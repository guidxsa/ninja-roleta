// Kit dos retratos (100×100): as peças que todo busto usa. Cada personagem monta o seu com cabelo, traje e
// acessórios próprios (konoha.ts, villains.ts, generic.ts); aqui ficam só rosto, olhos, boca, bandana e ombros.
// Tudo em coordenadas absolutas: rosto de x 33 a 67 e y 23 a 68, olhos em y 47, boca em y 60.
import { VILLAGES } from '../villages';

export const INK = '#1d1512';
export const SKIN = '#f3cda4';
export const PALE = '#ece5d8';
export const TAN = '#d9a877';
export const STEEL = '#cfd6df';
export const NAVY = '#27365a';

/** Clareia (f > 0) ou escurece (f < 0) uma cor `#rrggbb`. */
export function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
  const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Forma preenchida, sem contorno. */
export const p = (d: string, fill: string, extra = ''): string => `<path d="${d}" fill="${fill}"${extra ? ` ${extra}` : ''}/>`;
/** Forma preenchida com o contorno de tinta. */
export const po = (d: string, fill: string, w = 1.2): string =>
  `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`;
/** Traço. */
export const ln = (d: string, stroke = INK, w = 1.2, extra = ''): string =>
  `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra ? ` ${extra}` : ''}/>`;
/** Espelha no eixo vertical do retrato. */
export const mir = (s: string): string => `<g transform="matrix(-1 0 0 1 100 0)">${s}</g>`;
/** A peça e o espelho dela. */
export const both = (s: string): string => s + mir(s);

/** Fundo: gradiente radial com um brilho e os objetos da cena. O id é único por retrato. */
export function bg(id: string, from: string, to: string, extra = ''): string {
  return `<defs><radialGradient id="bg-${id}" cx="50%" cy="36%" r="78%"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></radialGradient></defs><rect width="100" height="100" fill="url(#bg-${id})"/>${extra}`;
}

export type EyeKind =
  | 'normal' | 'sharp' | 'byakugan' | 'sharingan' | 'ringed' | 'snake' | 'closed' | 'happy' | 'round' | 'bored' | 'slit' | 'dot' | 'none';
export type BrowKind = 'thin' | 'thick' | 'angry' | 'sad' | 'flat' | 'none';
export type MouthKind = 'neutral' | 'smirk' | 'smile' | 'grin' | 'frown' | 'open' | 'fangs' | 'none';
export type FaceShape = 'oval' | 'slim' | 'square' | 'wide' | 'round';

export interface FaceOpts {
  shape?: FaceShape;
  skin?: string;
  eyes?: EyeKind;
  iris?: string;
  brows?: BrowKind;
  browColor?: string;
  mouth?: MouthKind;
  lips?: string;
  ears?: boolean;
  nose?: boolean;
  /** Marcas de bigode do jinchūriki. */
  whiskers?: boolean | 'deep';
  /** Desenho por cima da pele e por baixo dos olhos (pintura, cicatriz). */
  under?: string;
}

const SHAPES: Record<FaceShape, string> = {
  oval: 'M33 43C33 30 40 23 50 23S67 30 67 43C67 56 60 67 50 68C40 67 33 56 33 43Z',
  slim: 'M33 42C33 30 40 23 50 23S67 30 67 42C67 53 61 62 55 66Q50 69 45 66C39 62 33 53 33 42Z',
  square: 'M33 42C33 30 40 23 50 23S67 30 67 42V51C67 60 59 67 50 68C41 67 33 60 33 51Z',
  wide: 'M30 44C30 31 39 23 50 23S70 31 70 44C70 58 61 68 50 68S30 58 30 44Z',
  round: 'M31.5 44C31.5 31 40 23 50 23S68.5 31 68.5 44C68.5 57 60 68 50 68S31.5 57 31.5 44Z',
};

/** O olho da esquerda de quem vê (centro em 41, 47); o da direita é o espelho. */
function eye(kind: EyeKind, iris: string): string {
  const white = (d: string, fill = '#fff') => p(d, fill);
  const lid = (d: string, w = 1.5) => ln(d, INK, w);
  switch (kind) {
    case 'normal':
      return white('M35 47Q41 41 47 47Q41 51 35 47Z') + `<circle cx="41" cy="46.6" r="3" fill="${iris}"/><circle cx="41" cy="46.6" r="1.3" fill="#111"/><circle cx="40" cy="45.4" r=".9" fill="#fff"/>` + lid('M34.5 47Q41 40.5 47.5 46.6');
    case 'sharp':
      return white('M35 45.6Q42 43.4 47 47.6Q41 50.4 36 48Z') + `<circle cx="41.6" cy="46.8" r="2.4" fill="${iris}"/><circle cx="41.6" cy="46.8" r="1" fill="#111"/><circle cx="40.8" cy="46" r=".6" fill="#fff"/>` + lid('M34 45Q42 42 47.6 47.4', 1.7);
    case 'byakugan':
      return white('M35 47Q41 41 47 47Q41 51 35 47Z', '#f1eef9') + `<circle cx="41" cy="46.6" r="3" fill="#dcd5f0" stroke="#a79fca" stroke-width=".6"/>` + lid('M34.5 47Q41 40.5 47.5 46.6');
    case 'sharingan':
      return white('M35 45.6Q42 43.4 47 47.6Q41 50.4 36 48Z') + `<circle cx="41.6" cy="46.8" r="2.7" fill="#d1232a"/><circle cx="41.6" cy="46.8" r="1.7" fill="none" stroke="#111" stroke-width=".4"/><circle cx="41.6" cy="46.8" r=".8" fill="#111"/><circle cx="41.6" cy="45.1" r=".6" fill="#111"/><circle cx="40.1" cy="47.7" r=".6" fill="#111"/><circle cx="43.1" cy="47.7" r=".6" fill="#111"/>` + lid('M34 45Q42 42 47.6 47.4', 1.7);
    case 'ringed':
      return `<ellipse cx="41" cy="47" rx="7.4" ry="6" fill="#17100f"/>` + white('M36.5 47Q41 43 45.5 47Q41 50 36.5 47Z', '#eaf4f0') + `<circle cx="41" cy="46.8" r="2" fill="${iris}"/><circle cx="41" cy="46.8" r=".7" fill="#111"/>`;
    case 'snake':
      return p('M33 45Q40 37 48 44L49 52 46 47Q40 50 33 45Z', '#6f4a96') + white('M35.5 46.4Q41 42 46.5 46.4Q41 49.6 35.5 46.4Z', '#e8c23a') + ln('M41 44.2V48.8', '#111', 1.3) + lid('M35 46Q41 41.4 47 46', 1.2);
    case 'closed':
      return lid('M35.5 46.5Q41 50.5 46.5 46.5', 1.6);
    case 'happy':
      return lid('M35.5 48.5Q41 43.5 46.5 48.5', 1.7);
    case 'round':
      return `<circle cx="41" cy="47" r="5" fill="#fff" stroke="${INK}" stroke-width="1.2"/><circle cx="41" cy="47" r="1.7" fill="#111"/>` + ln('M37.5 52.6L37 54M41 53.2V54.8M44.5 52.6L45 54', INK, .9);
    case 'bored':
      return white('M35.5 46H46.5Q45.5 50 41 50T35.5 46Z') + `<path d="M38.6 46H43.4Q43.4 49 41 49T38.6 46Z" fill="${iris}"/>` + lid('M34.5 46H47.5', 1.7);
    case 'slit':
      return white('M34.5 45.4Q42 42.6 47.4 47.8Q41 51 35.5 48.4Z', '#ffe9c9') + `<ellipse cx="41.6" cy="46.9" rx="2.6" ry="2.8" fill="${iris}"/>` + ln('M41.6 44.4V49.4', '#111', 1.2) + lid('M33.6 44.6Q42 41.4 48 47.6', 2.1);
    case 'dot':
      return `<circle cx="41" cy="47" r="1.9" fill="${INK}"/>`;
    case 'none':
      return '';
  }
}

function brow(kind: BrowKind, color: string): string {
  switch (kind) {
    case 'thin': return ln('M35 41.4Q40 38.6 46.4 40.4', color, 1.4);
    case 'thick': return ln('M34.6 41.4Q40 37.6 46.6 40', color, 3.6);
    case 'angry': return ln('M34.6 39.2L46.4 42.6', color, 1.9);
    case 'sad': return ln('M35 42.6Q40 39.4 46.2 39.6', color, 1.4);
    case 'flat': return ln('M35.4 41H46', color, 1.6);
    case 'none': return '';
  }
}

function mouth(kind: MouthKind, lips: string): string {
  switch (kind) {
    case 'neutral': return ln('M46 60.6H54', lips, 1.5);
    case 'smirk': return ln('M45 60.4Q50 62.4 55.6 58.6', lips, 1.5);
    case 'smile': return ln('M44.4 59Q50 63.4 55.6 59', lips, 1.5);
    case 'frown': return ln('M45.4 61.4Q50 58.8 54.6 61.4', lips, 1.5);
    case 'grin': return `<path d="M42.6 57.6Q50 60.4 57.4 57.6Q56.4 64.6 50 64.6T42.6 57.6Z" fill="#fff" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/>`;
    case 'open': return `<ellipse cx="50" cy="61" rx="3.2" ry="2.8" fill="#5a1f1c" stroke="${INK}" stroke-width=".8"/>`;
    case 'fangs': return `<path d="M42.6 57.6Q50 60 57.4 57.6Q56.4 64.6 50 64.6T42.6 57.6Z" fill="#5a1f1c" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/><path d="M44.6 58.6L46 62 47.6 59.2ZM55.4 58.6L54 62 52.4 59.2Z" fill="#fff"/>`;
    case 'none': return '';
  }
}

/** Rosto: orelhas, forma, pintura, sobrancelhas, olhos, nariz e boca. O cabelo vem depois, por cima. */
export function face(o: FaceOpts = {}): string {
  const skin = o.skin ?? SKIN;
  const dark = shade(skin, -0.22);
  const ears = o.ears === false ? '' : both(`<ellipse cx="32.4" cy="48.4" rx="3" ry="4.6" fill="${skin}" stroke="${INK}" stroke-width="1"/>`);
  const iris = o.iris ?? '#2b2b33';
  const e = o.eyes ?? 'normal';
  const browColor = o.browColor ?? INK;
  const whisk = o.whiskers
    ? both(ln('M34.6 52.4L41.6 53.6M34 56.4H41.4M34.8 60.4L41.6 59', o.whiskers === 'deep' ? '#3a1410' : '#7a4a36', o.whiskers === 'deep' ? 2 : 1.1))
    : '';
  return (
    ears +
    po(SHAPES[o.shape ?? 'oval'], skin) +
    (o.under ?? '') +
    both(brow(o.brows ?? 'thin', browColor)) +
    both(eye(e, iris)) +
    (o.nose === false ? '' : ln('M50.4 52.4L48.8 55.8H51.2', dark, 0.9)) +
    whisk +
    mouth(o.mouth ?? 'neutral', o.lips ?? '#5b2c22')
  );
}

/** Pescoço por cima dos ombros (abre o decote redondo). */
export const neck = (skin = SKIN): string =>
  p('M43 58H57V73Q50 79 43 73Z', skin) + p('M43 63Q50 69 57 63V67Q50 72 43 67Z', shade(skin, -0.2));

/** Ombros do busto. `wide` alarga para os grandalhões. */
export const shoulders = (outfit: string, wide = false): string =>
  po(wide ? 'M0 101C1 82 14 73 36 72H64C86 73 99 82 100 101Z' : 'M8 101C9 86 20 77 39 74H61C80 77 91 86 92 101Z', outfit);

/** Ombros e pescoço. */
export const torso = (outfit: string, skin = SKIN, wide = false): string => shoulders(outfit, wide) + neck(skin);

/** Gola alta em pé (Uchiha, Aburame). */
export const highCollar = (c: string): string => po('M34 73Q36 65 42 63L50 71 58 63Q64 65 66 73L67 82Q50 89 33 82Z', c);

/** Colete tático da Folha sobre a camisa. */
export function vest(c = '#5f7f45'): string {
  const d = shade(c, -0.2);
  return (
    po('M22 82Q32 76 38 74L50 84 62 74Q68 76 78 82L82 101H18Z', c) +
    po('M33 73Q50 84 67 73L69 79Q50 91 31 79Z', shade(c, 0.08)) +
    ln('M50 86V101', d, 1.2) +
    `<rect x="26" y="89" width="12" height="9" rx="1" fill="${d}" stroke="${INK}" stroke-width=".8"/><rect x="62" y="89" width="12" height="9" rx="1" fill="${d}" stroke="${INK}" stroke-width=".8"/>`
  );
}

/** Quimono cruzado: duas lapelas sobre a roupa de baixo. */
export const kimono = (c: string, trim = shade(c, -0.25)): string =>
  po('M39 72L52 90 46 101H22L26 80Z', c) + po('M61 72L42 101H78L74 80Z', c) + ln('M39 72L52 90M61 72L46 96', trim, 1.6);

/** Camisa de rede (por baixo do traje). */
export const mesh = (): string =>
  p('M40 74L50 88 60 74Z', '#3a3f48') + ln('M43 76L52 85M46 74L55 82M57 76L48 85M54 74L45 82', '#8b929e', 0.6);

/** Corda roxa dos servos do Orochimaru, com o laço na frente. */
export const rope = (): string =>
  ln('M20 93Q50 85 80 93', INK, 6.4) + ln('M20 93Q50 85 80 93', '#7a4aa0', 4.4) + po('M50 88L42 97 50 93.6 58 97Z', '#7a4aa0', 1);

export type Village = keyof typeof VILLAGES | 'rain' | 'grass' | 'blank';
const EXTRA: Record<string, string> = {
  rain: '<path d="M6 5v14M10 5v14M14 5v14M18 5v14"/>',
  grass: '<path d="M6 19 12 5l6 14M9 19l3-7 3 7"/>',
  blank: '',
};

export interface BandOpts {
  cloth?: string;
  /** Topo do pano nas laterais (o meio sobe 3). */
  y?: number;
  /** Risco de desertor. */
  slash?: boolean;
  /** Pontas do nó soltas à direita. */
  tails?: boolean;
}

/** Bandana: pano, placa de metal com rebites e o símbolo da vila. */
export function headband(village: Village, o: BandOpts = {}): string {
  const y = o.y ?? 30;
  const cloth = o.cloth ?? NAVY;
  const sym = (VILLAGES as Record<string, string>)[village] ?? EXTRA[village] ?? '';
  return (
    (o.tails ? po(`M67 ${y + 2}L78 ${y + 6} 72 ${y + 8} 79 ${y + 14} 68 ${y + 9}Z`, cloth, 1) : '') +
    po(`M32 ${y}Q50 ${y - 6} 68 ${y}V${y + 9}Q50 ${y + 3} 32 ${y + 9}Z`, cloth) +
    `<rect x="39" y="${y - 3.6}" width="22" height="10" rx="1.6" fill="${STEEL}" stroke="${INK}" stroke-width="1"/>` +
    ln(`M41 ${y - 2}H59`, '#f4f7fa', 0.8) +
    `<circle cx="40.8" cy="${y + 1.4}" r=".6" fill="#6f7786"/><circle cx="59.2" cy="${y + 1.4}" r=".6" fill="#6f7786"/>` +
    `<g transform="translate(45.2 ${y - 3.4}) scale(.4)" fill="none" stroke="#596172" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" color="#596172">${sym}</g>` +
    (o.slash ? ln(`M40 ${y + 1.6}H60`, '#3d4350', 1.3) : '')
  );
}

/** Placa de metal solta (tiara, braço, protetor): o símbolo fica centrado. */
export function plate(x: number, y: number, w: number, h: number, village: Village): string {
  const sym = (VILLAGES as Record<string, string>)[village] ?? EXTRA[village] ?? '';
  const s = (h - 0.6) / 24;
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.4" fill="${STEEL}" stroke="${INK}" stroke-width="1"/>` +
    `<g transform="translate(${x + w / 2 - 12 * s} ${y + 0.3}) scale(${s.toFixed(3)})" fill="none" stroke="#596172" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" color="#596172">${sym}</g>`
  );
}

/** Desenho de um retrato. `j`: com as marcas do jinchūriki (só os ninjas do jogador usam). */
export type Art = (j: boolean) => string;
