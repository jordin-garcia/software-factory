export { renderizarPlantilla } from './plantilla.js';

export interface Proyecto { nombre: string; repo: string; descripcion: string; plantilla: 'web-estatica'; creado: string }

/** Id de la aplicación GitHub Actions: los checks de ci solo valen si los publica ella. */
export const ID_APP_GITHUB_ACTIONS = 15368;

// Los seis primeros son los trabajos de ci.yml de la plantilla; los dos últimos los publica la factory.
export const CHECKS_OBLIGATORIOS: string[] = [
  'tipos', 'lint', 'tests', 'e2e', 'estatico', 'secretos', 'factory/clasificador', 'factory/aprobacion',
];

export function validarNombreProyecto(nombre: string, registro: Proyecto[]): void {
  if (!/^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/.test(nombre)) {
    throw new Error('El nombre solo admite minúsculas, dígitos y guiones, sin guion al principio ni al final, y hasta 60 caracteres');
  }
  if (registro.some(p => p.nombre === nombre)) throw new Error(`El proyecto ${nombre} ya existe en el registro`);
}

/** La descripción se sustituye tal cual en package.json, AGENTS.md y README.md: no puede romper esos formatos. */
export function validarDescripcion(descripcion: string): void {
  if (!descripcion.trim()) throw new Error('La descripción no puede estar vacía');
  if (descripcion.length > 200) throw new Error('La descripción admite hasta 200 caracteres');
  if (/["\\<>{}`]|[\u0000-\u001f\u007f]/.test(descripcion)) {
    throw new Error('La descripción no admite comillas dobles, barras invertidas, <, >, {, }, acentos graves ni saltos de línea');
  }
}

export function validarSha(sha: string): void {
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error(`El SHA debe tener 40 caracteres hexadecimales en minúsculas: ${sha}`);
}

export function agregarAlRegistro(registro: Proyecto[], p: Proyecto): Proyecto[] {
  const resto = registro.filter(r => r.nombre !== p.nombre);
  const existente = registro.find(r => r.nombre === p.nombre);
  return [...resto, existente ?? p].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/** Cuerpo de PUT /repos/{owner}/{repo}/branches/main/protection. */
export function proteccionRama(checks: string[], appId: number): object {
  return {
    required_status_checks: {
      strict: true,
      checks: checks.map(context => ({ context, app_id: context.startsWith('factory/') ? appId : ID_APP_GITHUB_ACTIONS })),
    },
    enforce_admins: true,
    required_pull_request_reviews: null,
    restrictions: null,
    allow_force_pushes: false,
    allow_deletions: false,
  };
}

const USES_DESPACHADOR = /(uses:\s*\S+\/\.github\/workflows\/despachador\.yml@)[0-9a-f]{40}/g;
const VERSION_FACTORY = /(version_factory:\s*)[0-9a-f]{40}/g;

/** Cambia el commit de la factory al que apunta el factory.yml de un producto. */
export function actualizarShaDespachador(contenido: string, sha: string): string {
  validarSha(sha);
  const usos = contenido.match(USES_DESPACHADOR)?.length ?? 0;
  const versiones = contenido.match(VERSION_FACTORY)?.length ?? 0;
  if (usos !== 1 || versiones !== 1) {
    throw new Error('factory.yml no tiene exactamente un uses del despachador y un version_factory fijados por SHA');
  }
  return contenido.replace(USES_DESPACHADOR, `$1${sha}`).replace(VERSION_FACTORY, `$1${sha}`);
}

/** Primer issue de un proyecto: la plantilla de especificación vacía. */
export function cuerpoIssueInicial(): string {
  return [
    'Escribe aquí la primera especificación del proyecto. Cuando esté completa, ponle la etiqueta `factory:lista`.',
    '',
    '### Qué debe hacer',
    '',
    '_El comportamiento que quieres, desde el punto de vista de quien usa la aplicación._',
    '',
    '### Criterios de aceptación',
    '',
    '_Una lista de comprobaciones concretas._',
    '',
    '### Qué no debe tocar',
    '',
    '_Partes del proyecto que deben quedar como están._',
  ].join('\n');
}
