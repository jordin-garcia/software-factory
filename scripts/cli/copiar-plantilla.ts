// Copia una plantilla de plantillas/ a un directorio y sustituye sus marcadores.
// Uso: tsx scripts/cli/copiar-plantilla.ts --plantilla web-estatica --destino <dir>
//        --propietario <cuenta> --nombre <repo> --descripcion <texto> --repo-factory <repo> --sha-factory <sha>
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { parseArgs } from 'node:util';
import { debeCopiarse, renderizarPlantilla } from '../lib/plantilla.js';

const { values } = parseArgs({
  options: {
    plantilla: { type: 'string' },
    destino: { type: 'string' },
    propietario: { type: 'string' },
    nombre: { type: 'string' },
    descripcion: { type: 'string' },
    'repo-factory': { type: 'string' },
    'sha-factory': { type: 'string' },
  },
  strict: true,
});

for (const opcion of ['plantilla', 'destino', 'propietario', 'nombre', 'descripcion', 'repo-factory', 'sha-factory'] as const) {
  if (!values[opcion]) throw new Error(`Falta la opción --${opcion}`);
}

const origen = join('plantillas', values.plantilla!);
const vars = {
  PROPIETARIO: values.propietario!,
  NOMBRE: values.nombre!,
  DESCRIPCION: values.descripcion!,
  REPO_FACTORY: values['repo-factory']!,
  SHA_FACTORY: values['sha-factory']!,
};

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap(n => {
    const ruta = join(dir, n);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}

let copiados = 0;
for (const ruta of archivos(origen)) {
  const relativa = relative(origen, ruta).replaceAll('\\', '/');
  if (!debeCopiarse(relativa)) continue;
  const destino = join(values.destino!, relativa);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, renderizarPlantilla(readFileSync(ruta, 'utf8'), vars));
  copiados++;
}
console.log(`Plantilla ${values.plantilla} copiada: ${copiados} archivos.`);
