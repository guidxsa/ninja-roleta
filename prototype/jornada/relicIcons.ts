// Ícones das relíquias da Jornada (24×24, desenhos originais). Um por relíquia; cores próprias com contorno
// escuro para ler bem nos dois temas. `tests/jornada.test.ts` confere que toda relíquia tem o seu.

const C = {
  metal: '#b9c3cf',
  steel: '#7d8a99',
  wood: '#a5713f',
  woodDark: '#6e4423',
  paper: '#efe1c0',
  ink: '#3a2a1a',
  red: '#c8372d',
  orange: '#f08a24',
  gold: '#e4b43c',
  green: '#4fa65a',
  leaf: '#7cc36a',
  blue: '#3f7fd0',
  sky: '#7fc4ef',
  purple: '#8a5cc8',
  cloth: '#3c5a8f',
  white: '#f4f1ea',
  dark: '#2a2a33',
  pink: '#f19bb0',
  sand: '#d8b46a',
  chakra: '#5fb7ff',
};
const O = 'stroke="#0007" stroke-width=".9"';

export const RELIC_ICONS: Record<string, string> = {
  // Inicial
  ichirakuBowl: `<path d="M3 11h18a9 9 0 0 1-18 0z" fill="${C.red}" ${O}/><path d="M5 11c1.5-1.6 3-1.6 4.5 0s3 1.6 4.5 0 3-1.6 4.5 0" fill="none" stroke="${C.gold}" stroke-width="1.4"/><path d="M14 2l-3 9M18 3l-5 8" stroke="${C.woodDark}" stroke-width="1.4" stroke-linecap="round"/><path d="M8 15h8" stroke="${C.white}" stroke-width="1.2" opacity=".7"/>`,

  // Comuns
  goggles: `<path d="M1.5 11h21" stroke="${C.dark}" stroke-width="2.2"/><rect x="3.5" y="7.5" width="7.5" height="8" rx="3" fill="${C.sky}" ${O}/><rect x="13" y="7.5" width="7.5" height="8" rx="3" fill="${C.sky}" ${O}/><path d="M5.5 10l2-1.5M15 10l2-1.5" stroke="${C.white}" stroke-width="1.2" stroke-linecap="round"/><path d="M11 11.5h2" stroke="${C.orange}" stroke-width="2"/>`,
  leafHeadband: `<path d="M1 10c4-1 18-1 22 0v5c-4-1-18-1-22 0z" fill="${C.cloth}" ${O}/><rect x="7" y="8.5" width="10" height="7.5" rx="1.2" fill="${C.metal}" ${O}/><path d="M9.5 14c0-3 2-4.5 5-4.5-.6 2.6-2.4 4.5-5 4.5z" fill="none" stroke="${C.dark}" stroke-width="1.1"/><path d="M12 12.3a.9.9 0 1 1 .9-.9" fill="none" stroke="${C.dark}" stroke-width=".9"/>`,
  frogWallet: `<ellipse cx="12" cy="15" rx="8.5" ry="6.5" fill="${C.green}" ${O}/><circle cx="7.5" cy="8.5" r="3" fill="${C.green}" ${O}/><circle cx="16.5" cy="8.5" r="3" fill="${C.green}" ${O}/><circle cx="7.5" cy="8.5" r="1.3" fill="${C.dark}"/><circle cx="16.5" cy="8.5" r="1.3" fill="${C.dark}"/><circle cx="12" cy="16" r="2.6" fill="${C.gold}" ${O}/><rect x="11.1" y="15.1" width="1.8" height="1.8" fill="#0006"/>`,
  kunaiPouch: `<path d="M5 9h14l-1.5 12h-11z" fill="${C.wood}" ${O}/><path d="M5 9h14v3H5z" fill="${C.woodDark}"/><path d="M9 9l1-6 1 6M13.5 9l1-7 1 7" fill="${C.metal}" ${O}/><circle cx="12" cy="15" r="1.4" fill="${C.gold}"/>`,
  ichirakuCoupon: `<path d="M2 7h20v3a2 2 0 0 0 0 4v3H2v-3a2 2 0 0 0 0-4z" fill="${C.paper}" ${O}/><path d="M8 7v10" stroke="${C.red}" stroke-width="1" stroke-dasharray="1.4 1.2"/><path d="M11 11.5h8a4 4 0 0 1-8 0z" fill="${C.red}"/><path d="M13 9.5l2 2M16 9l1.5 2.5" stroke="${C.woodDark}" stroke-width="1" stroke-linecap="round"/><path d="M4 10.5h2M4 13.5h2" stroke="${C.red}" stroke-width="1.2"/>`,
  trainingWeights: `<rect x="2" y="8" width="20" height="8" rx="2" fill="${C.cloth}" ${O}/><path d="M6 8v8M10 8v8M14 8v8M18 8v8" stroke="#0005" stroke-width="1.2"/><path d="M4.5 12h15" stroke="${C.paper}" stroke-width="1" opacity=".6"/>`,
  soldierPills: `<circle cx="8" cy="13" r="4.5" fill="${C.orange}" ${O}/><circle cx="16" cy="9" r="4" fill="${C.red}" ${O}/><circle cx="15.5" cy="17.5" r="3.5" fill="${C.gold}" ${O}/><circle cx="6.8" cy="11.6" r="1.1" fill="#fff8"/><circle cx="14.8" cy="7.8" r="1" fill="#fff8"/>`,
  medKit: `<rect x="3" y="7" width="18" height="13" rx="2.5" fill="${C.white}" ${O}/><path d="M9 7V5h6v2" stroke="${C.steel}" stroke-width="2" fill="none"/><path d="M12 10v7M8.5 13.5h7" stroke="${C.red}" stroke-width="2.6"/>`,
  handWraps: `<path d="M7 21V9a2 2 0 0 1 4 0V7a2 2 0 0 1 4 0v2.5a2 2 0 0 1 4 0V15c0 4-3 6-6 6z" fill="${C.pink}" ${O}/><path d="M7 12l12-1.5M7 15.5l12-1.5M7 19l10-1.3" stroke="${C.white}" stroke-width="2.2"/><path d="M11 9v2M15 9.5v1.5" stroke="#0004" stroke-width="1"/>`,
  steelWire: `<circle cx="12" cy="12" r="7.5" fill="none" stroke="${C.metal}" stroke-width="2.4"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="${C.steel}" stroke-width="1.8"/><circle cx="12" cy="12" r="1.8" fill="${C.dark}"/><path d="M19 9l3.5-5" stroke="${C.metal}" stroke-width="1.2"/><path d="M21 2.5l2 2-2 1" fill="${C.metal}"/>`,
  fieldCanteen: `<rect x="5" y="7" width="14" height="15" rx="6" fill="${C.green}" ${O}/><rect x="10" y="2.5" width="4" height="4.5" rx="1" fill="${C.wood}" ${O}/><path d="M5 14h14" stroke="${C.woodDark}" stroke-width="2"/><path d="M8 10c1-1.2 2-1.5 3-1.5" stroke="#fff6" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,
  herbPouch: `<path d="M6 10h12l1 9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" fill="${C.wood}" ${O}/><path d="M7 10c1-1 9-1 10 0" stroke="${C.woodDark}" stroke-width="1.6" fill="none"/><path d="M12 10c-1-3-4-5-6.5-5 .5 3 3 5 6.5 5zM12 10c1-3.5 3.5-6 7-6-.5 3.5-3 6-7 6z" fill="${C.leaf}" ${O}/><path d="M12 10V5" stroke="${C.green}" stroke-width="1.2"/>`,
  blankSeals: `<rect x="8" y="3" width="11" height="17" rx="1" fill="${C.paper}" ${O} transform="rotate(10 13 12)"/><rect x="5" y="4" width="11" height="17" rx="1" fill="${C.paper}" ${O}/><path d="M7.5 7h6M7.5 18h6" stroke="${C.chakra}" stroke-width="1.2"/><circle cx="10.5" cy="12.5" r="2.2" fill="none" stroke="${C.chakra}" stroke-width="1.2" stroke-dasharray="1.5 1"/>`,
  luckyCoin: `<circle cx="12" cy="12" r="9.5" fill="${C.gold}" ${O}/><circle cx="12" cy="12" r="7" fill="none" stroke="#0003" stroke-width="1.2"/><rect x="9.8" y="9.8" width="4.4" height="4.4" fill="#0005"/><path d="M6 6.5l1 2M17 17.5l1 1.5" stroke="#fff9" stroke-width="1.3" stroke-linecap="round"/><path d="M19.5 3l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z" fill="${C.white}"/>`,
  trainingLog: `<rect x="4" y="3" width="15" height="18" rx="1.5" fill="${C.cloth}" ${O}/><rect x="6.5" y="3" width="12.5" height="18" rx="1" fill="${C.paper}" ${O}/><path d="M9 8h7M9 11h7M9 14h4" stroke="${C.ink}" stroke-width="1.1"/><path d="M15 15.5l1.5 1.5 3-3.5" stroke="${C.green}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
  merchantToken: `<path d="M12 2l9 5v10l-9 5-9-5V7z" fill="${C.wood}" ${O}/><path d="M12 5l6 3.5v7L12 19l-6-3.5v-7z" fill="none" stroke="${C.gold}" stroke-width="1.3"/><text x="12" y="15.2" text-anchor="middle" font-size="8" font-weight="700" fill="${C.gold}" font-family="sans-serif">%</text>`,

  // Raras
  forbiddenScroll: `<rect x="4" y="4" width="16" height="16" rx="1" fill="${C.paper}" ${O}/><rect x="2" y="2.5" width="20" height="3" rx="1.5" fill="${C.woodDark}"/><rect x="2" y="18.5" width="20" height="3" rx="1.5" fill="${C.woodDark}"/><path d="M12 6.5v11" stroke="${C.red}" stroke-width="2.2"/><path d="M7 9.5h3M7 12.5h3M14 9.5h3M14 12.5h3" stroke="${C.ink}" stroke-width="1"/>`,
  kakashiBell: `<path d="M12 4a6 6 0 0 1 6 6v5l2 3H4l2-3v-5a6 6 0 0 1 6-6z" fill="${C.gold}" ${O}/><circle cx="12" cy="20" r="2" fill="${C.woodDark}"/><path d="M12 1.5V4" stroke="${C.red}" stroke-width="1.8"/><path d="M9 8.5c.5-1.2 1.6-2 2.8-2" stroke="#fff9" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M2.5 9.5l1.5 1M21.5 9.5 20 10.5" stroke="${C.gold}" stroke-width="1.3" stroke-linecap="round"/>`,
  explosiveTags: `<rect x="7" y="5" width="10" height="17" rx="1" fill="${C.paper}" ${O}/><path d="M9.5 9h5M12 9v10M9.5 13h5M10 17h4" stroke="${C.red}" stroke-width="1.4"/><path d="M12 5c0-2 1.5-3 3-2.5" stroke="${C.woodDark}" stroke-width="1.2" fill="none"/><path d="M16.5 1.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" fill="${C.orange}"/>`,
  hakuMask: `<path d="M12 2c5 0 8 3.5 8 9 0 6-3.6 11-8 11s-8-5-8-11c0-5.5 3-9 8-9z" fill="${C.white}" ${O}/><path d="M7.5 10.5l3 1.2M16.5 10.5l-3 1.2" stroke="${C.dark}" stroke-width="1.8" stroke-linecap="round"/><path d="M8 4.5c1 1.5 1.5 3 1.2 4.5M16 4.5c-1 1.5-1.5 3-1.2 4.5" stroke="${C.red}" stroke-width="1.3" fill="none"/><path d="M12 13.5v4" stroke="#0003" stroke-width="1.1"/>`,
  sandGourd: `<circle cx="12" cy="16" r="6" fill="${C.sand}" ${O}/><circle cx="12" cy="7.5" r="3.8" fill="${C.sand}" ${O}/><rect x="10.3" y="1.5" width="3.4" height="2.8" rx=".8" fill="${C.woodDark}"/><path d="M6.5 13.5h11" stroke="${C.red}" stroke-width="1.5"/><path d="M9 19c1 .8 2 1 3 1" stroke="#fff7" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,
  toadContract: `<rect x="3" y="5" width="18" height="14" rx="1" fill="${C.paper}" ${O}/><rect x="1.5" y="4" width="3" height="16" rx="1.5" fill="${C.red}"/><ellipse cx="13" cy="14" rx="5" ry="3.5" fill="${C.orange}" ${O}/><circle cx="10.5" cy="10" r="1.8" fill="${C.orange}" ${O}/><circle cx="15.5" cy="10" r="1.8" fill="${C.orange}" ${O}/><circle cx="10.5" cy="10" r=".7" fill="${C.dark}"/><circle cx="15.5" cy="10" r=".7" fill="${C.dark}"/>`,
  revivalPills: `<path d="M7 3h10v4l-2 2v12H9V9L7 7z" fill="${C.sky}" ${O}/><rect x="7" y="2" width="10" height="2.5" rx="1" fill="${C.woodDark}"/><circle cx="12" cy="14" r="2.3" fill="${C.green}" ${O}/><circle cx="12" cy="18.5" r="1.6" fill="${C.green}" ${O}/><path d="M10 11.5h4" stroke="${C.white}" stroke-width="1"/>`,
  tornHeadband: `<path d="M1 10c3-1 8-1 11 0l-1.5 2.5L12 15c-3-1-8-1-11 0z" fill="${C.cloth}" ${O}/><path d="M13.5 10c3-1 6.5-1 9.5 0v5c-3-1-6.5-1-9.5 0l1.5-2.5z" fill="${C.cloth}" ${O}/><rect x="6" y="9" width="5" height="6.5" rx="1" fill="${C.metal}" ${O}/><rect x="14.5" y="9" width="4" height="6.5" rx="1" fill="${C.metal}" ${O}/><path d="M7 11l3 3M15.5 14l2-3.5" stroke="${C.red}" stroke-width="1.4"/>`,
  summoningScroll: `<rect x="3" y="7" width="13" height="10" fill="${C.paper}" ${O}/><circle cx="18" cy="12" r="4.5" fill="${C.red}" ${O}/><circle cx="18" cy="12" r="2" fill="${C.woodDark}"/><circle cx="9.5" cy="12" r="3.3" fill="none" stroke="${C.ink}" stroke-width="1"/><path d="M9.5 8.7v6.6M6.2 12h6.6" stroke="${C.ink}" stroke-width=".9"/><path d="M2 21c1-1.5 2-2 3.5-2M5 4.5c.5-1 1.5-1.5 2.5-1.5" stroke="${C.white}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`,
  warFan: `<path d="M12 21L2.5 8.5A12.5 12.5 0 0 1 21.5 8.5z" fill="${C.purple}" ${O}/><path d="M12 21 7 4.5M12 21V3.5M12 21l5-16.5" stroke="#0005" stroke-width="1"/><circle cx="8" cy="9.5" r="1.6" fill="${C.white}"/><circle cx="16" cy="9.5" r="1.6" fill="${C.white}"/><circle cx="12" cy="7" r="1.6" fill="${C.white}"/><circle cx="12" cy="21" r="1.5" fill="${C.woodDark}"/>`,
  senbonCase: `<rect x="4" y="9" width="16" height="10" rx="2" fill="${C.woodDark}" ${O}/><path d="M7 9V2.5M10 9V1.5M13 9V2M16 9V3" stroke="${C.metal}" stroke-width="1.3" stroke-linecap="round"/><path d="M4 12.5h16" stroke="${C.gold}" stroke-width="1.2"/><circle cx="12" cy="15.5" r="1.3" fill="${C.gold}"/>`,
  storageSeal: `<rect x="3" y="3" width="18" height="18" rx="2" fill="${C.paper}" ${O}/><circle cx="12" cy="12" r="6.5" fill="none" stroke="${C.ink}" stroke-width="1.3"/><circle cx="12" cy="12" r="3" fill="none" stroke="${C.ink}" stroke-width="1"/><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" stroke="${C.ink}" stroke-width="1.2"/><rect x="10.5" y="10.5" width="3" height="3" fill="${C.red}"/>`,
  chakraStone: `<path d="M12 2l7 6-2 12H7L5 8z" fill="${C.chakra}" ${O}/><path d="M12 2 9.5 8h5zM5 8h4.5L12 20M19 8h-4.5L12 20" fill="none" stroke="#fff6" stroke-width="1"/><path d="M8 6.5l1.5-1.5" stroke="${C.white}" stroke-width="1.4" stroke-linecap="round"/>`,
  warDrum: `<ellipse cx="12" cy="7.5" rx="8.5" ry="3.5" fill="${C.paper}" ${O}/><path d="M3.5 7.5v9c0 2 3.8 3.5 8.5 3.5s8.5-1.5 8.5-3.5v-9" fill="${C.red}" ${O}/><path d="M3.5 7.5c0 2 3.8 3.5 8.5 3.5s8.5-1.5 8.5-3.5" fill="none" stroke="${C.paper}" stroke-width="1"/><circle cx="7" cy="14" r=".8" fill="${C.gold}"/><circle cx="12" cy="15" r=".8" fill="${C.gold}"/><circle cx="17" cy="14" r=".8" fill="${C.gold}"/><path d="M14 1.5l4 5" stroke="${C.wood}" stroke-width="1.6" stroke-linecap="round"/>`,
  mastersJournal: `<path d="M3 4.5C6 3.5 9 3.5 12 5.5v15c-3-2-6-2-9-1z" fill="${C.paper}" ${O}/><path d="M21 4.5c-3-1-6-1-9 1v15c3-2 6-2 9-1z" fill="${C.paper}" ${O}/><path d="M5 8h5M5 10.5h5M5 13h3M14 8h5M14 10.5h4" stroke="${C.ink}" stroke-width=".9"/><path d="M17 12.5l.8 1.8 2 .2-1.5 1.3.5 2-1.8-1-1.8 1 .5-2-1.5-1.3 2-.2z" fill="${C.gold}"/>`,

  // Lendárias
  hokageNecklace: `<path d="M3 3c1 7 4.5 10 9 10s8-3 9-10" fill="none" stroke="${C.dark}" stroke-width="1.4"/><path d="M12 12.5l3.5 1.2v6.6L12 21.5l-3.5-1.2v-6.6z" fill="${C.green}" ${O}/><path d="M12 12.5v9" stroke="#fff5" stroke-width="1"/><circle cx="6" cy="9" r="1" fill="${C.woodDark}"/><circle cx="18" cy="9" r="1" fill="${C.woodDark}"/>`,
  eightTrigramSeal: `<circle cx="12" cy="12" r="9.5" fill="${C.dark}" ${O}/><path d="M12 6.5a5.5 5.5 0 1 1-5.5 5.5A3.5 3.5 0 0 1 12 9.5a2 2 0 1 1-2 2" fill="none" stroke="${C.orange}" stroke-width="1.5" stroke-linecap="round"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" stroke="${C.orange}" stroke-width="1.3"/>`,
  hokageHat: `<path d="M12 2L1.5 15h21z" fill="${C.white}" ${O}/><path d="M1.5 15c3 3.5 18 3.5 21 0" fill="${C.red}" ${O}/><path d="M12 2l-3 13h6z" fill="${C.red}" opacity=".9"/><text x="12" y="13.5" text-anchor="middle" font-size="5.5" font-weight="700" fill="${C.white}" font-family="sans-serif">火</text>`,
  sanninBand: `<path d="M1 9c4-1.2 18-1.2 22 0v6c-4-1.2-18-1.2-22 0z" fill="${C.red}" ${O}/><rect x="6.5" y="7.5" width="11" height="9" rx="1.2" fill="${C.metal}" ${O}/><text x="12" y="14.6" text-anchor="middle" font-size="6.5" font-weight="700" fill="${C.dark}" font-family="sans-serif">油</text>`,
  gamabuntaPipe: `<path d="M3 17c4 0 8-1 11-3l2 2c-3 3-8 4.5-13 4.5z" fill="${C.woodDark}" ${O}/><path d="M13.5 9h7v5.5a3.5 3.5 0 0 1-7 0z" fill="${C.wood}" ${O}/><path d="M13.5 9h7" stroke="${C.gold}" stroke-width="1.6"/><path d="M15 6.5c0-1.5 1.5-1.5 1.5-3M18.5 6.5c0-1.5 1.5-1.5 1.5-3" stroke="${C.metal}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`,
  chakraBlade: `<path d="M13 2l2.5 2.5L7 13l-2.5-2.5z" fill="${C.chakra}" ${O}/><path d="M13 2l2.5 2.5L7 13" fill="none" stroke="${C.white}" stroke-width=".9"/><path d="M3 12l9 9M5 16l3 3" stroke="${C.gold}" stroke-width="2" stroke-linecap="round"/><path d="M4.5 13.5 2 21l7.5-2.5" fill="${C.woodDark}" ${O}/><path d="M17 1.5c3 1 5 3 5.5 5.5M19 6c1 .5 1.5 1.3 1.8 2.2" stroke="${C.chakra}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8"/>`,
  samuraiArmor: `<path d="M5 6l7-3 7 3v6c0 5-3 8.5-7 10-4-1.5-7-5-7-10z" fill="${C.red}" ${O}/><path d="M5 10h14M5.4 14h13.2M7 18h10" stroke="${C.dark}" stroke-width="1.4"/><path d="M12 3v19" stroke="#0004" stroke-width="1"/><path d="M8 3.5 6 1.5M16 3.5l2-2" stroke="${C.gold}" stroke-width="1.6" stroke-linecap="round"/>`,
  heavenEarthScrolls: `<rect x="2.5" y="5" width="8.5" height="15" rx="1" fill="${C.white}" ${O}/><rect x="13" y="4" width="8.5" height="15" rx="1" fill="${C.dark}" ${O}/><rect x="2" y="4" width="9.5" height="2.2" rx="1" fill="${C.gold}"/><rect x="12.5" y="17.8" width="9.5" height="2.2" rx="1" fill="${C.gold}"/><text x="6.75" y="15" text-anchor="middle" font-size="6" font-weight="700" fill="${C.dark}" font-family="sans-serif">天</text><text x="17.25" y="14" text-anchor="middle" font-size="6" font-weight="700" fill="${C.white}" font-family="sans-serif">地</text>`,
  eternalLotus: `<path d="M12 4c2.5 3 2.5 8 0 12-2.5-4-2.5-9 0-12z" fill="${C.pink}" ${O}/><path d="M12 16c-1-4-4-7-8.5-7.5C4 13 7.5 16 12 16zM12 16c1-4 4-7 8.5-7.5C20 13 16.5 16 12 16z" fill="${C.pink}" ${O}/><path d="M3 19c3-1.5 15-1.5 18 0" stroke="${C.green}" stroke-width="2.2" stroke-linecap="round" fill="none"/><circle cx="12" cy="14" r="1.2" fill="${C.gold}"/>`,
  bottomlessPouch: `<path d="M6 8h12l2 10a3 3 0 0 1-3 3.5H7A3 3 0 0 1 4 18z" fill="${C.purple}" ${O}/><path d="M6 8c-1-2 0-4.5 2-4.5 1 1.2 3 1.2 4 0 1 1.2 3 1.2 4 0 2 0 3 2.5 2 4.5" fill="${C.purple}" ${O}/><path d="M6.5 8h11" stroke="${C.gold}" stroke-width="1.6"/><ellipse cx="12" cy="15" rx="3.5" ry="2.5" fill="${C.dark}"/><circle cx="12" cy="14.6" r="1" fill="${C.gold}"/>`,
  phoenixFeather: `<path d="M19 2C10 3 5 9 5 17l2 2c2-1 3-2 4-3.5 1 .2 2.2 0 3-.8-1-.3-1.6-.8-2-1.5 1.5.2 3 0 4-1-1.2-.2-2-.8-2.5-1.5 1.8 0 3.2-.6 4-1.7-1.2 0-2-.4-2.6-1C17.5 7 18.8 5 19 2z" fill="${C.orange}" ${O}/><path d="M18 3.5C13 7 9 12 6 19" stroke="${C.gold}" stroke-width="1.2" fill="none"/><path d="M3 22l3-3" stroke="${C.woodDark}" stroke-width="1.6" stroke-linecap="round"/><path d="M8 13c1 .5 2 .6 3 .4" stroke="${C.red}" stroke-width="1" fill="none"/>`,
};

/** SVG da relíquia; cai num saco genérico se faltar o desenho. */
export function relicIcon(id: string, cls = 'ico relic-ico'): string {
  const body = RELIC_ICONS[id] ?? `<path d="M6 8h12l1.5 12.5a1 1 0 0 1-1 1.5h-13a1 1 0 0 1-1-1.5z" fill="currentColor"/>`;
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
}
