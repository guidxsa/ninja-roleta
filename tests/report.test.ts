import { describe, expect, it } from 'vitest';
import { buildReport, REPORT_LOG_LINES, type ReportInput } from '../src/core/report';
import { buildShareText, type ShareSummary } from '../src/core/share';
import { ptBR as S } from '../src/data/strings/ptBR';

const summary: ShareSummary = {
  version: '0.28.0',
  difficulty: 'Médio',
  origin: 'Uchiha (Fogo)',
  level: 6,
  trail: [
    { name: 'Mizuki', exam: false, results: ['win'] },
    { name: 'Haku e Zabuza', exam: false, results: ['win', 'win'] },
    { name: 'Exame chunin', exam: true, results: ['win', 'win', 'loss'] },
    { name: 'Gaara', exam: false, results: ['win'] },
    { name: 'Quarteto do Som', exam: false, results: ['win', 'win', 'loss'] },
    { name: 'Kabuto', exam: false, results: [] },
  ],
  won: false,
  fallenTo: 'Tayuya',
  revivesUsed: 2,
  seed: 48213,
};

describe('compartilhar a run', () => {
  it('monta o resumo com o caminho em emojis e omite etapas não jogadas', () => {
    expect(buildShareText(summary, S.share)).toBe(
      [
        'Ninja Roleta v0.28.0 · Médio',
        'Uchiha (Fogo) · Nível 6',
        'Mizuki ✅ · Haku e Zabuza ✅✅ · Exame chunin 🥇🥇❌ · Gaara ✅ · Quarteto do Som ✅✅💀',
        'Caiu para Tayuya · 2 Vontades do Fogo · seed 48213',
      ].join('\n'),
    );
  });

  it('na vitória não cita quem derrotou; sem seed, não mostra a seed', () => {
    const text = buildShareText({ ...summary, won: true, fallenTo: null, seed: null, revivesUsed: 1 }, S.share);
    expect(text.split('\n').at(-1)).toBe(`${S.share.victory} · 1 Vontade do Fogo`);
  });
});

const input: ReportInput = {
  version: '0.28.0',
  date: '31/10/2026 12:00',
  seed: 7,
  link: 'https://exemplo/?seed=7',
  note: '  o vilão não perdeu a vez  ',
  device: 'teste',
  run: {
    origin: 'Nara (Raio)',
    difficulty: 'Médio',
    stage: 'Gaara',
    level: 5,
    revivesUsed: 0,
    hp: 40,
    maxHp: 130,
    chakra: 10,
    maxChakra: 36,
    stats: [['Taijutsu', 12], ['Speed', 9]],
    techniques: ['Imitação de Sombra'],
    bag: [],
    summon: null,
  },
  battle: {
    villain: 'Gaara',
    round: 4,
    hp: 80,
    maxHp: 200,
    chakra: 20,
    maxChakra: 40,
    log: Array.from({ length: 40 }, (_, i) => `linha ${i + 1}`),
  },
};

describe('relatório', () => {
  it('traz seed, link, nota, ficha e as últimas linhas do log', () => {
    const text = buildReport(input, S.report.fields);
    expect(text).toContain(`${S.report.fields.seed}: 7`);
    expect(text).toContain('https://exemplo/?seed=7');
    expect(text).toContain('o vilão não perdeu a vez');
    expect(text).toContain('Taijutsu 12 · Speed 9');
    expect(text).toContain(`${S.report.fields.bag}: ${S.report.fields.none}`);
    expect(text).toContain('- linha 40');
    expect(text).not.toContain('- linha 10\n');
    expect(text.split('\n').filter((l) => l.startsWith('- linha'))).toHaveLength(REPORT_LOG_LINES);
  });

  it('fora de uma run, avisa que não há run e não tem luta', () => {
    const text = buildReport({ ...input, seed: null, link: null, note: '', run: null, battle: null }, S.report.fields);
    expect(text).toContain(S.report.fields.noRun);
    expect(text).not.toContain(S.report.fields.battle);
    expect(text).not.toContain(S.report.fields.seed + ':');
  });
});
