// Guarda un resumen de ejecución en la rama factory-datos del repositorio de producto, y lo añade al índice.
// Lo lanzan los trabajos de publicación del despachador con el token de la aplicación en GH_TOKEN.
// Cada intento parte de un clon nuevo de solo esa rama. Si otra ejecución sube antes, se vuelve a traer
// la rama y se reaplica la entrada, hasta 5 veces.
// Uso: tsx scripts/cli/registrar.ts --resumen <archivo.json>   (repositorio en GITHUB_REPOSITORY)
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { Ajv } from 'ajv';
import {
  RAMA_DATOS, RUTA_INDICE, agregarEntrada, huboCarrera, leerIndice, rutaResumen, shaDeLsRemote,
} from '../lib/registro.js';
import type { ResumenEjecucion } from '../lib/tipos.js';
import { entornoGit, git } from './git-io.js';

const INTENTOS = 5;
const ESQUEMA = new URL('../../esquemas/resumen-ejecucion.schema.json', import.meta.url);

function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre}`);
  return valor;
}

const esperar = (ms: number) => new Promise(resolver => setTimeout(resolver, ms));

function leerResumen(ruta: string): ResumenEjecucion {
  const validar = new Ajv({ allErrors: true }).compile(JSON.parse(readFileSync(ESQUEMA, 'utf8')));
  const resumen: unknown = JSON.parse(readFileSync(ruta, 'utf8'));
  // errorsText da rutas y reglas, no los valores.
  if (!validar(resumen)) throw new Error(`El resumen no cumple el esquema: ${new Ajv().errorsText(validar.errors)}`);
  return resumen as ResumenEjecucion;
}

type Desenlace = 'subido' | 'ya-estaba' | 'conflicto';

function intentar(resumen: ResumenEjecucion, ruta: string, url: string, entorno: NodeJS.ProcessEnv): Desenlace {
  const dir = mkdtempSync(join(tmpdir(), 'factory-datos-'));
  try {
    git(['init', '-q', '-b', RAMA_DATOS], dir, entorno);
    const remoto = () => shaDeLsRemote(git(['ls-remote', '--heads', url, RAMA_DATOS], dir, entorno));
    const base = remoto();
    if (base) {
      git(['fetch', '-q', '--depth=1', url, base], dir, entorno);
      git(['reset', '-q', '--hard', 'FETCH_HEAD'], dir, entorno);
    }
    // Si la rama no existe, el repositorio recién iniciado ya es la rama huérfana.

    const rutaIndice = join(dir, RUTA_INDICE);
    const indice = leerIndice(existsSync(rutaIndice) ? readFileSync(rutaIndice, 'utf8') : null);
    const nuevo = agregarEntrada(indice, resumen);
    if (nuevo.length === indice.length) return 'ya-estaba';

    mkdirSync(dirname(join(dir, ruta)), { recursive: true });
    writeFileSync(join(dir, ruta), `${JSON.stringify(resumen, null, 2)}\n`);
    writeFileSync(rutaIndice, `${JSON.stringify(nuevo, null, 2)}\n`);
    git(['add', '-A'], dir, entorno);
    git(['commit', '-q', '-m', `datos: ${ruta}`], dir, entorno);
    try {
      git(['push', '-q', url, `HEAD:refs/heads/${RAMA_DATOS}`], dir, entorno);
      return 'subido';
    } catch (e) {
      if (huboCarrera(base, remoto())) return 'conflicto';
      throw e;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function principal() {
  const { values } = parseArgs({ options: { resumen: { type: 'string' } }, strict: true });
  if (!values.resumen) throw new Error('Falta --resumen');
  const entorno = entornoGit(requerida('GH_TOKEN'));
  const url = `https://github.com/${requerida('GITHUB_REPOSITORY')}.git`;

  const resumen = leerResumen(values.resumen);
  const ruta = rutaResumen(resumen);
  for (let i = 1; i <= INTENTOS; i++) {
    const desenlace = intentar(resumen, ruta, url, entorno);
    if (desenlace !== 'conflicto') {
      console.log(`- ${ruta}: ${desenlace === 'subido' ? 'registrado' : 'ya estaba en el índice'} (intento ${i})`);
      return;
    }
    console.log(`- ${ruta}: otra ejecución subió antes, se reintenta (intento ${i})`);
    // Espera aleatoria para que dos ejecuciones no choquen otra vez al mismo tiempo.
    if (i < INTENTOS) await esperar(1000 + Math.random() * 2000 * i);
  }
  throw new Error(`No se pudo registrar ${ruta} tras ${INTENTOS} intentos`);
}

// Solo el mensaje: no se imprime nada más del entorno.
principal().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : 'Error desconocido');
  process.exit(1);
});
