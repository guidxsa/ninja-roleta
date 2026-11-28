// Fotos da revisão visual (scripts/revisar-visual.ts; skill revisar-visual): conhecem todos os cenários do lab e
// fotografam os tamanhos que a skill promete.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '../prototype/lab/registry';
import { scenarioIds, VIEWPORTS } from '../scripts/revisar-visual';

describe('revisar-visual', () => {
  it('conhece todo cenário registrado, inclusive o de id montado por template (#68)', () => {
    const ids = scenarioIds();
    expect(ids).toEqual([...new Set(SCENARIOS.map((s) => s.id))].sort());
    expect(ids).toContain('meta.registry.bingo:story-full');
  });

  it('a skill lista os mesmos tamanhos que o script fotografa (#81)', () => {
    const skill = readFileSync('.claude/skills/revisar-visual/SKILL.md', 'utf8');
    const prometidos = [...skill.matchAll(/(\d{3,4}) ?px/g)].map((m) => Number(m[1]));
    expect(VIEWPORTS.map((v) => v.width)).toEqual(expect.arrayContaining([390, 1280]));
    for (const w of new Set(prometidos)) expect(VIEWPORTS.map((v) => v.width), `${w}px da skill`).toContain(w);
    for (const v of VIEWPORTS) expect(skill, `${v.width} do script`).toContain(String(v.width));
  });
});
