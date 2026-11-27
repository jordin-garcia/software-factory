import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { parse } from 'yaml';
import {
  CHECKS_OBLIGATORIOS,
  ID_APP_GITHUB_ACTIONS,
  type Proyecto,
  actualizarShaDespachador,
  agregarAlRegistro,
  cuerpoIssueInicial,
  proteccionRama,
  validarDescripcion,
  validarNombreProyecto,
  validarSha,
} from '../scripts/lib/proyecto.js';

const SHA_A = 'a'.repeat(40);
const SHA_B = 'b'.repeat(40);

describe('validarNombreProyecto', () => {
  test('acepta minúsculas, dígitos y guiones', () =>
    expect(() => validarNombreProyecto('panel-factory', [])).not.toThrow());

  test.each(['Panel', 'con espacio', '-inicio', 'fin-', 'a'.repeat(61), '', 'con_guion_bajo', 'punto.js'])('rechaza %s', n =>
    expect(() => validarNombreProyecto(n, [])).toThrow());

  test('acepta 60 caracteres', () => expect(() => validarNombreProyecto('a'.repeat(60), [])).not.toThrow());

  test('rechaza un nombre ya registrado', () =>
    expect(() => validarNombreProyecto('panel', [{ nombre: 'panel' } as Proyecto])).toThrow(/ya existe/));
});

describe('validarDescripcion', () => {
  test('acepta texto normal con acentos y signos', () =>
    expect(() => validarDescripcion('Panel de métricas: estado, costo y tareas (versión 1).')).not.toThrow());

  test.each(['', '   ', 'con "comillas"', 'con \\ barra', 'con <html>', 'con {llaves}', 'con `acento grave`', 'dos\nlíneas', 'x'.repeat(201)])(
    'rechaza %j', d => expect(() => validarDescripcion(d)).toThrow());
});

describe('agregarAlRegistro', () => {
  test('el registro queda ordenado por nombre', () =>
    expect(agregarAlRegistro([{ nombre: 'b' } as Proyecto], { nombre: 'a' } as Proyecto).map(p => p.nombre))
      .toEqual(['a', 'b']));

  test('añadir un proyecto que ya está no lo duplica', () =>
    expect(agregarAlRegistro([{ nombre: 'a' } as Proyecto], { nombre: 'a' } as Proyecto)).toHaveLength(1));

  test('no modifica el registro recibido', () => {
    const registro = [{ nombre: 'b' } as Proyecto];
    agregarAlRegistro(registro, { nombre: 'a' } as Proyecto);
    expect(registro).toHaveLength(1);
  });
});

describe('proteccionRama', () => {
  test('la protección aplica a administradores y no exige revisiones de GitHub', () => {
    const p = proteccionRama(CHECKS_OBLIGATORIOS, 123) as any;
    expect(p.enforce_admins).toBe(true);
    expect(p.required_pull_request_reviews).toBeNull();
    expect(p.required_status_checks.strict).toBe(true);
  });

  test('los dos checks de la factory quedan atados a la aplicación', () => {
    const p = proteccionRama(CHECKS_OBLIGATORIOS, 123) as any;
    const ch = p.required_status_checks.checks.filter((c: any) => c.context.startsWith('factory/'));
    expect(ch).toHaveLength(2);
    expect(ch.every((c: any) => c.app_id === 123)).toBe(true);
  });

  test('los checks de ci quedan atados a GitHub Actions', () => {
    const p = proteccionRama(CHECKS_OBLIGATORIOS, 123) as any;
    const ch = p.required_status_checks.checks.filter((c: any) => !c.context.startsWith('factory/'));
    expect(ch).toHaveLength(6);
    expect(ch.every((c: any) => c.app_id === ID_APP_GITHUB_ACTIONS)).toBe(true);
  });

  test('no se puede forzar el push ni borrar la rama', () => {
    const p = proteccionRama(CHECKS_OBLIGATORIOS, 123) as any;
    expect(p.allow_force_pushes).toBe(false);
    expect(p.allow_deletions).toBe(false);
  });

  test('los checks de ci son exactamente los trabajos del ci.yml de la plantilla', () => {
    const ci = parse(readFileSync('plantillas/web-estatica/.github/workflows/ci.yml', 'utf8'));
    expect(CHECKS_OBLIGATORIOS.filter(c => !c.startsWith('factory/')).sort()).toEqual(Object.keys(ci.jobs).sort());
  });
});

describe('actualizarShaDespachador', () => {
  const factoryYml = (sha: string) => [
    'jobs:',
    '  despachar:',
    `    uses: ana/software-factory/.github/workflows/despachador.yml@${sha}`,
    '    with:',
    `      version_factory: ${sha}`,
    '      app_id: ${{ vars.FACTORY_APP_ID }}',
  ].join('\n');

  test('cambia el SHA del uses y de version_factory', () =>
    expect(actualizarShaDespachador(factoryYml(SHA_A), SHA_B)).toBe(factoryYml(SHA_B)));

  test('si ya tiene ese SHA no cambia nada', () =>
    expect(actualizarShaDespachador(factoryYml(SHA_B), SHA_B)).toBe(factoryYml(SHA_B)));

  test('falla si el archivo no tiene la forma esperada', () =>
    expect(() => actualizarShaDespachador('jobs: {}', SHA_B)).toThrow(/despachador/));

  test('falla con un SHA que no es de 40 caracteres hexadecimales', () =>
    expect(() => actualizarShaDespachador(factoryYml(SHA_A), 'main')).toThrow(/SHA/));

  test('la plantilla renderizada tiene la forma que espera', () => {
    const plantilla = readFileSync('plantillas/web-estatica/.github/workflows/factory.yml', 'utf8')
      .replaceAll('__SHA_FACTORY__', SHA_A);
    expect(actualizarShaDespachador(plantilla, SHA_B)).toContain(`despachador.yml@${SHA_B}`);
  });
});

describe('validarSha', () => {
  test('acepta 40 caracteres hexadecimales en minúsculas', () => expect(() => validarSha(SHA_A)).not.toThrow());
  test.each(['main', 'A'.repeat(40), 'a'.repeat(39), ''])('rechaza %j', s => expect(() => validarSha(s)).toThrow());
});

describe('cuerpoIssueInicial', () => {
  test('tiene los tres apartados de la plantilla de especificación', () => {
    const cuerpo = cuerpoIssueInicial();
    for (const t of ['### Qué debe hacer', '### Criterios de aceptación', '### Qué no debe tocar']) expect(cuerpo).toContain(t);
  });

  test('dice cómo pasarla a la factory', () => expect(cuerpoIssueInicial()).toContain('factory:lista'));
});
