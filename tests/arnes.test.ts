import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const leer = (ruta: string) => readFileSync(ruta, 'utf8');

describe('arnés del repositorio', () => {
  it('AGENTS.md existe', () => {
    expect(existsSync('AGENTS.md')).toBe(true);
  });

  it('AGENTS.md tiene menos de 120 líneas', () => {
    expect(leer('AGENTS.md').split('\n').length).toBeLessThan(120);
  });

  it('AGENTS.md enlaza la spec y el plan', () => {
    const agentes = leer('AGENTS.md');
    expect(agentes).toContain('docs/superpowers/specs/2026-11-24-software-factory-design.md');
    expect(agentes).toContain('docs/superpowers/plans/2026-11-24-software-factory.md');
  });

  it('CLAUDE.md contiene solo @AGENTS.md', () => {
    expect(leer('CLAUDE.md').trim()).toBe('@AGENTS.md');
  });
});
