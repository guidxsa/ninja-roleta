import { describe, expect, it } from 'vitest';
import { fitLabel, sliceFont } from '../prototype/wheelLabel';

const measure = (text: string, font: number) => text.length * font * 0.6;
const limits = { width: 104, twoLineWidth: 84, twoLineHeight: 40, fontMax: 13, fontMin: 8 };

describe('sliceFont', () => {
  const wheel = { radius: 140, outer: 132, fontMax: 13, fontMin: 8 };

  it('fatia larga segue a conta do meio do raio', () => {
    expect(sliceFont('Comum', measure, { ...wheel, spanDeg: 100 })).toBe(13);
  });

  it('o Senju (3 de 103, nome curto) aparece mesmo abaixo do limite do meio do raio', () => {
    const font = sliceFont('Senju', measure, { ...wheel, spanDeg: (3 / 103) * 360 });
    expect(font).not.toBeNull();
    expect(font!).toBeGreaterThanOrEqual(8);
  });

  it('nome longo em fatia estreita e fatia estreita demais ficam só na legenda', () => {
    expect(sliceFont('Pergaminho dos Oito Trigramas', measure, { ...wheel, spanDeg: 10 })).toBeNull();
    expect(sliceFont('Senju', measure, { ...wheel, spanDeg: 1 })).toBeNull();
  });
});

describe('fitLabel', () => {
  it('nome curto fica em uma linha com a fonte máxima', () => {
    expect(fitLabel('Fogo', measure, limits)).toEqual({ lines: ['Fogo'], font: 13 });
  });

  it('reduz a fonte até o legível antes de quebrar', () => {
    const fit = fitLabel('Pílula do soldado', measure, limits);
    expect(fit.lines).toEqual(['Pílula do soldado']);
    expect(fit.font).toBeGreaterThanOrEqual(10);
  });

  it('nome longo quebra em duas linhas no espaço mais equilibrado, sem cortar', () => {
    const fit = fitLabel('Pergaminho dos Oito Trigramas', measure, limits);
    expect(fit.lines).toEqual(['Pergaminho dos', 'Oito Trigramas']);
    expect(fit.lines.join(' ')).not.toContain('…');
  });

  it('fatia estreita não usa duas linhas: encolhe e só então corta entre palavras', () => {
    const narrow = { ...limits, twoLineHeight: 12 };
    const small = fitLabel('Pergaminho dos Oito', measure, narrow);
    expect(small).toEqual({ lines: ['Pergaminho dos Oito'], font: 9 });
    const cut = fitLabel('Pergaminho dos Oito Trigramas Secretos', measure, narrow);
    expect(cut.lines).toEqual(['Pergaminho dos Oito…']);
  });

  it('palavra única longa encolhe e, no limite, corta com reticências', () => {
    expect(fitLabel('Kuchiyosenojutsu', measure, limits).lines).toEqual(['Kuchiyosenojutsu']);
    const fit = fitLabel('K'.repeat(40), measure, limits);
    expect(fit.lines.length).toBe(1);
    expect(fit.lines[0]!.endsWith('…')).toBe(true);
    expect(measure(fit.lines[0]!, fit.font)).toBeLessThanOrEqual(limits.width);
  });

  it('o que não cabe nem em duas linhas corta só a segunda', () => {
    const fit = fitLabel('Pergaminho secreto dos Oito Trigramas do clã Hyuuga da Folha', measure, limits);
    expect(fit.lines.length).toBe(2);
    expect(fit.lines[0]!.endsWith('…')).toBe(false);
    expect(fit.lines[1]!.endsWith('…')).toBe(true);
  });
});
