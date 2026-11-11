import { describe, expect, it } from 'vitest';
import { buildShareText, replayUrl, type ShareSummary } from '../src/core/share';
import { ptBR } from '../src/data/strings/ptBR';

const base: ShareSummary = {
  version: '0.60.0',
  difficulty: 'Médio',
  origin: 'Comum (Fogo)',
  level: 5,
  trail: [
    { name: 'Mizuki', exam: false, results: ['win'] },
    { name: 'Zabuza', exam: false, results: ['loss'] },
    { name: 'Orochimaru', exam: false, results: [] },
  ],
  won: false,
  fallenTo: 'Zabuza',
  cycle: 1,
  revivesUsed: 1,
  seed: 42,
  replayUrl: null,
};
const text = (over: Partial<ShareSummary>) => buildShareText({ ...base, ...over }, ptBR.share).split('\n');

describe('texto de compartilhar (src/core/share.ts)', () => {
  it('título, origem e nível, a trilha só com as etapas jogadas e o fim', () => {
    expect(text({})).toEqual(['Ninja Roleta v0.60.0 · Médio', 'Comum (Fogo) · Nível 5', 'Mizuki ✅ · Zabuza 💀', 'Caiu para Zabuza · 1 Vontade do Fogo · seed 42']);
  });

  it('vitória no 1º ciclo', () => {
    expect(text({ won: true, fallenTo: null }).at(-1)).toBe('Run vencida 🏆 · 1 Vontade do Fogo · seed 42');
  });

  it('queda no modo infinito: a run foi vencida e diz o ciclo e quem derrubou', () => {
    expect(text({ won: true, fallenTo: 'Orochimaru', cycle: 3 }).at(-1)).toBe('Run vencida 🏆 · caiu no ciclo 3 para Orochimaru · 1 Vontade do Fogo · seed 42');
  });

  it('abandono: sem resultado, só as contas', () => {
    expect(text({ fallenTo: null }).at(-1)).toBe('1 Vontade do Fogo · seed 42');
  });

  it('sem seed, sem a seed; com o endereço, a linha para repetir', () => {
    expect(text({ seed: null }).at(-1)).toBe('Caiu para Zabuza · 1 Vontade do Fogo');
    expect(text({ replayUrl: 'https://x.io/jogo/?seed=42' }).at(-1)).toBe('Mesmas roletas: https://x.io/jogo/?seed=42');
  });
});

describe('endereço para repetir a run', () => {
  const web = { protocol: 'https:', origin: 'https://x.io', pathname: '/jogo/' };
  it('a página atual com ?seed=, só em http(s) e com seed', () => {
    expect(replayUrl(web, 42)).toBe('https://x.io/jogo/?seed=42');
    expect(replayUrl({ ...web, protocol: 'http:', origin: 'http://localhost:8080' }, 7)).toBe('http://localhost:8080/jogo/?seed=7');
    expect(replayUrl(web, null)).toBeNull();
    expect(replayUrl({ protocol: 'file:', origin: 'null', pathname: '/C:/dist/prototipo.html' }, 42)).toBeNull();
  });
});
