import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const DESPACHADOR = '__PROPIETARIO__/__REPO_FACTORY__/.github/workflows/despachador.yml@__SHA_FACTORY__';

function flujos(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(n => /\.ya?ml$/.test(n)).map(n => join(dir, n));
}

const DE_LA_FACTORY = flujos('.github/workflows');
const DE_PLANTILLAS = readdirSync('plantillas').flatMap(p => flujos(join('plantillas', p, '.github/workflows')));

/** Cada línea `uses:` con lo que referencia y el comentario que la acompaña. */
function usos(ruta: string): { ref: string; comentario: string }[] {
  return readFileSync(ruta, 'utf8').split('\n').flatMap(linea => {
    const m = linea.match(/^\s*(?:-\s+)?uses:\s*['"]?([^'"\s#]+)['"]?\s*(?:#\s*(.*))?$/);
    return m ? [{ ref: m[1], comentario: (m[2] ?? '').trim() }] : [];
  });
}

const hashFijado = (ref: string) => /@[0-9a-f]{40}$/.test(ref);

describe('referencias de los flujos', () => {
  test('hay flujos que comprobar en la factory y en la plantilla', () => {
    expect(DE_LA_FACTORY.length).toBeGreaterThan(0);
    expect(DE_PLANTILLAS.length).toBeGreaterThan(0);
  });

  test.each(DE_LA_FACTORY)('%s solo usa acciones fijadas por hash o locales', ruta =>
    expect(usos(ruta).filter(u => !hashFijado(u.ref) && !u.ref.startsWith('./')).map(u => u.ref)).toEqual([]));

  test.each(DE_PLANTILLAS)('%s solo usa acciones fijadas por hash, locales o el despachador fijado', ruta =>
    expect(usos(ruta).filter(u => !hashFijado(u.ref) && !u.ref.startsWith('./') && u.ref !== DESPACHADOR).map(u => u.ref))
      .toEqual([]));

  test.each([...DE_LA_FACTORY, ...DE_PLANTILLAS])('%s anota la versión de cada acción fijada', ruta =>
    expect(usos(ruta).filter(u => hashFijado(u.ref) && !/^v\d/.test(u.comentario)).map(u => u.ref)).toEqual([]));

  test('el lector de usos reconoce las tres formas', () => {
    expect('  - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1'
      .match(/^\s*(?:-\s+)?uses:/)).not.toBeNull();
    expect(hashFijado('actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1')).toBe(true);
    expect(hashFijado('actions/checkout@v7')).toBe(false);
    expect(hashFijado('a/b/.github/workflows/x.yml@main')).toBe(false);
  });
});
