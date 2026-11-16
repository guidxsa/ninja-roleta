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
export const po = (d: string, fill: string, w = 1.3): string =>
  `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`;
/** Traço. */
export const ln = (d: string, stroke = INK, w = 1.2, extra = ''): string =>
  `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra ? ` ${extra}` : ''}/>`;
/** Espelha no eixo vertical do retrato. */
export const mir = (s: string): string => `<g transform="matrix(-1 0 0 1 100 0)">${s}</g>`;
/** A peça e o espelho dela. */
export const both = (s: string): string => s + mir(s);

/** Fundo: gradiente radial, o disco (sol ou lua) atrás da cabeça e os objetos da cena. O id é único por retrato. */
export function bg(id: string, from: string, to: string, extra = ''): string {
  return (
    `<defs><radialGradient id="bg-${id}" cx="50%" cy="36%" r="78%"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></radialGradient></defs><rect width="100" height="100" fill="url(#bg-${id})"/>` +
    `<circle cx="50" cy="41" r="34" fill="#fff" opacity=".1"/><circle cx="50" cy="41" r="34" fill="none" stroke="#fff" stroke-width=".8" opacity=".22"/>` +
    `<path d="M0 78Q14 73 26 77T52 76M58 86Q74 81 86 85T100 83M2 14Q12 11 22 14M76 9Q86 6 98 10" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".13"/>` +
    extra
  );
}

export type EyeKind =
  | 'normal' | 'sharp' | 'byakugan' | 'byakuganOn' | 'sharingan' | 'ringed' | 'mad' | 'snake' | 'closed' | 'happy' | 'round' | 'bored' | 'slit' | 'dot' | 'none';
export type BrowKind = 'thin' | 'thick' | 'angry' | 'sad' | 'flat' | 'none';
export type MouthKind = 'neutral' | 'smirk' | 'smile' | 'grin' | 'frown' | 'open' | 'fangs' | 'none';
export type FaceShape = 'oval' | 'slim' | 'square' | 'wide' | 'round';

export interface FaceOpts {
  shape?: FaceShape;
  skin?: string;
  eyes?: EyeKind;
  /** Olho da direita de quem vê, quando difere do outro (Kakashi). */
  eyesR?: EyeKind;
  iris?: string;
  irisR?: string;
  /** Cor do branco do olho (preto na marca da maldição). */
  sclera?: string;
  /** Cílios puxados no canto. */
  lashes?: boolean;
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
  /** Sem a faixa de sombra da franja (testa à mostra). */
  flat?: boolean;
}

const SHAPES: Record<FaceShape, string> = {
  oval: 'M33 42C33 30 40 23 50 23S67 30 67 42C67 51 63 58 57 63L52.4 67.4Q50 69 47.6 67.4L43 63C37 58 33 51 33 42Z',
  slim: 'M33.6 42C33.6 30 40 23 50 23S66.4 30 66.4 42C66.4 50 63 56 58 61L52 68Q50 70 48 68L42 61C37 56 33.6 50 33.6 42Z',
  square: 'M33 42C33 30 40 23 50 23S67 30 67 42V51L62 61 54 67.6H46L38 61 33 51Z',
  wide: 'M30 44C30 31 39 23 50 23S70 31 70 44C70 58 61 68 50 68S30 58 30 44Z',
  round: 'M31.5 44C31.5 31 40 23 50 23S68.5 31 68.5 44C68.5 55 62 63 55 66.6Q50 69 45 66.6C38 63 31.5 55 31.5 44Z',
};

/** Íris de anime: oval alta, metade de cima mais escura, pupila e dois brilhos. */
function irisA(cx: number, cy: number, rx: number, ry: number, color: string, pupil = true): string {
  return (
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${color}"/>` +
    `<path d="M${cx - rx} ${cy}A${rx} ${ry} 0 0 1 ${cx + rx} ${cy}Z" fill="${shade(color, -0.4)}"/>` +
    (pupil ? `<ellipse cx="${cx}" cy="${cy + 0.2}" rx="${rx * 0.4}" ry="${ry * 0.46}" fill="#111"/>` : '') +
    `<circle cx="${cx - rx * 0.42}" cy="${cy - ry * 0.46}" r="${(rx * 0.34).toFixed(2)}" fill="#fff"/><circle cx="${cx + rx * 0.44}" cy="${cy + ry * 0.48}" r="${(rx * 0.17).toFixed(2)}" fill="#fff"/>`
  );
}
const OPEN_WHITE = 'M35 48Q36 42.4 41.6 42.4Q46.8 42.4 47.4 47.6Q46 51.8 41 51.8Q36.4 51.6 35 48Z';
const OPEN_LID = 'M32.8 46.6L34.4 48.2Q36 43.6 41.6 43.6Q45.8 43.6 47 46.8L48.2 45.8Q46.4 41 41.6 41Q35.6 41 32.8 46.6Z';
const SHARP_WHITE = 'M35 47Q40 43.8 47.4 46.8Q46 50.6 41 50.8Q37 50.6 35 47Z';
const SHARP_LID = 'M32.6 44.6L34.8 47.2Q40 44.2 47.4 47.2L48.4 45.6Q41 41 32.6 44.6Z';

/** O olho da esquerda de quem vê (centro em 41, 47); o da direita é o espelho. */
function eye(kind: EyeKind, iris: string, sclera: string, lashes: boolean): string {
  const lash = lashes ? ln('M33.4 46.8L31.4 45.2M34.2 44.6L32.6 42.6', INK, 0.9) : '';
  const lower = ln('M37 52.4Q40 53.2 43.6 52.6', INK, 0.5);
  switch (kind) {
    case 'normal':
      return p(OPEN_WHITE, sclera) + irisA(41.4, 47.2, 3.3, 4, iris) + p(OPEN_LID, INK) + lower + lash;
    case 'sharp':
      return p(SHARP_WHITE, sclera) + irisA(41.6, 47.4, 2.8, 3, iris) + p(SHARP_LID, INK) + lash;
    case 'byakugan':
      return p(OPEN_WHITE, '#f4f1fb') + `<ellipse cx="41.4" cy="47.2" rx="3.3" ry="4" fill="#e3ddf3" stroke="#aea6d0" stroke-width=".6"/><circle cx="40" cy="45.4" r="1" fill="#fff"/>` + p(OPEN_LID, INK) + lower + lash;
    case 'byakuganOn':
      return p(OPEN_WHITE, '#f4f1fb') + `<ellipse cx="41.4" cy="47.2" rx="3.3" ry="4" fill="#e3ddf3" stroke="#8f86b8" stroke-width=".8"/><ellipse cx="41.4" cy="47.2" rx="1.5" ry="1.9" fill="none" stroke="#8f86b8" stroke-width=".6"/>` + p(OPEN_LID, INK) +
        ln('M34 45.6L29.6 43.2 27.6 44M34 48L29.4 48.2M34.6 50.6L30.6 53.2 28.6 52.6M36 42.6L32.6 39.2 30.4 39.4M30.6 46L28 46.6', '#8c7fae', 0.9);
    case 'sharingan':
      return p(SHARP_WHITE, sclera) + `<ellipse cx="41.6" cy="47.4" rx="2.9" ry="3.1" fill="#d1232a"/><ellipse cx="41.6" cy="47.4" rx="1.8" ry="1.9" fill="none" stroke="#111" stroke-width=".4"/><circle cx="41.6" cy="47.4" r=".8" fill="#111"/><circle cx="41.6" cy="45.5" r=".65" fill="#111"/><circle cx="39.9" cy="48.4" r=".65" fill="#111"/><circle cx="43.3" cy="48.4" r=".65" fill="#111"/>` + p(SHARP_LID, INK) + lash;
    case 'ringed':
      return `<ellipse cx="41" cy="47.2" rx="7.6" ry="6.4" fill="#17100f"/>` + p('M36.2 47.4Q41 42.6 45.8 47.4Q41 51 36.2 47.4Z', '#eaf4f0') + `<ellipse cx="41" cy="47.2" rx="2.2" ry="2.5" fill="${iris}"/><ellipse cx="41" cy="47.2" rx="2.2" ry="2.5" fill="none" stroke="${shade(iris, -0.4)}" stroke-width=".5"/><circle cx="40.2" cy="46.2" r=".6" fill="#fff"/>`;
    case 'mad':
      return `<ellipse cx="41" cy="47.2" rx="7.8" ry="7" fill="#17100f"/><ellipse cx="41" cy="47.2" rx="5.2" ry="4.8" fill="#f4f6ee"/><circle cx="41" cy="47.2" r="1.7" fill="${iris}" stroke="#111" stroke-width=".5"/><circle cx="41" cy="47.2" r=".6" fill="#111"/>` + ln('M37 45.4L38.6 46.2M36.8 49L38.4 48.4', '#b85a52', 0.5);
    case 'snake':
      return p('M32.6 45.6Q40 36.6 48.4 43.6L50 55 46.6 48.4Q40 52 32.6 45.6Z', '#6f4a96') + p('M35 46.8Q41 41.4 47.2 46.6Q41 51.2 35 46.8Z', '#f0cc3a') + p('M35 46.8Q41 41.4 47.2 46.6Q41 44.2 35 46.8Z', '#c79a1e') + ln('M41.2 43.6V50', '#111', 1.4) + ln('M34.4 46.6Q41 40.6 47.8 46.2', INK, 1.5);
    case 'closed':
      return ln('M35.5 46.8Q41 50.8 46.5 46.8', INK, 1.7) + lash;
    case 'happy':
      return ln('M35.5 48.8Q41 43.4 46.5 48.8', INK, 1.8) + lash;
    case 'round':
      return `<circle cx="41" cy="47" r="5.2" fill="#fff" stroke="${INK}" stroke-width="1.3"/><circle cx="41" cy="47" r="1.8" fill="#111"/><circle cx="40.2" cy="46.2" r=".6" fill="#fff"/>` + ln('M37.4 52.8L36.8 54.4M41 53.4V55.2M44.6 52.8L45.2 54.4', INK, 0.9);
    case 'bored':
      return p('M35.4 46.2H46.8Q46 51 41 51T35.4 46.2Z', sclera) + `<path d="M38.2 46.2H44Q44 50 41.1 50T38.2 46.2Z" fill="${iris}"/><circle cx="40" cy="47.4" r=".7" fill="#fff"/>` + p('M32.8 45.4L34.4 47.4H47.4L48.2 45.4Z', INK);
    case 'slit':
      return p('M34.4 46.6Q40 42.6 47.8 46.8Q46 51.6 41 51.6Q36.6 51.2 34.4 46.6Z', '#ffe9c9') + `<ellipse cx="41.4" cy="47.4" rx="3" ry="3.6" fill="${iris}"/><path d="M38.4 47.4A3 3.6 0 0 1 44.4 47.4Z" fill="${shade(iris, -0.35)}"/>` + ln('M41.4 44.2V50.6', '#111', 1.3) + p('M32 44.2L34.4 47.4Q40 43.4 47.8 47.2L49 45.2Q41 39.8 32 44.2Z', INK);
    case 'dot':
      return `<ellipse cx="41" cy="47" rx="1.8" ry="2.2" fill="${INK}"/><circle cx="40.4" cy="46.2" r=".5" fill="#fff"/>`;
    case 'none':
      return '';
  }
}

function brow(kind: BrowKind, color: string): string {
  switch (kind) {
    case 'thin': return p('M34.6 40.4Q40 37 46.6 39.2L46.4 40.4Q40 38.8 35 41.6Z', color);
    case 'thick': return ln('M34.6 40.4Q40 36.6 46.6 39', color, 3.8);
    case 'angry': return p('M34 37.6L46.8 41 46.4 42.6 34.4 39.6Z', color);
    case 'sad': return p('M34.8 41.6Q40 38 46.4 38L46.4 39.2Q40 39.6 35.2 42.8Z', color);
    case 'flat': return p('M35 39.4H46.4V40.8H35.4Z', color);
    case 'none': return '';
  }
}

function mouth(kind: MouthKind, lips: string): string {
  switch (kind) {
    case 'neutral': return ln('M46.6 61H53.4', lips, 1.4);
    case 'smirk': return ln('M45.6 61Q50 62.6 55 59.4', lips, 1.4);
    case 'smile': return ln('M45 60Q50 63.6 55 60', lips, 1.4);
    case 'frown': return ln('M46 62Q50 59.8 54 62', lips, 1.4);
    case 'grin': return `<path d="M43.6 58.4Q50 60.6 56.4 58.4Q55.6 64.8 50 64.8T43.6 58.4Z" fill="#fff" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/>`;
    case 'open': return `<ellipse cx="50" cy="61.6" rx="3" ry="2.6" fill="#5a1f1c" stroke="${INK}" stroke-width=".8"/>`;
    case 'fangs': return `<path d="M43.6 58.4Q50 60.4 56.4 58.4Q55.6 64.8 50 64.8T43.6 58.4Z" fill="#5a1f1c" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/><path d="M45.2 59.2L46.6 62.6 48 59.8ZM54.8 59.2L53.4 62.6 52 59.8Z" fill="#fff"/>`;
    case 'none': return '';
  }
}

/** Rosto: orelhas, forma, sombra da franja, pintura, sobrancelhas, olhos, nariz e boca. O cabelo vem depois, por cima. */
export function face(o: FaceOpts = {}): string {
  const skin = o.skin ?? SKIN;
  const dark = shade(skin, -0.2);
  const shape = SHAPES[o.shape ?? 'oval'];
  const ears = o.ears === false ? '' : both(`<path d="M33.4 44C30 43 28.6 46 29.4 50C30 53 32 54.6 34 53.6Z" fill="${skin}" stroke="${INK}" stroke-width="1"/>` + ln('M31.4 47Q32.6 48.6 32 51', dark, 0.7));
  const iris = o.iris ?? '#2b2b33';
  const sclera = o.sclera ?? '#fff';
  const e = o.eyes ?? 'normal';
  const browColor = o.browColor ?? INK;
  const whisk = o.whiskers
    ? both(ln('M36 52.6L42 53.8M35.6 56.4H41.8M37 60L42.4 58.8', o.whiskers === 'deep' ? '#3a1410' : '#7a4a36', o.whiskers === 'deep' ? 2 : 1.1))
    : '';
  // Sombra chapada (cel shading): a faixa sob a franja e o lado do rosto.
  const cel = (o.flat ? '' : p('M33.2 37Q50 31 66.8 37V42.6Q50 36.6 33.2 42.6Z', dark, 'opacity=".55"')) + p('M62.6 56.6C65.4 52.6 66.8 47.6 67 42L67 50C66.6 54 65 57 62 60Z', dark, 'opacity=".5"');
  return (
    ears +
    p(shape, skin) +
    cel +
    ln(shape, INK, 1.3) +
    (o.under ?? '') +
    brow(o.brows ?? 'thin', browColor) + mir(brow(o.brows ?? 'thin', browColor)) +
    eye(e, iris, sclera, o.lashes ?? false) +
    mir(eye(o.eyesR ?? e, o.irisR ?? iris, sclera, o.lashes ?? false)) +
    (o.nose === false ? '' : ln('M50.6 54L49.6 56.4', dark, 1)) +
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

/** Traço grosso com contorno (braço, corpo de cobra, cachimbo). */
export const tube = (d: string, w: number, color: string): string => ln(d, INK, w + 2.4) + ln(d, color, w);
/** Brilho no cabelo: mecha clara. */
export const shine = (d: string, color = '#ffffff', w = 1.6): string => ln(d, color, w, 'opacity=".4"');
