// Arte do protótipo: retratos, símbolos de clã e ícones, todos em SVG desenhado à mão (originais, sem arte oficial).
// Imagens próprias em `public/img/` substituem os retratos: o build lista os arquivos em __IMAGES__.

declare const __IMAGES__: string[];
const IMAGES: readonly string[] = typeof __IMAGES__ === 'undefined' ? [] : __IMAGES__;
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
  gates: '<path d="M2 5h20M4 9h16" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M6 7v15M18 7v15M12 9v4" stroke="currentColor" stroke-width="2.4"/>',
  expansion: '<path d="M4 4h6M4 4v6M20 4h-6M20 4v6M4 20h6M4 20v-6M20 20h-6M20 20v-6" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/>',
  sharingan:
    '<circle cx="12" cy="12" r="10" fill="#b3151b"/><circle cx="12" cy="12" r="6" fill="none" stroke="#2a0507" stroke-width="1"/><circle cx="12" cy="12" r="2.4" fill="#120203"/><g fill="#120203"><circle cx="12" cy="6" r="1.6"/><circle cx="17.2" cy="15" r="1.6"/><circle cx="6.8" cy="15" r="1.6"/></g>',
  byakugan:
    '<circle cx="12" cy="12" r="10" fill="#ece8f6"/><circle cx="12" cy="12" r="5.5" fill="#d3cdea"/><g stroke="#9d93c7" stroke-width=".9"><path d="M2.5 9.5 6 10.5M2.5 14.5 6 13.5M21.5 9.5 18 10.5M21.5 14.5 18 13.5"/></g>',
  item: '<path d="M6 8h12l1.5 12.5a1 1 0 0 1-1 1.5h-13a1 1 0 0 1-1-1.5z" fill="currentColor"/><path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8 12h8" stroke="#0005" stroke-width="1.6"/>',
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
  timer: '<circle cx="12" cy="13" r="8.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 8.5V13l3 2M9.5 2h5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/>',
  heartbreak: '<path d="M12 21S3 15 3 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 2.5C21 15 12 21 12 21z" fill="currentColor"/><path d="m12 6-1.5 4 3 2.5-2 4" stroke="#0008" stroke-width="1.6" fill="none"/>',
  claw: '<path d="M5 21C5 13 7 7 11 3c-1.6 5-1.6 10 0 18zM11.5 21c0-8 2-13 6-16-1.6 5-1.6 10 0 16zM18 21c0-6 1.3-9 4-11-1 4-1 7 0 11z" fill="currentColor"/>',
  warning: '<path d="M12 2.5 22.5 21h-21z" fill="currentColor"/><path d="M12 9v6" stroke="#000a" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="18" r="1.3" fill="#000a"/>',
  intent: '<path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/>',
  dodge: '<path d="M14 4h6M11 9h10M14 14h6M3 19h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="6" cy="9" r="3" fill="currentColor"/>',
  clones: '<circle cx="8" cy="7" r="3.2" fill="currentColor"/><circle cx="16" cy="7" r="3.2" fill="currentColor" opacity=".6"/><path d="M2 21c0-5 2.7-8 6-8s6 3 6 8zM10 21c0-5 2.7-8 6-8s6 3 6 8z" fill="currentColor"/>',
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
  dice: '<rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor"/><g fill="#0008"><circle cx="8" cy="8" r="1.6"/><circle cx="16" cy="8" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="8" cy="16" r="1.6"/><circle cx="16" cy="16" r="1.6"/></g>',
  swords: '<path d="M4 3l9 9M20 3l-9 9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M7 16l-3 3M17 16l3 3M9 14l-4 4 2 2 4-4M15 14l4 4-2 2-4-4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  info: '<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 10.5V17" stroke="#000a" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="7.2" r="1.5" fill="#000a"/>',
};

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

const leafSpiral = spiral(11.5, 12.5, 3, 1.2);

const CLANS: Record<string, string> = {
  // Folha (comum): a folha com o redemoinho dentro.
  common: `<path d="M3.5 20.5C3.5 11 9.5 4.5 20.5 3.5 19.5 14.5 13 20.5 3.5 20.5z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="${leafSpiral.d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M3.5 20.5 7 17" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>`,
  // Uchiha: o leque.
  uchiha:
    '<path d="M4.5 10a7.5 7.5 0 0 1 15 0z" fill="#d1232a"/><path d="M4.5 10a7.5 7.5 0 0 0 15 0z" fill="#f5f1e6"/><rect x="10.8" y="16.5" width="2.4" height="6" rx="1" fill="#f5f1e6"/><circle cx="12" cy="10" r="7.5" fill="none" stroke="#0006" stroke-width=".8"/>',
  // Hyuuga: o olho branco com veias.
  hyuuga:
    '<path d="M1.5 12S6 4.5 12 4.5 22.5 12 22.5 12 18 19.5 12 19.5 1.5 12 1.5 12z" fill="#ece8f6"/><circle cx="12" cy="12" r="4.4" fill="#cfc8e8"/><circle cx="12" cy="12" r="1.4" fill="#f9f8ff"/><path d="M3.5 9 7 10.6M3.5 15 7 13.4M20.5 9 17 10.6M20.5 15 17 13.4" stroke="#a197cc" stroke-width="1"/>',
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
  // Inuzuka: pegada.
  inuzuka:
    '<g fill="#c0392b"><ellipse cx="12" cy="16" rx="5.2" ry="4.5"/><ellipse cx="5" cy="10.5" rx="2.2" ry="2.8"/><ellipse cx="9.3" cy="6" rx="2.2" ry="2.9"/><ellipse cx="14.7" cy="6" rx="2.2" ry="2.9"/><ellipse cx="19" cy="10.5" rx="2.2" ry="2.8"/></g>',
  // Uzumaki: redemoinho.
  uzumaki: `<circle cx="12" cy="12" r="10.5" fill="#d1232a"/><path d="${spiral(12, 12, 4, 1.05).d}" fill="none" stroke="#fff3e6" stroke-width="1.8" stroke-linecap="round"/>`,
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

/** Cor de destaque da linhagem (fundo do retrato, borda do selo). */
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
};

// ---------------------------------------------------------------------------
// Retratos (100×100). Busto com fundo de cena; traços marcantes de cada vilão.

const SKIN = '#f1c9a0';
const PALE = '#ece5d8';

interface Face {
  skin?: string;
  /** Olhos: 'normal', 'narrow' (estreitos), 'ringed' (olheiras escuras), 'snake' (fenda amarela). */
  eyes?: 'normal' | 'narrow' | 'ringed' | 'snake' | 'closed';
  eyeColor?: string;
  mouth?: 'neutral' | 'smirk' | 'grin' | 'none';
}

/** Fundo da cena: gradiente radial com um brilho. */
function scene(id: string, from: string, to: string, extra = ''): string {
  return `<defs><radialGradient id="bg-${id}" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></radialGradient></defs>
    <rect width="100" height="100" fill="url(#bg-${id})"/>${extra}`;
}

/** Ombros e pescoço. */
function body(outfit: string, skin = SKIN, collar = ''): string {
  return `<path d="M42 66h16v12H42z" fill="${skin}"/><path d="M8 100c2-17 16-27 42-27s40 10 42 27z" fill="${outfit}"/>${collar}`;
}

function head(f: Face = {}): string {
  const skin = f.skin ?? SKIN;
  const ec = f.eyeColor ?? '#1b1b22';
  let eyes = '';
  switch (f.eyes ?? 'normal') {
    case 'normal':
      eyes = `<path d="M36 46q5-4 10 0q-5 3-10 0zM54 46q5-4 10 0q-5 3-10 0z" fill="#fff"/><circle cx="41" cy="46" r="2.3" fill="${ec}"/><circle cx="59" cy="46" r="2.3" fill="${ec}"/>`;
      break;
    case 'narrow':
      eyes = `<path d="M35 46l11-1.5-1 2.6zM65 46l-11-1.5 1 2.6z" fill="${ec}"/>`;
      break;
    case 'ringed':
      eyes = `<ellipse cx="41" cy="46" rx="7" ry="5.5" fill="#1a1012"/><ellipse cx="59" cy="46" rx="7" ry="5.5" fill="#1a1012"/><path d="M37 46q4-3 8 0q-4 2.5-8 0zM55 46q4-3 8 0q-4 2.5-8 0z" fill="#e8f2ee"/><circle cx="41" cy="46" r="1.7" fill="${ec}"/><circle cx="59" cy="46" r="1.7" fill="${ec}"/>`;
      break;
    case 'snake':
      eyes = `<path d="M34 44q6-6 13 0q-6 5-13 0zM53 44q7-6 13 0q-7 5-13 0z" fill="#7a4a9e"/><path d="M36 45q5-3.5 9 0q-4.5 3-9 0zM55 45q4.5-3.5 9 0q-4.5 3-9 0z" fill="#e8c23a"/><path d="M40.5 42.8v4.4M59.5 42.8v4.4" stroke="#111" stroke-width="1.4"/>`;
      break;
    case 'closed':
      eyes = '<path d="M36 46q5 3 10 0M54 46q5 3 10 0" stroke="#1b1b22" stroke-width="1.6" fill="none"/>';
      break;
  }
  const mouth = {
    neutral: '<path d="M45 60h10" stroke="#6b3a2a" stroke-width="1.6" stroke-linecap="round"/>',
    smirk: '<path d="M44 60q6 1.5 12-2" stroke="#6b3a2a" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
    grin: '<path d="M43 58q7 6 14 0z" fill="#fff" stroke="#6b3a2a" stroke-width="1.2"/>',
    none: '',
  }[f.mouth ?? 'neutral'];
  return `<ellipse cx="50" cy="48" rx="17" ry="20" fill="${skin}"/>${eyes}${mouth}`;
}

/** Bandana com a placa de metal e o símbolo da vila. */
function headband(symbol: 'leaf' | 'mist' | 'sand' | 'sound', cloth = '#24324f', slash = false, y = 31): string {
  const sym = {
    leaf: `<path d="M48 ${y + 4.5}a1 1 0 0 1 2 0a2 2 0 0 1-4 0a3 3 0 0 1 6 0" fill="none" stroke="#6c7383" stroke-width="1.1"/><path d="M46 ${y + 4.5}l-3-3" stroke="#6c7383" stroke-width="1.1"/>`,
    mist: `<path d="M44 ${y + 2.5}q2-1.5 4 0t4 0M44 ${y + 4.5}q2-1.5 4 0t4 0M44 ${y + 6.5}q2-1.5 4 0t4 0" fill="none" stroke="#6c7383" stroke-width="1"/>`,
    sand: `<path d="M44.5 ${y + 1.5}h11l-4 3.5 4 3.5h-11l4-3.5z" fill="none" stroke="#6c7383" stroke-width="1.1"/>`,
    sound: `<path d="M51.5 ${y + 1.5}v5.5" stroke="#6c7383" stroke-width="1.3"/><ellipse cx="49.6" cy="${y + 7}" rx="2" ry="1.5" fill="#6c7383"/><path d="M51.5 ${y + 1.5}l3 1.5" stroke="#6c7383" stroke-width="1.3"/>`,
  }[symbol];
  return `<path d="M32 ${y}q18-5 36 0v8q-18-5-36 0z" fill="${cloth}"/><rect x="40" y="${y - 0.5}" width="20" height="10" rx="2" fill="#c9d1dc" stroke="#7d8696" stroke-width=".8"/>${sym}${slash ? `<path d="M41 ${y + 9}l18-9" stroke="#5a6170" stroke-width="1.4"/>` : ''}`;
}

/** Corda roxa dos guardas do Som (laço na frente). */
const rope = '<path d="M20 92q30 -8 60 0" stroke="#6a3f8f" stroke-width="5" fill="none"/><path d="M50 88l-7 8 7-3 7 3z" fill="#6a3f8f"/>';

const PORTRAITS: Record<string, () => string> = {
  mizuki: () =>
    scene('mizuki', '#4f6b3a', '#141d10',
      // Shuriken gigante atrás.
      '<g transform="translate(72 30) rotate(20)" fill="#8e98a8" stroke="#3e4552" stroke-width="1"><path d="M0-22 5-5 22 0 5 5 0 22-5 5-22 0-5-5z"/><circle r="4" fill="#2a2f3a"/></g>') +
    // Cabelo claro comprido.
    '<path d="M30 46c-4 14-2 28 4 38h32c6-10 8-24 4-38z" fill="#a9c0d3"/>' +
    body('#5f7a3a', SKIN, '<path d="M30 76c6 8 34 8 40 0l-4 24H34z" fill="#4d6630"/><path d="M38 74h24l-3 8H41z" fill="#2c3a4f"/>') +
    head({ eyes: 'narrow', mouth: 'smirk' }) +
    '<path d="M32 40c2-14 10-21 18-21s16 7 18 21c-6-6-12-8-18-8s-12 2-18 8z" fill="#bcd1e1"/>' +
    headband('leaf'),
  zabuza: () =>
    scene('zabuza', '#56697a', '#10161c',
      // Espadão (Kubikiribōchō) na diagonal.
      '<g transform="rotate(-28 50 50)"><rect x="56" y="-6" width="26" height="78" rx="2" fill="#b9c2cc" stroke="#4a5360" stroke-width="1.4"/><circle cx="74" cy="6" r="5" fill="#56697a"/><path d="M56 6h6" stroke="#4a5360" stroke-width="1"/><rect x="62" y="70" width="6" height="22" fill="#4a3a2a"/></g>') +
    body('#5a6672', '#e3cdb3', '<path d="M22 84l56-10M22 92l56-10" stroke="#3a3f46" stroke-width="3"/>') +
    head({ skin: '#e3cdb3', eyes: 'narrow', mouth: 'none' }) +
    // Bandagens no rosto.
    '<path d="M33 50q17 4 34 0v18q-17 10-34 0z" fill="#e6e1d6"/><path d="M34 55q16 3 32 0M34 60q16 3 32 0M35 65q15 3 30 0" stroke="#b8b1a2" stroke-width="1" fill="none"/>' +
    '<path d="M33 38c1-12 8-18 17-18s16 6 17 18l-4-5-3 4-4-6-4 5-4-6-3 6-4-4z" fill="#22252b"/>' +
    `<g transform="rotate(-10 50 34)">${headband('mist', '#3d4a5a', false)}</g>`,
  haku: () =>
    scene('haku', '#7cc8e0', '#0e2a36',
      // Espelhos de gelo.
      '<g fill="#d8f3fb" fill-opacity=".5" stroke="#eafaff" stroke-width=".8"><rect x="4" y="8" width="18" height="28" rx="1"/><rect x="78" y="10" width="18" height="28" rx="1"/><rect x="2" y="52" width="16" height="26" rx="1"/><rect x="82" y="54" width="16" height="26" rx="1"/></g>') +
    // Cabelo longo escuro.
    '<path d="M28 40c-3 18-2 34 4 48h36c6-14 7-30 4-48z" fill="#1d2129"/>' +
    body('#2f5a4a', SKIN, '<path d="M40 74l10 12 10-12" stroke="#c9d6cf" stroke-width="3" fill="none"/>') +
    head({ mouth: 'none' }) +
    // Máscara de caçador.
    '<ellipse cx="50" cy="48" rx="17.5" ry="20.5" fill="#f4f4f2"/><path d="M36 46q5-3 10 0M54 46q5-3 10 0" stroke="#222" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M38 52q-2 6 0 10M62 52q2 6 0 10" stroke="#c0392b" stroke-width="1.6" fill="none"/><path d="M45 34q2.5-1.5 5 0t5 0M45 37q2.5-1.5 5 0t5 0" stroke="#8a929e" stroke-width="1" fill="none"/>' +
    '<path d="M32 42c0-16 8-23 18-23s18 7 18 23c-4-8-10-12-18-12s-14 4-18 12z" fill="#1d2129"/>',
  gaara: () =>
    scene('gaara', '#d8a75e', '#3b2410',
      // Cabaça de areia atrás.
      '<g><ellipse cx="74" cy="66" rx="20" ry="22" fill="#c9a06a" stroke="#7a5a33" stroke-width="1.4"/><ellipse cx="74" cy="34" rx="12" ry="11" fill="#c9a06a" stroke="#7a5a33" stroke-width="1.4"/><rect x="69" y="18" width="10" height="7" rx="2" fill="#a5794a"/></g><g fill="#f3d9a6" opacity=".55"><circle cx="16" cy="20" r="1.2"/><circle cx="24" cy="70" r="1"/><circle cx="12" cy="48" r=".9"/></g>') +
    body('#7a2a24', '#f3d9c1', '<path d="M18 80l64 18" stroke="#3a2a1c" stroke-width="5"/>') +
    head({ skin: '#f3d9c1', eyes: 'ringed', eyeColor: '#4bb3a0', mouth: 'neutral' }) +
    // Kanji do amor na testa e cabelo ruivo espetado.
    '<text x="35" y="38" font-size="8" fill="#c0392b" font-weight="700" font-family="serif">愛</text>' +
    '<path d="M31 42c-2-6-1-12 2-16l-4-4 7 1 1-7 5 5 4-8 4 7 5-6 2 7 7-3-3 7 6 2-5 4c2 4 3 7 2 11-2-6-8-10-17-10s-14 4-16 10z" fill="#b3261e"/>',
  jirobo: () =>
    scene('jirobo', '#8a6a3c', '#24170a',
      '<g fill="#5e4524" opacity=".7"><path d="M0 80l14-18 10 10 8-14 14 22z"/><path d="M60 82l12-16 10 8 8-12 10 20z"/></g>') +
    // Corpo largo.
    '<path d="M0 100c0-20 18-34 50-34s50 14 50 34z" fill="#d6c49a"/><path d="M40 64h20v10H40z" fill="#e8b98a"/>' +
    rope +
    '<ellipse cx="50" cy="50" rx="21" ry="20" fill="#e8b98a"/><path d="M38 47l8-1M54 46l8 1" stroke="#1b1b22" stroke-width="2.4" stroke-linecap="round"/><path d="M44 60q6 3 12 0" stroke="#6b3a2a" stroke-width="1.8" fill="none"/>' +
    // Topete laranja em tufos.
    '<path d="M36 34l4-10 4 7 4-10 4 10 4-8 4 11c-6-3-18-3-24 0z" fill="#e07a24"/>',
  kidomaru: () =>
    scene('kidomaru', '#3e4630', '#121509',
      // Teia de aranha.
      '<g stroke="#e9eadf" stroke-opacity=".35" stroke-width=".8" fill="none"><path d="M0 0l40 40M100 0 60 40M0 100l40-60M100 100 60 40M50 0v40"/><path d="M18 18q32-10 64 0M8 34q42-10 84 0M6 54q44-8 88 0"/></g>') +
    // Seis braços.
    '<g fill="#a0704a" stroke="#5b3d24" stroke-width="1"><path d="M22 82 4 60l5-3 18 20z"/><path d="M78 82l18-22-5-3-18 20z"/><path d="M20 92 2 84l2-5 18 8z"/><path d="M80 92l18-8-2-5-18 8z"/></g>' +
    '<path d="M50 20c-12 0-18 8-18 18 0 0 6-6 18-6s18 6 18 6c0-10-6-18-18-18zM64 28c8 2 14 10 12 22l-6-12z" fill="#3a2a1e"/>' +
    body('#d6c49a', '#a0704a') + rope +
    head({ skin: '#a0704a', eyes: 'narrow', mouth: 'grin' }) +
    '<path d="M32 40c1-12 8-19 18-19s17 7 18 19c-5-5-11-7-18-7s-13 2-18 7z" fill="#3a2a1e"/><circle cx="44" cy="30" r="1.3" fill="#c0392b"/><circle cx="56" cy="30" r="1.3" fill="#c0392b"/>',
  tayuya: () =>
    scene('tayuya', '#6e2a4d', '#1a0a14',
      '<g fill="#f2c4dc" opacity=".35"><path d="M10 22q4-4 8 0M78 18q4-4 8 0M14 62q4-4 8 0"/></g>') +
    // Cabelo rosa longo.
    '<path d="M28 42c-6 18-6 36 0 52h44c6-16 6-34 0-52z" fill="#d6527a"/>' +
    body('#d6c49a', SKIN) + rope +
    head({ eyes: 'narrow', mouth: 'smirk' }) +
    '<path d="M33 42c1-12 8-18 17-18s16 6 17 18c-4-5-9-8-17-8s-13 3-17 8z" fill="#e2648c"/>' +
    // Chapéu preto e flauta.
    '<path d="M24 32q26-8 52 0l-3 4q-23-6-46 0z" fill="#1a1416"/><path d="M34 31q2-12 16-12t16 12z" fill="#1a1416"/>' +
    '<rect x="30" y="59" width="44" height="3.6" rx="1.8" fill="#d9dde3" stroke="#7d8696" stroke-width=".6"/><g fill="#7d8696"><circle cx="58" cy="60.8" r=".9"/><circle cx="63" cy="60.8" r=".9"/><circle cx="68" cy="60.8" r=".9"/></g>',
  sakon: () =>
    scene('sakon', '#4c6670', '#0f1a1e') +
    body('#d6c49a', '#e6dccd') + rope +
    // Segunda cabeça (Ukon) saindo do ombro.
    '<g transform="translate(24 -8) scale(.62)"><ellipse cx="50" cy="48" rx="17" ry="20" fill="#e6dccd"/><path d="M35 46l11-1.5-1 2.6zM65 46l-11-1.5 1 2.6z" fill="#1b1b22"/><path d="M44 60q6 1.5 12-2" stroke="#4a2a4a" stroke-width="2.4" fill="none"/><path d="M32 46c0-16 8-25 18-25s18 9 18 25c-3-9-8-14-14-15-4 6-10 10-22 15z" fill="#b6c2cc"/></g>' +
    head({ skin: '#e6dccd', eyes: 'narrow', mouth: 'smirk' }) +
    '<path d="M44 60q6 1.5 12-2" stroke="#4a2a4a" stroke-width="2" fill="none"/>' +
    '<path d="M32 50c-1-18 7-28 18-28s19 10 18 26c-3-9-8-14-14-15-4 7-11 12-22 17z" fill="#b6c2cc"/>',
  kabuto: () =>
    scene('kabuto', '#5a3d82', '#150b22') +
    // Rabo de cavalo grisalho.
    '<path d="M60 34c12 4 16 16 12 30l-6-14z" fill="#b8bcc6"/>' +
    body('#5b3d86', SKIN, '<path d="M34 74q16-8 32 0l-2 8q-14-5-28 0z" fill="#e8e4ee"/>') +
    head({ eyes: 'closed', mouth: 'smirk' }) +
    // Óculos redondos.
    '<g fill="#dfe8f5" fill-opacity=".35" stroke="#2a2a35" stroke-width="1.6"><circle cx="41" cy="46" r="6"/><circle cx="59" cy="46" r="6"/></g><path d="M47 46h6" stroke="#2a2a35" stroke-width="1.4"/><path d="M38 43l3-2M56 43l3-2" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>' +
    '<path d="M32 42c1-14 8-21 18-21s17 7 18 21c-2-4-6-8-12-9l-6 4-6-4c-6 1-10 5-12 9z" fill="#c9ccd4"/>' +
    headband('sound', '#24324f', false, 29),
  orochimaru: () =>
    scene('orochimaru', '#3a4a32', '#0b100a',
      // Cobra enrolada atrás.
      '<path d="M84 100c0-20-14-24-14-40 0-14 18-14 18-30 0-10-8-16-16-16" fill="none" stroke="#6a3f8f" stroke-width="10" stroke-linecap="round"/><path d="M84 100c0-20-14-24-14-40 0-14 18-14 18-30 0-10-8-16-16-16" fill="none" stroke="#8d5fb5" stroke-width="3" stroke-dasharray="2 5"/><circle cx="70" cy="14" r="7" fill="#6a3f8f"/><circle cx="68" cy="12.5" r="1.4" fill="#e8c23a"/>') +
    // Cabelo preto longo dos dois lados.
    '<path d="M28 38c-4 20-4 40 0 62h14V40zM72 38c4 20 4 40 0 62H58V40z" fill="#121214"/>' +
    body('#e7dfc8', PALE, '<path d="M40 74l10 14 10-14" stroke="#b8ad90" stroke-width="2" fill="none"/>') +
    rope +
    head({ skin: PALE, eyes: 'snake', mouth: 'smirk' }) +
    '<path d="M32 46c0-17 8-26 18-26s18 9 18 26c-3-9-9-15-18-15s-15 6-18 15z" fill="#121214"/>',
  examSand: () =>
    scene('examSand', '#c79a55', '#3b2410') +
    body('#8c6a44', SKIN, '<path d="M30 76q20 8 40 0l-2 24H32z" fill="#6f5233"/>') +
    // Capuz.
    '<path d="M28 52c-2-22 8-34 22-34s24 12 22 34l-5-10c-4-6-10-8-17-8s-13 2-17 8z" fill="#b89366"/>' +
    head({ eyes: 'narrow', mouth: 'neutral' }) +
    '<path d="M28 52c-2-22 8-34 22-34s24 12 22 34c-3-10-7-15-10-16H38c-3 1-7 6-10 16z" fill="#b89366"/>' +
    headband('sand', '#5a3d24', false, 30),
  examSound: () =>
    scene('examSound', '#58506e', '#14111e') +
    body('#3a3550', SKIN, '<path d="M28 82q22-10 44 0" stroke="#7a6f9a" stroke-width="3" fill="none"/>') +
    head({ eyes: 'normal', mouth: 'none' }) +
    // Bandagens cobrindo meio rosto.
    '<path d="M33 36q18-4 34 0l1 34q-14 6-17 0V36z" fill="#e6e1d6"/><path d="M52 42h15M52 50h15M52 58h15M52 66h12" stroke="#b8b1a2" stroke-width="1"/>' +
    '<path d="M33 38c0-12 8-18 17-18s17 6 17 18c-5-4-11-6-17-6s-12 2-17 6z" fill="#3a3a44"/>' +
    headband('sound', '#24324f', false, 28),
  examLeaf: () =>
    scene('examLeaf', '#5f7f45', '#121c0d',
      '<g fill="#8fb35a" opacity=".35"><path d="M10 20q8-6 12 2-8 4-12-2zM80 70q8-6 12 2-8 4-12-2z"/></g>') +
    body('#4a5a78', SKIN, '<path d="M30 76c6 8 34 8 40 0l-4 24H34z" fill="#5f7a3a"/>') +
    head({ eyes: 'normal', mouth: 'smirk' }) +
    '<path d="M31 42l-2-10 6 2 2-9 6 5 4-8 4 7 6-5 1 8 7-1-3 8c-5-5-11-7-18-7s-12 3-17 8z" fill="#5a3a22"/>' +
    headband('leaf'),
};

/** Retrato do vilão: imagem própria (img/viloes/<id>.webp) ou o desenho. */
export function villainPortrait(id: string, size: 'sm' | 'md' | 'lg' = 'md'): string {
  const img = customImage('viloes', id);
  const inner = img
    ? `<img src="${img}" alt="">`
    : svg((PORTRAITS[id] ?? PORTRAITS.examLeaf!)(), '0 0 100 100', 'art');
  return `<span class="portrait portrait-${size} villain-portrait">${inner}</span>`;
}

/** Cores do traje padrão do ninja por linhagem. */
const NINJA_OUTFIT: Record<string, { outfit: string; hair: string; collar?: string }> = {
  common: { outfit: '#2c3a5c', hair: '#3a2a1e' },
  uchiha: { outfit: '#1f2a44', hair: '#15161c', collar: '#1a2236' },
  hyuuga: { outfit: '#d8d2e6', hair: '#2a2430' },
  nara: { outfit: '#5f7a3a', hair: '#2a2420' },
  akimichi: { outfit: '#b8322a', hair: '#7a4a24' },
  yamanaka: { outfit: '#6a4a8a', hair: '#f0d27a' },
  aburame: { outfit: '#5a6a5a', hair: '#2a2a22', collar: '#4a584a' },
  inuzuka: { outfit: '#5a5a62', hair: '#4a3420' },
  uzumaki: { outfit: '#f07a1a', hair: '#e8b33a' },
  taijutsuProdigy: { outfit: '#3f8a3c', hair: '#121214' },
};

/** Retrato do jogador: imagem própria (img/ninja/<linhagem>.webp ou img/ninja/ninja.webp) ou o desenho. */
export function ninjaPortrait(lineageId: string | null, jinchuuriki: boolean, size: 'sm' | 'md' | 'lg' = 'sm'): string {
  const key = lineageId ?? 'common';
  const img = customImage('ninja', key) ?? customImage('ninja', 'ninja');
  if (img) return `<span class="portrait portrait-${size} ninja-portrait"><img src="${img}" alt=""></span>`;
  const look = NINJA_OUTFIT[key] ?? NINJA_OUTFIT.common!;
  const accent = CLAN_COLORS[key] ?? CLAN_COLORS.common!;
  const collar = look.collar ? `<path d="M34 64q16 6 32 0l2 14q-18 6-36 0z" fill="${look.collar}"/>` : '';
  const marks =
    (jinchuuriki ? '<path d="M35 53l7 1M35 56.5l7 0M35 60l7-1M65 53l-7 1M65 56.5l-7 0M65 60l-7-1" stroke="#6b3a2a" stroke-width="1"/>' : '') +
    (key === 'inuzuka' ? '<path d="M37 50l3 6M63 50l-3 6" stroke="#c0392b" stroke-width="2.4" stroke-linecap="round"/>' : '');
  const art =
    scene(`ninja-${key}`, accent, '#0d1222') +
    body(look.outfit, SKIN, collar) +
    head({ eyeColor: key === 'hyuuga' ? '#cfc8e8' : key === 'uchiha' ? '#15161c' : '#2a4a7a', mouth: 'smirk' }) +
    marks +
    `<path d="M30 46l-5-12 8 1-1-11 8 5 3-11 6 8 5-9 3 10 8-5-1 11 8-1-5 12c-4-8-11-12-19-12s-14 4-18 14z" fill="${look.hair}"/>` +
    headband('leaf', '#24324f');
  return `<span class="portrait portrait-${size} ninja-portrait">${svg(art, '0 0 100 100', 'art')}</span>`;
}
