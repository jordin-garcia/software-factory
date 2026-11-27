// Entrada y salida compartida para copiar una plantilla de plantillas/ a un directorio.
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { debeCopiarse, renderizarPlantilla } from '../lib/plantilla.js';

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap(n => {
    const ruta = join(dir, n);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}

/** Copia la plantilla sustituyendo sus marcadores. Devuelve cuántos archivos copió. */
export function copiarPlantilla(plantilla: string, destino: string, vars: Record<string, string>): number {
  const origen = join('plantillas', plantilla);
  let copiados = 0;
  for (const ruta of archivos(origen)) {
    const relativa = relative(origen, ruta).replaceAll('\\', '/');
    if (!debeCopiarse(relativa)) continue;
    const salida = join(destino, relativa);
    mkdirSync(dirname(salida), { recursive: true });
    writeFileSync(salida, renderizarPlantilla(readFileSync(ruta, 'utf8'), vars));
    copiados++;
  }
  return copiados;
}
