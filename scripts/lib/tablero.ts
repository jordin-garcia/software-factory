import { ETIQUETAS, leerEstado } from './estados.js';

/** Columnas del tablero, en orden. Son los valores del campo de selección `Etapa`. */
export const COLUMNAS: string[] = [
  'Especificación', 'Plan', 'En cola', 'Implementando', 'En revisión',
  'Esperando aprobación', 'Verificando', 'Hecha', 'Bloqueada',
];

// Una especificación en curso tiene sus tareas en marcha: se ve como implementando.
// Cambios pedidos vuelve al implementador. En pausa y bloqueada esperan las dos a algo externo.
const COLUMNA_POR_ESTADO: Record<string, string> = {
  'factory:lista': 'Especificación',
  'factory:plan-propuesto': 'Plan',
  'factory:plan-aprobado': 'Plan',
  'factory:en-curso': 'Implementando',
  'factory:pendiente': 'En cola',
  'factory:implementar': 'Implementando',
  'factory:en-revision': 'En revisión',
  'factory:cambios-pedidos': 'Implementando',
  'factory:esperando-aprobacion': 'Esperando aprobación',
  'factory:fusionada': 'Verificando',
  'factory:hecha': 'Hecha',
  'factory:bloqueada': 'Bloqueada',
  'factory:en-pausa': 'Bloqueada',
};

const ESTADOS = new Set(ETIQUETAS.map(e => e.nombre));

export function columnaDeEstado(estado: string): string {
  if (!ESTADOS.has(estado) || !Object.hasOwn(COLUMNA_POR_ESTADO, estado)) {
    throw new Error(`Estado sin columna en el tablero: ${estado}`);
  }
  return COLUMNA_POR_ESTADO[estado];
}

/** Id de opción del campo `Etapa` para cada columna. Lanza si el tablero no tiene alguna. */
export function opcionesDeEtapa(opciones: { id: string; nombre: string }[]): Map<string, string> {
  const porNombre = new Map(opciones.map(o => [o.nombre, o.id]));
  const faltan = COLUMNAS.filter(c => !porNombre.has(c));
  if (faltan.length > 0) throw new Error(`Al campo Etapa le faltan opciones: ${faltan.join(', ')}`);
  return new Map(COLUMNAS.map(c => [c, porNombre.get(c) as string]));
}

/** Un issue de un proyecto registrado. `contenidoId` es su id de nodo de GraphQL. */
export interface IssueProyecto { contenidoId: string; repo: string; numero: number; etiquetas: string[] }
/** Un elemento del tablero: su id, el id de nodo del issue que contiene y su etapa actual. */
export interface ElementoTablero { id: string; contenidoId: string; etapa: string | null }
/** Poner `etapa` al issue. Si `elementoId` es null, antes hay que añadirlo al tablero. */
export interface AccionTablero { contenidoId: string; elementoId: string | null; repo: string; numero: number; etapa: string }

export function planificarSincronizacion(issues: IssueProyecto[], elementos: ElementoTablero[]):
  { acciones: AccionTablero[]; conflictos: string[] } {
  const porContenido = new Map(elementos.map(e => [e.contenidoId, e]));
  const acciones: AccionTablero[] = [];
  const conflictos: string[] = [];
  for (const i of issues) {
    const { estado, conflicto } = leerEstado(i.etiquetas);
    if (conflicto) {
      conflictos.push(`${i.repo}#${i.numero}`);
      continue;
    }
    if (!estado) continue;
    const etapa = columnaDeEstado(estado);
    const actual = porContenido.get(i.contenidoId);
    if (actual?.etapa === etapa) continue;
    acciones.push({ contenidoId: i.contenidoId, elementoId: actual?.id ?? null, repo: i.repo, numero: i.numero, etapa });
  }
  return { acciones, conflictos };
}
