import { readFileSync } from 'node:fs';
import { Ajv } from 'ajv';
import { describe, expect, test } from 'vitest';
import {
  type EventoStream, type ResultadoAgente, clasificarSalida, construirResumen, contarHerramientas, extraerCupo,
  extraerResultado, leerStream, necesitaOperadora,
} from '../scripts/lib/resumen.js';

const fixture = (nombre: string) => leerStream(readFileSync(`tests/fixtures/${nombre}`, 'utf8').split('\n'));
const ok = fixture('stream-ok.jsonl');
const limite = fixture('stream-limite.jsonl');
const conEsquema = leerStream([readFileSync('tests/fixtures/salida-esquema.json', 'utf8')]);

/** Un `result` con lo mínimo, para los casos que no tienen fixture real. */
const resultado = (campos: Record<string, unknown>): EventoStream =>
  ({ type: 'result', subtype: 'success', is_error: false, terminal_reason: 'completed', num_turns: 1, ...campos });
const asistenteDeError = (error: string): EventoStream =>
  ({ type: 'assistant', error, is_api_error_message: true, message: { model: '<synthetic>', content: [] } });

const base = {
  proyecto: 'a/b', issue: 3, tipo: 'tarea' as const, rol: 'implementador' as const, modelo: 'sonnet',
  inicio: '2026-01-01T00:00:00Z', fin: '2026-01-01T00:02:30Z', urlEjecucion: 'u',
};

describe('leerStream', () => {
  test('ignora líneas vacías o que no son JSON', () =>
    expect(leerStream(['', 'no json', '{"type":"x"}'])).toEqual([{ type: 'x' }]));

  test('ignora JSON que no es un evento', () =>
    expect(leerStream(['[1]', 'null', '"x"', '{"tipo":"x"}', '{"type":3}'])).toEqual([]));

  test('acepta el final de línea de Windows', () =>
    expect(leerStream(['{"type":"x"}\r'])).toEqual([{ type: 'x' }]));

  test('lee el fixture real entero', () => {
    expect(ok).toHaveLength(19);
    expect(ok[0]).toMatchObject({ type: 'system', subtype: 'init' });
    expect(ok.at(-1)?.type).toBe('result');
  });
});

describe('contarHerramientas', () => {
  test('cuenta cada uso de herramienta por nombre', () =>
    expect(contarHerramientas(ok)).toEqual({ Read: 2, Edit: 3, Bash: 1 }));

  test('cuenta bloques, no líneas: un mensaje con dos usos cuenta dos', () =>
    expect(contarHerramientas([{
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Read' }, { type: 'text', text: 'x' }, { type: 'tool_use', name: 'Read' }] },
    }])).toEqual({ Read: 2 }));

  test('no cuenta los tool_use de otros tipos de evento', () =>
    expect(contarHerramientas([{ type: 'user', message: { content: [{ type: 'tool_use', name: 'Read' }] } }])).toEqual({}));

  test('un evento sin contenido no rompe nada', () =>
    expect(contarHerramientas([{ type: 'assistant' }, { type: 'assistant', message: { content: 'x' } }])).toEqual({}));
});

describe('extraerResultado', () => {
  test('extrae turnos, costo y permisos denegados del evento final', () => {
    const r = extraerResultado(ok)!;
    expect(r.turnos).toBe(7);
    expect(r.costoEstimadoUsd).toBeCloseTo(0.0512039);
    expect(r.permisosDenegados).toEqual(['Bash']);
    expect(r.esError).toBe(false);
    expect(r.motivoFin).toBe('completed');
    expect(r.errorApi).toBeNull();
  });

  test('sin evento final devuelve null', () => expect(extraerResultado([{ type: 'assistant' }])).toBeNull());

  test('lee la salida estructurada', () =>
    expect(extraerResultado(conEsquema)!.salidaEstructurada).not.toBeNull());

  test('del fixture de límite saca el error, el estado HTTP y la categoría', () => {
    const r = extraerResultado(limite)!;
    expect(r.esError).toBe(true);
    expect(r.motivoFin).toBe('api_error');
    expect(r.estadoErrorApi).toBe(429);
    expect(r.errorApi).toBe('rate_limit');
  });

  test('un fallo de arranque guarda su motivo', () =>
    expect(extraerResultado([resultado({ subtype: 'error_during_execution', is_error: true, num_turns: 0,
      startup_failure_reason: 'sandbox_required_unavailable' })])!.fallaArranque).toBe('sandbox_required_unavailable'));

  test('sin costo es null, no cero', () =>
    expect(extraerResultado([resultado({})])!.costoEstimadoUsd).toBeNull());
});

describe('extraerCupo', () => {
  test('lee la utilización de las dos ventanas y cuándo se reinician', () =>
    expect(extraerCupo(ok)).toEqual({
      cincoHoras: 0.13,
      sieteDias: 0.22,
      reiniciaCincoHoras: new Date(1795588800 * 1000).toISOString(),
      reiniciaSieteDias: new Date(1795687200 * 1000).toISOString(),
      rechazado: false,
    }));

  test('el fixture de límite está rechazado', () => expect(extraerCupo(limite)?.rechazado).toBe(true));

  test('sin evento de cupo es null', () => expect(extraerCupo(conEsquema)).toBeNull());

  test('un evento incompleto deja a null lo que falta', () =>
    expect(extraerCupo([{ type: 'rate_limit_event', rate_limit_info: { status: 'allowed' } }])).toEqual({
      cincoHoras: null, sieteDias: null, reiniciaCincoHoras: null, reiniciaSieteDias: null, rechazado: false,
    }));
});

describe('clasificarSalida', () => {
  const clasificar = (eventos: EventoStream[], codigoSalida: number, stderr = '') =>
    clasificarSalida({ codigoSalida, resultado: extraerResultado(eventos), stderr, cupo: extraerCupo(eventos) });

  test('salida limpia es termino', () => expect(clasificar(ok, 0)).toBe('termino'));

  test('el fixture de límite es en-pausa', () => expect(clasificar(limite, 1)).toBe('en-pausa'));

  test('el mensaje de límite es en-pausa aunque el código sea de error', () =>
    expect(clasificarSalida({ codigoSalida: 1, resultado: null, stderr: "You've hit your 5-hour limit" })).toBe('en-pausa'));

  test('reconoce también el texto documentado del límite de sesión', () =>
    expect(clasificar([resultado({ is_error: true, terminal_reason: 'api_error',
      result: "You've hit your session limit · resets 3:45pm" })], 1)).toBe('en-pausa'));

  test('un rate_limit_event rechazado es en-pausa sin texto', () =>
    expect(clasificar([
      { type: 'rate_limit_event', rate_limit_info: { status: 'rejected' } },
      resultado({ is_error: true, terminal_reason: 'api_error' }),
    ], 1)).toBe('en-pausa'));

  test('el rate_limit_event de cada ejecución no hace pausar un fallo cualquiera', () =>
    expect(clasificar([...ok.slice(0, -1), resultado({ is_error: true, terminal_reason: 'api_error', result: 'Internal error' })], 1))
      .toBe('fallo'));

  test('si el agente termina bien y habla de rate_limit, es termino', () =>
    expect(clasificar([resultado({ result: 'Añadí un middleware rate_limit que devuelve 429.' })], 0)).toBe('termino'));

  test('subtype success con is_error es fallo', () =>
    expect(clasificar([resultado({ is_error: true, terminal_reason: 'api_error', result: 'x' })], 0)).toBe('fallo'));

  test('un motivo de fin distinto de completed no es termino', () =>
    expect(clasificar([resultado({ terminal_reason: 'max_turns' })], 0)).toBe('fallo'));

  test('el sandbox no disponible es fallo, no en-pausa', () =>
    expect(clasificar([resultado({ subtype: 'error_during_execution', is_error: true, num_turns: 0,
      startup_failure_reason: 'sandbox_required_unavailable' })], 1, 'rate_limit')).toBe('fallo'));

  test('el login fallido es fallo', () =>
    expect(clasificar([asistenteDeError('authentication_failed'), resultado({ is_error: true, terminal_reason: 'api_error' })], 1))
      .toBe('fallo'));

  test('código 0 sin evento final es fallo', () =>
    expect(clasificarSalida({ codigoSalida: 0, resultado: null, stderr: '' })).toBe('fallo'));

  test('otro error es fallo', () =>
    expect(clasificarSalida({ codigoSalida: 1, resultado: null, stderr: 'ENOENT' })).toBe('fallo'));
});

describe('necesitaOperadora', () => {
  const r = (eventos: EventoStream[]) => extraerResultado(eventos) as ResultadoAgente;

  test('el login fallido avisa a la persona operadora', () =>
    expect(necesitaOperadora(r([asistenteDeError('authentication_failed'), resultado({ is_error: true })]))).toMatch(/login/i));

  test('el sandbox no disponible también', () =>
    expect(necesitaOperadora(r([resultado({ is_error: true, startup_failure_reason: 'sandbox_required_unavailable' })])))
      .toMatch(/sandbox_required_unavailable/));

  test('el límite de cupo no', () => expect(necesitaOperadora(r(limite))).toBeNull());

  test('una salida limpia no', () => expect(necesitaOperadora(r(ok))).toBeNull());
});

describe('construirResumen', () => {
  const resumen = construirResumen({ base, eventos: ok, resultado: 'termino', estadoResultante: 'factory:en-revision' });

  test('el resumen calcula la duración y no incluye texto del agente', () => {
    expect(resumen.duracionSeg).toBe(150);
    expect(Object.keys(resumen)).not.toContain('texto');
    expect(JSON.stringify(resumen)).not.toContain('no he podido ejecutar');
  });

  test('copia turnos, costo, herramientas y permisos denegados', () =>
    expect(resumen).toMatchObject({ turnos: 7, herramientas: { Read: 2, Edit: 3, Bash: 1 }, permisosDenegados: ['Bash'] }));

  test('guarda el cupo en datos', () =>
    expect(resumen.datos?.cupo).toMatchObject({ cincoHoras: 0.13, sieteDias: 0.22 }));

  test('sin evento de cupo, datos.cupo es null y se conservan los demás datos', () =>
    expect(construirResumen({ base, eventos: conEsquema, resultado: 'termino', estadoResultante: 'x', datos: { pr: 4 } }).datos)
      .toEqual({ pr: 4, cupo: null }));

  test('sin evento final quedan cero turnos y sin costo', () =>
    expect(construirResumen({ base, eventos: [], resultado: 'fallo', estadoResultante: 'factory:bloqueada' }))
      .toMatchObject({ turnos: 0, costoEstimadoUsd: null, herramientas: {}, permisosDenegados: [] }));

  test.each([
    ['fin anterior al inicio', { fin: '2025-12-31T23:59:59Z' }],
    ['fecha inválida', { inicio: 'ayer' }],
  ])('lanza con %s', (_, cambio) =>
    expect(() => construirResumen({ base: { ...base, ...cambio }, eventos: ok, resultado: 'termino', estadoResultante: 'x' }))
      .toThrow());
});

describe('esquema del resumen', () => {
  const esquema = JSON.parse(readFileSync('esquemas/resumen-ejecucion.schema.json', 'utf8'));
  const validar = new Ajv({ allErrors: true }).compile(esquema);

  test('acepta los resúmenes que se construyen', () => {
    expect(validar(resumen())).toBe(true);
    expect(validar(construirResumen({ base: { ...base, modelo: null }, eventos: limite, resultado: 'en-pausa', estadoResultante: 'factory:en-pausa' })))
      .toBe(true);
  });

  test('rechaza un campo de más, como el texto del agente', () =>
    expect(validar({ ...resumen(), texto: 'x' })).toBe(false));

  test('rechaza un resultado desconocido', () =>
    expect(validar({ ...resumen(), resultado: 'raro' })).toBe(false));

  test('rechaza un cupo fuera de 0 a 1', () =>
    expect(validar({ ...resumen(), datos: { cupo: { ...(resumen().datos!.cupo as object), cincoHoras: 2 } } })).toBe(false));

  function resumen() {
    return construirResumen({ base, eventos: ok, resultado: 'termino', estadoResultante: 'factory:en-revision' });
  }
});
