import { minimatch } from 'minimatch';
import type { Riesgo } from './tipos.js';

/** `rutaAnterior` existe si el archivo se movió o se renombró en el diff. */
export interface ArchivoCambiado { ruta: string; rutaAnterior?: string; adiciones: number; eliminaciones: number }
export interface ConfigClasificador { rutasSensibles: string[]; maxLineasDiff: number }

// Siempre de riesgo alto (sección 6.4 de la spec): CI, instrucciones de agentes y revisores,
// configuración de la puerta, lista de aprobadoras, despliegue, migraciones y dependencias.
// Las instrucciones y los manifiestos cuentan en cualquier carpeta: Claude Code lee los CLAUDE.md anidados.
export const RUTAS_SIEMPRE_SENSIBLES: string[] = [
  '.github/**',
  '.factory/**',
  '.claude/**',
  '**/AGENTS.md',
  '**/CLAUDE.md',
  'docs/agentes/**',
  '**/migrations/**',
  '**/migraciones/**',
  '**/package.json',
  '**/package-lock.json',
];

// El paso de publicación rechaza cualquier parche de un agente que toque estas rutas.
export const RUTAS_PROHIBIDAS_AL_AGENTE: string[] = ['.github/**', '.factory/**'];

// Archivos generados: no cuentan para el tamaño máximo del diff (sí para el riesgo).
export const RUTAS_FUERA_DEL_TAMANO: string[] = ['**/package-lock.json', '**/*.snap'];

const coincide = (ruta: string, patrones: string[]) => patrones.find(p => minimatch(ruta, p, { dot: true }));

/** Rutas que toca un archivo: la actual y, si se movió, la anterior. */
const rutasDe = (a: ArchivoCambiado) => (a.rutaAnterior && a.rutaAnterior !== a.ruta ? [a.rutaAnterior, a.ruta] : [a.ruta]);

export function clasificarDiff(archivos: ArchivoCambiado[], config: ConfigClasificador):
  { riesgo: Riesgo; motivos: string[]; lineas: number; excedeMaximo: boolean } {
  const sensibles = [...RUTAS_SIEMPRE_SENSIBLES, ...config.rutasSensibles];
  const motivos: string[] = [];
  let lineas = 0;
  for (const archivo of archivos) {
    for (const ruta of rutasDe(archivo)) {
      const patron = coincide(ruta, sensibles);
      if (patron) {
        motivos.push(`${ruta} es una ruta sensible (${patron})`);
        break;
      }
    }
    if (!coincide(archivo.ruta, RUTAS_FUERA_DEL_TAMANO)) lineas += archivo.adiciones + archivo.eliminaciones;
  }
  return { riesgo: motivos.length > 0 ? 'alto' : 'bajo', motivos, lineas, excedeMaximo: lineas > config.maxLineasDiff };
}

export function rutasProhibidas(archivos: ArchivoCambiado[]): string[] {
  return archivos.flatMap(rutasDe).filter(ruta => coincide(ruta, RUTAS_PROHIBIDAS_AL_AGENTE));
}
