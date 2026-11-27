import { Octokit } from '@octokit/rest';
import type { ArchivoCambiado } from './clasificador.js';
import type { Comentario, Permiso } from './tipos.js';

export interface Issue { numero: number; titulo: string; cuerpo: string; autor: string; etiquetas: string[]; abierto: boolean; esPr: boolean }
export interface Revision { autor: string; estado: string; sha: string; fecha: string }

/** Lo que los envoltorios necesitan de GitHub. Se sustituye por un objeto falso en los tests. */
export interface ClienteGitHub {
  leerIssue(numero: number): Promise<Issue>;
  leerComentarios(numero: number): Promise<Comentario[]>;
  leerArchivosPr(numero: number): Promise<ArchivoCambiado[]>;
  leerRevisiones(numero: number): Promise<Revision[]>;
  leerPermiso(usuario: string): Promise<Permiso>;
  leerArchivo(ruta: string, ref: string): Promise<string | null>;
  cambiarEtiquetas(numero: number, p: { quitar: string[]; poner: string[] }): Promise<void>;
  comentar(numero: number, cuerpo: string): Promise<void>;
  crearIssue(p: { titulo: string; cuerpo: string; etiquetas: string[] }): Promise<number>;
  publicarCheck(p: { sha: string; nombre: string; conclusion: 'success' | 'failure' | 'neutral'; titulo: string; resumen: string }): Promise<void>;
  publicarEstado(p: { sha: string; contexto: string; estado: 'success' | 'failure' | 'pending' | 'error'; descripcion: string }): Promise<void>;
}

export function aArchivoCambiado(f: { filename: string; previous_filename?: string; additions: number; deletions: number; status?: string }): ArchivoCambiado {
  const archivo: ArchivoCambiado = { ruta: f.filename, adiciones: f.additions, eliminaciones: f.deletions };
  if (f.previous_filename) archivo.rutaAnterior = f.previous_filename;
  return archivo;
}

export function aComentario(c: { user?: { login: string } | null; body?: string | null; created_at: string }): Comentario {
  return { autor: c.user?.login ?? '', cuerpo: c.body ?? '', fecha: c.created_at };
}

/** La API devuelve seis niveles; la factory solo distingue cuatro. `maintain` escribe y `triage` solo lee. */
export function aPermiso(nivel: string): Permiso {
  switch (nivel) {
    case 'admin': return 'admin';
    case 'maintain':
    case 'write': return 'write';
    case 'triage':
    case 'read': return 'read';
    default: return 'none';
  }
}

const esNoEncontrado = (e: unknown) => typeof e === 'object' && e !== null && (e as { status?: number }).status === 404;

export function crearCliente(token: string, repositorio: string): ClienteGitHub {
  const [owner, repo] = repositorio.split('/');
  if (!owner || !repo) throw new Error(`Repositorio con formato inválido: ${repositorio}`);
  const gh = new Octokit({ auth: token });
  const base = { owner, repo };

  return {
    async leerIssue(numero) {
      const { data } = await gh.rest.issues.get({ ...base, issue_number: numero });
      return {
        numero: data.number,
        titulo: data.title,
        cuerpo: data.body ?? '',
        autor: data.user?.login ?? '',
        etiquetas: data.labels.map(l => (typeof l === 'string' ? l : l.name ?? '')).filter(Boolean),
        abierto: data.state === 'open',
        esPr: data.pull_request !== undefined,
      };
    },
    async leerComentarios(numero) {
      const datos = await gh.paginate(gh.rest.issues.listComments, { ...base, issue_number: numero, per_page: 100 });
      return datos.map(aComentario);
    },
    async leerArchivosPr(numero) {
      const datos = await gh.paginate(gh.rest.pulls.listFiles, { ...base, pull_number: numero, per_page: 100 });
      return datos.map(aArchivoCambiado);
    },
    async leerRevisiones(numero) {
      const datos = await gh.paginate(gh.rest.pulls.listReviews, { ...base, pull_number: numero, per_page: 100 });
      return datos.map(r => ({ autor: r.user?.login ?? '', estado: r.state, sha: r.commit_id ?? '', fecha: r.submitted_at ?? '' }));
    },
    async leerPermiso(usuario) {
      try {
        const { data } = await gh.rest.repos.getCollaboratorPermissionLevel({ ...base, username: usuario });
        return aPermiso(data.permission);
      } catch (e) {
        if (esNoEncontrado(e)) return 'none';
        throw e;
      }
    },
    async leerArchivo(ruta, ref) {
      try {
        const { data } = await gh.rest.repos.getContent({ ...base, path: ruta, ref });
        if (Array.isArray(data) || data.type !== 'file') return null;
        return Buffer.from(data.content, 'base64').toString('utf8');
      } catch (e) {
        if (esNoEncontrado(e)) return null;
        throw e;
      }
    },
    async cambiarEtiquetas(numero, { quitar, poner }) {
      for (const nombre of quitar) {
        try {
          await gh.rest.issues.removeLabel({ ...base, issue_number: numero, name: nombre });
        } catch (e) {
          if (!esNoEncontrado(e)) throw e;
        }
      }
      if (poner.length > 0) await gh.rest.issues.addLabels({ ...base, issue_number: numero, labels: poner });
    },
    async comentar(numero, cuerpo) {
      await gh.rest.issues.createComment({ ...base, issue_number: numero, body: cuerpo });
    },
    async crearIssue({ titulo, cuerpo, etiquetas }) {
      const { data } = await gh.rest.issues.create({ ...base, title: titulo, body: cuerpo, labels: etiquetas });
      return data.number;
    },
    async publicarCheck({ sha, nombre, conclusion, titulo, resumen }) {
      await gh.rest.checks.create({ ...base, head_sha: sha, name: nombre, status: 'completed', conclusion, output: { title: titulo, summary: resumen } });
    },
    async publicarEstado({ sha, contexto, estado, descripcion }) {
      await gh.rest.repos.createCommitStatus({ ...base, sha, state: estado, context: contexto, description: descripcion.slice(0, 140) });
    },
  };
}
