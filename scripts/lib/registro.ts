import type { ResumenEjecucion } from './tipos.js';

/** Rama de cada repositorio de producto donde se guardan los resúmenes, separada del código. */
export const RAMA_DATOS = 'factory-datos';
export const RUTA_INDICE = 'ejecuciones/indice.json';

const RUN = /\/actions\/runs\/(\d+)(?:\/attempts\/(\d+))?\/?$/;

/** `ejecuciones/<issue>/<idEjecucion>-<rol>.json`. Un reintento del run (intento 2 o más) lleva `.<intento>`. */
export function rutaResumen(r: ResumenEjecucion): string {
  const m = RUN.exec(r.urlEjecucion);
  if (!m) throw new Error(`La URL de ejecución no es de un run de Actions: ${r.urlEjecucion}`);
  if (!Number.isInteger(r.issue) || r.issue <= 0) throw new Error(`Número de issue inválido: ${r.issue}`);
  if (!/^[a-z]+(-[a-z]+)*$/.test(r.rol)) throw new Error(`Rol inválido: ${r.rol}`);
  const intento = Number(m[2] ?? 1);
  const id = intento > 1 ? `${m[1]}.${intento}` : m[1];
  return `ejecuciones/${r.issue}/${id}-${r.rol}.json`;
}

const clave = (r: ResumenEjecucion) => `${r.urlEjecucion}\n${r.rol}`;

/** Añade sin duplicar (misma `urlEjecucion` y mismo `rol`) y ordena por `inicio`. No cambia el índice recibido. */
export function agregarEntrada(indice: ResumenEjecucion[], r: ResumenEjecucion): ResumenEjecucion[] {
  const ya = new Set(indice.map(clave));
  const nuevo = ya.has(clave(r)) ? [...indice] : [...indice, r];
  return nuevo.sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
}

/** Contenido de `ejecuciones/indice.json`, o null si aún no existe. */
export function leerIndice(contenido: string | null): ResumenEjecucion[] {
  if (contenido === null) return [];
  let valor: unknown;
  try {
    valor = JSON.parse(contenido);
  } catch {
    throw new Error(`${RUTA_INDICE} no es JSON válido`);
  }
  if (!Array.isArray(valor)) throw new Error(`${RUTA_INDICE} no es una lista`);
  return valor as ResumenEjecucion[];
}

/** El commit de la rama en la salida de `git ls-remote --heads`, o null si la rama no existe. */
export function shaDeLsRemote(salida: string, rama: string = RAMA_DATOS): string | null {
  for (const linea of salida.split('\n')) {
    const [sha, ref] = linea.trim().split(/\s+/);
    if (ref === `refs/heads/${rama}` && /^[0-9a-f]{40}$/.test(sha)) return sha;
  }
  return null;
}

/**
 * Si un `git push` rechazado se debe a que otra ejecución subió antes: la rama remota ya no está
 * donde estaba al empezar el intento. Git da varios mensajes distintos para esa carrera, así que
 * no se mira el texto. Si la rama no se movió, el fallo es otro y no se reintenta.
 */
export function huboCarrera(base: string | null, actual: string | null): boolean {
  return actual !== base;
}
