// Retratos dos vilões e das invocações: Ondas, Exame chūnin, Som e os bichos gigantes.
import { VILLAGES } from '../villages';
import { type Art, INK, NAVY, PALE, STEEL, bg, both, face, headband, kimono, ln, neck, p, po, rope, shade, shoulders, torso, vest } from './kit';

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

/** Zabuza: sem sobrancelhas, o rosto enfaixado, a bandana de lado e a Kubikiribōchō. */
function zabuza(): string {
  const skin = '#dcc3a6';
  const wrap = '#ece7dc';
  return (
    bg('zabuza', '#5f7384', '#10161c',
      `<g transform="rotate(-28 50 50)"><rect x="56" y="-8" width="27" height="80" rx="2" fill="#b9c2cc" stroke="${INK}" stroke-width="1.4"/><circle cx="75" cy="5" r="5" fill="#5f7384" stroke="${INK}"/><path d="M56 12h7" stroke="${INK}" stroke-width="1.2"/><rect x="63" y="72" width="6" height="24" fill="#4a3a2a" stroke="${INK}"/></g>`) +
    torso(skin, wrap) +
    po('M22 84L78 73 79 79 23 91Z', '#3a3f46') +
    face({ shape: 'square', skin, eyes: 'sharp', iris: '#3a2a20', brows: 'none', mouth: 'none', nose: false }) +
    po('M33 51Q50 55 67 51V54C67 62 59 67.6 50 68.4C41 67.6 33 62 33 54Z', wrap) +
    ln('M34 56Q50 60 66 56M35.6 61Q50 65 64.4 61M44 66V74M50 68V76', '#b8b1a2', 0.9) +
    po('M31 38L28 28 34 30 33 20 40 25 43 15 49 23 55 14 58 24 66 18 66 29 72 27 69 38C64 33 58 31 50 31S36 33 31 38Z', '#2a2d36') +
    `<g transform="rotate(-12 50 34)">${headband('mist', { cloth: '#3d4a5a', tails: true })}</g>`
  );
}

/** Haku: a máscara de caçador da Névoa, o coque coberto e as duas mechas presas. */
function haku(): string {
  const hair = '#1d2129';
  return (
    bg('haku', '#86d0e6', '#0e2a36',
      `<g fill="#d8f3fb" fill-opacity=".5" stroke="#eafaff" stroke-width=".8"><path d="M4 8h18v28H4zM78 10h18v28H78zM2 52h16v26H2zM82 54h16v26H82z"/></g>`) +
    po('M30 40C26 58 27 78 31 95H69C73 78 74 58 70 40Z', hair) +
    `<circle cx="50" cy="15" r="7.4" fill="#f1ece0" stroke="${INK}" stroke-width="1.2"/>` +
    torso('#3f7a66') +
    kimono('#3f7a66', '#e8e4d8') +
    po('M33 43C33 30 40 23 50 23S67 30 67 43C67 56 60 67 50 68C40 67 33 56 33 43Z', '#f6f5f1') +
    both(ln('M36 47Q41 43.6 46 47', '#222', 2.4)) +
    both(ln('M38 53.6Q35.4 59 38.4 63.4', '#c0392b', 1.7)) +
    `<g transform="translate(45.6 28.6) scale(.36)" fill="none" stroke="#7d8696" stroke-width="2.6" stroke-linecap="round">${VILLAGES.mist}</g>` +
    po('M31 42C30 26 38 17 50 17S70 26 69 42C65 33 58 29 50 29S35 33 31 42Z', hair) +
    both(po('M33.4 40L30 70 34.6 76 36.6 44Z', hair, 1)) +
    both(po('M29.6 63H35.6V69.6H29.6Z', '#f1ece0', 0.8))
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

/** Gaara: cabelo ruivo, as olheiras, o kanji do amor na testa e a cabaça de areia. `weak`: a armadura de areia rachando. */
function gaara(weak = false): string {
  const skin = weak ? '#e8cfa8' : '#f3dcc6';
  const gourd = `<ellipse cx="76" cy="66" rx="20" ry="22" fill="#c9a06a" stroke="${INK}" stroke-width="1.3"/><ellipse cx="76" cy="34" rx="12" ry="11" fill="#c9a06a" stroke="${INK}" stroke-width="1.3"/><rect x="71" y="18" width="10" height="7" rx="2" fill="#a5794a" stroke="${INK}"/>`;
  const sand = p('M16 20h2v2h-2zM24 70h2v2h-2zM12 48h1.6v1.6H12zM88 14h2v2h-2zM8 84h2v2H8z', '#f3d9a6', 'opacity=".7"');
  return (
    bg(weak ? 'gaaraWeak' : 'gaara', weak ? '#9a7a52' : '#dcab60', weak ? '#1c120a' : '#3b2410', gourd + sand) +
    torso('#2e2a30', skin) +
    po('M10 97C12 86 22 78 38 74.6L70 101H10Z', '#ece4d0') +
    po('M24 82L78 95 77 101H62L22 89Z', '#6a4a30') +
    face({ skin, eyes: 'ringed', iris: '#6fc9b6', brows: 'none', mouth: weak ? 'frown' : 'neutral',
      under: weak ? ln('M38 28L42 39 39 44M61 52L64.6 60 61.6 66M34 56L38 62', '#8a6a48', 1.1) + p('M61.6 66L66 62 65 58Z', '#c9a06a') : '' }) +
    `<text x="53.6" y="39" font-size="8.4" fill="#b3261e" font-weight="700" font-family="serif">愛</text>` +
    po('M31 43L26 36 31 33 26 25 33 25 31 16 39 21 42 12 48 19 53 11 57 19 64 13 65 22 72 19 70 28 76 28 71 35 74 40 69 43C68 36 66 32 63 30L53 29 48 36 44 30 40 37 37 32C34 34 32 38 31 43Z', '#b3261e')
  );
}

/** Shukaku: o tanuki de areia com as marcas azuis e a pupila em estrela. */
function shukaku(): string {
  const body = '#dcb47c';
  const eyeS = `<circle cx="39" cy="43" r="5.6" fill="#f6e9a0" stroke="${INK}" stroke-width="1.1"/><path d="M39 39.6L40 42 42.4 43 40 44 39 46.4 38 44 35.6 43 38 42Z" fill="#111"/>`;
  return (
    bg('shukaku', '#cfa66e', '#3b2410', p('M14 22h2.6v2.6H14zM86 30h2.4v2.4H86zM20 76h2v2h-2z', '#f3d9a6', 'opacity=".6"')) +
    po('M14 101C14 70 30 50 50 50S86 70 86 101Z', body) +
    both(po('M24 32L31 12 41 27Z', body)) +
    po('M25 45C25 31 36 23 50 23S75 31 75 45C75 58 64 66 50 66S25 58 25 45Z', body) +
    both(ln('M29 35Q36 39 33.6 47M34 72Q41 79 34.6 86', '#3a5fa0', 2.4)) +
    ln('M50 68V82M50 26V33', '#3a5fa0', 2.4) +
    both(eyeS) +
    po('M38 55Q50 61 62 55L60 60Q50 65 40 60Z', '#3a1c10', 1) +
    p('M41 57L43 60.6 45 57.6 47 61.6 49 58.4 51 61.6 53 58.4 55 61.6 57 57.6 59 57Q50 61 41 57Z', '#fff')
  );
}

/** Gamabunta: o sapo chefe, de cachimbo, cicatriz no olho e o happi azul. */
function gamabunta(): string {
  const skin = '#c2552f';
  const eyeG = `<circle cx="30" cy="38" r="11.4" fill="${skin}" stroke="${INK}" stroke-width="1.3"/><circle cx="30" cy="38" r="6.4" fill="#f3d36b" stroke="${INK}" stroke-width=".8"/><rect x="28.8" y="33" width="2.4" height="10" fill="#1b1b22"/>`;
  return (
    bg('gamabunta', '#b85c3e', '#2a120c', p('M0 86Q22 74 50 78T100 86V100H0Z', '#7a3324', 'opacity=".55"')) +
    `<ellipse cx="50" cy="70" rx="41" ry="29" fill="${skin}" stroke="${INK}" stroke-width="1.4"/>` +
    `<ellipse cx="50" cy="76" rx="27" ry="13" fill="#e8b48a"/>` +
    po('M8 101C10 88 20 82 32 82L50 94 68 82C80 82 90 88 92 101Z', '#2f4d9c') +
    both(eyeG) +
    ln('M64 27L77 49', INK, 2.4) +
    ln('M27 60Q50 71 73 60', INK, 2.2) +
    ln('M66 63L83 57', '#6e4423', 3.4) +
    `<rect x="81" y="50" width="8" height="9" rx="2" fill="#6e4423" stroke="${INK}"/>` +
    ln('M84 46Q87 40 84 33', '#e6e6e6', 1.6, 'opacity=".75"') +
    p('M22 56h3v3h-3zM74 54h3v3h-3zM46 52h2.6v2.6H46z', '#8a3520')
  );
}

/** Gamabunta transformado em raposa de nove caudas: a cicatriz e o cachimbo denunciam quem está por baixo. */
function foxHenge(): string {
  const fur = '#d9642a';
  return (
    bg('foxHenge', '#e47c40', '#2a0f08',
      `<g fill="#c9531f" stroke="${INK}" stroke-width="1" stroke-linejoin="round"><path d="M50 78C20 70 4 46 6 18 14 34 26 48 50 62Z"/><path d="M50 78C30 62 22 36 28 8 32 26 40 42 50 62Z"/><path d="M50 78C44 56 44 30 50 4 56 30 56 56 50 78Z"/><path d="M50 78C70 62 78 36 72 8 68 26 60 42 50 62Z"/><path d="M50 78C80 70 96 46 94 18 86 34 74 48 50 62Z"/></g>`) +
    po('M22 101C24 74 34 60 50 60S76 74 78 101Z', fur) +
    both(po('M28 44L24 20 40 32Z', fur)) +
    both(p('M29 38L28 27 36 33Z', '#2a0f08')) +
    po('M26 46Q50 24 74 46Q74 66 50 80Q26 66 26 46Z', fur) +
    p('M38 62Q50 72 62 62L50 80Z', '#f4dcc0') +
    both(p('M32 48L44 53 34 57Z', '#f3d36b') + ln('M38 49V55', '#1b1b22', 1.7)) +
    p('M47 68H53L50 72Z', '#1b1b22') +
    ln('M42 74Q50 78 58 74', INK, 1.4) +
    p('M44 74L45.5 78 47 74.6ZM56 74L54.5 78 53 74.6Z', '#fff') +
    ln('M64 40L72 58', INK, 2.2) +
    ln('M60 74L74 70', '#6e4423', 2.8) +
    `<rect x="73" y="63.6" width="6.4" height="7.4" rx="2" fill="#6e4423" stroke="${INK}"/>`
  );
}

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

/** Jirobo: o grandalhão de moicano laranja e tufos nas laterais. */
function jirobo(): string {
  const skin = '#e8b98a';
  const hair = '#e07a24';
  return (
    bg('jirobo', '#8f6e3e', '#24170a', p('M0 80L14 62 24 72 32 58 46 80ZM60 82L72 66 82 74 90 62 100 82Z', '#5e4524', 'opacity=".7"')) +
    shoulders(SOUND_TUNIC, true) +
    neck(skin) +
    soundCollar() +
    rope() +
    both(po('M31 42L22 31 29 33 26 23 36 31Z', hair)) +
    face({ shape: 'wide', skin, eyes: 'sharp', iris: '#b0763a', brows: 'angry', browColor: '#c0661e', mouth: 'frown' }) +
    po('M43 28L41 12 47 19 50 7 53 19 59 12 57 28Z', hair)
  );
}

/** Kidōmaru: pele escura, seis braços, o rabo de cavalo espetado e a teia. */
function kidomaru(): string {
  const skin = '#a8744a';
  const hair = '#221c1a';
  return (
    bg('kidomaru', '#444c34', '#121509',
      `<g stroke="#e9eadf" stroke-opacity=".35" stroke-width=".8" fill="none"><path d="M0 0l40 40M100 0 60 40M0 100l40-60M100 100 60 40M50 0v40"/><path d="M18 18q32-10 64 0M8 34q42-10 84 0M6 54q44-8 88 0"/></g>`) +
    both(po('M22 82L3 58 9 54 28 76Z', skin) + po('M20 93L1 84 3 78 23 87Z', skin)) +
    po('M43 23L40 6 47 12 50 2 53 12 60 6 57 23Z', hair) +
    torso(SOUND_TUNIC, skin) +
    soundCollar() +
    rope() +
    face({ skin, eyes: 'sharp', iris: '#2b2b33', brows: 'angry', mouth: 'grin' }) +
    po('M31 41C30 26 38 17 50 17S70 26 69 41C66 35 62 33 58 32L50 31 42 32C38 33 34 35 31 41Z', hair) +
    headband('sound', { cloth: '#2a2a30' })
  );
}

/** Tayuya: cabelo vermelho comprido, a touca preta e a flauta. */
function tayuya(): string {
  const hair = '#d6527a';
  return (
    bg('tayuya', '#74304f', '#1a0a14', ln('M10 22q4-4 8 0M78 18q4-4 8 0M14 62q4-4 8 0', '#f2c4dc', 1.4, 'opacity=".5"')) +
    po('M29 40C23 58 23 80 26 101H74C77 80 77 58 71 40Z', hair) +
    torso(SOUND_TUNIC) +
    soundCollar() +
    rope() +
    face({ eyes: 'sharp', iris: '#6a4a2a', brows: 'angry', browColor: '#a83a5c', mouth: 'frown' }) +
    po('M50 30C44 31 38 36 36 44L34 63 30.6 50C29 34 37 22 50 22S71 34 69.4 50L66 63 64 44C62 36 56 31 50 30Z', shade(hair, 0.12)) +
    po('M31 35C31 22 39 14 50 14S69 22 69 35Q50 26 31 35Z', '#1f1a1c') +
    ln('M32.6 31.6Q50 23 67.4 31.6', '#e6e1d6', 2.6) +
    `<g transform="rotate(-9 54 62)"><rect x="36" y="60" width="44" height="4" rx="2" fill="#d9dde3" stroke="${INK}" stroke-width=".8"/><path d="M62 62h.1M67 62h.1M72 62h.1" stroke="#596172" stroke-width="1.8" stroke-linecap="round"/></g>`
  );
}

/** Sakon: a franja cobrindo um olho, os lábios escuros, o colar de contas e o Ukon às costas. */
function sakon(): string {
  const skin = '#e6dccd';
  const hair = '#aebbc6';
  const fringe = 'M31 44C29 28 37 17 50 17S71 28 69 46L66.6 57 66 50C62 52 56 52 52 50 53 42 51 36 46 31 42 33 37 37 34.6 44L33 51Z';
  return (
    bg('sakon', '#527078', '#0f1a1e') +
    `<g transform="translate(34 -2) scale(.62)">${face({ shape: 'slim', skin, eyes: 'sharp', iris: '#2b2b33', mouth: 'smirk', lips: '#3f7f86' })}${mirFringe(fringe, shade(hair, -0.12))}</g>` +
    torso(SOUND_TUNIC, skin) +
    soundCollar() +
    rope() +
    p('M36 77h3v3h-3zM41 80h3v3h-3zM46.6 81.6h3v3h-3zM52 81h3v3h-3zM57.4 79h3v3h-3zM62 76h3v3h-3z', '#b3261e') +
    face({ shape: 'slim', skin, eyes: 'sharp', iris: '#2b2b33', mouth: 'smirk', lips: '#3f7f86' }) +
    po(fringe, hair)
  );
}
const mirFringe = (d: string, fill: string): string => `<g transform="matrix(-1 0 0 1 100 0)">${po(d, fill)}</g>`;

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

/** Orochimaru: a pele pálida, os olhos de cobra pintados de roxo, o cabelo preto escorrido e a cobra. */
function orochimaru(): string {
  const hair = '#141416';
  const coil = 'M86 101C86 80 71 76 71 60 71 46 90 46 90 30 90 20 82 14 73 14';
  return (
    bg('orochimaru', '#42543a', '#0b100a',
      ln(coil, INK, 12.4) + ln(coil, '#6a3f8f', 10) + ln(coil, '#8d5fb5', 3, 'stroke-dasharray="2 5"') +
      `<circle cx="71" cy="14" r="7.4" fill="#6a3f8f" stroke="${INK}" stroke-width="1.2"/><circle cx="69" cy="12.4" r="1.5" fill="#e8c23a"/>`) +
    po('M29 38C24 58 24 80 26 101H74C76 80 76 58 71 38Z', hair) +
    torso('#e7dfc8', PALE) +
    soundCollar() +
    rope() +
    face({ shape: 'slim', skin: PALE, eyes: 'snake', mouth: 'smirk', lips: '#5a3a5a' }) +
    both(po('M30.6 54Q33.6 56.6 31.6 61Q28.6 58.6 30.6 54Z', '#3f6aa8', 0.7)) +
    po('M50 24C43 26 37 31 35 40L33.6 71 29.6 60C28 34 36 16 50 16S72 34 70.4 60L66.4 71 65 40C63 31 57 26 50 24Z', hair)
  );
}

/** A cobra gigante das invocações do Orochimaru. */
function snake(): string {
  const skin = '#8a6aa0';
  return (
    bg('snake', '#4a5a3a', '#0b100a') +
    po('M18 101C18 78 30 62 50 62S82 78 82 101Z', skin) +
    p('M34 101C34 84 40 74 50 74S66 84 66 101Z', '#e2d6b8') +
    ln('M38 82H62M36 90H64M35 97H65', '#b8ab8a', 1) +
    po('M25 42C25 24 36 12 50 12S75 24 75 42C75 58 64 70 50 72 36 70 25 58 25 42Z', skin) +
    p('M36 20q5-3 8 1-4 4-8-1zM56 21q5-3 8 1-4 4-8-1zM46 15q4-2 7 1-4 3-7-1z', shade(skin, -0.3)) +
    both(po('M30 37Q37 30 45 37Q38 43 30 37Z', '#e8c23a', 1) + ln('M37.6 33.6V40.6', '#111', 1.6)) +
    p('M46 48h1.6v2H46zM52.4 48H54v2h-1.6z', INK) +
    po('M32 54Q50 60 68 54Q64 68 50 70 36 68 32 54Z', '#5a1f1c', 1) +
    p('M36 56L39 66 42 57.6ZM64 56L61 66 58 57.6Z', '#fff') +
    ln('M50 62V74L46 80M50 74L54 80', '#e0506a', 1.8)
  );
}

export const VILLAINS: Record<string, Art> = {
  mizuki,
  zabuza,
  haku,
  gozu: () => brotherBg('gozu') + brother(1),
  meizu: () => brotherBg('meizu') + brother(2),
  demonBrothers: () => brotherBg('demonBrothers') + `<g transform="translate(-16 12) scale(.84)">${brother(1)}</g><g transform="translate(34 2) scale(.84)">${brother(2)}</g>`,
  gaara: () => gaara(),
  gaaraWeak: () => gaara(true),
  shukaku,
  gamabunta,
  foxHenge,
  dosu,
  zaku,
  kin,
  jirobo,
  kidomaru,
  tayuya,
  sakon,
  kimimaro,
  kabuto: () => kabuto(),
  kabutoSpy: () => kabuto(true),
  orochimaru,
  snake,
};
