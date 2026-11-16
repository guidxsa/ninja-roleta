// Retratos de Konoha: o time 7, os colegas e os mestres. Cada um com cabelo, rosto e traje próprios.
import { VILLAGES } from '../villages';
import { type Art, INK, NAVY, SKIN, STEEL, TAN, bg, both, face, headband, highCollar, kimono, ln, mesh, neck, p, plate, po, shade, shine, shoulders, torso, tube, vest } from './kit';

/**
 * Naruto, pela imagem base (prototype/lab/refs/naruto): a cabeleira loira de espetos largos que passam dos ombros, a
 * bandana azul de placa comprida, os olhos grandes e quadrados de íris azul-clara, os três bigodes finos e a gola
 * branca felpuda sobre o azul e o laranja. As formas da Kyuubi mudam os olhos, as presas, os bigodes e o chakra em volta.
 */
export function naruto(mode: 'base' | 'kyuubi' | 'oneTail' = 'base'): string {
  const wild = mode !== 'base';
  const hair = '#f8dd4c';
  const skin = '#fbd9b5';
  const blue = '#2c4fa3';
  const orange = '#f08a1c';
  const fluff = 'M29 83C31 75 41 73 50 73S69 75 71 83C69 91 59 93 50 93S31 91 29 83Z';
  const scene =
    mode === 'base'
      ? bg('naruto', '#8fd0f0', '#1f4a7a')
      : mode === 'kyuubi'
        ? bg('narutoKyuubi', '#e0332c', '#1c0507', ln('M10 98Q5 66 20 44M90 98Q95 66 80 44', '#ff8a52', 2.4, 'opacity=".7"'))
        : bg('narutoOneTail', '#f0541e', '#1c0507', p('M80 101C95 82 97 54 84 30 84 52 76 70 62 84Z', '#ff8a52', 'opacity=".8"'));
  // Manto de uma cauda: a capa de chakra envolve o corpo e forma as orelhas de raposa.
  const cloak = mode === 'oneTail' ? p('M3 101C3 74 17 60 25 48L20 14 38 30Q50 24 62 30L80 14 75 48C83 60 97 74 97 101Z', '#ff6a32', 'opacity=".55"') : '';
  // Olho esquerdo de quem vê: quadrado de cantos vivos, pálpebra grossa em cima, íris clara com a pupila miúda.
  const eye = wild
    ? p('M34.6 45.6L46.8 44.6 46.2 51.6 35.6 51.6Z', '#ffe9c9') + `<ellipse cx="41" cy="48.2" rx="3" ry="3.4" fill="#d1232a"/>` + ln('M41 45.2V51.2', '#111', 1.3) +
      ln('M33.6 46.4L47.4 43.6', INK, 2.2) + ln('M35.6 51.8H46', INK, 0.8)
    : p('M34.2 44.6Q40.6 42.2 47 45.4L46 51.4Q40.6 53 35.6 51.8Z', '#fff') +
      `<circle cx="41" cy="48" r="3.4" fill="#a9def6" stroke="#3a78a8" stroke-width=".6"/><circle cx="41" cy="48" r=".9" fill="#111"/><circle cx="39.8" cy="46.8" r=".7" fill="#fff"/>` +
      ln('M33.6 44.8Q40.6 41.8 47.4 45.4', INK, 1.7) + ln('M34.2 45L35.6 51.8Q40.6 53 46 51.4L47 45.4', INK, 0.45);
  return (
    scene +
    cloak +
    shoulders(blue) +
    `<ellipse cx="50" cy="83" rx="17" ry="7" fill="#ddd5c6"/>` +
    tube(fluff, 11, '#f7f3ea') +
    `<path d="${fluff}" fill="none" stroke="#c9c1b2" stroke-width="9" stroke-dasharray=".5 3.6"/>` +
    po('M43.6 90H56.4V101H43.6Z', orange) +
    ln('M50 90V101', '#8d939d', 1.4) + ln('M50 90V101', INK, 0.5, 'stroke-dasharray="1 1"') +
    // A cabeça ocupa o quadro, como na imagem base: os espetos passam das bordas.
    `<g transform="translate(50 47) scale(1.16) translate(-50 -47)">` +
    both(`<path d="M31.4 45C27.8 43.6 26 47 26.8 51.4C27.4 55 30 56.6 32.4 55.4Z" fill="${skin}" stroke="${INK}" stroke-width="1"/>` + ln('M28.6 48Q30.2 50 29.6 53', shade(skin, -0.25), 0.7)) +
    po('M30.5 44C30.5 33 38 24 50 24S69.5 33 69.5 44C69.5 54 64 62 57 66.4Q50 70 43 66.4C36 62 30.5 54 30.5 44Z', skin) +
    both(ln(wild ? 'M34.6 40.4L46.4 44' : 'M35.4 41.4L45.8 43.2', INK, wild ? 1.8 : 1.1)) +
    both(eye) +
    ln('M49 57.2L50.8 58.4', INK, 0.9) + ln('M48.4 59.6H52', shade(skin, -0.25), 0.7) +
    both(ln('M32.4 53.4L39.8 55.6M31.8 57.6L39.4 58.6M33.2 62.2L40 61.2', wild ? '#3a1410' : INK, wild ? 1.9 : 0.8)) +
    (wild
      ? `<path d="M42.6 60.6Q50 63.4 57.4 60.6Q56.4 67.2 50 67.2T42.6 60.6Z" fill="#5a1f1c" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/><path d="M44.6 61.6L46 65 47.6 62.2ZM55.4 61.6L54 65 52.4 62.2Z" fill="#fff"/>`
      : ln('M42.4 62Q50 65.6 57.6 61.2', INK, 1.2) + ln('M48 67H52', shade(skin, -0.25), 0.8)) +
    po('M30 37L10 43 21 31 2 25 22 20 13 4 33 13 42 0 51 11 62 0 67 13 86 5 79 21 98 25 80 31 91 43 70 37C64 33 58 31 50 31S36 33 30 37Z', hair) +
    both(po('M31.6 40L30.2 50.6 34 45 33.6 41Z', hair, 0.8)) +
    po('M30 31Q50 24 70 31V41.4Q50 34.4 30 41.4Z', blue) +
    `<path d="M34 28Q50 23.6 66 28V39.4Q50 35 34 39.4Z" fill="${STEEL}" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/>` +
    ln('M37 29.6Q50 25.8 63 29.6', '#f4f7fa', 0.9) +
    both(`<circle cx="35.8" cy="30.6" r=".55" fill="#596172"/><circle cx="35.8" cy="33.4" r=".55" fill="#596172"/><circle cx="35.8" cy="36.2" r=".55" fill="#596172"/>`) +
    `<g transform="translate(45 26.2) scale(.42)" fill="none" stroke="#596172" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${VILLAGES.leaf}</g>` +
    `</g>` +
    (mode === 'oneTail' ? ln('M13 94Q10 72 23 56M87 94Q90 72 77 56', '#ffc09a', 1.8, 'opacity=".85"') : '')
  );
}

/** Marca da maldição, primeiro estágio: fileiras de pequenas chamas pretas subindo pelo lado esquerdo do rosto, com a brasa por baixo. */
function curseFlames(): string {
  let d = '';
  for (let row = 0; row < 3; row++) {
    for (let k = 0; k < 6; k++) {
      const x = 52.6 + row * 4.2 + k * 0.5;
      const y = 65.4 - k * 5 - row * 1.6;
      // Só dentro do rosto: o queixo afina abaixo de y 56.
      if (x > 65.4 - Math.max(0, y - 54) * 0.75 || y < 39) continue;
      d += `M${x.toFixed(1)} ${y.toFixed(1)}q2.4-.6 2.8 2.6q-1.4-1.8-3.4-1.2q1.2-.4.6-1.4z`;
    }
  }
  return `<path d="${d}" fill="none" stroke="#f08a3a" stroke-width="1.6" stroke-linejoin="round" opacity=".55"/><path d="${d}" fill="#17100f"/>`;
}

type SasukeLook = 'base' | 'sharingan' | 'curse' | 'hospital' | 'final' | 'curse2';
/** Sasuke: a franja repartida em duas mechas longas, os espetos subindo atrás e a gola alta azul. As variantes trocam os olhos, a marca e a bandana. */
export function sasuke(look: SasukeLook = 'base'): string {
  const c2 = look === 'curse2';
  const hair = c2 ? '#6d7396' : '#1b2038';
  const lite = c2 ? '#aab0d0' : '#5a68a8';
  const skin = c2 ? '#9a8f86' : SKIN;
  const red = look !== 'base' && look !== 'hospital';
  const curse = look === 'curse' || look === 'final';
  // Marca da maldição, primeiro estágio: as chamas pretas sobem em fileira pelo lado esquerdo do rosto, com a borda em brasa.
  const flames = curse ? curseFlames() : c2 ? po('M44 50L50 46.6 56 50 54 55.6 50 52.6 46 55.6Z', '#3b3340', 0.6) : '';
  const band =
    look === 'hospital'
      ? po('M32.6 31Q50 25 67.4 31V38Q50 32 32.6 38Z', '#f1ece0') + ln('M34 34.6Q50 28.6 66 34.6', '#c9c1b0', 0.8)
      : c2 ? '' : headband('leaf', { slash: look === 'final' });
  return (
    bg(`sasuke-${look}`, c2 ? '#6a4a8a' : red ? '#a8323a' : '#4a63b8', c2 ? '#120a1c' : '#0d1226',
      c2 ? both(po('M30 70L4 40 14 44 8 26 20 36 20 20 34 60Z', '#5a4a52')) : '') +
    both(po('M35 41L23 42 29 35 16 31 28 28 19 17 32 22 33 12 41 22Z', hair)) +
    both(shine('M23 32L30 33M24 21L31 25', lite, 1.2)) +
    (c2 ? po('M30 40C26 56 26 70 30 86H70C74 70 74 56 70 40Z', hair) : '') +
    torso('#2b3f7e', skin) +
    highCollar('#33498f') +
    face({ shape: 'slim', skin, eyes: red ? 'sharingan' : 'sharp', iris: '#1b1b22', sclera: c2 ? '#17100f' : '#fff', brows: 'angry', browColor: hair, mouth: look === 'base' ? 'neutral' : 'frown', lips: c2 ? '#3b2a30' : undefined, under: flames }) +
    po('M31 39C29 26 37 15 50 15S71 26 69 39C66 33 60 28 53 27L50 31 47 27C40 28 34 33 31 39Z', hair) +
    band +
    both(po('M47 24C40 25 34 30 31.6 40C30.4 47 31 56 33.6 66C34.4 58 35.4 52 36.4 46C36.8 38 38 32 40 29Z', hair)) +
    both(shine('M35 34Q38 28 45 26', lite, 1.3))
  );
}

/** Kakashi: cabelo prata inclinado, máscara até o nariz e a bandana torta cobrindo o olho esquerdo. `sharingan`: a bandana levantada, o Sharingan e a cicatriz à mostra. */
export function kakashi(sharingan = false): string {
  const hair = '#dce1e8';
  const mask = '#2b3550';
  return (
    bg(sharingan ? 'kakashiSharingan' : 'kakashi', sharingan ? '#a85a66' : '#8ea2b8', '#131a24',
      sharingan ? ln('M6 60L20 52 14 66 28 58M94 30L80 38 86 24 72 32', '#bfe6ff', 1.4, 'opacity=".6"') : '') +
    torso(NAVY, mask) +
    vest() +
    face({ shape: 'square', eyes: 'bored', eyesR: sharingan ? 'sharingan' : 'none', brows: 'flat', browColor: '#9399a3', mouth: 'none', nose: false,
      under: sharingan ? ln('M59 39.6V56', '#b0665a', 1.3) : '' }) +
    po('M33 52Q50 47 67 52V54C67 62 59 67.6 50 68.4C41 67.6 33 62 33 54Z', mask) +
    ln('M50 50.4V57', '#1a2136', 1) +
    po('M31 36L26 26 33 28 30 15 38 22 40 8 47 18 54 5 57 17 67 7 66 19 77 13 72 25 80 26 69 37C64 33 58 31 50 31S36 33 31 36Z', hair) +
    shine('M40 22L42 14M56 20L58 12M66 24L70 18', '#fff', 1.4) +
    (sharingan
      ? headband('leaf', { tails: true })
      : po('M32 30Q46 28 69 45V57Q52 44 32 39.6Z', NAVY) + `<g transform="rotate(30 50 38)">${plate(40, 33.4, 21, 9.6, 'leaf')}</g>`)
  );
}

/** Neji: cabelo longo e escuro, bandana de pano preto e a camisa bege. `on`: o Byakugan ativo, com as veias saltadas nas têmporas. */
export function neji(on = false): string {
  const hair = '#3b2e2c';
  return (
    bg(on ? 'nejiByakugan' : 'neji', on ? '#d8d2f0' : '#beb6dc', '#1c1830',
      on ? `<g fill="none" stroke="#fff" stroke-width=".8" opacity=".5"><circle cx="50" cy="46" r="26"/><circle cx="50" cy="46" r="42"/><path d="M50 0V100M0 46H100M14 10L86 82M86 10L14 82"/></g>` : '') +
    po('M30 36C24 56 24 80 27 101H73C76 80 76 56 70 36Z', hair) +
    torso('#e3dac8') +
    po('M36 73L50 86 64 73 67 80 50 96 33 80Z', '#d2c7b0') +
    face({ shape: 'slim', eyes: on ? 'byakuganOn' : 'byakugan', brows: 'angry', browColor: hair, mouth: 'frown' }) +
    po('M31 40C30 25 38 16 50 16S70 25 69 40C66 33 60 28 50 27 40 28 34 33 31 40Z', hair) +
    shine('M38 22Q44 18 50 18', '#8a7470') +
    headband('leaf', { cloth: '#1f2026' }) +
    both(po('M34.6 36L30 62 33.6 68 36.6 41Z', hair, 1))
  );
}

/** Akamaru: o filhote branco de cabeça grande, orelhas marrons caídas e olhos sempre apertados. */
export function akamaru(): string {
  const fur = '#f6f1e8';
  const ear = '#9a6a44';
  return (
    bg('akamaru', '#c25a60', '#2a0c10') +
    po('M33 101C31 87 38 77 50 77S69 87 67 101Z', fur) +
    both(po('M40 91Q35.6 91 35.6 96.4Q35.6 101 41 101Q45.6 101 45.6 95.6Q45.6 91 40 91Z', fur, 1)) +
    both(po('M32 36C22 33 14 42 14 55C14 63 17 69 23 72C28 67 30.6 59 31.4 50C32 45 33 40 35 37Z', ear)) +
    both(shine('M19 50Q20 60 23 66', '#c89a70', 1.6)) +
    po('M26 53C26 38 36 29 50 29S74 38 74 53C74 67 64 78 50 78S26 67 26 53Z', fur) +
    po('M43.6 31L45 22 48.6 28 51 19 54 28 57.4 23 57 31Z', fur, 1.1) +
    p('M30 58C34 70 42 76 50 77C40 78 30 70 28 58Z', '#ddd5c6') +
    both(ln('M34.6 50.4Q39.6 47.4 44.6 50.4', INK, 2.1)) +
    both(`<ellipse cx="36" cy="58" rx="3.6" ry="2" fill="#f2b8b0" opacity=".7"/>`) +
    `<ellipse cx="50" cy="58.6" rx="3.4" ry="2.4" fill="${INK}"/><circle cx="49" cy="57.8" r=".7" fill="#fff"/>` +
    ln('M50 61V63.6M44.6 63.6Q47.4 66.6 50 63.6Q52.6 66.6 55.4 63.6', INK, 1.3) +
    po('M48 65.4H52V68.4Q50 70.6 48 68.4Z', '#e77a8c', 0.8)
  );
}

/** Jiraiya: a juba branca espetada caindo pelos ombros, as linhas vermelhas descendo dos olhos, o protetor de chifres com o kanji do óleo e o haori vermelho. */
export function jiraiya(): string {
  const hair = '#f1f3f5';
  const dim = '#c3cad3';
  return (
    bg('jiraiya', '#c6584e', '#2a0c0a') +
    po('M31 30L18 23 22 34 9 33 18 44 5 50 16 57 5 67 16 71 7 83 18 85 13 101H87L82 85 93 83 84 71 95 67 84 57 95 50 82 44 91 33 78 34 82 23 69 30 64 13 56 22 50 9 44 22 36 13Z', hair) +
    both(ln('M20 40L27 46M14 54L24 58M15 72L24 72M17 88L25 84', dim, 1.3)) +
    torso('#6f8f5a') +
    kimono('#b23a34') +
    mesh() +
    face({ shape: 'square', eyes: 'sharp', iris: '#2b2b33', browColor: '#8d939d', mouth: 'grin', under: both(ln('M40 51.6L39 58 40.4 65', '#c0392b', 2)) + `<circle cx="55" cy="55" r="1.1" fill="${shade(SKIN, -0.32)}"/>` }) +
    po('M32 33L27 20 35 24 37 11 44 20 50 8 56 20 63 11 65 24 73 20 68 33Q50 25 32 33Z', hair) +
    both(ln('M37 24L39 16M45 21L47 14', dim, 1.1)) +
    both(po('M37 31L31 18 42 28Z', STEEL, 1)) +
    po('M33 29.6Q50 23.6 67 29.6V39Q50 33 33 39Z', STEEL) +
    ln('M35 31Q50 25.4 65 31', '#f4f7fa', 0.8) +
    `<text x="50" y="35.4" text-anchor="middle" font-size="6.6" font-weight="700" fill="#454d5c" font-family="serif">油</text>` +
    both(po('M34.6 37L27 44 25.6 62 29 86 34 73 36.4 56 37 42Z', hair)) +
    both(ln('M30 50L31 70', dim, 1.1))
  );
}

/** Tsunade: a franja partida com duas mechas longas, os rabos baixos, o losango na testa, o haori verde aberto e o colar do cristal. */
export function tsunade(): string {
  const hair = '#f4d878';
  const dim = '#d1ae48';
  return (
    bg('tsunade', '#93cb9e', '#12301c') +
    both(po('M34 52C26 60 21 76 23 100L34 96C32 82 34 68 39 58Z', hair)) +
    both(ln('M28 70Q27 84 28 96', dim, 1.2)) +
    torso('#c9ccd4') +
    p('M42 73L50 93 58 73Z', SKIN) +
    ln('M42 73L50 93 58 73', INK, 1.2) +
    both(po('M8 101C9 86 20 77 37 74.4L45 101Z', '#4f9a62')) +
    both(ln('M37 74.4L45 101', '#2f6a40', 1.6)) +
    ln('M44.6 76L50 84 55.4 76', '#3a3f48', 0.8) +
    po('M50 83L51.8 86.8 50 90.4 48.2 86.8Z', '#6ad0d8', 0.7) +
    face({ iris: '#a8743a', lashes: true, browColor: '#a8862a', mouth: 'smirk', lips: '#c8405a', under: po('M50 29.6L52.2 33.6 50 37.6 47.8 33.6Z', '#7a5ac0', 0.6) }) +
    po('M50 24C45 30 39 33 35 36L34 50 33 66 29 82 26.6 62C26 46 28 34 33 26 37 19 43 15 50 15S63 19 67 26C72 34 74 46 73.4 62L71 82 67 66 66 50 65 36C61 33 55 30 50 24Z', hair) +
    both(shine('M36 26Q42 19 49 18', '#fff', 1.4)) +
    both(ln('M30 46L29.4 70', dim, 1.1))
  );
}

/** Sakura: cabelo rosa comprido, testa larga, a bandana usada como tiara e o vestido vermelho de debrum branco. */
export function sakura(): string {
  const hair = '#f29cba';
  return (
    bg('sakura', '#f8c3d6', '#5a1f38', p('M12 20q5-5 9 1-5 4-9-1zM82 26q5-5 9 1-5 4-9-1zM16 70q4-4 7 1-4 3-7-1z', '#fde3ec', 'opacity=".6"')) +
    po('M30 38C25 54 25 78 29 94H71C75 78 75 54 70 38Z', hair) +
    torso('#c5283d') +
    po('M35 74Q50 85 65 74L67 79.6Q50 91 33 79.6Z', '#d4374c') +
    ln('M33 79.6Q50 91 67 79.6M50 90V101', '#fff', 1.5) +
    face({ shape: 'oval', iris: '#3fa77a', browColor: '#c46a8c', mouth: 'smile', lips: '#b8506a' }) +
    po('M50 28C44 30 38 36 35 46L33 57 30.6 47C29 30 37 16 50 16S71 30 69.4 47L67 57 65 46C62 36 56 30 50 28Z', hair) +
    po('M34 31C36 20 43 15.6 50 15.6S64 20 66 31L62.6 32.6C61 25 56 21.6 50 21.6S39 25 37.4 32.6Z', NAVY) +
    plate(42, 13.6, 16, 8.6, 'leaf')
  );
}

/** Iruka: rabo de cavalo espetado, a cicatriz atravessando o nariz e o colete de chūnin. */
export function iruka(): string {
  const hair = '#5a3b28';
  return (
    bg('iruka', '#d2aa62', '#2a1c0c') +
    po('M43 23L40 6 48 13 52 2 56 13 63 7 57 23Z', hair) +
    torso(NAVY, TAN) +
    vest() +
    face({ skin: TAN, iris: '#3a2a20', browColor: hair, mouth: 'smile', nose: false, under: ln('M39.6 53Q50 56.4 60.4 53', '#8a4630', 1.7) }) +
    po('M31 41C30 26 38 17 50 17S70 26 69 41L66.6 46 65 36C60 32 56 31 50 31S40 32 35 36L33.4 46Z', hair) +
    headband('leaf')
  );
}

/** Rock Lee: corte de tigela brilhante, sobrancelhas grossas, olhos redondos e o macacão verde. */
export function lee(): string {
  return (
    bg('lee', '#86d690', '#0f2a14', ln('M8 16L20 28M92 16L80 28M6 60H16M94 60H84', '#d8f7d0', 2, 'opacity=".5"')) +
    torso('#3f9a4a') +
    po('M35 73Q50 82 65 73L66.6 79Q50 90 33.4 79Z', '#4bb058') +
    face({ shape: 'round', eyes: 'round', brows: 'thick', mouth: 'grin' }) +
    po('M29.6 49C27 28 36 15 50 15S73 28 70.4 49C69.6 44 68 40 66 37.6 56 41 44 41 34 37.6 32 40 30.4 44 29.6 49Z', '#17171c') +
    ln('M37 24Q50 17 63 24', '#ffffff', 2.6, 'opacity=".45"')
  );
}

/** Shikamaru: rabo de cavalo em abacaxi, brincos, olhar de tédio e a camisa de rede. */
export function shikamaru(): string {
  const hair = '#2b2420';
  return (
    bg('shikamaru', '#93b25e', '#1a2410') +
    po('M41 25L31 9 41 15 39 3 47 12 50 1 53 12 61 3 59 15 69 9 59 25Z', hair) +
    torso('#3a3f48') +
    both(po('M8 101C9 86 20 77 37 74.4L43 87 36 101Z', '#8a9a72')) +
    mesh() +
    face({ shape: 'slim', eyes: 'bored', iris: '#3a2a20', brows: 'flat', browColor: hair, mouth: 'frown' }) +
    both(`<circle cx="31.6" cy="54.6" r="1.7" fill="none" stroke="${STEEL}" stroke-width="1.2"/>`) +
    po('M31 42C30 26 38 17 50 17S70 26 69 42C67 37 64 33 61 31L50 35 39 31C36 33 33 37 31 42Z', hair)
  );
}

/** Chōji: rosto redondo, espirais nas bochechas, os tufos saindo do protetor e o cachecol branco. */
export function choji(): string {
  const hair = '#a65a2a';
  return (
    bg('choji', '#f39a66', '#3a140a') +
    both(po('M38 22L25 5 30 20 19 16 31 32Z', hair)) +
    shoulders('#3f8a55', true) +
    neck() +
    po('M28 78Q50 66 72 78L74 88Q50 79 26 88Z', '#f1ece0') +
    po('M58 82L67 101H55L53 83Z', '#f1ece0') +
    face({ shape: 'wide', eyes: 'dot', browColor: hair, mouth: 'smile', under: both(ln('M36.4 55A2.6 2.6 0 1 1 39 57.6A1.4 1.4 0 1 1 37.8 55.4', '#c0392b', 1.2)) }) +
    po('M30 35C31 23 39 16 50 16S69 23 70 35Q50 27 30 35Z', NAVY) +
    headband('leaf', { y: 31 })
  );
}

/** Kiba: o capuz de pelo, as presas vermelhas do clã no rosto e o sorriso de caninos. */
export function kiba(): string {
  const hood = '#8d9199';
  const fur = '#4a3f3a';
  return (
    bg('kiba', '#c25a60', '#2a0c10') +
    po('M25 64C20 34 30 11 50 11S80 34 75 64L70 80H30Z', hood) +
    torso(hood) +
    po('M30 79L34 72 38 78 42 71 46 78 50 72 54 78 58 71 62 78 66 72 70 79 66 87 60 83 55 89 50 84 45 89 40 83 34 87Z', fur) +
    face({ eyes: 'sharp', iris: '#111', brows: 'angry', browColor: '#5a3a26', mouth: 'fangs', under: both(po('M36 50H41L38.4 60.6Z', '#c0392b', 0.6)) }) +
    headband('leaf', { y: 31 }) +
    po('M28 54L31 45 27 41 31.6 37 29 31 35 29.6 33.6 24 39 24.4 40 18.6 45 21.4 48 15.6 52 20.4 56 15.6 59 21.4 64 18.6 65 24.4 70.4 24 69 29.6 75 31 72.4 37 77 41 73 45 76 54 68.6 45C67.6 31 60 25.6 50 25.6S32.4 31 31.4 45Z', fur)
  );
}

export const KONOHA: Record<string, Art> = {
  naruto: () => naruto(),
  narutoKyuubi: () => naruto('kyuubi'),
  narutoOneTail: () => naruto('oneTail'),
  sasuke: () => sasuke(),
  sasukeSharingan: () => sasuke('sharingan'),
  sasukeCurse: () => sasuke('curse'),
  sasukeHospital: () => sasuke('hospital'),
  sasukeFinal: () => sasuke('final'),
  sasukeCurse2: () => sasuke('curse2'),
  sakura,
  kakashi: () => kakashi(),
  kakashiSharingan: () => kakashi(true),
  iruka,
  neji: () => neji(),
  nejiByakugan: () => neji(true),
  lee,
  shikamaru,
  choji,
  kiba,
  akamaru,
  jiraiya,
  tsunade,
};
