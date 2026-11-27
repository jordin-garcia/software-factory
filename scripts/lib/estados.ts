import type { Comentario, TipoIssue } from './tipos.js';

export interface Etiqueta { nombre: string; color: string; descripcion: string }

export type Origen = 'revisor' | 'persona' | 'sistema';

const ORIGENES: readonly Origen[] = ['revisor', 'persona', 'sistema'];

const HECHA = 'factory:hecha';
const BLOQUEADA = 'factory:bloqueada';
const EN_PAUSA = 'factory:en-pausa';
const DE_ESPERA = [BLOQUEADA, EN_PAUSA];

// Sección 6.3 de la spec. El color va sin '#', como lo pide la API de GitHub.
export const ETIQUETAS: Etiqueta[] = [
  { nombre: 'factory:lista', color: '0e8a16', descripcion: 'Especificación completa: la factory la planifica' },
  { nombre: 'factory:plan-propuesto', color: 'fbca04', descripcion: 'Hay un plan esperando aprobación' },
  { nombre: 'factory:plan-aprobado', color: '1d76db', descripcion: 'Plan aceptado: se crean las tareas' },
  { nombre: 'factory:en-curso', color: '5319e7', descripcion: 'Sus tareas están en marcha' },
  { nombre: 'factory:pendiente', color: 'c5def5', descripcion: 'Espera a que termine la tarea anterior' },
  { nombre: 'factory:implementar', color: '0052cc', descripcion: 'Le toca al implementador' },
  { nombre: 'factory:en-revision', color: 'bfd4f2', descripcion: 'Hay un PR abierto en revisión' },
  { nombre: 'factory:cambios-pedidos', color: 'e99695', descripcion: 'Se pidieron cambios: vuelve al implementador' },
  { nombre: 'factory:esperando-aprobacion', color: 'fef2c0', descripcion: 'Revisión y checks pasaron: espera a una persona' },
  { nombre: 'factory:fusionada', color: '6f42c1', descripcion: 'PR fusionado: falta verificar la rama principal' },
  { nombre: HECHA, color: '2ea44f', descripcion: 'Terminada y verificada' },
  { nombre: BLOQUEADA, color: 'b60205', descripcion: 'Necesita a una persona' },
  { nombre: EN_PAUSA, color: 'd4c5f9', descripcion: 'Cupo agotado: se reintenta más tarde' },
];

const NOMBRES = new Set(ETIQUETAS.map(e => e.nombre));

// Transiciones propias de cada tipo. Las de bloqueada y en-pausa se añaden en puedeTransicionar.
const TRANSICIONES: Record<TipoIssue, Record<string, string[]>> = {
  especificacion: {
    'factory:lista': ['factory:plan-propuesto'],
    'factory:plan-propuesto': ['factory:lista', 'factory:plan-aprobado'],
    'factory:plan-aprobado': ['factory:en-curso'],
    'factory:en-curso': [HECHA],
  },
  tarea: {
    'factory:pendiente': ['factory:implementar'],
    'factory:implementar': ['factory:en-revision'],
    'factory:en-revision': ['factory:cambios-pedidos', 'factory:esperando-aprobacion'],
    'factory:cambios-pedidos': ['factory:en-revision'],
    'factory:esperando-aprobacion': ['factory:cambios-pedidos', 'factory:fusionada'],
    'factory:fusionada': [HECHA],
  },
};

/** Estados no finales de un tipo: los suyos salvo hecha, más bloqueada y en-pausa. */
function noFinales(tipo: TipoIssue): string[] {
  return [...Object.keys(TRANSICIONES[tipo]), ...DE_ESPERA];
}

export function leerEstado(etiquetas: string[]): { estado: string | null; conflicto: boolean } {
  const estados = [...new Set(etiquetas.filter(e => NOMBRES.has(e)))];
  if (estados.length > 1) return { estado: null, conflicto: true };
  return { estado: estados[0] ?? null, conflicto: false };
}

export function puedeTransicionar(tipo: TipoIssue, de: string, a: string): boolean {
  if (de === a) return false;
  const propias = TRANSICIONES[tipo];
  if (Object.hasOwn(propias, de) && propias[de].includes(a)) return true;
  const validos = noFinales(tipo);
  if (!validos.includes(de) || !validos.includes(a)) return false;
  return DE_ESPERA.includes(a) || DE_ESPERA.includes(de);
}

export function tipoPorEstado(estado: string): TipoIssue | null {
  if (Object.hasOwn(TRANSICIONES.especificacion, estado)) return 'especificacion';
  if (Object.hasOwn(TRANSICIONES.tarea, estado)) return 'tarea';
  return null;
}

const MARCADOR = /<!-- factory:transicion de=(\S+) a=(\S+) origen=(\S+) -->/g;

export function comentarioTransicion(p: { de: string; a: string; origen: Origen; motivo: string }): string {
  // Quitar los delimitadores de comentario HTML impide colar un marcador falso en el motivo.
  const motivo = p.motivo.replace(/<!--|-->/g, '').trim();
  const lineas = [`La factory pasa este issue de \`${p.de}\` a \`${p.a}\`.`, '', `Origen: ${p.origen}.`];
  if (motivo) lineas.push(`Motivo: ${motivo}`);
  lineas.push('', `<!-- factory:transicion de=${p.de} a=${p.a} origen=${p.origen} -->`);
  return lineas.join('\n');
}

function leerMarcador(cuerpo: string): { de: string; a: string; origen: Origen } | null {
  const coincidencias = [...cuerpo.matchAll(MARCADOR)];
  const ultima = coincidencias.at(-1);
  if (!ultima) return null;
  const [, de, a, origen] = ultima;
  if (!NOMBRES.has(de) || !NOMBRES.has(a) || !ORIGENES.includes(origen as Origen)) return null;
  return { de, a, origen: origen as Origen };
}

/** Solo cuenta los marcadores escritos por la aplicación de la factory. */
export function leerUltimaTransicion(comentarios: Comentario[], appLogin: string):
  { de: string; a: string; origen: Origen } | null {
  let mejor: { de: string; a: string; origen: Origen } | null = null;
  let mejorFecha = -Infinity;
  for (const c of comentarios) {
    if (c.autor !== appLogin) continue;
    const t = leerMarcador(c.cuerpo);
    if (!t) continue;
    const fecha = Date.parse(c.fecha);
    const valor = Number.isNaN(fecha) ? -Infinity : fecha;
    if (valor >= mejorFecha) {
      mejor = t;
      mejorFecha = valor;
    }
  }
  return mejor;
}
