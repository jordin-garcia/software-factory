/** Marcadores que puede contener una plantilla de proyecto, escritos como `__NOMBRE__`. */
export const MARCADORES = ['PROPIETARIO', 'NOMBRE', 'DESCRIPCION', 'REPO_FACTORY', 'SHA_FACTORY'];

const MARCADOR = /__([A-Z][A-Z_]*)__/g;

const NO_SE_COPIAN = ['node_modules', 'dist', 'coverage', 'test-results', 'playwright-report'];

/** Si un archivo de la plantilla, con su ruta relativa en formato `a/b`, se copia al proyecto. */
export function debeCopiarse(ruta: string): boolean {
  return !ruta.split('/').some(parte => NO_SE_COPIAN.includes(parte));
}

/**
 * Sustituye cada `__CLAVE__` por `vars[CLAVE]`. Lanza si queda algún marcador en mayúsculas sin valor,
 * para que nunca se publique un proyecto a medio renderizar. Los nombres en minúsculas (`__snapshots__`) no son marcadores.
 */
export function renderizarPlantilla(contenido: string, vars: Record<string, string>): string {
  const faltan = new Set<string>();
  const resultado = contenido.replace(MARCADOR, (entero, clave: string) => {
    if (Object.hasOwn(vars, clave)) return vars[clave];
    faltan.add(clave);
    return entero;
  });
  if (faltan.size > 0) throw new Error(`Faltan valores para los marcadores: ${[...faltan].join(', ')}`);
  return resultado;
}
