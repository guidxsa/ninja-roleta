// Arte do protótipo: retratos, símbolos de clã e de vila e ícones em SVG desenhado à mão.
// Retratos podem vir de imagens em public/img/ (inclusive arte oficial, ver public/img/LEIAME.md).
// Imagens próprias em `public/img/` substituem os retratos: o build lista os arquivos em __IMAGES__.
import { prefersStill } from './layout';
import { portraitArt } from './portraits/index';
import { VILLAGES, VILLAGE_LEAF } from './villages';

declare const __IMAGES__: string[];
declare const __IMAGE_META__: Record<string, readonly [number, number]>;
const IMAGES: readonly string[] = typeof __IMAGES__ === 'undefined' ? [] : __IMAGES__;
/** Largura e altura de cada imagem, lidas no build (scripts/image-size.ts): a arte sabe a própria forma antes de carregar. */
const IMAGE_META: Record<string, readonly [number, number]> = typeof __IMAGE_META__ === 'undefined' ? {} : __IMAGE_META__;
const EXTS = ['webp', 'png', 'jpg', 'jpeg', 'svg'];

/** Caminho de uma imagem própria (`img/<pasta>/<nome>.<ext>`), se existir. */
function customImage(folder: string, name: string): string | null {
  for (const ext of EXTS) {
    const path = `img/${folder}/${name}.${ext}`;
    if (IMAGES.includes(path)) return path;
  }
  return null;
}

const svg = (body: string, viewBox = '0 0 24 24', cls = 'ico') =>
  `<svg class="${cls}" viewBox="${viewBox}" aria-hidden="true">${body}</svg>`;

// ---------------------------------------------------------------------------
// Ícones (24×24). `currentColor` herda a cor do componente.

const ICONS: Record<string, string> = {
  house: '<path d="M3 11 12 3l9 8M5 10v11h5v-6h4v6h5V10" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/>',
  fortuneWheel: '<path d="M12 2a10 10 0 1 0 .01 0M12 2v20M2 12h20M5 5l14 14M5 19 19 5" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/>',
  navScroll: '<path d="M7 3h12a2 2 0 0 1 0 4h-2M17 5v13a3 3 0 0 1-3 3H5a2 2 0 0 1 0-4h9M7 17V5a2 2 0 0 1 2-2m1 5h4m-4 4h4" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/>',
  navRoute: '<path d="M5 20v-3c0-5 7-4 7-10V3m0 9c1-3 7-2 7-8m-4 2 4-3 2 4M9 6l3-3 3 3" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/>',
  clock: '<path d="M12 3a9 9 0 1 0 .01 0M12 6v6l4 2" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/>',
  navBook: '<path d="M12 6C9 3 5 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-4-1-7-1-10 2Zm0 0v15" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/>',
  navChest: '<path d="M3 11V8a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v11H3zM3 11h7m4 0h7m-10-1h2v4h-2z" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/>',
  trophy: '<path d="M7 3h10v5c0 4-2 7-5 7S7 12 7 8Zm10 2h4v2c0 3-2 5-5 5M7 5H3v2c0 3 2 5 5 5m4 3v5m-4 1h8" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/>',
  konoha: '<path d="M21.8 4.2c-1.5 2-2.8 3.2-5.2 2.2C10 3.5 4.9 7.4 4.9 12.9c0 4.2 3.4 7 7.4 6.6 4.2-.4 6.6-4.2 4.8-7.5-1.4-2.6-5.1-3-6.9-.8-1.4 1.7-.7 4 1.1 4.4 1.4.3 2.7-.6 2.7-1.8M5.2 10.9 1.8 19.5h9.9" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>',
  // Elementos
  fire: '<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 1.6-4.6 3-6 .2 2 1 3 2.2 3.6C10.6 8.8 11 5.4 12 2z" fill="currentColor"/><path d="M12 13c.8 1.6 3 2.4 3 5a3 3 0 0 1-6 0c0-1.6 1.2-2.4 1.6-3.6.4.8.8 1.2 1.4 1.4-.3-1-.3-1.8 0-2.8z" fill="#fff3" />',
  wind: '<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h16a3 3 0 1 1-3 3"/><path d="M3 16h7a2.5 2.5 0 1 1-2.5 2.5"/></g>',
  lightning: '<path d="M14 2 4 14h6l-2 8 10-12h-6z" fill="currentColor"/>',
  earth: '<path d="M2 20 8.5 8l3.5 6 2.5-4L22 20z" fill="currentColor"/><path d="m8.5 8 1.8 3.4-1.8-.8-1.6 1.4z" fill="#fff4"/>',
  water: '<path d="M12 2.5C9 7.5 5.5 11 5.5 15a6.5 6.5 0 0 0 13 0C18.5 11 15 7.5 12 2.5z" fill="currentColor"/><path d="M9 15.5a3 3 0 0 0 3 3" fill="none" stroke="#fff6" stroke-width="1.6" stroke-linecap="round"/>',
  neutral: '<circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="2" fill="currentColor"/>',
  // Tipos de ataque
  taijutsu:
    '<path d="M6 10.5V8a2 2 0 0 1 4 0V7a2 2 0 0 1 4 0v1a2 2 0 0 1 4 0v6.5a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 4 15v-2.5a2 2 0 0 1 2-2z" fill="currentColor"/><path d="M10 8v4M14 8v4M6 10.5V13" stroke="#0005" stroke-width="1.3" stroke-linecap="round"/>',
  ninjutsu:
    '<path d="M12 2.5 14.2 9.8 21.5 12l-7.3 2.2L12 21.5l-2.2-7.3L2.5 12l7.3-2.2z" fill="currentColor"/><circle cx="12" cy="12" r="2.2" fill="#0006"/>',
  genjutsu:
    '<path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" fill="currentColor"/><circle cx="12" cy="12" r="4.2" fill="#0007"/><path d="M12 9.8a2.2 2.2 0 1 1-2.2 2.2" fill="none" stroke="currentColor" stroke-width="1.4"/>',
  medical: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" fill="currentColor"/>',
  barrier: '<path d="M12 2 4 5v6c0 5 3.4 9.2 8 11 4.6-1.8 8-6 8-11V5z" fill="currentColor"/><path d="M12 5.5v13" stroke="#0004" stroke-width="1.6"/>',
  blade: '<path d="M14.5 2.5 21.5 3l-.5 7-9 9-6-6z" fill="currentColor"/><path d="M5.5 12.5 3 15l6 6 2.5-2.5M4 20l-1.5 1.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  // Ações especiais
  rest: '<path d="M12 3c2.5 3.5 4 6 4 8.5a4 4 0 0 1-8 0C8 9 9.5 6.5 12 3z" fill="currentColor"/><path d="M3 18c3 0 4-2 9-2s6 2 9 2M5 21.5c2.4 0 3.6-1.5 7-1.5s4.6 1.5 7 1.5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  stance: '<path d="M12 2 4 5v6c0 5 3.4 9.2 8 11 4.6-1.8 8-6 8-11V5z" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="m8.5 12 2.5 2.5 4.5-5" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
  // Torii do Portão da Vila: voltar ao menu principal.
  home: '<path d="M2 5.5c3.5 1 16.5 1 20 0" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M4.5 10h15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M7 6.5V21M17 6.5V21M12 6.5V10" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  gates: '<path d="M2 5h20M4 9h16" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M6 7v15M18 7v15M12 9v4" stroke="currentColor" stroke-width="2.4"/>',
  expansion: '<path d="M4 4h6M4 4v6M20 4h-6M20 4v6M4 20h6M4 20v-6M20 20h-6M20 20v-6" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/>',
  sharingan:
    '<circle cx="12" cy="12" r="10" fill="#b3151b"/><circle cx="12" cy="12" r="6" fill="none" stroke="#2a0507" stroke-width="1"/><circle cx="12" cy="12" r="2.4" fill="#120203"/><g fill="#120203"><circle cx="12" cy="6" r="1.6"/><circle cx="17.2" cy="15" r="1.6"/><circle cx="6.8" cy="15" r="1.6"/></g>',
  byakugan:
    '<circle cx="12" cy="12" r="10" fill="#ece8f6" stroke="#7d73a8" stroke-width=".9"/><circle cx="12" cy="12" r="5.5" fill="#d3cdea"/><g stroke="#9d93c7" stroke-width=".9"><path d="M2.5 9.5 6 10.5M2.5 14.5 6 13.5M21.5 9.5 18 10.5M21.5 14.5 18 13.5"/></g>',
  item: '<path d="M6 8h12l1.5 12.5a1 1 0 0 1-1 1.5h-13a1 1 0 0 1-1-1.5z" fill="currentColor"/><path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8 12h8" stroke="#0005" stroke-width="1.6"/>',
  // Baú laqueado do tesouro (a bolsa do item, no mapa, lia como cadeado).
  chest: '<path d="M4.5 5h15L21 10H3z" fill="currentColor" opacity=".75"/><path d="M3 10h18v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5z" fill="currentColor"/><path d="M3 13.5h18" stroke="#0005" stroke-width="1.6"/><rect x="10.5" y="11.5" width="3" height="4.5" fill="#0007"/>',
  substitution: '<rect x="4" y="9" width="16" height="9" rx="4.5" fill="currentColor"/><ellipse cx="18" cy="13.5" rx="2.5" ry="4.5" fill="#0004"/><path d="M8 5l2 2M12 3.5v3M16 5l-2 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  clash: '<path d="M3 21 11 13M21 21l-8-8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M12 2l1.6 4.6L18 5l-2 4.2 4.5 1.3L16 12l-4-.4L8 12l-4.5-1.5L8 9.2 6 5l4.4 1.6z" fill="currentColor"/>',
  pass: '<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  // Condições de batalha
  prison: '<path d="M4 4v16M9 4v16M14 4v16M19 4v16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M2 4h20M2 20h20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  sleep: '<path d="M4 8h6l-6 7h6M13 4h5l-5 6h5M15 14h4l-4 5h4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  stun: '<path d="M12 4l1.3 3 3.2.2-2.4 2.1.8 3.1L12 10.7l-2.9 1.7.8-3.1-2.4-2.1 3.2-.2z" fill="currentColor"/><ellipse cx="12" cy="16" rx="9" ry="3.5" fill="none" stroke="currentColor" stroke-width="2"/>',
  fear: '<circle cx="12" cy="11" r="8.5" fill="currentColor"/><circle cx="8.8" cy="10" r="1.8" fill="#0008"/><circle cx="15.2" cy="10" r="1.8" fill="#0008"/><ellipse cx="12" cy="15.5" rx="2" ry="2.6" fill="#0008"/><path d="M8.5 19.5v3M12 20v2.5M15.5 19.5v3" stroke="currentColor" stroke-width="1.6"/>',
  confusion: '<path d="M12 12a1.5 1.5 0 1 1 1.5-1.5 3 3 0 1 1-3 3 4.5 4.5 0 1 1 4.5-4.5 6 6 0 1 1-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  torment: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" stroke-width="2"/>',
  poison: '<path d="M12 2.5C9 7.5 5.5 11 5.5 15a6.5 6.5 0 0 0 13 0C18.5 11 15 7.5 12 2.5z" fill="currentColor"/><path d="M9 13.5l6 3.5M15 13.5l-6 3.5" stroke="#0008" stroke-width="1.6" stroke-linecap="round"/>',
  bleed: '<path d="M8 3c-2 3.4-3.5 5.6-3.5 8a3.5 3.5 0 0 0 7 0C11.5 8.6 10 6.4 8 3zM16.5 9c-2 3.4-3.5 5.6-3.5 8a3.5 3.5 0 0 0 7 0c0-2.4-1.5-4.6-3.5-8z" fill="currentColor"/>',
  immune: '<path d="M12 2 4 5v6c0 5 3.4 9.2 8 11 4.6-1.8 8-6 8-11V5z" fill="currentColor"/><path d="m8.5 12 2.5 2.5 4.5-5" stroke="#0008" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
  cloak: '<path d="M12 2c1.5 3 5 4 5 9 2-1 2.6-3 2.6-3 1.4 2 2.4 4.4 2.4 6.5A10 10 0 0 1 2 14.5C2 12.4 3 10 4.4 8c0 0 .6 2 2.6 3 0-5 3.5-6 5-9z" fill="currentColor"/><circle cx="12" cy="15" r="3.5" fill="#0005"/>',
  crit: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><path d="M12 1v5M12 18v5M1 12h5M18 12h5" stroke="currentColor" stroke-width="2"/>',
  mist: '<path d="M6.5 17a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 17.5 7a4.6 4.6 0 0 1 .3 10z" fill="currentColor"/><path d="M3 20.5h10M15 20.5h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  bell: '<path d="M12 3a1.5 1.5 0 0 1 1.5 1.5v.4c2.900.8 4.700 3.400 4.700 6.600V15l1.800 2.400H4L5.800 15v-3.500c0-3.200 1.800-5.800 4.700-6.600v-.4A1.500 1.500 0 0 1 12 3z" fill="currentColor"/><path d="M9.700 19a2.300 2.300 0 0 0 4.600 0z" fill="currentColor"/>',
  timer: '<circle cx="12" cy="13" r="8.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 8.5V13l3 2M9.5 2h5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/>',
  heartbreak: '<path d="M12 21S3 15 3 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 2.5C21 15 12 21 12 21z" fill="currentColor"/><path d="m12 6-1.5 4 3 2.5-2 4" stroke="#0008" stroke-width="1.6" fill="none"/>',
  claw: '<path d="M5 21C5 13 7 7 11 3c-1.6 5-1.6 10 0 18zM11.5 21c0-8 2-13 6-16-1.6 5-1.6 10 0 16zM18 21c0-6 1.3-9 4-11-1 4-1 7 0 11z" fill="currentColor"/>',
  warning: '<path d="M12 2.5 22.5 21h-21z" fill="currentColor"/><path d="M12 9v6" stroke="#000a" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="18" r="1.3" fill="#000a"/>',
  intent: '<path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/>',
  dodge: '<path d="M14 4h6M11 9h10M14 14h6M3 19h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="6" cy="9" r="3" fill="currentColor"/>',
  clones: '<circle cx="8" cy="7" r="3.2" fill="currentColor"/><circle cx="16" cy="7" r="3.2" fill="currentColor" opacity=".6"/><path d="M2 21c0-5 2.7-8 6-8s6 3 6 8zM10 21c0-5 2.7-8 6-8s6 3 6 8z" fill="currentColor"/>',
  // Um shinobi de pé, com a bandana (minijogo do clone verdadeiro, v0.91.0).
  shinobi: '<circle cx="12" cy="6" r="3.4" fill="currentColor"/><path d="M8.4 5h7.2" stroke="#0008" stroke-width="1.4"/><path d="M15.4 5.2l3 1.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M6 22l1.6-8.5c.4-2 2.2-3.5 4.4-3.5s4 1.5 4.4 3.5L18 22h-3.4l-1-5h-3.2l-1 5z" fill="currentColor"/>',
  armor: '<path d="M12 2 4 5v6c0 5 3.4 9.2 8 11 4.6-1.8 8-6 8-11V5z" fill="currentColor"/><path d="M13 6 8.5 13h3l-1 5 4.5-7h-3z" fill="#0008"/>',
  willOfFire: '<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 1.6-4.6 3-6 .2 2 1 3 2.2 3.6C10.6 8.8 11 5.4 12 2z" fill="currentColor"/><path d="M12 21s-3.5-2.4-3.5-5a1.9 1.9 0 0 1 3.5-1 1.9 1.9 0 0 1 3.5 1c0 2.6-3.5 5-3.5 5z" fill="#fff8"/>',
  owes: '<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M10 18h4" stroke="currentColor" stroke-width="2.4"/>',
  focus: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/>',
  // Passivas dos vilões
  trickster: '<path d="M4 3l4 5h8l4-5v9a8 8 0 0 1-16 0z" fill="currentColor"/><path d="M7 12.5l3.5 1M17 12.5l-3.5 1" stroke="#000a" stroke-width="1.8" stroke-linecap="round"/><path d="M10 18c1.4 1 2.6 1 4 0" stroke="#000a" stroke-width="1.5" fill="none"/>',
  mirrors: '<path d="M7 2h7l-2 9H5z" fill="currentColor"/><path d="M15 6h6l-2 9h-6zM4 13h6l-2 9H2z" fill="currentColor" opacity=".65"/>',
  beast: '<path d="M12 3c4 0 7.5 3 7.5 8.5 0 5-3.4 9.5-7.5 9.5s-7.5-4.5-7.5-9.5C4.5 6 8 3 12 3z" fill="currentColor"/><path d="M4.5 9 2 3.5l5.5 2.4M19.5 9 22 3.5l-5.5 2.4" fill="currentColor"/><g fill="#000a"><circle cx="8.8" cy="11" r="1.8"/><circle cx="15.2" cy="11" r="1.8"/></g><path d="M8 16.5h8" stroke="#000a" stroke-width="1.6"/>',
  curseMark: '<g fill="currentColor"><path d="M7 5a3.5 3.5 0 1 1 0 7c1.6-1.6 1.6-5.4 0-7z"/><path d="M17 5a3.5 3.5 0 1 0 0 7c-1.6-1.6-1.6-5.4 0-7z"/><path d="M12 13a3.5 3.5 0 1 1 0 7c1.6-1.6 1.6-5.4 0-7z"/></g>',
  scalpel: '<path d="M3 21 13 11l2 2L5 23z" fill="currentColor" opacity=".6"/><path d="M13 11 21 3c.6 4-1.4 8-6 10z" fill="currentColor"/>',
  snake: '<path d="M4 20c0-3 2.5-4.5 6-4.5s5.5-1 5.5-3.5S13 8.5 10 8.5 6 7 6 5s2-3 4-3h6.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="18" cy="2.5" r="2.5" fill="currentColor"/>',
  sandArmor: '<path d="M12 2 4 5v6c0 5 3.4 9.2 8 11 4.6-1.8 8-6 8-11V5z" fill="currentColor"/><g fill="#0005"><circle cx="9" cy="9" r="1"/><circle cx="14" cy="8" r=".9"/><circle cx="12" cy="12" r="1.1"/><circle cx="9.5" cy="15" r=".9"/><circle cx="15" cy="13.5" r="1"/></g>',
  genjutsuImmune: '<path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 20 20 4" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  // Bolsa
  pill: '<rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-35 12 12)" fill="currentColor"/><path d="m9.3 15.8 5.4-7.6" stroke="#0006" stroke-width="1.6"/>',
  kit: '<rect x="3" y="7" width="18" height="13" rx="2.5" fill="currentColor"/><path d="M9 7V5h6v2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 10.5v6M9 13.5h6" stroke="#fff" stroke-width="2.2"/>',
  tag: '<rect x="6" y="2" width="12" height="20" rx="1.5" fill="#efe1c0"/><path d="M9 6h6M12 6v12M9 10h6M9.5 14l5 0M10 18h4" stroke="#b3151b" stroke-width="1.6"/>',
  smoke: '<circle cx="8" cy="14" r="5" fill="currentColor"/><circle cx="15" cy="12" r="6" fill="currentColor" opacity=".75"/><circle cx="13" cy="7" r="3.5" fill="currentColor" opacity=".5"/>',
  coin: '<circle cx="12" cy="12" r="9.5" fill="currentColor"/><rect x="9.5" y="9.5" width="5" height="5" fill="#0005"/><circle cx="12" cy="12" r="7" fill="none" stroke="#0003" stroke-width="1.2"/>',
  weights: '<rect x="2" y="9" width="4" height="6" rx="1" fill="currentColor"/><rect x="18" y="9" width="4" height="6" rx="1" fill="currentColor"/><rect x="5" y="7" width="3" height="10" rx="1" fill="currentColor"/><rect x="16" y="7" width="3" height="10" rx="1" fill="currentColor"/><path d="M8 12h8" stroke="currentColor" stroke-width="2.4"/>',
  amuletSpeed: '<path d="M20 3C11 3 5 9 4 19l2 2C9 13 14 8 20 3z" fill="currentColor"/><path d="M8 15l4-1M10 11.5l4-.5" stroke="#0005" stroke-width="1.4"/>',
  amuletRes: '<circle cx="12" cy="13" r="8" fill="currentColor"/><circle cx="12" cy="13" r="4.5" fill="#fff"/><circle cx="12" cy="13" r="2.2" fill="#123"/><path d="M12 1.5V5" stroke="currentColor" stroke-width="2"/>',
  scroll: '<rect x="5" y="4" width="14" height="16" rx="1" fill="#efe1c0"/><rect x="3" y="2.5" width="18" height="3" rx="1.5" fill="currentColor"/><rect x="3" y="18.5" width="18" height="3" rx="1.5" fill="currentColor"/><path d="M8.5 9h7M8.5 12h7M8.5 15h4" stroke="#6b3f1d" stroke-width="1.4"/>',
  toad: '<ellipse cx="12" cy="15" rx="9" ry="6" fill="currentColor"/><circle cx="7.5" cy="8.5" r="3" fill="currentColor"/><circle cx="16.5" cy="8.5" r="3" fill="currentColor"/><circle cx="7.5" cy="8.5" r="1.3" fill="#0008"/><circle cx="16.5" cy="8.5" r="1.3" fill="#0008"/><path d="M7 16.5c3 1.6 7 1.6 10 0" stroke="#0007" stroke-width="1.4" fill="none"/>',
  slug: '<path d="M2 19c3 0 4-1 7-1h8c3 0 5-2 5-5s-2-5-5-5c-2.6 0-4.6 1.8-5 4.5L9 18" fill="currentColor"/><path d="M14 8 13 3M18 8l1-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  // Pips vazados (evenodd): com a cor fixa #0008 o dado virava um quadrado preto no tema claro.
  dice: '<path fill="currentColor" fill-rule="evenodd" d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM8 6.4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zm8 0a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zm-4 4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zm-4 4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zm8 0a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z"/>',
  swords: '<path d="M4 3l9 9M20 3l-9 9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M7 16l-3 3M17 16l3 3M9 14l-4 4 2 2 4-4M15 14l4 4-2 2-4-4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  sun: '<circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="currentColor"/><circle cx="17" cy="5" r="1.2" fill="currentColor"/><circle cx="20.5" cy="9" r=".8" fill="currentColor"/>',
  soundOn: '<path d="M3 9h4l5-4.5v15L7 15H3z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  soundOff: '<path d="M3 9h4l5-4.5v15L7 15H3z" fill="currentColor"/><path d="m16 9 6 6M22 9l-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  music: '<path d="M9 18V5l11-2v13" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="3" fill="currentColor"/><circle cx="17.5" cy="16" r="3" fill="currentColor"/>',
  musicOff: '<path d="M9 18V5l11-2v13" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linejoin="round" opacity=".55"/><circle cx="6.5" cy="18" r="3" fill="currentColor" opacity=".55"/><circle cx="17.5" cy="16" r="3" fill="currentColor" opacity=".55"/><path d="M3 3l18 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  share: '<g fill="currentColor"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/></g><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" stroke="currentColor" stroke-width="2" fill="none"/>',
  info: 
'<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 10.5V17" stroke="#000a" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="7.2" r="1.5" fill="#000a"/>',
  // Interface (traçado de check, x, cadeado e seta baseado no Lucide, licença ISC: https://lucide.dev)
  // Kunai (ornamento: prende pergaminhos na casca do PC).
  kunai: '<path d="M3 3l8.2 3.4 3.6 3.6-4.8 4.8-3.6-3.6z" fill="currentColor"/><path d="M12.6 12.6l5.2 5.2" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M13.8 15.6l1.8-1.8M15.4 17.2l1.8-1.8" stroke="currentColor" stroke-width="1" stroke-opacity=".55"/><circle cx="19.6" cy="19.6" r="2" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  check: '<path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  close: '<path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  lock: '<rect x="4" y="11" width="16" height="10.5" rx="1.5" fill="currentColor"/><path d="M8 11V7a4 4 0 0 1 8 0v4" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="16" r="1.6" fill="#0008"/>',
  chevron: '<path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  advantage: '<path d="m6 15 6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>',
  disadvantage: '<path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>',
  book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15H6a2 2 0 0 0-2 2z" fill="currentColor"/><path d="M4 20a2 2 0 0 0 2 2h13v-4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 7h7M8.5 10.5h7" stroke="#0008" stroke-width="1.5" stroke-linecap="round"/>',
  medal: '<path d="M7 2h4l2 6H9zM13 2h4l-2 6h-4z" fill="currentColor" opacity=".65"/><circle cx="12" cy="15" r="6.5" fill="currentColor"/><path d="m12 11.3 1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3z" fill="#0007"/>',
  // Ciclo (modo infinito): duas setas em círculo.
  cycle: '<path d="M19.5 9.5A8 8 0 0 0 5.2 7.6M4.5 14.5a8 8 0 0 0 14.3 1.9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="m20.5 4.5-.6 5.6-5.4-1.6zM3.5 19.5l.6-5.6 5.4 1.6z" fill="currentColor"/>',
  sparkle: '<path d="M12 2c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z" fill="currentColor"/><path d="M19 15c.3 2 1 2.7 3 3-2 .3-2.7 1-3 3-.3-2-1-2.7-3-3 2-.3 2.7-1 3-3z" fill="currentColor" opacity=".7"/>',
  card: '<rect x="3" y="5" width="11" height="15" rx="1" transform="rotate(-10 8.5 12.5)" fill="currentColor" opacity=".5"/><rect x="9" y="3" width="11" height="15" rx="1" transform="rotate(8 14.5 10.5)" fill="currentColor"/><circle cx="14.6" cy="10.6" r="2.4" fill="none" stroke="#0008" stroke-width="1.4"/>',
  heart: '<path d="M12 21S3 15 3 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 2.5C21 15 12 21 12 21z" fill="currentColor"/>',
  block: '<circle cx="12" cy="12" r="9.5" fill="currentColor"/><rect x="6" y="10.5" width="12" height="3" fill="#0009"/>',
  // Jokenpô
  rock: '<path d="M5 11a2 2 0 0 1 2-2h1V8a2 2 0 0 1 4 0 2 2 0 0 1 4 0v1a2 2 0 0 1 3 1.7V15a7 7 0 0 1-7 7h-1a6 6 0 0 1-6-6z" fill="currentColor"/><path d="M8 9v4M12 8v4.5M16 9v4" stroke="#0006" stroke-width="1.3" stroke-linecap="round"/><path d="M5 14c2 0 4 .6 5 2" stroke="#0006" stroke-width="1.3" fill="none" stroke-linecap="round"/>',
  paper: '<g fill="currentColor"><rect x="6.2" y="5" width="2.8" height="10" rx="1.4"/><rect x="9.6" y="2.5" width="2.8" height="11" rx="1.4"/><rect x="13" y="3.5" width="2.8" height="10" rx="1.4"/><rect x="16.4" y="6" width="2.8" height="9" rx="1.4"/><path d="M6.2 12h13v3.5a6.5 6.5 0 0 1-6.5 6.5h-.5a6 6 0 0 1-4.6-2.2L3.4 15.4a1.6 1.6 0 0 1 2.4-2z"/></g>',
  scissors: '<g fill="currentColor"><rect x="7" y="2.5" width="3" height="11" rx="1.5" transform="rotate(-12 8.5 8)"/><rect x="12.4" y="2.5" width="3" height="11" rx="1.5" transform="rotate(12 13.9 8)"/><path d="M6 12.5h12v3a6.5 6.5 0 0 1-6.5 6.5h-.5A5.5 5.5 0 0 1 6 16.5z"/></g><path d="M9 14.8h7" stroke="#0006" stroke-width="1.3" stroke-linecap="round"/>',
  // Log de combate (no lugar dos emojis)
  mind: '<path d="M13 2a8 8 0 0 1 8 8c0 2.5-1 4-2 5v6h-7v-3H8.5A2.5 2.5 0 0 1 6 15.5V13l-2-1 2.4-4A8 8 0 0 1 13 2z" fill="currentColor"/><path d="M13.5 10a1 1 0 1 1 1-1 2 2 0 1 1-2 2 3 3 0 1 1 3-3" fill="none" stroke="#0008" stroke-width="1.4" stroke-linecap="round"/>',
  blast: '<path d="M12 1.5 14 8l5.5-3.5L17 10.5l5.5 1.5-5.5 2 3 5.5-5.8-2.6L12 22.5l-2.2-5.6L4 19.5l3-5.5-5.5-2 5.5-1.5L4.5 4.5 10 8z" fill="currentColor"/><circle cx="12" cy="12" r="3" fill="#0005"/>',
  antlers: '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 21V14C10 10 6 9 5 4M7.5 10.5 3.5 9M8.2 6.6 9.5 3"/><path d="M14 21V14c0-4 4-5 5-10M16.5 10.5l4-1.5M15.8 6.6 14.5 3"/></g>',
  gourd: '<path d="M10.5 2h3v2.2c0 .8.6 1.3 1.2 1.8a3.6 3.6 0 0 1-.4 5.6A6 6 0 1 1 9.7 11.6a3.6 3.6 0 0 1-.4-5.6c.6-.5 1.2-1 1.2-1.8z" fill="currentColor"/><path d="M8.6 11.6h6.8" stroke="#0007" stroke-width="1.6"/>',
  steam: '<path d="M8 3c-2 2.5 2 3.5 0 6M12 2c-2 2.5 2 3.5 0 6M16 3c-2 2.5 2 3.5 0 6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M3 12h18a9 9 0 0 1-18 0z" fill="currentColor"/>',
  sprout: '<path d="M12 22v-9" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M12 13C12 8 9 5 3.5 5c0 5.5 3.5 8 8.5 8zM12 11c0-4 2.5-7 8.5-7 0 5-3 7-8.5 7z" fill="currentColor"/>',
  tree: '<path d="M12 2c4.5 0 7 3 7 6.5 2 1 2.5 3 2 4.5-.6 2.2-3 3-5 3H8c-2 0-4.4-.8-5-3-.5-1.5 0-3.5 2-4.5C5 5 7.5 2 12 2z" fill="currentColor"/><path d="M12 16v6" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M12 15l-3-2.5M12 13l2.5-2" stroke="#0006" stroke-width="1.6" stroke-linecap="round"/>',
  bug: '<ellipse cx="12" cy="14" rx="6" ry="7.5" fill="currentColor"/><circle cx="12" cy="5.5" r="2.6" fill="currentColor"/><path d="M12 7.5v13" stroke="#0007" stroke-width="1.2"/><path d="M6.5 10 3 8M6 14H2.5M6.5 18 3 20.5M17.5 10 21 8M18 14h3.5M17.5 18l3.5 2.5M10.5 3.5 9 1.5M13.5 3.5 15 1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  ice: '<g stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7"/><path d="M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5M3.6 10.4 7 9.5 6 6M20.4 13.6 17 14.5l1 3.5M3.6 13.6 7 14.5l-1 3.5M20.4 10.4 17 9.5 18 6"/></g>',
};

/**
 * Texturas da interface (vagas em public/img/ui/): papel, madeira, pincel e fundo. Cada uma que existir vira uma
 * variável CSS (`--tex-paper`, `--tex-wood`, `--tex-brush`, `--tex-page`); sem a imagem, vale o desenho do CSS.
 */
export function uiTextureVars(): Record<string, string> {
  const slots: Record<string, string> = { papel: '--tex-paper', madeira: '--tex-wood', pincel: '--tex-brush', fundo: '--tex-page' };
  const out: Record<string, string> = {};
  for (const [name, cssVar] of Object.entries(slots)) {
    const path = customImage('ui', name);
    if (path) out[cssVar] = `url("${path}")`;
  }
  return out;
}

/** Diz se o ícone existe (o `icon()` cai no neutro sem avisar). */
export function hasIcon(name: string): boolean {
  return name in ICONS;
}

export function icon(name: string, cls = ''): string {
  const body = ICONS[name] ?? ICONS.neutral!;
  return svg(body, '0 0 24 24', `ico${cls ? ` ${cls}` : ''}`);
}

// ---------------------------------------------------------------------------
// Símbolos de clã (24×24, cores próprias). Desenhos originais, livres.

/** Espiral em semicírculos alternados (base da folha e do redemoinho). */
const spiral = (cx: number, cy: number, turns: number, step = 1) => {
  let d = `M${cx} ${cy}`;
  let x = cx;
  for (let i = 1; i <= turns; i++) {
    const r = i * step;
    const dx = i % 2 ? 2 * r : -2 * r;
    d += ` a${r} ${r} 0 0 1 ${dx} 0`;
    x += dx;
  }
  return { d, x };
};

const CLANS: Record<string, string> = {
  // Folha (comum): o símbolo de Konoha, o mesmo da vila, na cor da folha.
  common: `<g fill="none" stroke="#e8701a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${VILLAGE_LEAF}</g>`,
  // Uchiha: o uchiwa (leque) do clã, vermelho em cima e branco embaixo, com o cabo.
  uchiha:
    '<path d="M12 1.8a7.6 7.6 0 0 1 7.6 7.6c0 .9-.1 1.7-.4 2.5H4.8a7.6 7.6 0 0 1 7.2-10.1z" fill="#d1232a"/><path d="M4.8 11.9h14.4A7.6 7.6 0 0 1 12 17a7.6 7.6 0 0 1-7.2-5.1z" fill="#f5f1e6"/><circle cx="12" cy="9.4" r="7.6" fill="none" stroke="#2a1d16" stroke-width=".9"/><rect x="10.9" y="17" width="2.2" height="5.6" rx=".6" fill="#f5f1e6" stroke="#2a1d16" stroke-width=".8"/>',
  // Hyuuga: o olho branco com veias.
  hyuuga:
    '<path d="M1.5 12S6 4.5 12 4.5 22.5 12 22.5 12 18 19.5 12 19.5 1.5 12 1.5 12z" fill="#ece8f6" stroke="#7d73a8" stroke-width=".9"/><circle cx="12" cy="12" r="4.4" fill="#cfc8e8"/><circle cx="12" cy="12" r="1.4" fill="#f9f8ff"/><path d="M3.5 9 7 10.6M3.5 15 7 13.4M20.5 9 17 10.6M20.5 15 17 13.4" stroke="#a197cc" stroke-width="1"/>',
  // Nara: chifres de cervo.
  nara: '<g fill="none" stroke="#c8a46a" stroke-width="2" stroke-linecap="round"><path d="M10 21V14C10 10 6 9 5 4M7.5 10.5 3.5 9M8.2 6.6 9.5 3"/><path d="M14 21V14c0-4 4-5 5-10M16.5 10.5l4-1.5M15.8 6.6 14.5 3"/></g>',
  // Akimichi: borboleta.
  akimichi:
    '<g fill="#e0582b"><ellipse cx="7" cy="8.5" rx="5" ry="4.5" transform="rotate(-25 7 8.5)"/><ellipse cx="17" cy="8.5" rx="5" ry="4.5" transform="rotate(25 17 8.5)"/><ellipse cx="8" cy="16" rx="3.5" ry="3" transform="rotate(20 8 16)"/><ellipse cx="16" cy="16" rx="3.5" ry="3" transform="rotate(-20 16 16)"/></g><path d="M12 5.5v14" stroke="#4a1a08" stroke-width="2" stroke-linecap="round"/><path d="M12 6 10 2.5M12 6l2-3.5" stroke="#4a1a08" stroke-width="1.2" stroke-linecap="round"/>',
  // Yamanaka: flor.
  yamanaka:
    '<g fill="#b77ad8"><ellipse cx="12" cy="6.5" rx="3.4" ry="4.5"/><ellipse cx="12" cy="17.5" rx="3.4" ry="4.5"/><ellipse cx="6.5" cy="12" rx="4.5" ry="3.4"/><ellipse cx="17.5" cy="12" rx="4.5" ry="3.4"/></g><circle cx="12" cy="12" r="2.8" fill="#f2c94c"/>',
  // Aburame: besouro.
  aburame:
    '<g stroke="#5d7a4a" stroke-width="1.5" stroke-linecap="round"><path d="M7 9 3 7M6.5 13H2.5M7 17l-3.5 2.5M17 9l4-2M17.5 13h4M17 17l3.5 2.5"/></g><ellipse cx="12" cy="14" rx="5.5" ry="7" fill="#3e5a34"/><circle cx="12" cy="5.5" r="2.6" fill="#2b4024"/><path d="M12 8v13" stroke="#9fbf7a" stroke-width="1"/>',
  // Inuzuka: as presas vermelhas pintadas no rosto do clã.
  inuzuka:
    '<path d="M3.5 5.5h6.5L6.2 18.5z" fill="#c0392b"/><path d="M14 5.5h6.5L17.8 18.5z" fill="#c0392b"/>',
  // Uzumaki: o redemoinho vermelho do clã, sem fundo, com a ponta solta para fora.
  uzumaki: `<path d="${spiral(11.4, 12, 3, 1.75).d} c0 3-2 5.6-4.6 7" fill="none" stroke="#d1232a" stroke-width="2.3" stroke-linecap="round"/>`,
  // Senju: folha com o broto da árvore.
  senju:
    '<path d="M12 2.5c5 3 7.5 7.5 7.5 11.5a7.5 7.5 0 0 1-15 0C4.5 10 7 5.5 12 2.5z" fill="#2fa36b"/><path d="M12 21V9M12 14l-3.5-3M12 12l3-2.5" stroke="#eaf7ee" stroke-width="1.6" stroke-linecap="round" fill="none"/>',
  // Prodígio do taijutsu: lótus verde.
  taijutsuProdigy:
    '<g fill="#3fa34d"><path d="M12 3c2.6 3 2.6 9 0 13-2.6-4-2.6-10 0-13z"/><path d="M3 9c4 .4 7.5 3.8 9 7.5-4 .5-8-3-9-7.5zM21 9c-4 .4-7.5 3.8-9 7.5 4 .5 8-3 9-7.5z" opacity=".85"/></g><path d="M5 19.5c4 1.6 10 1.6 14 0" stroke="#2c7a37" stroke-width="2" fill="none" stroke-linecap="round"/>',
  // Jinchuuriki: selo de oito trigramas.
  jinchuuriki: `<circle cx="12" cy="12" r="10" fill="none" stroke="#ff5a3c" stroke-width="1.6"/><path d="${spiral(12, 12, 3, 1.2).d}" fill="none" stroke="#ff5a3c" stroke-width="1.6" stroke-linecap="round"/><g stroke="#ff5a3c" stroke-width="1.4"><path d="M12 1.5v2.5M12 20v2.5M1.5 12H4M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M19.4 4.6l-1.8 1.8M6.4 17.6l-1.8 1.8"/></g>`,
};

/** Símbolo do clã (ou da folha, para quem não tem linhagem). */
export function clanSymbol(lineageId: string | null | undefined, cls = ''): string {
  const body = CLANS[lineageId ?? 'common'] ?? CLANS.common!;
  return svg(body, '0 0 24 24', `ico clan${cls ? ` ${cls}` : ''}`);
}

/** Cor de destaque da linhagem (borda do selo; o fundo do retrato da origem usa a mesma). */
export const CLAN_COLORS: Record<string, string> = {
  common: '#f28c28',
  uchiha: '#d1232a',
  hyuuga: '#9d93c7',
  nara: '#6f8f3a',
  akimichi: '#e0582b',
  yamanaka: '#b77ad8',
  aburame: '#4f7a45',
  inuzuka: '#c0392b',
  uzumaki: '#e2482f',
  taijutsuProdigy: '#3fa34d',
  senju: '#2fa36b',
};

export const VILLAGE_IDS = Object.keys(VILLAGES) as (keyof typeof VILLAGES)[];
export const villageCrest = (id: keyof typeof VILLAGES): string => svg(VILLAGES[id], '0 0 24 24', 'ico crest');

/**
 * Mapa único das artes de `img/cenas/` (docs/visual.md, "Vagas de ilustração"): a chave que o código usa → o arquivo
 * (sem extensão) e o **foco** da arte, em % da imagem (onde estão os rostos). É o único lugar com nome de arquivo e com
 * enquadramento; a interface pede pela chave e a moldura (.art-frame, styles/art.css) corta em volta do foco. Sem
 * entrada, a chave é o próprio nome do arquivo e o foco é o centro, um pouco acima (`DEFAULT_FOCUS`). Um vídeo com o
 * mesmo nome do arquivo vira a versão animada.
 */
export interface SceneArt { file?: string; focus?: readonly [x: number, y: number] }
const DEFAULT_FOCUS: readonly [number, number] = [50, 35];
export const SCENE_ART: Record<string, SceneArt> = {
  portao: { focus: [66, 48] },
  // Os pôsteres pertencem à escolha da perspectiva da História.
  'perspectiva-naruto': { file: 'dia', focus: [64, 62] },
  'perspectiva-sasuke': { file: 'noite', focus: [30, 58] },
  // Entrada da Jornada e card do modo: o time 7, com o Naruto à direita.
  'jornada': { focus: [62, 46] },
  'modo-jornada': { focus: [50, 50] },
  'modo-roleta': { focus: [50, 50] },
  // Arcos da História do Naruto, pelo id do estágio (src/data/jornada/stages.ts).
  'arco-waves': { file: 'waves', focus: [62, 34] },
  'arco-exam': { file: 'chunnin', focus: [50, 58] },
  'arco-sannin': { file: 'sannin', focus: [50, 30] },
  'arco-retrieval': { file: 'sasuke', focus: [26, 40] },
  // A rota ilustra o modo. O pôster da preparação conserva seu enquadramento.
  'caminho-ninja': { focus: [50, 30] },
  'modo-caminho': { focus: [50, 50] },
  // Roleta no PC (todas opcionais; sem imagem, vale o cenário desenhado): palco do sorteio e uma por categoria de vilão.
  'roleta-boss': { file: 'roleta-chefe' },
};
const sceneFile = (key: string): string => SCENE_ART[key]?.file ?? key;
const sceneFocus = (key: string): readonly [number, number] => SCENE_ART[key]?.focus ?? DEFAULT_FOCUS;

/** Ilustração do jogador para a chave (ver `SCENE_ART`), se existir. */
export function sceneImage(name: string): string | null {
  const image = customImage('cenas', sceneFile(name));
  // O SVG de amostra contém instruções de substituição. Sem a pintura, vale a cena de Konoha do CSS.
  const sample = name === 'portao' || name === 'modo-jornada' || name === 'modo-roleta';
  return sample && image?.endsWith('.svg') ? null : image;
}

/** Vídeo próprio (`img/<pasta>/<nome>.webm|mp4`), se existir: a versão animada de uma vaga. */
function customVideo(folder: string, name: string): string | null {
  for (const ext of ['webm', 'mp4']) {
    const path = `img/${folder}/${name}.${ext}`;
    if (IMAGES.includes(path)) return path;
  }
  return null;
}

/** Modo das cenas: Leve (imagem parada, padrão) ou Animado (vídeo em loop, quando a vaga tem). */
let animatedScenes = false;


function sceneInner(name: string): string {
  const img = sceneImage(name);
  const video = customVideo('cenas', sceneFile(name));
  if (video && animatedScenes && !prefersStill()) {
    return `<video src="${video}" autoplay muted loop playsinline preload="metadata"${img ? ` poster="${img}"` : ''} aria-hidden="true"></video>`;
  }
  if (!img) return '';
  const fallback = name === 'portao' ? ' onerror="this.remove()"' : '';
  return `<img src="${img}" alt=""${fallback}>`;
}

/**
 * Ilustração de uma vaga de `cenas/` no modo atual: a imagem (Leve) ou o vídeo (Animado), num invólucro que o
 * `applySceneMode` redesenha. Sem imagem nem vídeo, `null` (quem chama usa o desenho próprio).
 */
export function sceneMedia(name: string): string | null {
  const inner = sceneInner(name);
  return inner ? `<span class="scene-media" data-scene="${name}" style="${sceneVars(name)}">${inner}</span>` : null;
}

/**
 * Forma e foco da arte de uma vaga, como variáveis de estilo: `--ratio` (largura / altura, lida no build) e
 * `--fx`/`--fy` (o foco do `SCENE_ART`). Vão no invólucro da arte e em quem precisa da forma para se compor (o card).
 */
export function sceneVars(name: string): string {
  const img = sceneImage(name);
  const size = img ? IMAGE_META[img] : undefined;
  const [fx, fy] = sceneFocus(name);
  return `${size ? `--ratio:${(size[0] / size[1]).toFixed(3)};` : ''}--fx:${fx}%;--fy:${fy}%`;
}

/**
 * Camada da cena viva (styles/art.css, `.scene-fx`): névoa, folhas e vaga-lumes sobre a arte de um painel grande. O CSS
 * só a monta no modo Animado. A arte define folhas ou vaga-lumes.
 * Vai ao lado do invólucro da arte, nunca dentro (o `applySceneMode` reescreve o invólucro).
 */
export function sceneFx(mode: 'day' | 'night' = 'night'): string {
  const bits = (cls: string, n: number) => Array.from({ length: n }, () => `<i class="${cls}"></i>`).join('');
  const particles = mode === 'day' ? bits('scene-leaf', 7) : bits('scene-fly', 9);
  return `<span class="scene-fx" aria-hidden="true">${bits('scene-mist', 2)}<span class="scene-fx-set">${particles}</span></span>`;
}

/** Arte do arco (estágio) da História, ou a vaga com o id do estágio (Caminho Ninja: g1, g2, g3). */
export const arcMedia = (stageId: string): string | null => sceneMedia(`arco-${stageId}`) ?? sceneMedia(stageId);

/**
 * Reserva para o que o build não mede (vídeo, imagem de formato desconhecido): ao carregar, a proporção vai em
 * `--ratio` no invólucro da arte e no contêiner que a enquadra. As imagens já nascem com ela (`sceneVars`).
 */
export function installSceneRatios(): void {
  if (typeof document === 'undefined') return;
  const HOSTS = '.mode-card, .gate-hero, .jc-panel, .jarc, .jarc-fan-i, .jthumb, .rmap-art, .rstage, .rarena-art';
  const mark = (el: HTMLElement, w: number, h: number) => {
    if (!w || !h) return;
    const ratio = (w / h).toFixed(3);
    el.closest<HTMLElement>('[data-scene]')?.style.setProperty('--ratio', ratio);
    (el.closest<HTMLElement>(HOSTS) ?? el.parentElement)?.style.setProperty('--ratio', ratio);
  };
  document.addEventListener('load', (e) => {
    const t = e.target;
    if (t instanceof HTMLImageElement && t.closest('[data-scene]')) mark(t, t.naturalWidth, t.naturalHeight);
  }, true);
  document.addEventListener('loadedmetadata', (e) => {
    const t = e.target;
    if (t instanceof HTMLVideoElement && t.closest('[data-scene]')) mark(t, t.videoWidth, t.videoHeight);
  }, true);
}

/** Troca o modo e redesenha as cenas que estão na tela, sem recarregar. */
export function applySceneMode(animated: boolean): void {
  animatedScenes = animated;
  if (typeof document === 'undefined') return;
  document.querySelectorAll<HTMLElement>('[data-scene]').forEach((el) => {
    el.innerHTML = sceneInner(el.dataset.scene!);
  });
}

/** Nuvem em espiral (ornamento), desenho próprio. */
export const cloud = (): string =>
  svg(
    '<path d="M10 62C1 62 0 49 10 47c-4-13 11-21 21-13 2-16 25-20 33-6 8-14 31-12 33 4 10-8 27-2 23 10 14 0 20 15 10 20z" fill="#efe3c7" stroke="#6b4a2a" stroke-width="3" stroke-linejoin="round"/>' +
      '<g fill="none" stroke="#6b4a2a" stroke-width="2.4" stroke-linecap="round"><path d="M41 47a7 7 0 1 1 7 7 3.5 3.5 0 0 1-3.5-3.5"/><path d="M80 43a8 8 0 1 0-8 8 4 4 0 0 0 4-4"/><path d="M107 53a5 5 0 1 1 5 5"/></g>',
    '0 0 144 70',
    'cloud',
  );

/** Emblema do card de modo quando não há ilustração: a Folha (Jornada) ou a espiral (Roleta). */
export function emblem(mode: 'jornada' | 'roleta'): string {
  const swirl = '<path d="M12 12.6a1.4 1.4 0 1 1 1.4-1.4 2.8 2.8 0 0 1-2.8 2.8 4.2 4.2 0 0 1-4.2-4.2 5.6 5.6 0 0 1 5.6-5.6 7 7 0 0 1 7 7 8.4 8.4 0 0 1-8.4 8.4"/>';
  return svg(mode === 'jornada' ? VILLAGES.leaf : swirl, '0 0 24 24', 'emblem');
}

// ---------------------------------------------------------------------------
// Retratos. Os desenhos ficam em prototype/portraits/ (um por personagem); aqui só o invólucro e a troca por imagem.

/** O SVG do retrato da chave; sem desenho, o da reserva. */
const portraitSvg = (key: string, fallback: string): string =>
  svg(portraitArt(key) ?? portraitArt(fallback)!, '0 0 100 100', 'art');

/** Silhuetas dos WebPs dos avatares, em coordenadas relativas ao retrato quadrado. */
export const AVATAR_CUTS: Readonly<Record<string, string>> = {
  common: 'polygon(40% 0%, 51% 0%, 53% 1%, 54% 0%, 59% 4%, 61% 0%, 63% 3%, 63% 6%, 70% 8%, 72% 9%, 71% 10%, 73% 13%, 78% 11%, 74% 16%, 79% 21%, 80% 21%, 76% 23%, 78% 25%, 78% 28%, 76% 28%, 76% 30%, 78% 33%, 75% 33%, 75% 37%, 79% 40%, 83% 47%, 78% 45%, 75% 45%, 76% 56%, 76% 57%, 69% 49%, 69% 54%, 68% 53%, 67% 54%, 66% 57%, 65% 57%, 64% 60%, 71% 63%, 75% 66%, 74% 78%, 77% 81%, 93% 88%, 98% 99%, 0% 99%, 1% 85%, 6% 81%, 21% 76%, 23% 72%, 23% 61%, 33% 59%, 31% 56%, 30% 57%, 30% 54%, 28% 54%, 28% 50%, 26% 46%, 24% 46%, 24% 41%, 24% 41%, 21% 42%, 23% 39%, 19% 39%, 21% 37%, 21% 34%, 20% 34%, 18% 36%, 19% 31%, 17% 31%, 16% 29%, 19% 28%, 20% 25%, 19% 24%, 18% 26%, 19% 23%, 16% 19%, 19% 20%, 23% 17%, 23% 14%, 21% 16%, 20% 15%, 26% 10%, 25% 9%, 27% 9%, 24% 6%, 34% 6%, 34% 2%, 37% 4%, 44% 3%, 43% 1%, 39% 1%)',
  nara: 'polygon(0% 90%, 5% 83%, 13% 76%, 21% 73%, 21% 63%, 24% 58%, 32% 55%, 27% 46%, 26% 42%, 27% 38%, 25% 34%, 26% 26%, 29% 18%, 36% 12%, 49% 7%, 57% 7%, 61% 2%, 64% 0%, 70% 0%, 66% 4%, 78% 0%, 73% 5%, 84% 3%, 78% 8%, 87% 9%, 82% 14%, 85% 20%, 77% 20%, 80% 27%, 73% 25%, 70% 21%, 71% 32%, 68% 37%, 71% 40%, 69% 48%, 65% 50%, 65% 54%, 72% 52%, 77% 55%, 81% 72%, 89% 77%, 98% 84%, 100% 86%, 100% 100%, 0% 100%)',
  akimichi: 'polygon(0% 71%, 5% 65%, 10% 63%, 5% 65%, 7% 58%, 2% 60%, 5% 53%, 2% 48%, 6% 50%, 3% 43%, 6% 45%, 9% 39%, 7% 39%, 12% 33%, 7% 28%, 11% 30%, 8% 25%, 15% 27%, 21% 21%, 16% 20%, 14% 16%, 18% 18%, 23% 15%, 21% 13%, 29% 11%, 21% 8%, 27% 7%, 34% 9%, 33% 5%, 35% 1%, 37% 5%, 44% 2%, 55% 2%, 59% 4%, 59% 0%, 63% 3%, 66% 7%, 65% 9%, 70% 9%, 74% 13%, 70% 12%, 74% 15%, 79% 13%, 80% 9%, 81% 15%, 80% 20%, 84% 21%, 89% 19%, 88% 24%, 86% 29%, 89% 33%, 92% 40%, 88% 38%, 90% 43%, 88% 45%, 93% 46%, 89% 51%, 85% 52%, 89% 55%, 84% 58%, 87% 64%, 82% 63%, 84% 67%, 91% 70%, 100% 76%, 100% 100%, 0% 100%)',
  yamanaka: 'polygon(58% 0%, 78% 1%, 83% 8%, 84% 14%, 90% 23%, 91% 34%, 89% 40%, 89% 44%, 91% 45%, 93% 53%, 93% 63%, 91% 63%, 92% 66%, 91% 66%, 91% 67%, 89% 72%, 89% 86%, 94% 88%, 96% 98%, 98% 99%, 1% 99%, 3% 94%, 4% 87%, 23% 82%, 25% 79%, 26% 71%, 29% 69%, 26% 55%, 24% 52%, 23% 59%, 22% 54%, 22% 47%, 20% 44%, 20% 41%, 19% 40%, 18% 41%, 18% 40%, 19% 31%, 21% 31%, 19% 29%, 19% 26%, 23% 16%, 31% 8%, 38% 3%, 50% 1%, 57% 5%)',
  aburame: 'polygon(0% 90%, 4% 86%, 4% 84%, 14% 79%, 12% 73%, 13% 65%, 16% 63%, 18% 54%, 13% 59%, 16% 48%, 10% 50%, 14% 44%, 23% 39%, 22% 35%, 18% 36%, 20% 32%, 17% 33%, 20% 29%, 16% 26%, 18% 23%, 16% 18%, 18% 19%, 18% 13%, 21% 15%, 21% 9%, 23% 11%, 27% 5%, 30% 5%, 28% 2%, 33% 4%, 34% 1%, 41% 0%, 64% 0%, 68% 4%, 71% 2%, 71% 6%, 77% 6%, 75% 10%, 80% 11%, 78% 14%, 82% 16%, 80% 20%, 83% 22%, 80% 25%, 82% 28%, 79% 30%, 81% 33%, 77% 34%, 77% 38%, 72% 39%, 73% 45%, 70% 51%, 77% 50%, 82% 53%, 80% 61%, 83% 64%, 84% 69%, 82% 77%, 91% 80%, 100% 88%, 100% 100%, 0% 100%)',
  inuzuka: 'polygon(0% 71%, 5% 68%, 2% 67%, 7% 64%, 4% 63%, 9% 61%, 5% 59%, 13% 58%, 16% 59%, 13% 55%, 18% 56%, 14% 52%, 16% 45%, 10% 51%, 12% 41%, 9% 45%, 12% 36%, 17% 30%, 11% 34%, 17% 25%, 12% 29%, 18% 21%, 20% 19%, 17% 18%, 23% 15%, 19% 15%, 25% 10%, 22% 9%, 29% 7%, 26% 4%, 34% 5%, 41% 2%, 45% 2%, 48% 0%, 64% 0%, 70% 3%, 73% 10%, 78% 14%, 75% 14%, 81% 21%, 78% 20%, 83% 28%, 81% 28%, 84% 35%, 87% 36%, 83% 38%, 85% 45%, 81% 42%, 85% 51%, 81% 48%, 83% 56%, 80% 54%, 78% 59%, 84% 58%, 83% 61%, 91% 60%, 88% 63%, 97% 65%, 92% 66%, 98% 71%, 95% 72%, 100% 76%, 97% 77%, 100% 81%, 98% 82%, 100% 89%, 100% 100%, 0% 100%)',
  taijutsuProdigy: 'polygon(0% 78%, 4% 73%, 9% 71%, 11% 68%, 14% 68%, 16% 66%, 23% 66%, 26% 55%, 29% 53%, 35% 51%, 33% 46%, 30% 46%, 28% 41%, 27% 36%, 24% 33%, 23% 30%, 21% 25%, 22% 19%, 23% 15%, 27% 11%, 25% 9%, 30% 8%, 34% 5%, 42% 2%, 45% 0%, 59% 0%, 63% 2%, 64% 6%, 66% 5%, 71% 8%, 74% 13%, 77% 20%, 75% 26%, 72% 32%, 72% 37%, 72% 41%, 68% 46%, 66% 47%, 66% 52%, 72% 54%, 78% 59%, 79% 70%, 90% 74%, 93% 80%, 96% 86%, 100% 89%, 100% 100%, 0% 100%)',
  uchiha: 'polygon(35% 0%, 53% 0%, 59% 3%, 60% 2%, 59% 0%, 62% 2%, 63% 6%, 69% 7%, 70% 8%, 68% 9%, 74% 15%, 76% 15%, 72% 18%, 76% 23%, 73% 23%, 74% 28%, 76% 31%, 73% 31%, 74% 36%, 72% 33%, 71% 34%, 72% 39%, 71% 38%, 70% 38%, 70% 43%, 68% 45%, 68% 48%, 66% 49%, 66% 51%, 77% 52%, 76% 69%, 78% 70%, 81% 73%, 91% 77%, 93% 79%, 98% 93%, 99% 99%, 1% 99%, 7% 86%, 20% 79%, 23% 76%, 19% 61%, 26% 57%, 34% 54%, 34% 53%, 33% 53%, 31% 49%, 31% 51%, 31% 47%, 28% 44%, 26% 46%, 26% 49%, 24% 41%, 24% 41%, 21% 43%, 23% 38%, 22% 38%, 19% 41%, 19% 36%, 16% 36%, 19% 33%, 19% 28%, 18% 27%, 15% 29%, 14% 29%, 19% 19%, 14% 18%, 17% 18%, 22% 13%, 18% 9%, 23% 9%, 28% 6%, 23% 3%, 29% 3%, 36% 1%)',
  hyuuga: 'polygon(40% 0%, 61% 0%, 66% 3%, 71% 9%, 76% 26%, 78% 48%, 79% 53%, 79% 66%, 78% 70%, 78% 62%, 75% 73%, 71% 74%, 70% 76%, 75% 82%, 88% 88%, 96% 99%, 1% 99%, 0% 95%, 1% 94%, 1% 93%, 3% 91%, 3% 90%, 5% 86%, 9% 83%, 16% 81%, 19% 78%, 21% 79%, 23% 76%, 20% 66%, 20% 53%, 23% 37%, 23% 24%, 26% 15%, 29% 8%, 35% 3%)',
  uzumaki: 'polygon(43% 0%, 51% 0%, 53% 1%, 53% 0%, 56% 2%, 56% 4%, 62% 4%, 67% 9%, 68% 13%, 71% 15%, 73% 15%, 74% 14%, 71% 18%, 73% 21%, 73% 24%, 76% 25%, 73% 27%, 71% 29%, 75% 29%, 80% 32%, 85% 38%, 78% 39%, 80% 50%, 74% 46%, 71% 38%, 70% 44%, 69% 44%, 69% 42%, 68% 44%, 68% 46%, 71% 47%, 68% 48%, 69% 51%, 67% 51%, 71% 56%, 78% 56%, 81% 57%, 81% 60%, 78% 56%, 75% 57%, 79% 61%, 79% 66%, 76% 69%, 83% 71%, 93% 78%, 98% 88%, 99% 99%, 1% 99%, 1% 97%, 0% 98%, 6% 86%, 9% 83%, 22% 78%, 22% 71%, 21% 71%, 20% 73%, 20% 76%, 19% 71%, 26% 63%, 24% 62%, 22% 64%, 22% 63%, 25% 60%, 31% 59%, 33% 56%, 32% 53%, 29% 54%, 31% 52%, 28% 49%, 28% 53%, 26% 49%, 22% 49%, 24% 48%, 23% 43%, 21% 45%, 20% 47%, 20% 43%, 16% 43%, 19% 41%, 19% 36%, 18% 35%, 16% 39%, 16% 35%, 18% 32%, 14% 30%, 18% 29%, 19% 24%, 15% 22%, 14% 19%, 18% 20%, 20% 18%, 22% 14%, 21% 14%, 18% 16%, 18% 14%, 26% 9%, 23% 7%, 28% 7%, 29% 6%, 29% 3%, 31% 4%, 34% 5%, 34% 3%)',
  senju: 'polygon(0% 89%, 4% 86%, 7% 74%, 10% 69%, 14% 66%, 25% 61%, 29% 58%, 29% 54%, 34% 49%, 33% 44%, 30% 40%, 30% 33%, 27% 34%, 28% 30%, 23% 30%, 26% 25%, 21% 26%, 25% 20%, 22% 21%, 25% 16%, 23% 16%, 28% 12%, 26% 9%, 32% 9%, 30% 6%, 37% 7%, 34% 4%, 41% 4%, 42% 1%, 46% 3%, 46% 0%, 54% 3%, 58% 0%, 58% 4%, 64% 2%, 63% 5%, 67% 5%, 65% 8%, 70% 10%, 69% 11%, 72% 15%, 70% 15%, 72% 20%, 69% 20%, 71% 27%, 68% 25%, 67% 32%, 66% 36%, 66% 48%, 70% 48%, 72% 54%, 73% 60%, 81% 61%, 87% 67%, 92% 74%, 94% 82%, 97% 87%, 100% 87%, 100% 100%, 0% 100%)',
  naruto: 'polygon(47.4% 2.8%, 54% 7.2%, 60% 13%, 63.2% 9.6%, 66% 5.2%, 68% 16.4%, 76% 12%, 73.6% 22%, 81.8% 22.6%, 76.2% 29.2%, 80.2% 34.6%, 74.8% 34.8%, 75.8% 37.6%, 81% 37.4%, 84.4% 39.4%, 88% 43.6%, 83.6% 42.8%, 79.4% 43.4%, 76.6% 44.4%, 79.4% 47.4%, 81.4% 50.4%, 83.2% 55.2%, 78.4% 51.8%, 75.4% 50.4%, 73.4% 47.6%, 73% 46.6%, 73.2% 51%, 72.8% 54.6%, 71% 57.2%, 68.6% 59.4%, 68.2% 64%, 67.2% 62.8%, 66.4% 64.8%, 65.4% 64.2%, 64.6% 67.4%, 63.6% 66.6%, 63% 68.8%, 62.2% 67.4%, 61.8% 69.2%, 65% 67.8%, 68% 68.6%, 70.2% 69.4%, 71.4% 71%, 71.8% 77.6%, 72.4% 80.2%, 75% 81.8%, 81.6% 83.8%, 87.4% 86.6%, 91% 89.8%, 94.2% 95.2%, 96.2% 100%, 3.6% 100%, 5.8% 95%, 9% 90%, 12.6% 87%, 18% 84.2%, 24.6% 82%, 27.4% 80.4%, 28% 75.4%, 28.2% 71%, 29.6% 69.2%, 31.4% 68.4%, 34.8% 67.6%, 33.8% 64.4%, 33.4% 67.2%, 32% 63.4%, 31.2% 64%, 31.2% 59.8%, 29% 57.6%, 27.2% 54.6%, 26.4% 51.6%, 26.8% 47.8%, 27.6% 46.8%, 27.2% 43.8%, 24.6% 47.2%, 25% 41.8%, 21.2% 44.2%, 23% 39.2%, 24% 37.4%, 17.6% 39.6%, 20.4% 34.8%, 23.2% 30.8%, 14.8% 28.4%, 20.4% 24.4%, 26.4% 21.6%, 21.8% 13.6%, 27.6% 14.6%, 35.4% 14.8%, 32% 7.6%, 41.4% 9.6%, 46.4% 11.8%, 44.8% 8.6%, 48.6% 11%)',
  sasuke: 'polygon(74% 1%, 69% 10%, 86% 10%, 78% 19%, 76% 21%, 89% 28%, 82% 29%, 77% 32%, 83% 41%, 76% 39%, 76% 43%, 74% 42%, 74% 43%, 74% 53%, 71% 64%, 71% 62%, 70% 62%, 70% 68%, 75% 70%, 73% 84%, 76% 88%, 89% 93%, 93% 99%, 4% 99%, 9% 92%, 23% 87%, 25% 83%, 23% 74%, 23% 70%, 29% 67%, 28% 64%, 28% 63%, 27% 64%, 26% 58%, 24% 59%, 24% 61%, 23% 56%, 16% 59%, 16% 58%, 19% 48%, 23% 46%, 23% 36%, 25% 28%, 28% 23%, 36% 14%, 42% 11%, 57% 4%, 56% 7%, 57% 8%, 69% 4%)',
};

/** A mesma chave pode ser chamada como ninja na Jornada e como vilão no Roleta. */
export function portraitImage(key: string, folder: 'ninja' | 'viloes' = 'ninja'): string | null {
  return customImage(folder, key) ?? customImage(folder === 'ninja' ? 'viloes' : 'ninja', key);
}

/** O template deixa o desenho fora da tela até a imagem falhar, por exemplo ao jogar offline. */
const portraitImg = (src: string, fallback: string): string =>
  `<img src="${src}" alt="" onerror="this.replaceWith(this.nextElementSibling.content)"><template>${fallback}</template>`;

/** Retrato do vilão: imagem própria (img/viloes/<id>.webp) ou o desenho. */
export function villainPortrait(id: string, size: 'sm' | 'md' | 'lg' = 'md'): string {
  const img = portraitImage(id, 'viloes');
  const drawing = portraitSvg(id, 'examLeaf');
  const inner = img ? portraitImg(img, drawing) : drawing;
  return `<span class="portrait portrait-${size} villain-portrait">${inner}</span>`;
}

/**
 * Retrato de ninja: imagem própria (img/ninja/<chave>.webp ou img/ninja/ninja.webp) ou o desenho. A chave é uma
 * linhagem do jogador (o visual da origem) ou um personagem. Por enquanto o jinchūriki não muda o retrato.
 */
export function ninjaPortrait(lineageId: string | null, size: 'sm' | 'md' | 'lg' = 'sm'): string {
  const key = lineageId ?? 'common';
  const img = portraitImage(key) ?? customImage('ninja', 'ninja');
  const drawing = portraitSvg(key, 'common');
  const inner = img ? portraitImg(img, drawing) : drawing;
  return `<span class="portrait portrait-${size} ninja-portrait">${inner}</span>`;
}

/**
 * O personagem tem representação própria? Uma imagem em img/jornada/<id> ou um desenho dele (`villain:<id>` ou
 * `ninja:<chave>`). O ninja comum (`ninja:common`) é o genérico: não representa ninguém.
 */
export function hasOwnPortrait(defId: string, spec: string | undefined): boolean {
  return Boolean(customImage('jornada', defId)) || (spec !== undefined && spec !== 'ninja:common');
}

/**
 * Retrato de um lutador da Jornada: imagem própria (img/jornada/<id>.webp) ou o desenho indicado nos dados
 * (`villain:<id>` ou `ninja:<chave>`).
 */
export function fighterPortrait(defId: string, spec: string, size: 'sm' | 'md' | 'lg' = 'md'): string {
  const [kind, key = ''] = spec.split(':');
  const img = customImage('jornada', defId);
  if (img) {
    const drawing = portraitArt(key) && spec !== 'ninja:common' ? portraitSvg(key, key) : '';
    return `<span class="portrait portrait-${size}">${portraitImg(img, drawing)}</span>`;
  }
  return kind === 'villain' ? villainPortrait(key, size) : ninjaPortrait(key, size);
}
