// Copia una plantilla de plantillas/ a un directorio y sustituye sus marcadores.
// Uso: tsx scripts/cli/copiar-plantilla.ts --plantilla web-estatica --destino <dir>
//        --propietario <cuenta> --nombre <repo> --descripcion <texto> --repo-factory <repo> --sha-factory <sha>
import { parseArgs } from 'node:util';
import { copiarPlantilla } from './plantilla-io.js';

const OPCIONES = ['plantilla', 'destino', 'propietario', 'nombre', 'descripcion', 'repo-factory', 'sha-factory'] as const;

const { values } = parseArgs({
  options: Object.fromEntries(OPCIONES.map(o => [o, { type: 'string' as const }])),
  strict: true,
});

for (const opcion of OPCIONES) {
  if (!values[opcion]) throw new Error(`Falta la opción --${opcion}`);
}

const copiados = copiarPlantilla(String(values.plantilla), String(values.destino), {
  PROPIETARIO: String(values.propietario),
  NOMBRE: String(values.nombre),
  DESCRIPCION: String(values.descripcion),
  REPO_FACTORY: String(values['repo-factory']),
  SHA_FACTORY: String(values['sha-factory']),
});
console.log(`Plantilla ${values.plantilla} copiada: ${copiados} archivos.`);
