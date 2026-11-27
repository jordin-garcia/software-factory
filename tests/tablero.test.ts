import { describe, expect, test } from 'vitest';
import { ETIQUETAS } from '../scripts/lib/estados.js';
import {
  COLUMNAS, type ElementoTablero, type IssueProyecto, columnaDeEstado, opcionesDeEtapa, planificarSincronizacion,
} from '../scripts/lib/tablero.js';

describe('columnaDeEstado', () => {
  test('toda etiqueta tiene una columna existente', () =>
    ETIQUETAS.forEach(e => expect(COLUMNAS).toContain(columnaDeEstado(e.nombre))));

  test('en-pausa y bloqueada comparten columna', () => {
    expect(columnaDeEstado('factory:en-pausa')).toBe('Bloqueada');
    expect(columnaDeEstado('factory:bloqueada')).toBe('Bloqueada');
  });

  test('cambios-pedidos se ve como implementando', () =>
    expect(columnaDeEstado('factory:cambios-pedidos')).toBe('Implementando'));

  test('un estado desconocido lanza', () => expect(() => columnaDeEstado('otra')).toThrow());

  test('un nombre heredado de Object no se toma por un estado', () =>
    expect(() => columnaDeEstado('constructor')).toThrow());

  test('las nueve columnas, en orden', () =>
    expect(COLUMNAS).toEqual([
      'Especificación', 'Plan', 'En cola', 'Implementando', 'En revisión',
      'Esperando aprobación', 'Verificando', 'Hecha', 'Bloqueada',
    ]));

  test('toda columna recibe al menos un estado', () =>
    expect(new Set(ETIQUETAS.map(e => columnaDeEstado(e.nombre)))).toEqual(new Set(COLUMNAS)));

  test('el recorrido de una especificación y de una tarea', () => {
    expect(columnaDeEstado('factory:lista')).toBe('Especificación');
    expect(columnaDeEstado('factory:plan-propuesto')).toBe('Plan');
    expect(columnaDeEstado('factory:plan-aprobado')).toBe('Plan');
    expect(columnaDeEstado('factory:pendiente')).toBe('En cola');
    expect(columnaDeEstado('factory:implementar')).toBe('Implementando');
    expect(columnaDeEstado('factory:en-revision')).toBe('En revisión');
    expect(columnaDeEstado('factory:esperando-aprobacion')).toBe('Esperando aprobación');
    expect(columnaDeEstado('factory:fusionada')).toBe('Verificando');
    expect(columnaDeEstado('factory:hecha')).toBe('Hecha');
  });
});

describe('opcionesDeEtapa', () => {
  const todas = COLUMNAS.map((nombre, i) => ({ id: `op${i}`, nombre }));

  test('devuelve el id de cada columna', () => {
    const mapa = opcionesDeEtapa(todas);
    expect(mapa.get('Especificación')).toBe('op0');
    expect(mapa.get('Bloqueada')).toBe('op8');
  });

  test('lanza si falta una columna y la nombra', () =>
    expect(() => opcionesDeEtapa(todas.filter(o => o.nombre !== 'Verificando'))).toThrow(/Verificando/));

  test('ignora opciones de más', () =>
    expect(opcionesDeEtapa([...todas, { id: 'x', nombre: 'Otra' }]).size).toBe(COLUMNAS.length));
});

const issue = (numero: number, etiquetas: string[], repo = 'ana/panel'): IssueProyecto =>
  ({ contenidoId: `I_${repo}_${numero}`, repo, numero, etiquetas });
const elemento = (i: IssueProyecto, etapa: string | null): ElementoTablero =>
  ({ id: `E_${i.contenidoId}`, contenidoId: i.contenidoId, etapa });

describe('planificarSincronizacion', () => {
  test('añade al tablero un issue con estado que no está', () => {
    const i = issue(1, ['factory:lista']);
    expect(planificarSincronizacion([i], []).acciones)
      .toEqual([{ contenidoId: i.contenidoId, elementoId: null, repo: 'ana/panel', numero: 1, etapa: 'Especificación' }]);
  });

  test('mueve un elemento cuya etapa no coincide con la etiqueta', () => {
    const i = issue(2, ['bug', 'factory:en-revision']);
    expect(planificarSincronizacion([i], [elemento(i, 'Implementando')]).acciones)
      .toEqual([{ contenidoId: i.contenidoId, elementoId: `E_${i.contenidoId}`, repo: 'ana/panel', numero: 2, etapa: 'En revisión' }]);
  });

  test('pone etapa a un elemento que no la tiene', () => {
    const i = issue(3, ['factory:pendiente']);
    expect(planificarSincronizacion([i], [elemento(i, null)]).acciones.map(a => a.etapa)).toEqual(['En cola']);
  });

  test('no hace nada si la etapa ya es la correcta', () => {
    const i = issue(4, ['factory:hecha']);
    expect(planificarSincronizacion([i], [elemento(i, 'Hecha')]).acciones).toEqual([]);
  });

  test('ignora los issues sin etiqueta de estado, estén o no en el tablero', () => {
    const fuera = issue(5, ['bug']);
    const dentro = issue(6, []);
    expect(planificarSincronizacion([fuera, dentro], [elemento(dentro, 'Plan')]).acciones).toEqual([]);
  });

  test('un issue con dos estados no se toca y se informa', () => {
    const i = issue(7, ['factory:lista', 'factory:en-curso']);
    const r = planificarSincronizacion([i], [elemento(i, 'Plan')]);
    expect(r.acciones).toEqual([]);
    expect(r.conflictos).toEqual(['ana/panel#7']);
  });

  test('distingue issues con el mismo número en repos distintos', () => {
    const a = issue(1, ['factory:lista'], 'ana/a');
    const b = issue(1, ['factory:implementar'], 'ana/b');
    const r = planificarSincronizacion([a, b], [elemento(a, 'Especificación')]);
    expect(r.acciones).toEqual([{ contenidoId: b.contenidoId, elementoId: null, repo: 'ana/b', numero: 1, etapa: 'Implementando' }]);
  });

  test('los elementos que no son de un issue registrado no se tocan', () => {
    const ajeno: ElementoTablero = { id: 'E_x', contenidoId: 'I_x', etapa: 'Plan' };
    expect(planificarSincronizacion([], [ajeno]).acciones).toEqual([]);
  });
});
