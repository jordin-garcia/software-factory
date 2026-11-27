// Abre en cada proyecto un PR que fija su factory.yml a otro commit de la factory.
// Lo lanza actualizar-despachador.yml con FACTORY_ADMIN_TOKEN en GH_TOKEN: la aplicación no tiene Workflows.
// Uso: tsx scripts/cli/actualizar-despachador.ts --sha <commit de main de la factory>
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { Octokit } from '@octokit/rest';
import { type Proyecto, actualizarShaDespachador, validarSha } from '../lib/proyecto.js';

const RUTA = '.github/workflows/factory.yml';

const token = process.env.GH_TOKEN;
const repositorio = process.env.GITHUB_REPOSITORY;
if (!token || !repositorio) throw new Error('Faltan GH_TOKEN o GITHUB_REPOSITORY');
const [propietario, repoFactory] = repositorio.split('/');

const { values } = parseArgs({ options: { sha: { type: 'string' } }, strict: true });
const sha = values.sha || process.env.GITHUB_SHA || '';
validarSha(sha);

const gh = new Octokit({ auth: token });

// Solo se fija un commit que ya está en main de la factory, nunca uno de una rama sin revisar.
const { data: comparacion } = await gh.rest.repos.compareCommits({ owner: propietario, repo: repoFactory, base: sha, head: 'main' });
if (!['ahead', 'identical'].includes(comparacion.status)) throw new Error(`${sha} no está en main de ${repositorio}`);

const registro: Proyecto[] = JSON.parse(readFileSync('proyectos.json', 'utf8'));
const corto = sha.slice(0, 7);
const rama = `factory/despachador-${corto}`;

for (const p of registro) {
  const [owner, repo] = p.repo.split('/');
  const base = { owner, repo };
  const { data: archivo } = await gh.rest.repos.getContent({ ...base, path: RUTA, ref: 'main' });
  if (Array.isArray(archivo) || archivo.type !== 'file') throw new Error(`${p.repo}: ${RUTA} no es un archivo`);
  const actual = Buffer.from(archivo.content, 'base64').toString('utf8');
  const nuevo = actualizarShaDespachador(actual, sha);
  if (nuevo === actual) {
    console.log(`- ${p.repo}: ya usa ${corto}`);
    continue;
  }

  const { data: abiertos } = await gh.rest.pulls.list({ ...base, head: `${owner}:${rama}`, state: 'open' });
  if (abiertos.length > 0) {
    console.log(`- ${p.repo}: ya tiene el PR #${abiertos[0].number}`);
    continue;
  }

  const { data: main } = await gh.rest.repos.getBranch({ ...base, branch: 'main' });
  try {
    await gh.rest.git.createRef({ ...base, ref: `refs/heads/${rama}`, sha: main.commit.sha });
  } catch (e) {
    if ((e as { status?: number }).status !== 422) throw e;
    await gh.rest.git.updateRef({ ...base, ref: `heads/${rama}`, sha: main.commit.sha, force: true });
  }
  await gh.rest.repos.createOrUpdateFileContents({
    ...base, path: RUTA, branch: rama, sha: archivo.sha,
    message: `ci: fijar el despachador de la factory en ${corto}`,
    content: Buffer.from(nuevo).toString('base64'),
  });
  const { data: pr } = await gh.rest.pulls.create({
    ...base, head: rama, base: 'main',
    title: `Fijar el despachador de la factory en ${corto}`,
    body: `Cambia el commit de \`${repositorio}\` que usa \`${RUTA}\` a [\`${corto}\`](https://github.com/${repositorio}/commit/${sha}).\n\n`
      + 'Toca `.github/`, así que es de riesgo alto: lo aprueba una persona.',
  });
  console.log(`- ${p.repo}: PR #${pr.number}`);
}
