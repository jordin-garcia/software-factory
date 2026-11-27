// Sincroniza el tablero (Projects v2 de la cuenta) con las etiquetas de estado de los proyectos registrados.
// Lo lanza tablero.yml con FACTORY_TABLERO_TOKEN en GH_TOKEN: un PAT clásico solo con el alcance `project`,
// porque la aplicación recibe FORBIDDEN en Projects de una cuenta personal (docs/supuestos.md, Step 14).
// No relee lo que escribe: la lectura llega con minutos de retraso. Añadir un issue que ya está
// devuelve el elemento existente, así que relanzar no duplica nada.
// Uso: tsx scripts/cli/tablero.ts
import { readFileSync } from 'node:fs';
import { Octokit } from '@octokit/rest';
import { crearCliente } from '../lib/github.js';
import type { Proyecto } from '../lib/proyecto.js';
import { type ElementoTablero, type IssueProyecto, opcionesDeEtapa, planificarSincronizacion } from '../lib/tablero.js';

const CAMPO = 'Etapa';

interface RespuestaTablero {
  user: {
    projectV2: {
      id: string;
      field: { id?: string; options?: { id: string; name: string }[] } | null;
      items: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: { id: string; content: { id?: string } | null; fieldValueByName: { name?: string } | null }[];
      };
    } | null;
  } | null;
}

const CONSULTA_TABLERO = `
query($login: String!, $numero: Int!, $despues: String) {
  user(login: $login) {
    projectV2(number: $numero) {
      id
      field(name: "${CAMPO}") { ... on ProjectV2SingleSelectField { id options { id name } } }
      items(first: 100, after: $despues) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          content { ... on Issue { id } }
          fieldValueByName(name: "${CAMPO}") { ... on ProjectV2ItemFieldSingleSelectValue { name } }
        }
      }
    }
  }
}`;

const AGREGAR = `
mutation($proyecto: ID!, $contenido: ID!) {
  addProjectV2ItemById(input: { projectId: $proyecto, contentId: $contenido }) { item { id } }
}`;

const PONER_ETAPA = `
mutation($proyecto: ID!, $elemento: ID!, $campo: ID!, $opcion: String!) {
  updateProjectV2ItemFieldValue(input: {
    projectId: $proyecto, itemId: $elemento, fieldId: $campo, value: { singleSelectOptionId: $opcion }
  }) { projectV2Item { id } }
}`;

function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre}`);
  return valor;
}

async function leerTablero(gh: Octokit, login: string, numero: number) {
  const elementos: ElementoTablero[] = [];
  let despues: string | null = null;
  let proyectoId = '';
  let campo: { id: string; options: { id: string; name: string }[] } | null = null;
  do {
    const r: RespuestaTablero = await gh.graphql(CONSULTA_TABLERO, { login, numero, despues });
    const p = r.user?.projectV2;
    if (!p) throw new Error(`No existe el proyecto ${numero} de ${login}, o el token no lo ve`);
    proyectoId = p.id;
    if (p.field?.id && p.field.options) campo = { id: p.field.id, options: p.field.options };
    for (const n of p.items.nodes) {
      if (n.content?.id) elementos.push({ id: n.id, contenidoId: n.content.id, etapa: n.fieldValueByName?.name ?? null });
    }
    despues = p.items.pageInfo.hasNextPage ? p.items.pageInfo.endCursor : null;
  } while (despues);
  if (!campo) throw new Error(`El proyecto ${numero} no tiene un campo de selección ${CAMPO}`);
  return { proyectoId, campo, elementos };
}

async function leerIssues(token: string, repositorio: string): Promise<IssueProyecto[]> {
  const issues = await crearCliente(token, repositorio).listarIssues();
  return issues.map(i => ({ contenidoId: i.nodoId, repo: repositorio, numero: i.numero, etiquetas: i.etiquetas }));
}

async function principal() {
  const token = requerida('GH_TOKEN');
  const [login] = requerida('GITHUB_REPOSITORY').split('/');
  const numero = Number(requerida('FACTORY_TABLERO'));
  if (!Number.isInteger(numero) || numero <= 0) throw new Error('FACTORY_TABLERO no es un número de proyecto válido');

  const gh = new Octokit({ auth: token });
  const { proyectoId, campo, elementos } = await leerTablero(gh, login, numero);
  const opciones = opcionesDeEtapa(campo.options.map(o => ({ id: o.id, nombre: o.name })));

  const registro: Proyecto[] = JSON.parse(readFileSync('proyectos.json', 'utf8'));
  const issues: IssueProyecto[] = [];
  for (const p of registro) issues.push(...await leerIssues(token, p.repo));

  const { acciones, conflictos } = planificarSincronizacion(issues, elementos);
  for (const c of conflictos) console.log(`- ${c}: tiene más de un estado, no se mueve`);
  for (const a of acciones) {
    let elemento = a.elementoId;
    if (!elemento) {
      const r: { addProjectV2ItemById: { item: { id: string } } } =
        await gh.graphql(AGREGAR, { proyecto: proyectoId, contenido: a.contenidoId });
      elemento = r.addProjectV2ItemById.item.id;
    }
    await gh.graphql(PONER_ETAPA, { proyecto: proyectoId, elemento, campo: campo.id, opcion: opciones.get(a.etapa) });
    console.log(`- ${a.repo}#${a.numero}: ${a.elementoId ? 'movido' : 'añadido'} a ${a.etapa}`);
  }
  console.log(`${registro.length} proyectos, ${issues.length} issues, ${acciones.length} cambios, ${conflictos.length} conflictos`);
}

// Solo el mensaje: el objeto de error de Octokit lleva la petición entera.
principal().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : 'Error desconocido');
  process.exit(1);
});
