import { describe, expect, test } from 'vitest';
import { aArchivoCambiado, aComentario, aPermiso } from '../scripts/lib/github.js';

describe('aPermiso', () => {
  test.each([
    ['admin', 'admin'], ['maintain', 'write'], ['write', 'write'], ['triage', 'read'], ['read', 'read'], ['none', 'none'], ['raro', 'none'],
  ])('%s se trata como %s', (api, esperado) => expect(aPermiso(api)).toBe(esperado));
});

describe('aArchivoCambiado', () => {
  test('convierte un archivo del PR', () =>
    expect(aArchivoCambiado({ filename: 'src/a.ts', additions: 3, deletions: 1, status: 'modified' }))
      .toEqual({ ruta: 'src/a.ts', adiciones: 3, eliminaciones: 1 }));

  test('un archivo movido conserva su ruta anterior', () =>
    expect(aArchivoCambiado({ filename: 'src/ci.yml', previous_filename: '.github/workflows/ci.yml', additions: 0, deletions: 0, status: 'renamed' }))
      .toEqual({ ruta: 'src/ci.yml', rutaAnterior: '.github/workflows/ci.yml', adiciones: 0, eliminaciones: 0 }));
});

describe('aComentario', () => {
  test('usa el login del autor, el cuerpo y la fecha de creación', () =>
    expect(aComentario({ user: { login: 'app[bot]' }, body: 'hola', created_at: '2026-01-01T00:00:00Z' }))
      .toEqual({ autor: 'app[bot]', cuerpo: 'hola', fecha: '2026-01-01T00:00:00Z' }));

  test('un comentario sin autor ni cuerpo no rompe nada', () =>
    expect(aComentario({ user: null, created_at: '2026-01-01T00:00:00Z' }))
      .toEqual({ autor: '', cuerpo: '', fecha: '2026-01-01T00:00:00Z' }));
});
