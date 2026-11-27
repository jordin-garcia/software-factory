import type { Resultado, ResumenEjecucion } from './tipos.js';

/** Una línea de la salida `stream-json` de Claude Code. */
export interface EventoStream { type: string; [clave: string]: unknown }

export interface ResultadoAgente {
  turnos: number;
  costoEstimadoUsd: number | null;
  permisosDenegados: string[];
  esError: boolean;
  /** Texto final del agente. Sirve para clasificar; nunca va al resumen ni a los logs. */
  texto: string;
  salidaEstructurada: unknown;
  /** `terminal_reason`: `completed`, `api_error`… */
  motivoFin: string | null;
  /** `api_error_status`: el código HTTP del error de API, si lo hubo. */
  estadoErrorApi: number | null;
  /** `error` del mensaje sintético de error de API: `rate_limit`, `authentication_failed`… */
  errorApi: string | null;
  /** `startup_failure_reason`: por qué no arrancó, por ejemplo `sandbox_required_unavailable`. */
  fallaArranque: string | null;
}

/** Utilización del cupo al empezar la ejecución, de 0 a 1. Los reinicios, en ISO 8601. */
export interface Cupo {
  cincoHoras: number | null;
  sieteDias: number | null;
  reiniciaCincoHoras: string | null;
  reiniciaSieteDias: string | null;
  rechazado: boolean;
}

type Objeto = Record<string, unknown>;

const esObjeto = (v: unknown): v is Objeto => typeof v === 'object' && v !== null && !Array.isArray(v);
const numero = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const texto = (v: unknown): string | null => (typeof v === 'string' ? v : null);

export function leerStream(lineas: string[]): EventoStream[] {
  const eventos: EventoStream[] = [];
  for (const linea of lineas) {
    const limpia = linea.trim();
    if (!limpia) continue;
    let valor: unknown;
    try {
      valor = JSON.parse(limpia);
    } catch {
      continue;
    }
    if (esObjeto(valor) && typeof valor.type === 'string') eventos.push(valor as EventoStream);
  }
  return eventos;
}

/** Bloques de contenido de un evento `assistant`. Un turno puede llegar repartido en varias líneas. */
function bloquesDeAsistente(e: EventoStream): Objeto[] {
  if (e.type !== 'assistant' || !esObjeto(e.message) || !Array.isArray(e.message.content)) return [];
  return e.message.content.filter(esObjeto);
}

/** Cuenta los bloques `tool_use` por herramienta, no las líneas. */
export function contarHerramientas(eventos: EventoStream[]): Record<string, number> {
  const cuenta: Record<string, number> = {};
  for (const e of eventos) {
    for (const b of bloquesDeAsistente(e)) {
      if (b.type !== 'tool_use' || typeof b.name !== 'string') continue;
      cuenta[b.name] = (cuenta[b.name] ?? 0) + 1;
    }
  }
  return cuenta;
}

export function extraerResultado(eventos: EventoStream[]): ResultadoAgente | null {
  const r = eventos.findLast(e => e.type === 'result');
  if (!r) return null;
  const errorApi = eventos.findLast(e => e.type === 'assistant' && e.is_api_error_message === true);
  const denegados = Array.isArray(r.permission_denials) ? r.permission_denials : [];
  return {
    turnos: numero(r.num_turns) ?? 0,
    costoEstimadoUsd: numero(r.total_cost_usd),
    permisosDenegados: denegados.flatMap(d => (esObjeto(d) && typeof d.tool_name === 'string' ? [d.tool_name] : [])),
    esError: r.is_error === true,
    texto: texto(r.result) ?? '',
    salidaEstructurada: r.structured_output ?? null,
    motivoFin: texto(r.terminal_reason),
    estadoErrorApi: numero(r.api_error_status),
    errorApi: errorApi ? texto(errorApi.error) : null,
    fallaArranque: texto(r.startup_failure_reason),
  };
}

const aIso = (segundos: number | null) => (segundos === null ? null : new Date(segundos * 1000).toISOString());

/** Lee el `rate_limit_event`. Llega al principio: mide el cupo de antes de este rol, no lo que gastó. */
export function extraerCupo(eventos: EventoStream[]): Cupo | null {
  const e = eventos.find(x => x.type === 'rate_limit_event');
  if (!e) return null;
  const info = esObjeto(e.rate_limit_info) ? e.rate_limit_info : {};
  const ventanas = esObjeto(info.unifiedWindows) ? info.unifiedWindows : {};
  const ventana = (nombre: string): Objeto => (esObjeto(ventanas[nombre]) ? ventanas[nombre] : {});
  const cinco = ventana('five_hour');
  const siete = ventana('seven_day');
  return {
    cincoHoras: numero(cinco.utilization),
    sieteDias: numero(siete.utilization),
    reiniciaCincoHoras: aIso(numero(cinco.resetsAt)),
    reiniciaSieteDias: aIso(numero(siete.resetsAt)),
    rechazado: [info.status, cinco.status, siete.status].includes('rejected'),
  };
}

// Solo se aplica al texto final y a stderr, nunca a las líneas crudas del stream:
// todas las ejecuciones traen un evento `rate_limit_event` y darían falsas pausas.
const LIMITE = /hit your .*limit|rate_limit|usage limit|\b429\b/i;

export function clasificarSalida(p: { codigoSalida: number; resultado: ResultadoAgente | null; stderr: string; cupo?: Cupo | null }): Resultado {
  const r = p.resultado;
  if (r?.fallaArranque || r?.errorApi === 'authentication_failed') return 'fallo';
  const limpia = p.codigoSalida === 0 && r !== null && !r.esError;
  if (limpia && (r.motivoFin === null || r.motivoFin === 'completed')) return 'termino';
  if (limpia) return 'fallo';
  if (p.cupo?.rechazado || r?.errorApi === 'rate_limit' || r?.estadoErrorApi === 429) return 'en-pausa';
  if (LIMITE.test(r?.texto ?? '') || LIMITE.test(p.stderr)) return 'en-pausa';
  return 'fallo';
}

/** Motivo para avisar a la persona operadora: fallos que no se arreglan reintentando. */
export function necesitaOperadora(r: ResultadoAgente | null): string | null {
  if (r?.errorApi === 'authentication_failed') return 'Falló el login de Claude Code: revisa CLAUDE_CODE_OAUTH_TOKEN';
  if (r?.fallaArranque) return `Claude Code no arrancó: ${r.fallaArranque}`;
  return null;
}

export function construirResumen(p: {
  base: Pick<ResumenEjecucion, 'proyecto' | 'issue' | 'tipo' | 'rol' | 'modelo' | 'inicio' | 'fin' | 'urlEjecucion'>;
  eventos: EventoStream[]; resultado: Resultado; estadoResultante: string; datos?: Record<string, unknown>;
}): ResumenEjecucion {
  const inicio = Date.parse(p.base.inicio);
  const fin = Date.parse(p.base.fin);
  if (Number.isNaN(inicio) || Number.isNaN(fin)) throw new Error('Fecha de inicio o fin inválida');
  if (fin < inicio) throw new Error('La ejecución termina antes de empezar');
  const r = extraerResultado(p.eventos);
  return {
    ...p.base,
    duracionSeg: Math.round((fin - inicio) / 1000),
    resultado: p.resultado,
    estadoResultante: p.estadoResultante,
    turnos: r?.turnos ?? 0,
    costoEstimadoUsd: r?.costoEstimadoUsd ?? null,
    herramientas: contarHerramientas(p.eventos),
    permisosDenegados: r?.permisosDenegados ?? [],
    datos: { ...p.datos, cupo: extraerCupo(p.eventos) },
  };
}
