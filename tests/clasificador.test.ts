import { describe, expect, test } from 'vitest';
import { clasificarDiff, rutasProhibidas } from '../scripts/lib/clasificador.js';

const cfg = { rutasSensibles: ['src/pagos/**'], maxLineasDiff: 400 };
const a = (ruta: string, adiciones = 10, eliminaciones = 0) => ({ ruta, adiciones, eliminaciones });

describe('clasificarDiff', () => {
  test('cambio pequeño en src es riesgo bajo', () =>
    expect(clasificarDiff([a('src/lista.ts')], cfg)).toMatchObject({ riesgo: 'bajo', lineas: 10, excedeMaximo: false }));

  test('tocar un flujo de CI es riesgo alto y lo explica', () => {
    const r = clasificarDiff([a('.github/workflows/ci.yml')], cfg);
    expect(r.riesgo).toBe('alto');
    expect(r.motivos[0]).toContain('.github/workflows/ci.yml');
  });

  test('una ruta sensible de la configuración es riesgo alto', () =>
    expect(clasificarDiff([a('src/pagos/cobro.ts')], cfg).riesgo).toBe('alto'));

  test('la configuración no puede quitar las rutas siempre sensibles', () =>
    expect(clasificarDiff([a('package.json')], { rutasSensibles: [], maxLineasDiff: 400 }).riesgo).toBe('alto'));

  test('una migración es riesgo alto', () =>
    expect(clasificarDiff([a('db/migrations/001.sql')], cfg).riesgo).toBe('alto'));

  test('las instrucciones de Copilot son riesgo alto', () => {
    expect(clasificarDiff([a('.github/copilot-instructions.md')], cfg).riesgo).toBe('alto');
    expect(clasificarDiff([a('.github/instructions/x.instructions.md')], cfg).riesgo).toBe('alto');
  });

  test('las instrucciones de agente en un subdirectorio también son riesgo alto', () => {
    expect(clasificarDiff([a('src/CLAUDE.md')], cfg).riesgo).toBe('alto');
    expect(clasificarDiff([a('src/modulo/AGENTS.md')], cfg).riesgo).toBe('alto');
  });

  test('la lista de aprobadoras es riesgo alto', () =>
    expect(clasificarDiff([a('.factory/aprobadoras.txt')], cfg).riesgo).toBe('alto'));

  test('mover un archivo fuera de una ruta sensible es riesgo alto', () => {
    const r = clasificarDiff([{ ...a('src/ci.yml'), rutaAnterior: '.github/workflows/ci.yml' }], cfg);
    expect(r.riesgo).toBe('alto');
    expect(r.motivos[0]).toContain('.github/workflows/ci.yml');
  });

  test('un archivo cuyo nombre solo empieza como una ruta sensible no lo es', () =>
    expect(clasificarDiff([a('src/.github-notas.md'), a('docs/agentes.md')], cfg).riesgo).toBe('bajo'));

  test('da un motivo por cada archivo sensible', () =>
    expect(clasificarDiff([a('package.json'), a('src/a.ts'), a('.claude/settings.json')], cfg).motivos).toHaveLength(2));

  test('401 líneas exceden un máximo de 400', () =>
    expect(clasificarDiff([a('src/a.ts', 300, 101)], cfg).excedeMaximo).toBe(true));

  test('400 líneas no lo exceden', () =>
    expect(clasificarDiff([a('src/a.ts', 400, 0)], cfg).excedeMaximo).toBe(false));

  test('las líneas suman adiciones y eliminaciones de todos los archivos', () =>
    expect(clasificarDiff([a('src/a.ts', 3, 2), a('src/b.ts', 1, 4)], cfg).lineas).toBe(10));

  test('el lockfile no cuenta para el tamaño', () =>
    expect(clasificarDiff([a('package-lock.json', 5000), a('src/a.ts', 5)], cfg).lineas).toBe(5));

  test('las instantáneas de tests no cuentan para el tamaño', () =>
    expect(clasificarDiff([a('src/__snapshots__/App.test.tsx.snap', 900), a('src/a.ts', 5)], cfg).lineas).toBe(5));

  test('el lockfile no cuenta para el tamaño pero sí para el riesgo', () =>
    expect(clasificarDiff([a('package-lock.json', 5000)], cfg).riesgo).toBe('alto'));

  test('diff vacío es riesgo bajo con cero líneas', () =>
    expect(clasificarDiff([], cfg)).toMatchObject({ riesgo: 'bajo', lineas: 0, motivos: [] }));
});

describe('rutasProhibidas', () => {
  test('detecta rutas prohibidas al agente', () =>
    expect(rutasProhibidas([a('.factory/config.json'), a('src/a.ts')])).toEqual(['.factory/config.json']));

  test('un archivo sacado de una ruta prohibida también cuenta', () =>
    expect(rutasProhibidas([{ ...a('src/x.yml'), rutaAnterior: '.github/workflows/ci.yml' }]))
      .toEqual(['.github/workflows/ci.yml']));

  test('las instrucciones de agente son sensibles pero no prohibidas', () =>
    expect(rutasProhibidas([a('AGENTS.md'), a('package.json')])).toEqual([]));
});
