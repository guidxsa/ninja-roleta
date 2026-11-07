// Encaixe do nome numa fatia da roleta. Função pura: a medição do texto vem de fora.

export interface LabelFit {
  lines: string[];
  font: number;
}

export interface LabelLimits {
  /** Comprimento disponível em uma linha. */
  width: number;
  /** Comprimento disponível em cada linha, com duas. */
  twoLineWidth: number;
  /** Altura da fatia onde as duas linhas terminam; sem altura, fica em uma linha. */
  twoLineHeight: number;
  fontMax: number;
  fontMin: number;
}

/** Abaixo disso, uma linha só fica ruim de ler: antes tenta duas linhas com a letra maior. */
const FONT_READABLE = 10;
const FONT_STEP = 0.5;
/** Altura de duas linhas, em frações do tamanho da fonte. */
const TWO_LINE_EM = 2.2;

type Measure = (text: string, font: number) => number;

function fontSteps(from: number, to: number): number[] {
  const out: number[] = [];
  for (let f = from; f >= to; f -= FONT_STEP) out.push(f);
  return out;
}

/** Quebras possíveis (nos espaços), da mais equilibrada para a menos. */
function splits(label: string): [string, string][] {
  const words = label.split(' ');
  return words
    .slice(1)
    .map((_, i): [string, string] => [words.slice(0, i + 1).join(' '), words.slice(i + 1).join(' ')])
    .sort((a, b) => Math.abs(a[0].length - a[1].length) - Math.abs(b[0].length - b[1].length));
}

/** Último recurso: corta com reticências, de preferência entre palavras. */
function ellipsize(label: string, width: number, font: number, measure: Measure): string {
  if (measure(label, font) <= width) return label;
  const words = label.split(' ');
  for (let n = words.length - 1; n > 0; n--) {
    const text = `${words.slice(0, n).join(' ')}…`;
    if (measure(text, font) <= width) return text;
  }
  for (let n = label.length - 1; n > 0; n--) {
    const text = `${label.slice(0, n).trimEnd()}…`;
    if (measure(text, font) <= width) return text;
  }
  return '…';
}

/** Fração da largura da fatia que a altura da letra pode ocupar. */
const FONT_PER_CHORD = 0.62;

/** Largura da fatia a uma distância do centro. */
export function sliceChord(radius: number, spanDeg: number): number {
  return 2 * radius * Math.sin(((Math.min(spanDeg, 180) / 2) * Math.PI) / 180);
}

export interface SliceFontLimits {
  /** Raio da roleta e raio onde o nome começa (na borda). */
  radius: number;
  outer: number;
  spanDeg: number;
  fontMax: number;
  fontMin: number;
}

/**
 * Maior letra do rótulo de uma fatia, ou null se nem o menor tamanho cabe (só a legenda mostra).
 * A referência é o meio do raio. Fatia estreita, abaixo disso, ainda leva nome curto: ele sai da borda, onde a fatia é
 * mais larga, então a conta usa a largura no ponto em que o nome termina.
 */
export function sliceFont(label: string, measure: Measure, limits: SliceFontLimits): number | null {
  const { radius, outer, spanDeg, fontMax, fontMin } = limits;
  const atMiddle = Math.min(fontMax, sliceChord(radius * 0.5, spanDeg) * FONT_PER_CHORD);
  if (atMiddle >= fontMin) return atMiddle;
  const fits = fontSteps(fontMax, fontMin).find((f) => {
    const end = outer - measure(label, f);
    return end > 0 && sliceChord(end, spanDeg) * FONT_PER_CHORD >= f;
  });
  return fits ?? null;
}

/** Uma linha com letra legível; senão, duas linhas; senão, uma linha menor; só então reticências. */
export function fitLabel(label: string, measure: Measure, limits: LabelLimits): LabelFit {
  const { width, twoLineWidth, twoLineHeight, fontMax, fontMin } = limits;
  const readable = Math.max(fontMin, Math.min(fontMax, FONT_READABLE));
  const oneLine = (fonts: number[]) => fonts.find((f) => measure(label, f) <= width);

  const big = oneLine(fontSteps(fontMax, readable));
  if (big !== undefined) return { lines: [label], font: big };

  const twoLineFonts = fontSteps(Math.min(fontMax, twoLineHeight / TWO_LINE_EM), fontMin);
  for (const font of twoLineFonts) {
    const fit = splits(label).find(([a, b]) => measure(a, font) <= twoLineWidth && measure(b, font) <= twoLineWidth);
    if (fit) return { lines: fit, font };
  }

  const small = oneLine(fontSteps(readable, fontMin));
  if (small !== undefined) return { lines: [label], font: small };

  // Não coube de jeito nenhum: com altura, a primeira linha fica inteira e a segunda leva as reticências.
  if (twoLineFonts.length && label.includes(' ')) {
    const font = fontMin;
    const words = label.split(' ');
    let n = words.length - 1;
    while (n > 1 && measure(words.slice(0, n).join(' '), font) > twoLineWidth) n--;
    return { lines: [ellipsize(words.slice(0, n).join(' '), twoLineWidth, font, measure), ellipsize(words.slice(n).join(' '), twoLineWidth, font, measure)], font };
  }
  return { lines: [ellipsize(label, width, fontMin, measure)], font: fontMin };
}
