// Crea un proyecto desde la plantilla. Lo lanza nuevo-proyecto.yml con FACTORY_ADMIN_TOKEN en GH_TOKEN.
// Cada paso comprueba antes si ya está hecho, para poder relanzarlo tras un fallo.
// Uso: tsx scripts/cli/crear-proyecto.ts --nombre <repo> --descripcion <texto>
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { Octokit } from '@octokit/rest';
import { ETIQUETAS } from '../lib/estados.js';
import {
  CHECKS_OBLIGATORIOS, type Proyecto, agregarAlRegistro, cuerpoIssueInicial, proteccionRama,
  validarDescripcion, validarNombreProyecto, validarSha,
} from '../lib/proyecto.js';
import { entornoGit, git } from './git-io.js';
import { copiarPlantilla } from './plantilla-io.js';

const REGISTRO = 'proyectos.json';
const PLANTILLA = 'web-estatica';

function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre}`);
  return valor;
}

const esEstado = (e: unknown, ...codigos: number[]) =>
  typeof e === 'object' && e !== null && codigos.includes((e as { status?: number }).status ?? 0);

const paso = (texto: string) => console.log(`- ${texto}`);

const { values } = parseArgs({ options: { nombre: { type: 'string' }, descripcion: { type: 'string' } }, strict: true });
const nombre = values.nombre ?? '';
const descripcion = (values.descripcion ?? '').trim();

const token = requerida('GH_TOKEN');
const [propietario, repoFactory] = requerida('GITHUB_REPOSITORY').split('/');
const shaFactory = requerida('GITHUB_SHA');
const appId = Number(requerida('FACTORY_APP_ID'));
const variablesProducto: Record<string, string> = {
  FACTORY_APP_ID: requerida('FACTORY_APP_ID'),
  FACTORY_APP_CLIENT_ID: requerida('FACTORY_APP_CLIENT_ID'),
  FACTORY_APP_LOGIN: requerida('FACTORY_APP_LOGIN'),
  FACTORY_ACTIVA: requerida('FACTORY_ACTIVA'),
  FACTORY_HORARIO: requerida('FACTORY_HORARIO'),
  FACTORY_ZONA_HORARIA: requerida('FACTORY_ZONA_HORARIA'),
};
const SECRETOS_PRODUCTO = ['CLAUDE_CODE_OAUTH_TOKEN', 'FACTORY_APP_PRIVATE_KEY'];
for (const s of SECRETOS_PRODUCTO) requerida(s);
if (!Number.isInteger(appId) || appId <= 0) throw new Error('FACTORY_APP_ID no es un número válido');

const registro: Proyecto[] = JSON.parse(readFileSync(REGISTRO, 'utf8'));
const yaRegistrado = registro.some(p => p.nombre === nombre);
if (!yaRegistrado) validarNombreProyecto(nombre, registro);
validarDescripcion(descripcion);
validarSha(shaFactory);

const gh = new Octokit({ auth: token });
const base = { owner: propietario, repo: nombre };
const repoCompleto = `${propietario}/${nombre}`;

const { data: yo } = await gh.rest.users.getAuthenticated();
if (yo.login !== propietario) throw new Error(`El token de administración es de ${yo.login}, no de ${propietario}`);

// 1. Repositorio. Si ya existe, solo se continúa si está vacío o lo creó la factory.
async function tieneMain(): Promise<boolean> {
  try {
    await gh.rest.repos.getBranch({ ...base, branch: 'main' });
    return true;
  } catch (e) {
    if (esEstado(e, 404)) return false;
    throw e;
  }
}

try {
  await gh.rest.repos.get(base);
  const conMain = await tieneMain();
  if (conMain) {
    try {
      await gh.rest.repos.getContent({ ...base, path: '.factory/config.json', ref: 'main' });
    } catch (e) {
      if (esEstado(e, 404)) throw new Error(`Ya existe ${repoCompleto} y no lo creó la factory: no se toca`);
      throw e;
    }
  }
  paso(`El repositorio ${repoCompleto} ya existe y es de la factory: se continúa`);
} catch (e) {
  if (!esEstado(e, 404)) throw e;
  await gh.rest.repos.createForAuthenticatedUser({
    name: nombre, description: descripcion, private: false, auto_init: false, has_wiki: false, has_projects: false,
  });
  paso(`Repositorio público ${repoCompleto} creado`);
}

// 2. Pages con despliegue por flujo. En un repositorio vacío puede no estar permitido: se reintenta tras el push.
async function asegurarPages(): Promise<boolean> {
  try {
    const { data } = await gh.request('GET /repos/{owner}/{repo}/pages', base);
    if (data.build_type !== 'workflow') await gh.request('PUT /repos/{owner}/{repo}/pages', { ...base, build_type: 'workflow' });
    return true;
  } catch (e) {
    if (!esEstado(e, 404)) throw e;
  }
  try {
    await gh.request('POST /repos/{owner}/{repo}/pages', { ...base, build_type: 'workflow' });
    return true;
  } catch (e) {
    if (esEstado(e, 404, 409, 422)) return false;
    throw e;
  }
}
const pagesAntesDelPush = await asegurarPages();
paso(pagesAntesDelPush ? 'Pages activado (despliegue por flujo)' : 'Pages no se puede activar aún: se reintenta tras el push');

// 3. Secretos y variables. El valor de un secreto va por la entrada estándar de gh, nunca como argumento.
for (const secreto of SECRETOS_PRODUCTO) {
  const r = spawnSync('gh', ['secret', 'set', secreto, '-R', repoCompleto], {
    input: process.env[secreto], encoding: 'utf8', stdio: ['pipe', 'ignore', 'pipe'],
  });
  if (r.status !== 0) throw new Error(`No se pudo guardar el secreto ${secreto} (código ${r.status})`);
}
paso(`Secretos guardados: ${SECRETOS_PRODUCTO.join(', ')}`);

async function asegurarVariable(nombreVar: string, valor: string, soloSiFalta = false) {
  try {
    const { data } = await gh.rest.actions.getRepoVariable({ ...base, name: nombreVar });
    if (!soloSiFalta && data.value !== valor) await gh.rest.actions.updateRepoVariable({ ...base, name: nombreVar, value: valor });
  } catch (e) {
    if (!esEstado(e, 404)) throw e;
    await gh.rest.actions.createRepoVariable({ ...base, name: nombreVar, value: valor });
  }
}
for (const [nombreVar, valor] of Object.entries(variablesProducto)) await asegurarVariable(nombreVar, valor);
// La aprobación delegada empieza apagada y, si ya existe, no se toca: la cambia solo la persona operadora.
await asegurarVariable('FACTORY_APROBACION_DELEGADA', 'false', true);
paso('Variables guardadas');

// 4. Etiquetas de estado.
for (const e of ETIQUETAS) {
  try {
    await gh.rest.issues.createLabel({ ...base, name: e.nombre, color: e.color, description: e.descripcion });
  } catch (err) {
    if (!esEstado(err, 422)) throw err;
    await gh.rest.issues.updateLabel({ ...base, name: e.nombre, color: e.color, description: e.descripcion });
  }
}
paso(`${ETIQUETAS.length} etiquetas de estado`);

// 5. Commit inicial con la plantilla renderizada. Incluye .factory/aprobadoras.txt, antes de proteger main.
const entorno = entornoGit(token);
if (await tieneMain()) {
  paso('main ya tiene el commit inicial');
} else {
  const dir = mkdtempSync(join(tmpdir(), 'proyecto-'));
  const copiados = copiarPlantilla(PLANTILLA, dir, {
    PROPIETARIO: propietario, NOMBRE: nombre, DESCRIPCION: descripcion, REPO_FACTORY: repoFactory, SHA_FACTORY: shaFactory,
  });
  git(['init', '-q', '-b', 'main'], dir, entorno);
  git(['add', '-A'], dir, entorno);
  git(['commit', '-q', '-m', `Proyecto creado desde la plantilla ${PLANTILLA} de ${propietario}/${repoFactory}@${shaFactory.slice(0, 7)}`], dir, entorno);
  git(['push', '-q', `https://github.com/${repoCompleto}.git`, 'main'], dir, entorno);
  paso(`Commit inicial subido a main (${copiados} archivos)`);
}

// 6. Si Pages no se pudo activar antes, se activa ahora y se lanza el primer despliegue.
if (!pagesAntesDelPush) {
  if (!(await asegurarPages())) throw new Error('No se pudo activar Pages');
  await gh.rest.actions.createWorkflowDispatch({ ...base, workflow_id: 'desplegar.yml', ref: 'main' });
  paso('Pages activado y primer despliegue lanzado');
}

// 7. Fusión automática y protección de main, al final para no bloquear los pasos anteriores.
await gh.rest.repos.update({
  ...base, allow_auto_merge: true, delete_branch_on_merge: true,
  allow_squash_merge: true, allow_merge_commit: false, allow_rebase_merge: false,
});
// El tipo de Octokit aún exige `contexts`, que está obsoleto; la API acepta `checks` con `app_id` (supuesto 8).
type CuerpoProteccion = Parameters<typeof gh.rest.repos.updateBranchProtection>[0];
await gh.rest.repos.updateBranchProtection(
  { ...base, branch: 'main', ...proteccionRama(CHECKS_OBLIGATORIOS, appId) } as CuerpoProteccion,
);
paso('Fusión automática activada y main protegida');

// 8. Registro de proyectos en la factory.
if (yaRegistrado) {
  paso(`${nombre} ya estaba en ${REGISTRO}`);
} else {
  const proyecto: Proyecto = { nombre, repo: repoCompleto, descripcion, plantilla: PLANTILLA, creado: new Date().toISOString() };
  for (let intento = 1; ; intento++) {
    const actual: Proyecto[] = JSON.parse(readFileSync(REGISTRO, 'utf8'));
    writeFileSync(REGISTRO, `${JSON.stringify(agregarAlRegistro(actual, proyecto), null, 2)}\n`);
    git(['add', REGISTRO], '.', entorno);
    git(['commit', '-q', '-m', `chore: registrar el proyecto ${nombre}`], '.', entorno);
    try {
      git(['push', '-q', 'origin', 'HEAD:main'], '.', entorno);
      break;
    } catch (e) {
      if (intento >= 3) throw e;
      git(['reset', '-q', '--hard', 'HEAD~1'], '.', entorno);
      git(['pull', '-q', '--rebase', 'origin', 'main'], '.', entorno);
    }
  }
  paso(`${nombre} añadido a ${REGISTRO}`);
}

// 9. Primer issue: la especificación vacía, sin etiqueta. La persona operadora le pone factory:lista.
const { data: issues } = await gh.rest.issues.listForRepo({ ...base, state: 'all', per_page: 5 });
if (issues.some(i => !i.pull_request)) {
  paso('El proyecto ya tiene issues');
} else {
  const { data } = await gh.rest.issues.create({ ...base, title: 'Especificación: primera versión', body: cuerpoIssueInicial() });
  paso(`Issue #${data.number} abierto con la plantilla de especificación`);
}

console.log(`Proyecto listo: https://github.com/${repoCompleto}`);
