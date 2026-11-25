import { describe, expect, it } from 'vitest';
import type { ResumenEjecucion } from '../scripts/lib/tipos.js';

describe('tipos', () => {
  it('permite construir un resumen de ejecución válido', () => {
    const resumen: ResumenEjecucion = {
      proyecto: 'demo',
      issue: 1,
      tipo: 'tarea',
      rol: 'implementador',
      modelo: null,
      inicio: '2026-11-24T10:00:00Z',
      fin: '2026-11-24T10:05:00Z',
      duracionSeg: 300,
      resultado: 'termino',
      estadoResultante: 'factory:en-revision',
      turnos: 10,
      costoEstimadoUsd: null,
      herramientas: { Edit: 3 },
      permisosDenegados: [],
      urlEjecucion: 'https://github.com/org/repo/actions/runs/1',
    };
    expect(resumen.resultado).toBe('termino');
  });
});
