// Minijogos de tempo da Jornada (v0.91.0): kunai, água, clone e sino (docs/jornada/run.md#minijogos).
import { describe, expect, it } from 'vitest';
import {
  bellCalmJudge,
  bellJudge,
  bellResult,
  bellScript,
  botWinChance,
  cloneCheck,
  clonePosition,
  cloneScript,
  kunaiCalmPos,
  kunaiPoints,
  kunaiPos,
  kunaiSetup,
  kunaiWon,
  kunaiZone,
  minigameBonus,
  NO_BONUS,
  waterCalmHint,
  waterCalmResult,
  waterCalmStep,
  waterInBand,
  waterResult,
  waterSetup,
  waterStart,
  waterStep,
  type WaterState,
} from '../src/core/jornada/minigames';
import { newGenericRun, newRun } from '../src/core/jornada/run';
import { createRng } from '../src/core/rng';
import { jornadaData as data } from '../src/data/jornada';
import { events, genericEvents } from '../src/data/jornada/events';

const cfg = data.j.minigames;

describe('kunai no alvo', () => {
  it('o marcador vai e volta entre 0 e 1 e acelera a cada kunai', () => {
    const s = kunaiSetup(cfg, 'normal', NO_BONUS, createRng(3));
    expect(s.throws).toHaveLength(3);
    expect(s.throws[1]!.period).toBeLessThan(s.throws[0]!.period);
    for (let t = 0; t < 100; t++) {
      const p = kunaiPos(s.throws[0]!, t);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
    expect(kunaiPos({ period: 20, phase: 0, calmOrder: [] }, 5)).toBeCloseTo(0.5);
  });

  it('centro vale 2, anel 1, fora 0; vence com 4 pontos', () => {
    const s = kunaiSetup(cfg, 'normal', NO_BONUS, createRng(1));
    expect(kunaiZone(s, 0.5)).toBe('center');
    expect(kunaiZone(s, 0.5 + s.center / 2 + 0.01)).toBe('ring');
    expect(kunaiZone(s, 0.02)).toBe('out');
    expect([kunaiPoints('center'), kunaiPoints('ring'), kunaiPoints('out')]).toEqual([2, 1, 0]);
    expect(kunaiWon(s, 4)).toBe(true);
    expect(kunaiWon(s, 3)).toBe(false);
  });

  it('a dificuldade aperta o centro e a relíquia de kunai alarga', () => {
    const easy = kunaiSetup(cfg, 'easy', NO_BONUS, createRng(1));
    const hardcore = kunaiSetup(cfg, 'hardcore', NO_BONUS, createRng(1));
    expect(hardcore.center).toBeLessThan(easy.center);
    const run = { ...newRun(1, 'normal', data), relics: ['kunaiPouch', 'masterKunai'] };
    expect(minigameBonus(run, data).kunaiCenter).toBeCloseTo(0.04);
  });

  it('sem pressa, as duas posições do meio são centro mesmo no Hardcore', () => {
    const s = kunaiSetup(cfg, 'hardcore', NO_BONUS, createRng(1));
    const zones = Array.from({ length: s.calmPositions }, (_, i) => kunaiZone(s, kunaiCalmPos(s, i), true));
    expect(zones.filter((z) => z === 'center')).toHaveLength(2);
    expect(s.throws[0]!.calmOrder.slice().sort((a, b) => a - b)).toEqual([...Array(s.calmPositions).keys()]);
  });
});

describe('andar sobre a água', () => {
  const run = (taps: (s: WaterState) => number) => {
    const setup = waterSetup(cfg, 'normal', NO_BONUS, createRng(5));
    let s = waterStart();
    while (waterResult(setup, s) === null) s = waterStep(setup, s, taps(s));
    return { setup, s, won: waterResult(setup, s) };
  };

  it('sem tocar, o chakra se dispersa e afunda', () => {
    const r = run(() => 0);
    expect(r.won).toBe(false);
    expect(r.s.pos).toBeLessThan(r.setup.band[0]);
  });

  it('tocando quando está baixo, fica no ponto até o fim', () => {
    const r = run((s) => (s.pos < 0.5 ? 1 : 0));
    expect(r.won).toBe(true);
    expect(r.s.tick).toBe(cfg.water.ticks);
  });

  it('a faixa aperta com a dificuldade e o chakra máximo a alarga', () => {
    const easy = waterSetup(cfg, 'easy', NO_BONUS, createRng(1));
    const hard = waterSetup(cfg, 'hardcore', NO_BONUS, createRng(1));
    expect(hard.band[1] - hard.band[0]).toBeLessThan(easy.band[1] - easy.band[0]);
    const base = newRun(1, 'normal', data);
    const strong = { ...base, bonus: { ...base.bonus, [base.hero]: { hp: 0, chakra: 45 } } };
    expect(minigameBonus(base, data).waterBand).toBe(0);
    expect(minigameBonus(strong, data).waterBand).toBeCloseTo(0.02);
  });

  it('sem pressa, a direção da onda é anunciada e seguir o centro costuma vencer', () => {
    let wins = 0;
    for (let i = 1; i <= 200; i++) {
      const setup = waterSetup(cfg, 'normal', NO_BONUS, createRng(i));
      let s = waterStart();
      while (waterCalmResult(setup, s) === null) {
        const hint = waterCalmHint(setup, s);
        const target = s.pos - 0.5 + hint * 0.16;
        s = waterCalmStep(setup, s, target > 0.05 ? -1 : target < -0.05 ? 1 : 0);
      }
      if (waterCalmResult(setup, s)) wins++;
    }
    expect(wins / 200).toBeGreaterThan(0.6);
  });

  it('sem pressa, perde com mais de 2 passos fora da faixa', () => {
    const setup = waterSetup(cfg, 'normal', NO_BONUS, createRng(2));
    let s = waterStart();
    while (waterCalmResult(setup, s) === null) s = waterCalmStep(setup, s, 1);
    expect(waterCalmResult(setup, s)).toBe(false);
    expect(s.out).toBe(cfg.water.calmMaxOut + 1);
    expect(waterInBand(setup, 0.5)).toBe(true);
  });
});

describe('o clone verdadeiro', () => {
  it('segue o verdadeiro pelas trocas', () => {
    const s = { figures: 4, start: 0, swaps: [[0, 2], [1, 3], [2, 1]] as [number, number][], swapTicks: 10 };
    expect(clonePosition(s, 1)).toBe(2);
    expect(clonePosition(s)).toBe(1);
    expect(cloneCheck(s, 1)).toBe(true);
    expect(cloneCheck(s, 2)).toBe(false);
  });

  it('a dificuldade dá mais figuras e trocas; toda troca é entre duas posições diferentes', () => {
    const easy = cloneScript(cfg, 'easy', createRng(4));
    const hard = cloneScript(cfg, 'hardcore', createRng(4));
    expect(hard.figures).toBeGreaterThan(easy.figures);
    expect(hard.swaps.length).toBeGreaterThan(easy.swaps.length);
    for (const [a, b] of hard.swaps) {
      expect(a).not.toBe(b);
      expect(b).toBeLessThan(hard.figures);
    }
  });

  it('Uchiha e Hyuuga veem o fluxo; o Naruto com o Sasuke na equipe ganha o brilho', () => {
    const unlocked = new Set(['j_unlockUchiha', 'j_unlockHyuuga']);
    expect(minigameBonus(newGenericRun(1, 'normal', 'uchiha', data, unlocked), data).cloneSight).toBe('full');
    expect(minigameBonus(newGenericRun(1, 'normal', 'hyuuga', data, unlocked), data).cloneSight).toBe('full');
    const naruto = newRun(1, 'normal', data);
    const withSasuke = { ...naruto, members: { ...naruto.members, sasuke: { hp: 10, chakra: 10 } } };
    const alone = { ...naruto, members: {}, supports: [] };
    expect(minigameBonus(withSasuke, data).cloneSight).toBe('glimpse');
    expect(minigameBonus(alone, data).cloneSight).toBe('none');
  });
});

describe('pegar o sino', () => {
  it('antes do sinal queima a largada; dentro da janela pega; depois perde', () => {
    const s = bellScript(cfg, 'normal', NO_BONUS, createRng(7));
    const sig = s.signals[0]!;
    expect(bellJudge(s, 0, sig - 1)).toBe('early');
    expect(bellJudge(s, 0, sig)).toBe('hit');
    expect(bellJudge(s, 0, sig + s.window)).toBe('hit');
    expect(bellJudge(s, 0, sig + s.window + 1)).toBe('late');
    expect(bellJudge(s, 0, null)).toBe('late');
  });

  it('melhor de 3 e a janela aperta com a dificuldade, sem passar do mínimo', () => {
    const s = bellScript(cfg, 'normal', NO_BONUS, createRng(1));
    expect(bellResult(s, ['hit'])).toBeNull();
    expect(bellResult(s, ['hit', 'early', 'hit'])).toBe(true);
    expect(bellResult(s, ['late', 'early'])).toBe(false);
    const easy = bellScript(cfg, 'easy', NO_BONUS, createRng(1));
    const hardcore = bellScript(cfg, 'hardcore', NO_BONUS, createRng(1));
    expect(hardcore.window).toBeLessThan(easy.window);
    expect(hardcore.window * cfg.tickMs).toBeGreaterThanOrEqual(cfg.bell.windowMinMs - cfg.tickMs);
  });

  it('o speed do protagonista alarga a janela', () => {
    const run = newRun(1, 'normal', data);
    const fast = { ...run, relics: [...run.relics, 'trainingWeights', 'youthJumpsuit'] };
    expect(minigameBonus(fast, data).bellMs).toBeGreaterThan(minigameBonus(run, data).bellMs);
  });

  it('sem pressa, só uma página é a certa e a primeira nunca é', () => {
    const s = bellScript(cfg, 'normal', NO_BONUS, createRng(9));
    for (let r = 0; r < s.calm.length; r++) {
      const c = s.calm[r]!;
      expect(c.real).toBeGreaterThan(0);
      expect(c.decoys).not.toContain(c.real);
      expect(bellCalmJudge(s, r, c.real)).toBe('hit');
      expect(bellCalmJudge(s, r, null)).toBe('late');
    }
  });
});

describe('minijogos nos eventos', () => {
  const all = [...events, ...genericEvents].flatMap((e) => e.options.map((o) => ({ ev: e.id, ...o })));
  const count = (k: string) => all.filter((o) => o.minigame === k).length;

  it('a Sequência deixou de ser maioria e cada jogo novo aparece em 2 opções', () => {
    expect(count('seals')).toBe(5);
    expect(count('memory')).toBe(1);
    for (const k of ['kunai', 'water', 'clone', 'bell']) expect(count(k)).toBe(2);
  });

  it('o sino entra no Time 7 e o clone na parada do Itachi e do Kisame', () => {
    expect(all.find((o) => o.ev === 'team7' && o.id === 'rival')?.minigame).toBe('bell');
    expect(all.find((o) => o.ev === 'itachiKisame' && o.id === 'chase')?.minigame).toBe('clone');
  });

  it('o bot ganha 60% nos de selos e os de tempo apertam com a dificuldade', () => {
    expect(botWinChance('seals', 'hardcore', cfg)).toBe(0.6);
    expect(botWinChance('kunai', 'normal', cfg)).toBe(0.6);
    expect(botWinChance('kunai', 'easy', cfg)).toBeGreaterThan(botWinChance('kunai', 'hardcore', cfg));
  });
});
