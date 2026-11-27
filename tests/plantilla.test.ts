import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, test } from 'vitest';
import { parse } from 'yaml';
import { MARCADORES, debeCopiarse, renderizarPlantilla } from '../scripts/lib/plantilla.js';

const RAIZ = 'plantillas/web-estatica';
const leer = (ruta: string) => readFileSync(join(RAIZ, ruta), 'utf8');
const leerYaml = (ruta: string) => parse(leer(ruta));

const ARCHIVOS = [
  'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts', 'eslint.config.js', '.dependency-cruiser.cjs',
  'playwright.config.ts', 'index.html', 'src/main.tsx', 'src/App.tsx', 'src/App.test.tsx', 'e2e/inicio.spec.ts',
  'AGENTS.md', 'CLAUDE.md', 'README.md', '.gitignore',
  'docs/arquitectura.md', 'docs/convenciones.md', 'docs/calidad.md', 'docs/diseno.md',
  '.factory/config.json', '.factory/aprobadoras.txt',
  '.github/workflows/ci.yml', '.github/workflows/desplegar.yml', '.github/workflows/factory.yml',
  '.github/ISSUE_TEMPLATE/especificacion.yml',
];

function listar(dir: string): string[] {
  return readdirSync(dir).flatMap(n => {
    const ruta = join(dir, n);
    return statSync(ruta).isDirectory() ? listar(ruta) : [relative(RAIZ, ruta).replaceAll('\\', '/')];
  });
}

describe('archivos de la plantilla', () => {
  test.each(ARCHIVOS)('existe %s', ruta => expect(existsSync(join(RAIZ, ruta))).toBe(true));

  test('no incluye instrucciones de Copilot: no hay revisor externo', () =>
    expect(existsSync(join(RAIZ, '.github/copilot-instructions.md'))).toBe(false));

  test('no incluye dependencias instaladas ni compilaciones', () =>
    expect(listar(RAIZ).some(r => /^(node_modules|dist|coverage)\//.test(r))).toBe(false));
});

describe('marcadores', () => {
  test('todos los marcadores usados en la plantilla son conocidos', () => {
    const usados = new Set(listar(RAIZ).flatMap(r => [...leer(r).matchAll(/__([A-Z][A-Z_]*)__/g)].map(m => m[1])));
    expect([...usados].filter(m => !MARCADORES.includes(m))).toEqual([]);
  });

  test('sustituye todos los marcadores', () =>
    expect(renderizarPlantilla('__PROPIETARIO__/__NOMBRE__ y __NOMBRE__', { PROPIETARIO: 'ana', NOMBRE: 'panel' }))
      .toBe('ana/panel y panel'));

  test('falla si queda un marcador sin valor', () =>
    expect(() => renderizarPlantilla('__DESCRIPCION__', {})).toThrow(/DESCRIPCION/));

  test('no copia dependencias instaladas, compilaciones ni informes', () => {
    for (const r of ['node_modules/react/index.js', 'dist/index.html', 'coverage/x.xml', 'test-results/a', 'playwright-report/index.html'])
      expect(debeCopiarse(r)).toBe(false);
    for (const r of ['src/App.tsx', '.github/workflows/ci.yml', 'package-lock.json']) expect(debeCopiarse(r)).toBe(true);
  });

  test('deja intactos los nombres en minúsculas como __snapshots__', () =>
    expect(renderizarPlantilla('src/__snapshots__/a.snap', {})).toBe('src/__snapshots__/a.snap'));
});

describe('configuración de la factory', () => {
  test('config.json tiene las claves del plan y no hay revisor externo', () => {
    const c = JSON.parse(leer('.factory/config.json'));
    expect(Object.keys(c).sort()).toEqual(['maxLineasDiff', 'maxRondas', 'modelos', 'revisorExterno', 'rutasSensibles', 'urlDespliegue']);
    expect(c).toMatchObject({ rutasSensibles: [], maxLineasDiff: 400, maxRondas: 3, revisorExterno: 'ninguno',
      modelos: { planificador: 'opus', implementador: 'sonnet', revisor: 'opus' },
      urlDespliegue: 'https://__PROPIETARIO__.github.io/__NOMBRE__/' });
  });

  test('la persona propietaria es aprobadora desde el commit inicial', () =>
    expect(leer('.factory/aprobadoras.txt').split('\n').map(l => l.trim())).toContain('__PROPIETARIO__'));
});

describe('arnés', () => {
  test('AGENTS.md tiene menos de 120 líneas', () => expect(leer('AGENTS.md').split('\n').length).toBeLessThan(120));

  test.each(['docs/arquitectura.md', 'docs/convenciones.md', 'docs/calidad.md', 'docs/diseno.md'])('AGENTS.md enlaza %s', doc =>
    expect(leer('AGENTS.md')).toContain(`(${doc})`));

  test('AGENTS.md nombra los comandos y prohíbe tocar .github/ y .factory/', () => {
    const agentes = leer('AGENTS.md');
    for (const t of ['npm run verificar', 'npm run e2e', '.github/', '.factory/']) expect(agentes).toContain(t);
  });

  test('CLAUDE.md contiene solo @AGENTS.md', () => expect(leer('CLAUDE.md').trim()).toBe('@AGENTS.md'));

  test('npm run verificar ejecuta tipos, lint, arquitectura y tests', () => {
    const { scripts } = JSON.parse(leer('package.json'));
    expect(scripts.verificar).toBe('npm run tipos && npm run lint && npm run arquitectura && npm run test');
    for (const s of ['tipos', 'lint', 'arquitectura', 'test', 'cobertura', 'e2e', 'build', 'preview']) expect(scripts[s]).toBeTruthy();
  });

  test('el lockfile corresponde al package.json', () => {
    const lock = JSON.parse(leer('package-lock.json'));
    const pkg = JSON.parse(leer('package.json'));
    expect(lock.name).toBe('__NOMBRE__');
    expect(lock.packages[''].devDependencies).toEqual(pkg.devDependencies);
    expect(lock.packages[''].dependencies).toEqual(pkg.dependencies);
  });
});

describe('flujos de la plantilla', () => {
  test('ci.yml declara exactamente los seis checks obligatorios', () =>
    expect(Object.keys(leerYaml('.github/workflows/ci.yml').jobs).sort())
      .toEqual(['e2e', 'estatico', 'lint', 'secretos', 'tests', 'tipos']));

  test('ci.yml corre en PR y en push a main, solo con lectura y sin secretos', () => {
    const ci = leerYaml('.github/workflows/ci.yml');
    expect(Object.keys(ci.on).sort()).toEqual(['pull_request', 'push']);
    expect(ci.on.push.branches).toEqual(['main']);
    expect(ci.permissions).toEqual({ contents: 'read' });
    expect(leer('.github/workflows/ci.yml')).not.toMatch(/secrets\./);
  });

  test('ci.yml exige el 80% de cobertura en las líneas del diff', () =>
    expect(leer('.github/workflows/ci.yml')).toMatch(/diff-cover .*--compare-branch=origin\/main .*--fail-under=80/));

  test('desplegar.yml publica en Pages al fusionar en main, sin secretos', () => {
    const d = leerYaml('.github/workflows/desplegar.yml');
    expect(Object.keys(d.on)).toEqual(['push']);
    expect(d.on.push.branches).toEqual(['main']);
    expect(d.permissions).toMatchObject({ pages: 'write', 'id-token': 'write' });
    expect(leer('.github/workflows/desplegar.yml')).not.toMatch(/secrets\./);
  });

  test('factory.yml escucha los eventos del plan', () => {
    const f = leerYaml('.github/workflows/factory.yml');
    expect(Object.keys(f.on).sort()).toEqual(['issues', 'pull_request_review', 'pull_request_target', 'schedule', 'status', 'workflow_run']);
    expect(f.on.issues.types).toEqual(['labeled']);
    expect(f.on.pull_request_target.types).toEqual(['opened', 'synchronize', 'closed']);
    expect(f.on.pull_request_review.types).toEqual(['submitted']);
    expect(f.on.workflow_run).toEqual({ workflows: ['ci'], types: ['completed'] });
    expect(f.on.schedule).toEqual([{ cron: '*/30 * * * *' }]);
  });

  test('factory.yml llama al despachador fijado por SHA y le pasa ese mismo SHA', () => {
    const [trabajo, ...otros] = Object.values(leerYaml('.github/workflows/factory.yml').jobs) as any[];
    expect(otros).toHaveLength(0);
    expect(trabajo.uses).toBe('__PROPIETARIO__/__REPO_FACTORY__/.github/workflows/despachador.yml@__SHA_FACTORY__');
    expect(trabajo.with.version_factory).toBe('__SHA_FACTORY__');
  });

  test('factory.yml pasa los secretos por nombre, nunca con inherit', () => {
    const [trabajo] = Object.values(leerYaml('.github/workflows/factory.yml').jobs) as any[];
    expect(Object.keys(trabajo.secrets).sort()).toEqual(['CLAUDE_CODE_OAUTH_TOKEN', 'FACTORY_APP_PRIVATE_KEY']);
  });

  test('factory.yml pasa las variables de la factory como entradas', () => {
    const [trabajo] = Object.values(leerYaml('.github/workflows/factory.yml').jobs) as any[];
    expect(trabajo.with).toMatchObject({
      app_id: '${{ vars.FACTORY_APP_ID }}', app_client_id: '${{ vars.FACTORY_APP_CLIENT_ID }}',
      app_login: '${{ vars.FACTORY_APP_LOGIN }}', activa: '${{ vars.FACTORY_ACTIVA }}',
      horario: '${{ vars.FACTORY_HORARIO }}', zona_horaria: '${{ vars.FACTORY_ZONA_HORARIA }}',
      aprobacion_delegada: '${{ vars.FACTORY_APROBACION_DELEGADA }}',
    });
  });

  test('factory.yml no se ejecuta para PR ni runs que vienen de un fork', () => {
    const [trabajo] = Object.values(leerYaml('.github/workflows/factory.yml').jobs) as any[];
    expect(trabajo.if).toContain('github.event.pull_request.head.repo.full_name == github.repository');
    expect(trabajo.if).toContain('github.event.workflow_run.head_repository.full_name == github.repository');
  });

  test('factory.yml solo concede permisos de lectura al token de Actions', () => {
    const permisos = leerYaml('.github/workflows/factory.yml').permissions as Record<string, string>;
    expect(Object.values(permisos).every(p => p === 'read')).toBe(true);
  });

  test('la plantilla de especificación tiene tres campos obligatorios', () => {
    const campos = (leerYaml('.github/ISSUE_TEMPLATE/especificacion.yml').body as any[]).filter(c => c.type !== 'markdown');
    expect(campos.map(c => c.attributes.label)).toEqual(['Qué debe hacer', 'Criterios de aceptación', 'Qué no debe tocar']);
    expect(campos.every(c => c.validations?.required === true)).toBe(true);
  });
});
