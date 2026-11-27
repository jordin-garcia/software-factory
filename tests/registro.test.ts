import { describe, expect, test } from 'vitest';
import { RAMA_DATOS, agregarEntrada, huboCarrera, leerIndice, rutaResumen, shaDeLsRemote } from '../scripts/lib/registro.js';
import type { ResumenEjecucion } from '../scripts/lib/tipos.js';

const r = (over: Partial<ResumenEjecucion>) => ({
  issue: 3, rol: 'implementador', inicio: '2026-01-01T00:00:00Z',
  urlEjecucion: 'https://github.com/a/b/actions/runs/77', ...over,
}) as ResumenEjecucion;

describe('rutaResumen', () => {
  test('la rama de datos es factory-datos', () => expect(RAMA_DATOS).toBe('factory-datos'));

  test('la ruta usa issue, id de ejecución y rol', () =>
    expect(rutaResumen(r({}))).toBe('ejecuciones/3/77-implementador.json'));

  test('el primer intento no cambia la ruta', () =>
    expect(rutaResumen(r({ urlEjecucion: 'https://github.com/a/b/actions/runs/77/attempts/1' })))
      .toBe('ejecuciones/3/77-implementador.json'));

  test('un reintento del run tiene su propio archivo', () =>
    expect(rutaResumen(r({ urlEjecucion: 'https://github.com/a/b/actions/runs/77/attempts/2' })))
      .toBe('ejecuciones/3/77.2-implementador.json'));

  test.each([
    ['una URL que no es de un run', { urlEjecucion: 'https://example.com/x' }],
    ['un rol que sale de la carpeta', { rol: '../indice' as ResumenEjecucion['rol'] }],
    ['un issue que no es un número positivo', { issue: 0 }],
  ])('lanza con %s', (_, over) => expect(() => rutaResumen(r(over))).toThrow());
});

describe('agregarEntrada', () => {
  test('no duplica la misma ejecución y rol', () =>
    expect(agregarEntrada([r({})], r({}))).toHaveLength(1));

  test('dos roles de la misma ejecución sí se guardan', () =>
    expect(agregarEntrada([r({})], r({ rol: 'puerta' }))).toHaveLength(2));

  test('queda ordenado por inicio', () =>
    expect(agregarEntrada([r({ inicio: '2026-01-02T00:00:00Z', urlEjecucion: 'x/2' })], r({})).map(e => e.inicio))
      .toEqual(['2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z']));

  test('ordena por instante, no por texto', () =>
    expect(agregarEntrada([r({ inicio: '2026-01-01T01:00:00+02:00', urlEjecucion: 'x/2' })], r({ inicio: '2026-01-01T00:30:00Z' }))
      .map(e => e.urlEjecucion)).toEqual(['x/2', 'https://github.com/a/b/actions/runs/77']));

  test('si ya está, se queda la entrada que había', () =>
    expect(agregarEntrada([r({ turnos: 1 })], r({ turnos: 9 }))[0].turnos).toBe(1));

  test('no cambia el índice que recibe', () => {
    const indice = [r({ inicio: '2026-01-02T00:00:00Z', urlEjecucion: 'x/2' })];
    agregarEntrada(indice, r({}));
    expect(indice).toHaveLength(1);
  });
});

describe('leerIndice', () => {
  test('sin archivo, el índice está vacío', () => expect(leerIndice(null)).toEqual([]));

  test('lee una lista', () => expect(leerIndice(JSON.stringify([r({})]))).toHaveLength(1));

  test.each(['no json', '{"a":1}'])('lanza si el índice no es una lista: %s', contenido =>
    expect(() => leerIndice(contenido)).toThrow(/indice/));
});

describe('shaDeLsRemote', () => {
  const sha = 'a'.repeat(40);

  test('lee el commit de la rama', () =>
    expect(shaDeLsRemote(`${sha}\trefs/heads/factory-datos\n`)).toBe(sha));

  test('sin la rama es null', () => expect(shaDeLsRemote('')).toBeNull());

  test('no confunde otra rama con un nombre parecido', () =>
    expect(shaDeLsRemote(`${sha}\trefs/heads/factory-datos-viejo`)).toBeNull());
});

describe('huboCarrera', () => {
  const a = 'a'.repeat(40);
  const b = 'b'.repeat(40);

  test('la rama avanzó desde la base', () => expect(huboCarrera(a, b)).toBe(true));

  test('otra ejecución creó la rama mientras tanto', () => expect(huboCarrera(null, a)).toBe(true));

  test('la rama sigue donde estaba: el fallo es otro', () => {
    expect(huboCarrera(a, a)).toBe(false);
    expect(huboCarrera(null, null)).toBe(false);
  });
});
