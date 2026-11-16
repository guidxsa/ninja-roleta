// Retratos dos vilões e das invocações: Ondas, Exame chūnin, Som e os bichos gigantes.
import { VILLAGES } from '../villages';
import { type Art, INK, NAVY, PALE, SKIN, STEEL, bg, both, face, headband, kimono, ln, neck, p, po, rope, shade, shine, shoulders, torso, tube, vest } from './kit';

const CAMO = '#8d8a7a';
/** Cachecol camuflado dos genins do Som. */
const camoScarf = (): string =>
  po('M29 79Q50 68 71 79L73 89Q50 80 27 89Z', CAMO) +
  p('M36 78q3-2 5 1-3 2-5-1zM48 75q3-2 5 1-3 2-5-1zM60 79q3-2 5 1-3 2-5-1zM42 82q3-2 5 1-3 2-5-1zM56 83q3-2 5 1-3 2-5-1z', '#4f4d44');
/** Gola preta por baixo da túnica do Som. */
const soundCollar = (): string => po('M35 74Q50 85 65 74L67 80Q50 92 33 80Z', '#2a2a30');
const SOUND_TUNIC = '#d9cba4';

/** Mizuki: cabelo claro até o ombro, a bandana em touca e a shuriken gigante às costas. */
function mizuki(): string {
  const hair = '#b9cfe0';
  return (
    bg('mizuki', '#5a7a42', '#141d10',
      `<g transform="translate(74 30) rotate(20)" fill="#8e98a8" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"><path d="M0-24 5-5 24 0 5 5 0 24-5 5-24 0-5-5z"/><circle r="4" fill="#2a2f3a"/></g>`) +
    po('M30 40C27 54 27 68 31 81H69C73 68 73 54 69 40Z', hair) +
    torso(NAVY) +
    vest() +
    face({ shape: 'slim', eyes: 'sharp', iris: '#3f6a55', brows: 'angry', browColor: '#7f96a8', mouth: 'smirk' }) +
    po('M30.6 36C31 23 39 15.6 50 15.6S69 23 69.4 36Q50 28 30.6 36Z', NAVY) +
    headband('leaf', { y: 31 }) +
    both(po('M33.6 40L30 67 35 60 36.4 42Z', hair, 1))
  );
}

/** Zabuza: sem sobrancelhas, o rosto enfaixado, a bandana de lado e a Kubikiribōchō. `unmasked`: as faixas caídas no pescoço, os dentes pontudos e a kunai na boca. */
function zabuza(unmasked = false): string {
  const skin = '#dcc3a6';
  const wrap = '#ece7dc';
  return (
    bg(unmasked ? 'zabuzaUnmasked' : 'zabuza', unmasked ? '#7a5a5a' : '#5f7384', '#10161c',
      `<g transform="rotate(-28 50 50)"><rect x="56" y="-8" width="27" height="80" rx="2" fill="#b9c2cc" stroke="${INK}" stroke-width="1.4"/><circle cx="75" cy="5" r="5" fill="#5f7384" stroke="${INK}"/><path d="M56 12h7" stroke="${INK}" stroke-width="1.2"/><rect x="63" y="72" width="6" height="24" fill="#4a3a2a" stroke="${INK}"/></g>`) +
    torso(skin, unmasked ? skin : wrap) +
    po('M22 84L78 73 79 79 23 91Z', '#3a3f46') +
    (unmasked ? po('M35 71Q50 80 65 71L67 79Q50 88 33 79Z', wrap) + ln('M36 75Q50 83 64 75M60 78L63 92M57 80L58 96', '#b8b1a2', 0.9) + po('M58 79L62 79 64 96 59 94Z', wrap, 0.9) : '') +
    face({ shape: 'square', skin, eyes: 'sharp', iris: '#3a2a20', brows: 'none', mouth: 'none', nose: !unmasked ? false : undefined }) +
    (unmasked
      ? po('M41.6 58Q50 61 58.4 58Q57.4 65.4 50 66Q42.6 65.4 41.6 58Z', '#3a1418', 1) +
        p('M42.6 58.6L44.6 62.4 46.6 59.6 48.6 63 50.6 60 52.6 63 54.6 59.6 56.6 62.4 57.6 58.6Q50 61 42.6 58.6Z', '#fff') +
        po('M38 60.6L63 59.6 72 61.6 63 63.6 38 62.8Z', STEEL, 0.9) + `<circle cx="35.6" cy="61.7" r="2.4" fill="none" stroke="${INK}" stroke-width="1.3"/>`
      : po('M33 51Q50 55 67 51V54C67 62 59 67.6 50 68.4C41 67.6 33 62 33 54Z', wrap) + ln('M34 56Q50 60 66 56M35.6 61Q50 65 64.4 61M44 67V74M50 68V76', '#b8b1a2', 0.9)) +
    po('M31 38L28 28 34 30 33 20 40 25 43 15 49 23 55 14 58 24 66 18 66 29 72 27 69 38C64 33 58 31 50 31S36 33 31 38Z', '#2a2d36') +
    `<g transform="rotate(-12 50 34)">${headband('mist', { cloth: '#3d4a5a', tails: true })}</g>`
  );
}

/** Haku. `mask`: a máscara de caçador da Névoa. `unmasked`: o rosto à mostra, com o coque e o traje de combate. `civil`: cabelo solto e o quimono rosa de colher ervas. */
function haku(mode: 'mask' | 'unmasked' | 'civil' = 'mask'): string {
  const hair = '#1d2129';
  const civil = mode === 'civil';
  const head =
    mode === 'mask'
      ? po('M33 43C33 30 40 23 50 23S67 30 67 43C67 56 60 67 50 68C40 67 33 56 33 43Z', '#f6f5f1') +
        both(ln('M36 47Q41 43.6 46 47', '#222', 2.4)) +
        both(ln('M38 53.6Q35.4 58 38.4 62', '#c0392b', 1.7)) +
        `<g transform="translate(45.6 28.6) scale(.36)" fill="none" stroke="#7d8696" stroke-width="2.6" stroke-linecap="round">${VILLAGES.mist}</g>`
      : face({ shape: 'slim', iris: '#6a4630', lashes: true, browColor: hair, mouth: civil ? 'smile' : 'neutral', lips: '#b8607a', brows: civil ? 'thin' : 'sad' });
  return (
    (civil
      ? bg('hakuCivil', '#a8d88a', '#14301c', p('M8 20q6-6 10 1-6 4-10-1zM82 14q6-6 10 1-6 4-10-1zM86 60q5-5 8 1-5 3-8-1zM10 66q5-5 8 1-5 3-8-1z', '#e8f6c8', 'opacity=".55"'))
      : bg(mode === 'mask' ? 'haku' : 'hakuUnmasked', '#86d0e6', '#0e2a36',
          `<g fill="#d8f3fb" fill-opacity=".5" stroke="#eafaff" stroke-width=".8"><path d="M4 8h18v28H4zM78 10h18v28H78zM2 52h16v26H2zM82 54h16v26H82z"/></g>`)) +
    po(civil ? 'M30 38C24 58 24 80 27 101H73C76 80 76 58 70 38Z' : 'M30 40C26 58 27 78 31 95H69C73 78 74 58 70 40Z', hair) +
    (civil ? '' : `<circle cx="50" cy="15" r="7.4" fill="#f1ece0" stroke="${INK}" stroke-width="1.2"/>`) +
    torso(civil ? '#f2a9ba' : '#3f7a66') +
    kimono(civil ? '#f2a9ba' : '#3f7a66', civil ? '#c8607a' : '#e8e4d8') +
    (civil
      ? both(ln('M20 90a3 3 0 1 1 3 3M30 96a2.4 2.4 0 1 1 2.4 2.4', '#fbe3ea', 1)) + po('M43 65.6Q50 69.6 57 65.6V68.4Q50 72.4 43 68.4Z', '#2a2a30', 0.6)
      : '') +
    head +
    (civil
      ? po('M50 25C43 26 37 31 35 40L33.4 62 29.6 52C28 30 37 16 50 16S72 30 70.4 52L66.6 62 65 40C63 31 57 26 50 25Z', hair)
      : po('M31 42C30 26 38 17 50 17S70 26 69 42C65 33 58 29 50 29S35 33 31 42Z', hair)) +
    shine('M38 22Q44 18 50 18', '#5a6272') +
    (mode === 'unmasked' ? headband('mist', { cloth: '#3d4a5a', y: 30 }) : '') +
    (civil ? '' : both(po('M33.4 40L30 70 34.6 76 36.6 44Z', hair, 1)) + both(po('M29.6 63H35.6V69.6H29.6Z', '#f1ece0', 0.8)))
  );
}

/** O olho do Shukaku (esquerdo de quem vê): fundo preto, íris amarela, a estrela de quatro pontas e os quatro pontos. */
const shukakuEye = (cx: number, cy: number, r: number): string =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${r * 1.5}" ry="${r * 1.25}" fill="#15151c" stroke="${INK}" stroke-width="1"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#ecc94a"/>` +
  `<path d="M${cx} ${cy - r * 0.8}L${cx + r * 0.22} ${cy - r * 0.22} ${cx + r * 0.8} ${cy} ${cx + r * 0.22} ${cy + r * 0.22} ${cx} ${cy + r * 0.8} ${cx - r * 0.22} ${cy + r * 0.22} ${cx - r * 0.8} ${cy} ${cx - r * 0.22} ${cy - r * 0.22}Z" fill="#111"/>` +
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, y]) => `<circle cx="${cx + x! * r * 0.52}" cy="${cy + y! * r * 0.52}" r="${(r * 0.13).toFixed(2)}" fill="#111"/>`).join('');
const SAND = '#dcb97e';
const SAND_MARK = '#2f4a9a';

/** Gaara: cabelo ruivo, as olheiras, o kanji do amor na testa e a cabaça de areia. `insane`: o olhar arregalado, o sorriso torto e metade do corpo já tomada pelo Shukaku. */
function gaara(insane = false): string {
  const skin = '#f3dcc6';
  const gourd = `<ellipse cx="76" cy="66" rx="20" ry="22" fill="#c9a06a" stroke="${INK}" stroke-width="1.3"/><ellipse cx="76" cy="34" rx="12" ry="11" fill="#c9a06a" stroke="${INK}" stroke-width="1.3"/><rect x="71" y="18" width="10" height="7" rx="2" fill="#a5794a" stroke="${INK}"/>`;
  const sand = p('M16 20h2v2h-2zM24 70h2v2h-2zM12 48h1.6v1.6H12zM88 14h2v2h-2zM8 84h2v2H8z', '#f3d9a6', 'opacity=".7"');
  // Metade Shukaku (à esquerda de quem vê): a areia cobre o rosto, o olho vira o do tanuki e o braço cresce em garra.
  const half = insane
    ? po('M50 23C40 23 33 30 33 43C33 56 40 67 50 68L48 60 51 52 48 44 51 34Z', SAND) +
      ln('M35 36Q41 39 39 45M36 54Q41 57 40 62M46 26V33', SAND_MARK, 1.8) + shukakuEye(41, 47.4, 3.6)
    : '';
  const claw = insane
    ? po('M2 101L5 80 1 62 9 72 12 52 18 70 24 54 26 74 34 64 32 84 36 101Z', SAND) + ln('M8 84Q16 80 14 92M22 78Q28 84 24 94', SAND_MARK, 2)
    : '';
  return (
    bg(insane ? 'gaaraInsane' : 'gaara', insane ? '#a8443a' : '#dcab60', insane ? '#1c0a08' : '#3b2410', gourd + sand) +
    torso('#2e2a30', skin) +
    po('M10 97C12 86 22 78 38 74.6L70 101H10Z', '#ece4d0') +
    po('M24 82L78 95 77 101H62L22 89Z', '#6a4a30') +
    claw +
    face({ skin, eyes: insane ? 'none' : 'ringed', eyesR: insane ? 'mad' : 'ringed', iris: '#6fc9b6', brows: 'none', mouth: insane ? 'none' : 'neutral', under: half }) +
    (insane
      ? po('M40 57Q50 62.6 60 56L61 60.6Q55 67 47 66Q41.6 64 40 57Z', '#3a1418', 1) +
        p('M41 58L43 62 45 59.6 47 63.4 49 60.6 51 64 53 60.6 55 63.6 57 59.6 59 61.6 59.6 57Q50 62 41 58Z', '#fff')
      : '') +
    `<text x="53.6" y="39" font-size="8.4" fill="#b3261e" font-weight="700" font-family="serif">愛</text>` +
    po('M31 43L26 36 31 33 26 25 33 25 31 16 39 21 42 12 48 19 53 11 57 19 64 13 65 22 72 19 70 28 76 28 71 35 74 40 69 43C68 36 66 32 63 30L53 29 48 36 44 30 40 37 37 32C34 34 32 38 31 43Z', '#b3261e') +
    shine('M40 22L42 16M55 20L56 15', '#e8685a', 1.3)
  );
}

/** Shukaku: o tanuki de areia, bojudo, de orelhas pontudas, marcas azuis pelo corpo, olhos de estrela e a bocarra serrilhada. */
function shukaku(): string {
  return (
    bg('shukaku', '#cfa66e', '#3b2410', p('M10 22h2.6v2.6H10zM90 30h2.4v2.4H90zM6 60h2v2H6zM92 56h2v2h-2z', '#f3d9a6', 'opacity=".6"')) +
    po('M66 98C82 98 97 88 97 70C97 58 90 52 83 55C88 62 86 72 74 78Z', SAND) +
    ln('M82 62Q88 66 86 72M76 80Q84 84 88 80', SAND_MARK, 2.2) +
    po('M12 101C10 80 24 62 50 62S90 80 88 101Z', SAND) +
    ln('M26 78Q34 84 28 94M74 78Q66 84 72 94M50 70V88M40 92Q50 98 60 92', SAND_MARK, 2.4) +
    both(po('M27 34L21 9 42 24Z', SAND)) +
    both(p('M28 28L25.6 16 35 23.6Z', shade(SAND, -0.25))) +
    po('M20 44C20 30 33 21 50 21S80 30 80 44C80 58 67 68 50 68S20 58 20 44Z', SAND) +
    both(ln('M22 40Q28 46 24 54M30 26Q36 30 34 35', SAND_MARK, 2.2)) +
    ln('M50 21V31M46 23L50 31 54 23', SAND_MARK, 2) +
    both(shukakuEye(37, 42, 4.8)) +
    p('M48 49h1.6v1.6H48zM50.6 49h1.6v1.6h-1.6z', INK) +
    po('M28 53Q50 61 72 53Q68 66 50 67Q32 66 28 53Z', '#3a1c10', 1.1) +
    p('M30 54.2L33 59.6 36 56.4 39 61.6 42 58.2 45 63 48 59.4 50 63.4 52 59.4 55 63 58 58.2 61 61.6 64 56.4 67 59.6 70 54.2Q50 61 30 54.2Z', '#f6f0dc') +
    p('M36 64L39 60.6 42 65ZM58 65L61 60.6 64 64Z', '#f6f0dc')
  );
}

/** Gamabunta: o sapo chefe, de olhos semicerrados, cicatriz no olho esquerdo, cachimbo aceso, o happi azul e a tantō à cintura. */
function gamabunta(): string {
  const skin = '#b8482c';
  const dark = '#7a2418';
  const belly = '#ecc9a0';
  const eyeG =
    `<circle cx="29" cy="31" r="12.6" fill="${skin}" stroke="${INK}" stroke-width="1.4"/><circle cx="29" cy="32" r="8.4" fill="#f0d264" stroke="${INK}" stroke-width=".9"/><rect x="24" y="30.4" width="10" height="3.4" rx="1.4" fill="#17100f"/>` +
    `<path d="M16.4 31A12.6 12.6 0 0 1 41.6 31Q29 26 16.4 31Z" fill="${dark}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
  return (
    bg('gamabunta', '#b85c3e', '#2a120c', p('M0 88Q22 78 50 82T100 88V100H0Z', '#7a3324', 'opacity=".55"')) +
    po('M10 70L3 44 8 42 16 66Z', '#3a2a1e') + po('M2 40H10L9 46H3Z', '#c9a24a', 0.9) +
    po('M4 101C6 84 20 74 36 72L50 86 64 72C80 74 94 84 96 101Z', '#2a4a9a') +
    p('M40 76L50 86 60 76V101H40Z', belly) +
    both(ln('M36 72L46 101', '#f4f1ea', 2)) +
    `<text x="24" y="95" text-anchor="middle" font-size="9" font-weight="700" fill="#f4f1ea" font-family="serif">蝦</text>` +
    both(eyeG) +
    po('M10 53C10 40 26 31 50 31S90 40 90 53C90 67 74 77 50 77S10 67 10 53Z', skin) +
    p('M16 60Q50 75 84 60Q78 75 50 77Q22 75 16 60Z', belly) +
    both(p('M18 47Q27 42 37 46L35 50.6Q27 47.6 20 51Z', dark)) +
    both(p('M14 58L20 55 19 60ZM40 38h3v3h-3zM24 40h2.4v2.4H24z', dark)) +
    ln('M14 58Q50 73 86 58', INK, 2.4) +
    p('M44 50h2.4v2H44zM53.6 50H56v2h-2.4z', INK) +
    ln('M63 14L79 46', dark, 3) + ln('M63 14L79 46', '#e89a7a', 0.9) +
    tube('M66 64L86 55', 2.6, '#6e4423') +
    po('M83 46H93L91.6 57H84.4Z', '#6e4423') +
    ln('M88 43Q92 37 87 31Q83 26 88 20', '#eeeeee', 1.8, 'opacity=".7"')
  );
}

/** Gamabunta transformado na Kyuubi: orelhas longas, olhos de fenda, o rosnado e as nove caudas em leque. A cicatriz e o cachimbo denunciam quem está por baixo. */
function foxHenge(): string {
  const fur = '#e2692a';
  const dark = '#1b1210';
  // Nove caudas, uma a cada 19°, saindo de trás do corpo.
  const tails = Array.from({ length: 9 }, (_, i) =>
    `<path d="M-5.4 0C-10 -26-8-50-1-72C1-66 0-60 2-56C8-40 9-20 5.4 0Z" transform="translate(50 88) rotate(${(i - 4) * 20}) scale(1.16)" fill="${i % 2 ? '#d4581f' : '#ec7a34'}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`).join('');
  return (
    bg('foxHenge', '#e47c40', '#2a0f08', tails) +
    po('M27 101C27 84 36 73 50 73S73 84 73 101Z', fur) +
    po('M30 46L22 10 41 31Q50 27 59 31L78 10 70 46C72 57 64 70 50 79C36 70 28 57 30 46Z', fur) +
    both(p('M29 34L25.6 18 36 30Z', dark)) +
    both(p('M32 43L45.6 49.6 42 55.4 35 53 30 36Z', dark)) +
    both(p('M35.6 47L44 51 37.6 53.2Z', '#f0332a') + ln('M39.6 48.6V52.6', '#111', 1.2)) +
    p('M44 60Q50 57 56 60L54 66H46Z', shade(fur, -0.15)) +
    p('M47.4 63.6H52.6L50 66.6Z', dark) +
    po('M39 67Q50 63 61 67L58.6 74Q50 78 41.4 74Z', '#3a0f0a', 1) +
    p('M40 67.4L42.4 72 44.6 68.4 47 72.6 50 69 53 72.6 55.4 68.4 57.6 72 60 67.4Q50 64 40 67.4Z', '#fff') +
    ln('M61 34L70 54', '#7a2418', 2.4) +
    tube('M59 72L76 67', 2.4, '#6e4423') +
    po('M74 59H82L81 68.6H75Z', '#6e4423') +
    ln('M78 56Q81 51 77 46', '#eeeeee', 1.6, 'opacity=".7"')
  );
}

/** Olhos da marca da maldição nível 2: o branco fica preto e a íris, amarela. */
const CURSE_EYES = { eyes: 'sharp', sclera: '#17100f', iris: '#f0cc3a' } as const;
const curseBg = (id: string): string =>
  bg(id, '#7a3a8a', '#12061a', ln('M8 96Q2 66 16 42M92 96Q98 66 84 42M22 26Q32 10 50 6M78 26Q68 10 50 6', '#c88af0', 2, 'opacity=".5"'));

/** Jirobo: o grandalhão de moicano laranja e tufos nas laterais. `curse`: nível 2, pele vermelha, juba e calombos. */
function jirobo(curse = false): string {
  const skin = curse ? '#b8503a' : '#e8b98a';
  const hair = curse ? '#f08a2a' : '#e07a24';
  return (
    (curse ? curseBg('jiroboCurse') : bg('jirobo', '#8f6e3e', '#24170a', p('M0 80L14 62 24 72 32 58 46 80ZM60 82L72 66 82 74 90 62 100 82Z', '#5e4524', 'opacity=".7"'))) +
    (curse ? po('M28 40L14 34 20 46 8 52 20 58 10 70 24 70 22 84H78L76 70 90 70 80 58 92 52 80 46 86 34 72 40 66 20 50 26 34 20Z', hair) : '') +
    shoulders(curse ? skin : SOUND_TUNIC, true) +
    (curse ? both(p('M12 84a3 3 0 1 0 .1 0zM22 78a2.4 2.4 0 1 0 .1 0zM30 88a2 2 0 1 0 .1 0z', shade(skin, -0.25))) : '') +
    neck(skin) +
    (curse ? '' : soundCollar()) +
    rope() +
    both(po('M31 42L22 31 29 33 26 23 36 31Z', hair)) +
    face({ shape: 'wide', skin, ...(curse ? CURSE_EYES : { eyes: 'sharp', iris: '#b0763a' }), brows: 'angry', browColor: curse ? '#7a2a1c' : '#c0661e', mouth: curse ? 'fangs' : 'frown',
      under: curse ? p('M38 30a2 2 0 1 0 .1 0zM50 27a2.4 2.4 0 1 0 .1 0zM62 30a2 2 0 1 0 .1 0zM34 58a1.6 1.6 0 1 0 .1 0zM66 58a1.6 1.6 0 1 0 .1 0z', shade(skin, -0.28)) : '' }) +
    po('M43 28L41 12 47 19 50 7 53 19 59 12 57 28Z', hair)
  );
}

/** Kidōmaru: pele escura, seis braços, o rabo de cavalo espetado e a teia. `curse`: nível 2, chifres, cabelo longo e o terceiro olho aberto. */
function kidomaru(curse = false): string {
  const skin = curse ? '#8a4630' : '#a8744a';
  const hair = curse ? '#b8b0a8' : '#221c1a';
  // Um braço extra: ombro, cotovelo e punho em traço grosso, com a mão aberta na ponta.
  const arm = (d: string, hx: number, hy: number, rot: number): string =>
    tube(d, 6.4, skin) +
    `<g transform="translate(${hx} ${hy}) rotate(${rot})"><path d="M-4 1.6C-4.6-3-3-5.6 0-5.6S4.6-3 4 1.6Z" fill="${skin}" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/><path d="M-3.4-4L-4.6-9.4M-1.2-5.4L-1.6-11M1.2-5.4L1.6-11M3.4-4L4.6-9.4" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M-3.4-4L-4.6-9.4M-1.2-5.4L-1.6-11M1.2-5.4L1.6-11M3.4-4L4.6-9.4" stroke="${skin}" stroke-width="1.6" stroke-linecap="round"/></g>`;
  const arms = both(arm('M27 82L11 70 15 50', 15, 47, -8) + arm('M25 92L7 93 5 76', 5, 73, -14));
  return (
    (curse ? curseBg('kidomaruCurse') : bg('kidomaru', '#444c34', '#121509')) +
    `<g stroke="#e9eadf" stroke-opacity=".4" stroke-width=".8" fill="none"><path d="M0 0l40 40M100 0 60 40M0 100l40-60M100 100 60 40M50 0v40"/><path d="M18 18q32-10 64 0M8 34q42-10 84 0M6 54q44-8 88 0"/><path d="M15 38H85"/></g>` +
    (curse ? po('M30 38C25 54 26 70 30 84H70C74 70 75 54 70 38Z', hair) : po('M43 23L40 6 47 12 50 2 53 12 60 6 57 23Z', hair)) +
    arms +
    torso(curse ? skin : SOUND_TUNIC, skin) +
    (curse ? '' : soundCollar()) +
    rope() +
    (curse ? both(po('M38 26L33 8 44 22Z', '#d8d0c0')) : '') +
    face({ skin, ...(curse ? CURSE_EYES : { eyes: 'sharp', iris: '#2b2b33' }), brows: 'angry', mouth: curse ? 'fangs' : 'grin',
      under: curse ? p('M45 33Q50 29 55 33Q50 37 45 33Z', '#17100f') + `<circle cx="50" cy="33" r="1.7" fill="#f0cc3a"/><circle cx="50" cy="33" r=".7" fill="#111"/>` : '' }) +
    (curse
      ? po('M31 42C30 27 38 18 50 18S70 27 69 42C67 34 62 29 56 27L50 30 44 27C38 29 33 34 31 42Z', hair)
      : po('M31 41C30 26 38 17 50 17S70 26 69 41C66 35 62 33 58 32L50 31 42 32C38 33 34 35 31 41Z', hair) + headband('sound', { cloth: '#2a2a30' }))
  );
}

/** Tayuya: cabelo vermelho comprido, a touca preta e a flauta. `curse`: nível 2, pele escura e a coroa de chifres. */
function tayuya(curse = false): string {
  const hair = curse ? '#c8a0b0' : '#b8283a';
  const skin = curse ? '#7a4a36' : SKIN;
  return (
    (curse ? curseBg('tayuyaCurse') : bg('tayuya', '#74304f', '#1a0a14', ln('M10 22q4-4 8 0M78 18q4-4 8 0M14 62q4-4 8 0', '#f2c4dc', 1.4, 'opacity=".5"'))) +
    po('M29 40C23 58 23 80 26 101H74C77 80 77 58 71 40Z', hair) +
    torso(SOUND_TUNIC, skin) +
    soundCollar() +
    rope() +
    (curse ? po('M34 30L27 8 40 24ZM44 24L42 2 50 20ZM56 24L58 2 50 20ZM66 30L73 8 60 24Z', '#d8cdb8') : '') +
    face({ skin, ...(curse ? CURSE_EYES : { eyes: 'sharp', iris: '#6a4a2a' }), brows: 'angry', browColor: curse ? '#3a1c14' : '#8a1c2c', mouth: curse ? 'fangs' : 'frown' }) +
    po('M50 30C44 31 38 36 36 44L34 63 30.6 50C29 34 37 22 50 22S71 34 69.4 50L66 63 64 44C62 36 56 31 50 30Z', shade(hair, 0.14)) +
    (curse ? '' : po('M31 35C31 22 39 14 50 14S69 22 69 35Q50 26 31 35Z', '#1f1a1c') + ln('M32.6 31.6Q50 23 67.4 31.6', '#e6e1d6', 2.6)) +
    `<g transform="rotate(-9 54 62)"><rect x="36" y="60" width="44" height="4" rx="2" fill="#d9dde3" stroke="${INK}" stroke-width=".8"/><path d="M62 62h.1M67 62h.1M72 62h.1" stroke="#596172" stroke-width="1.8" stroke-linecap="round"/></g>`
  );
}

/** Sakon: a franja sobre um olho, o batom azul-esverdeado, o colar de contas e a cabeça do Ukon saindo da nuca. `curse`: nível 2, pele vermelha e um chifre em cada irmão. */
function sakon(curse = false): string {
  const skin = curse ? '#b8483a' : '#e6dccd';
  const hair = curse ? '#e6e2da' : '#aebbc6';
  const lips = curse ? '#3a1418' : '#3f8f8a';
  const fringe = 'M31 46C29 28 37 16 50 16S71 28 69 44L66.4 51 65 40C60 36 56 32 54 28 52 38 48 48 42 54L34 57 32.4 52Z';
  const eyes = curse ? CURSE_EYES : ({ eyes: 'sharp', iris: '#2b2b33' } as const);
  // O Ukon dorme na nuca do irmão: a mesma cabeça, virada para o outro lado, com o olho fechado.
  const ukon =
    `<g transform="translate(27 -7) rotate(14 50 60)">` +
    `<g transform="matrix(-1 0 0 1 100 0)">${face({ shape: 'slim', skin: shade(skin, -0.08), eyes: 'closed', mouth: 'neutral', lips, brows: 'thin' })}${po(fringe, shade(hair, -0.14))}${curse ? po('M56 24L62 6 64 26Z', '#d8cdb8') : ''}</g></g>`;
  return (
    (curse ? curseBg('sakonCurse') : bg('sakon', '#527078', '#0f1a1e')) +
    ukon +
    torso(SOUND_TUNIC, skin) +
    soundCollar() +
    rope() +
    `<g fill="#b3261e" stroke="${INK}" stroke-width=".6"><circle cx="36" cy="77" r="2.3"/><circle cx="41" cy="80.6" r="2.3"/><circle cx="46.6" cy="82.6" r="2.3"/><circle cx="52.6" cy="82.6" r="2.3"/><circle cx="58.4" cy="80.6" r="2.3"/><circle cx="63.6" cy="77" r="2.3"/></g>` +
    (curse ? po('M56 24L62 6 64 26Z', '#d8cdb8') : '') +
    face({ shape: 'slim', skin, ...eyes, eyes: 'none', eyesR: 'sharp', mouth: 'smirk', lips, brows: 'thin' }) +
    po(fringe, hair) +
    shine('M40 24Q46 19 52 19', '#fff', 1.3)
  );
}

/** Orochimaru: a cabeça inclinada, os olhos de cobra arregalados, o sorriso com a língua comprida, o cabelo escorrendo sobre o rosto e a cobra de boca aberta. */
function orochimaru(): string {
  const hair = '#141416';
  const coil = 'M88 101C88 80 73 76 73 60 73 46 91 44 91 28';
  return (
    bg('orochimaru', '#42543a', '#0b100a',
      tube(coil, 10, '#6a3f8f') + ln(coil, '#8d5fb5', 3, 'stroke-dasharray="2 5"') +
      po('M80 30C78 18 84 8 92 8S100 16 100 26L92 22Z', '#6a3f8f') + po('M82 30L92 22 100 28C98 36 90 38 84 36Z', '#4a2a68') +
      p('M85 30L86.6 35 88.4 30.4ZM95 28L94.4 33 92.6 28.6Z', '#fff') + `<circle cx="89" cy="15" r="1.7" fill="#f0cc3a"/>` + ln('M89 13.6V16.4', '#111', 0.8)) +
    po('M29 38C24 58 24 80 26 101H74C76 80 76 58 71 38Z', hair) +
    torso('#e7dfc8', PALE) +
    soundCollar() +
    rope() +
    `<g transform="rotate(-6 50 66)">` +
    face({ shape: 'slim', skin: PALE, eyes: 'snake', brows: 'angry', browColor: '#3a2a4a', mouth: 'none' }) +
    p('M50 23C40 23 33 30 33 42C33 53 39 62 45 66L48 67.6 47 62 50 54 48 40Z', '#3a2a5a', 'opacity=".13"') +
    po('M40 57.6Q50 62.6 60 56.6Q58.6 65.6 50 66.4Q42 65.6 40 57.6Z', '#3a1420', 1) +
    p('M41 58.4Q50 62.6 59.4 57.6L58.8 59.6Q50 64 41.6 60.4Z', '#fff') +
    po('M47.6 62C46.6 70 50 76 46 86 49 84 53.6 78 54 70 54.2 66 53.6 63.6 53 62Z', '#d0506a', 1) +
    ln('M50 64Q50.6 72 48.6 80', '#8a2a44', 0.8) +
    both(po('M30.6 54Q33.6 56.6 31.6 61Q28.6 58.6 30.6 54Z', '#3f6aa8', 0.7)) +
    po('M50 24C43 26 37 31 35 40L33.6 71 29.6 60C28 34 36 16 50 16S72 34 70.4 60L66.4 71 65 40C63 31 57 26 50 24Z', hair) +
    po('M52 22C58 28 62 38 61 52L64.6 44C65 34 61 26 54 21Z', hair, 1) +
    shine('M38 22Q44 18 50 18', '#5a5a66') +
    `</g>`
  );
}

/** A cobra gigante das invocações: enrolada, de cabeça erguida, a boca aberta com as presas e a língua bifurcada. */
function snake(): string {
  const skin = '#7a5a94';
  const dark = '#4a3264';
  const coilA = 'M-6 92C8 74 40 74 58 84S92 100 106 90';
  const coilB = 'M30 100C14 86 22 66 40 60C56 55 64 48 60 34';
  const scales = 'stroke-dasharray=".1 7"';
  return (
    bg('snake', '#4a5a3a', '#0b100a') +
    tube(coilA, 20, skin) + ln(coilA, dark, 5, scales) + ln('M-6 99C8 82 40 82 58 92S92 106 106 97', '#e2d6b8', 4, 'opacity=".8"') +
    tube(coilB, 17, skin) + ln(coilB, dark, 5, scales) +
    // Mandíbula de baixo, por dentro da boca.
    po('M46 34C48 50 60 56 74 50C80 47 84 40 83 33C72 40 58 40 46 34Z', '#5a1420') +
    p('M52 40L54.4 47 57 41ZM76 38L74.6 45 72 39.4Z', '#fff') +
    ln('M64 44C64 54 59 58 55 63M59 58L61.6 65', '#e0506a', 1.8) +
    // Cabeça triangular, vista de cima e de frente.
    po('M42 30C40 16 52 6 66 6C80 6 90 16 86 28C84 35 76 38 66 38C56 39 44 38 42 30Z', skin) +
    p('M56 12Q66 8 76 12Q66 20 56 12Z', shade(skin, 0.18)) +
    ln('M50 14Q54 20 52 26M82 14Q78 20 80 26M60 8L64 14 68 8', dark, 1.6) +
    po('M48 24Q54 17 61 23Q54 27 48 24Z', '#f0cc3a', 1) + ln('M54.6 20.4V25.6', '#111', 1.6) +
    po('M71 23Q78 17 84 24Q78 27 71 23Z', '#f0cc3a', 1) + ln('M77.4 20.4V25.6', '#111', 1.6) +
    ln('M46 21Q54 14 62 21M70 21Q78 14 86 21', INK, 1.6) +
    p('M62 31h1.6v2H62zM69 31h1.6v2H69z', INK) +
    p('M50 35L52 43 55 36.6ZM79 34L78 42 75 35.6Z', '#fff')
  );
}

/** Um Irmão Demônio (sem fundo): juba solta, respirador, garra e o protetor de chifres (Gōzu um, Meizu dois). */
function brother(horns: 1 | 2): string {
  const hair = '#1d2a33';
  const skin = '#e2c4a2';
  return (
    po('M29 45L17 41 26 34 16 26 28 26 23 14 34 20 37 8 45 18 50 7 55 18 63 8 66 20 77 14 72 26 84 26 74 34 83 41 71 45Z', hair) +
    torso(horns === 1 ? '#3f4a3a' : '#3a3f4a', skin) +
    po('M28 80Q50 68 72 80L70 91Q50 80 30 91Z', '#25282a') +
    po('M70 101L72 85 78 78 80 87 84 76 87 87 91 78 92 101Z', STEEL) +
    face({ skin, eyes: 'sharp', iris: '#2b2b33', brows: 'angry', mouth: 'none', nose: false }) +
    po('M34 52H66V61Q50 70 34 61Z', '#2a2f36') +
    `<circle cx="50" cy="58.6" r="4.4" fill="#5b6470" stroke="${INK}"/>` +
    ln('M38 57H43.6M56.4 57H62M48 58.6H52', '#8d96a4', 1.1) +
    po('M31 40L33 26 38 33 42 24 46 32 50 25 54 32 58 24 62 33 67 26 69 40Q50 31 31 40Z', hair) +
    (horns === 1 ? po('M45.6 28L50 10 54.4 28Z', STEEL) : both(po('M38 29L35 11 46 27Z', STEEL))) +
    headband('mist', { cloth: '#2f3a48', y: 31 })
  );
}
const brotherBg = (id: string): string => bg(id, '#607486', '#0e141a', ln('M0 22Q30 12 56 24T100 20M0 70Q24 62 50 72T100 66', '#c9d6e0', 2, 'opacity=".25"'));

/** Dosu: o rosto todo enfaixado com um olho de fora, a capa de pelo e o braço de metal. */
function dosu(): string {
  return (
    bg('dosu', '#62597a', '#14111e') +
    po('M10 101C8 76 22 58 38 55L24 60 30 50 18 52 28 42 44 45 60 45 72 42 82 52 70 50 76 60 62 55C78 58 92 76 90 101Z', '#8a7a5a') +
    torso('#6a6a72', '#e9e4d8') +
    camoScarf() +
    po('M70 101V86Q80 79 91 86V101Z', '#9aa2ae') +
    p('M75 90h3v3h-3zM81 88h3v3h-3zM86 92h3v3h-3zM78 95h3v3h-3z', '#3a3f48') +
    face({ skin: '#e9e4d8', eyes: 'none', brows: 'none', mouth: 'none', nose: false, ears: false }) +
    ln('M33.6 40Q50 45 66.4 40M33 50Q42 53 51 51M34.6 58Q50 63 65.4 58M40 65Q50 68 60 65M44 24L48 40M58 26L52 40', '#b8b1a2', 0.9) +
    p('M52.6 45Q59 40.6 65.6 45.6Q59 51 52.6 48Z', '#2a2228') +
    `<circle cx="59" cy="46.6" r="2.2" fill="#fff"/><circle cx="59" cy="46.6" r="1" fill="#111"/>` +
    po('M40 27L38 14 44 20 48 10 52 20 58 12 60 27Z', '#2a2a30') +
    headband('sound')
  );
}

/** Zaku: cabelo espetado para cima, o protetor que desce pelas bochechas e o sorriso convencido. */
function zaku(): string {
  const guard = '#9aa2ae';
  return (
    bg('zaku', '#7a6a5a', '#14100c', ln('M4 30H22M2 40H18M78 26H96M82 36H98', '#e6dcc8', 1.6, 'opacity=".4"')) +
    torso('#d8d0c0') +
    ln('M30 92V100M34 90V100M66 90V100M70 92V100', '#2a2a30', 1.6) +
    camoScarf() +
    face({ eyes: 'sharp', iris: '#2b2b33', brows: 'angry', mouth: 'smirk' }) +
    po('M32 34L29 18 36 24 38 9 45 20 50 6 55 20 62 9 64 24 71 18 68 34Q50 26 32 34Z', '#1f1f26') +
    both(po('M31.6 37L36.4 39 37 56 33.4 61 30.6 50Z', guard, 1)) +
    headband('sound', { cloth: guard })
  );
}

/** Kin: cabelo preto que desce até o chão, os sinos e as agulhas. */
function kin(): string {
  const hair = '#17171c';
  return (
    bg('kin', '#7a5a8a', '#160e1c',
      ln('M82 6V26M14 10L26 30M10 18L22 38', '#d9dde3', 1) + `<circle cx="82" cy="30" r="4.4" fill="#e8c23a" stroke="${INK}"/><circle cx="82" cy="31.6" r="1" fill="${INK}"/>`) +
    po('M29 36C22 60 22 84 24 101H76C78 84 78 60 71 36Z', hair) +
    torso('#8a9a72') +
    camoScarf() +
    face({ eyes: 'sharp', iris: '#2b2b33', mouth: 'smirk', lips: '#a8506a' }) +
    po('M31 42C30 26 38 16 50 16S70 26 69 42C66 34 60 30 50 28 40 30 34 34 31 42Z', hair) +
    headband('sound') +
    both(po('M34.4 37L30 66 33.6 72 36.6 42Z', hair, 1))
  );
}


/** Kimimaro: cabelo branco de risca em zigue-zague, os dois pontos vermelhos na testa e os ossos saindo dos ombros. */
function kimimaro(): string {
  const hair = '#f2f2f0';
  return (
    bg('kimimaro', '#bdb6cd', '#1a1626') +
    both(po('M24 82L13 60 18 57 30 78Z', '#f6f2e4') + po('M16 92L4 76 9 73 21 88Z', '#f6f2e4')) +
    torso('#d9d2e6', PALE) +
    p('M41 74L50 97 59 74Z', PALE) +
    ln('M41 74L50 97 59 74', INK, 1.2) +
    rope() +
    face({ shape: 'slim', skin: PALE, eyes: 'sharp', iris: '#3f9a6a', brows: 'none', mouth: 'neutral',
      under: `<circle cx="46.4" cy="33.6" r="1.6" fill="#c0392b"/><circle cx="53.6" cy="33.6" r="1.6" fill="#c0392b"/>` + both(ln('M36 49.8Q41 52 46.4 49.8', '#c0392b', 1.1)) }) +
    po('M50 21L47 25 50 28 45 30C40 31 37 34 35 40L33 62 29.6 50C28 32 36 16 50 16S72 32 70.4 50L67 62 65 40C63 34 60 31 55 30L50 28 53 25Z', hair) +
    both(po('M31.4 55H36.6V63.6H31.4Z', '#c0392b', 0.8))
  );
}

/** Kabuto: cabelo grisalho preso, óculos redondos e o roxo. `spy`: o genin simpático da Folha no Exame. */
function kabuto(spy = false): string {
  const hair = '#c3c7d0';
  return (
    bg(spy ? 'kabutoSpy' : 'kabuto', spy ? '#7f9a6a' : '#62438c', spy ? '#141c10' : '#150b22') +
    po('M61 29C74 31 81 46 77 63L70 51 65 40Z', hair) +
    torso('#5b3d86') +
    po('M34 74Q50 85 66 74L68 80Q50 92 32 80Z', '#e8e4ee') +
    face({ eyes: spy ? 'happy' : 'sharp', iris: '#2b2b33', browColor: '#8d939d', mouth: spy ? 'smile' : 'smirk' }) +
    both(`<circle cx="41" cy="47" r="6.6" fill="#dfe8f5" fill-opacity="${spy ? 0.3 : 0.5}" stroke="${INK}" stroke-width="1.5"/>`) +
    ln('M47.6 47H52.4', INK, 1.4) +
    both(ln('M37.4 44L40.6 41.6', '#fff', 1.4)) +
    po('M31 41C30 26 38 17 50 17S70 26 69 41C67 36 63 32 57 31L50 36 43 31C37 32 33 36 31 41Z', hair) +
    both(po('M33.6 39L31 58 35.4 52 36.4 41Z', hair, 1)) +
    headband(spy ? 'leaf' : 'sound', { y: 29 })
  );
}

export const VILLAINS: Record<string, Art> = {
  mizuki,
  zabuza: () => zabuza(),
  zabuzaUnmasked: () => zabuza(true),
  haku: () => haku(),
  hakuUnmasked: () => haku('unmasked'),
  hakuCivil: () => haku('civil'),
  gozu: () => brotherBg('gozu') + brother(1),
  meizu: () => brotherBg('meizu') + brother(2),
  demonBrothers: () => brotherBg('demonBrothers') + `<g transform="translate(-16 12) scale(.84)">${brother(1)}</g><g transform="translate(34 2) scale(.84)">${brother(2)}</g>`,
  gaara: () => gaara(),
  gaaraInsane: () => gaara(true),
  shukaku,
  gamabunta,
  foxHenge,
  dosu,
  zaku,
  kin,
  jirobo: () => jirobo(),
  jiroboCurse: () => jirobo(true),
  kidomaru: () => kidomaru(),
  kidomaruCurse: () => kidomaru(true),
  tayuya: () => tayuya(),
  tayuyaCurse: () => tayuya(true),
  sakon: () => sakon(),
  sakonCurse: () => sakon(true),
  kimimaro,
  kabuto: () => kabuto(),
  kabutoSpy: () => kabuto(true),
  orochimaru,
  snake,
};
