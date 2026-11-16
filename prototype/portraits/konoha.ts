// Retratos de Konoha: o time 7, os colegas e os mestres. Cada um com cabelo, rosto e traje próprios.
import { type Art, INK, NAVY, SKIN, STEEL, TAN, bg, both, face, headband, highCollar, kimono, ln, mesh, neck, p, plate, po, shade, shoulders, torso, vest } from './kit';

const NARUTO_HAIR = 'M31 37L22 30 30 30 23 19 33 23 31 11 40 19 42 7 50 17 55 6 59 18 67 9 68 20 77 14 74 25 83 23 77 33 69 37C65 33 58 31 50 31S35 33 31 37Z';

/** Naruto: cabelo loiro espetado, bigodes e a jaqueta laranja e azul de gola branca. As formas da Kyuubi mudam olhos, presas e o chakra em volta. */
export function naruto(mode: 'base' | 'kyuubi' | 'oneTail' = 'base'): string {
  const wild = mode !== 'base';
  const hair = '#f6c63c';
  const scene =
    mode === 'base'
      ? bg('naruto', '#f6a53c', '#3a1c0a')
      : mode === 'kyuubi'
        ? bg('narutoKyuubi', '#e0332c', '#1c0507', ln('M10 98Q5 66 20 44M90 98Q95 66 80 44M20 30Q31 12 50 7M80 30Q69 12 50 7', '#ff8a52', 2.4, 'opacity=".7"'))
        : bg('narutoOneTail', '#f0541e', '#1c0507', p('M80 101C95 82 97 54 84 30 84 52 76 70 62 84Z', '#ff8a52', 'opacity=".8"'));
  // Manto de uma cauda: a capa de chakra envolve o corpo e forma as orelhas de raposa.
  const cloak = mode === 'oneTail' ? p('M3 101C3 74 17 60 25 48L20 14 38 30Q50 24 62 30L80 14 75 48C83 60 97 74 97 101Z', '#ff6a32', 'opacity=".55"') : '';
  return (
    scene +
    cloak +
    torso('#f08a1c') +
    both(po('M9 99C10 87 21 78 38 74.4L41 80Q26 84 21 99Z', '#2f4d9c')) +
    po('M32 74Q50 86 68 74L70 81Q50 94 30 81Z', '#f4f1ea') +
    ln('M50 90V101', shade('#f08a1c', -0.3)) +
    face({ shape: 'round', eyes: wild ? 'slit' : 'normal', iris: wild ? '#d1232a' : '#2f7fd6', brows: wild ? 'angry' : 'thin', browColor: '#a9791f', mouth: wild ? 'fangs' : 'grin', whiskers: wild ? 'deep' : true }) +
    po(NARUTO_HAIR, hair) +
    both(po('M32.6 38L30.4 48 35.4 42Z', hair, 1)) +
    headband('leaf', { tails: true }) +
    (mode === 'oneTail' ? ln('M13 94Q10 72 23 56M87 94Q90 72 77 56', '#ffc09a', 1.8, 'opacity=".85"') : '')
  );
}

type SasukeLook = 'base' | 'sharingan' | 'curse' | 'hospital' | 'final' | 'curse2';
/** Sasuke: franja em duas mechas, espetos atrás e a gola alta azul. As variantes trocam os olhos, a marca e a bandana. */
export function sasuke(look: SasukeLook = 'base'): string {
  const c2 = look === 'curse2';
  const hair = c2 ? '#6d7396' : '#1c2136';
  const skin = c2 ? '#9a8f86' : SKIN;
  const red = look !== 'base' && look !== 'hospital';
  const marks = look === 'curse' || look === 'final'
    ? p('M57 40q3 .6 3.4 3.6q-2-1.6-4-.8zM62 45q3 .6 3.4 3.6q-2-1.6-4-.8zM58 52q3 .6 3.4 3.6q-2-1.6-4-.8zM63 57q2.4.6 2.6 3q-1.6-1.2-3.2-.6zM55 60q3 .6 3.4 3.6q-2-1.6-4-.8zM53 35q3 .6 3.4 3.6q-2-1.6-4-.8z', '#1b1210')
    : c2 ? po('M44 49L50 46 56 49 54 55 50 52 46 55Z', '#3b3340', 0.6) : '';
  const band =
    look === 'hospital'
      ? po('M32.6 31Q50 25 67.4 31V38Q50 32 32.6 38Z', '#f1ece0') + ln('M34 34.6Q50 28.6 66 34.6', '#c9c1b0', 0.8)
      : c2 ? '' : headband('leaf', { slash: look === 'final' });
  return (
    bg(`sasuke-${look}`, c2 ? '#6a4a8a' : red ? '#a8323a' : '#4a63b8', c2 ? '#120a1c' : '#0d1226',
      c2 ? both(po('M30 70L4 40 14 44 8 26 20 36 20 20 34 60Z', '#5a4a52')) : '') +
    both(po('M33 30L19 21 27 31 15 33 26 38 17 45 31 43Z', hair)) +
    (c2 ? po('M30 40C26 56 26 70 30 84H70C74 70 74 56 70 40Z', hair) : '') +
    torso('#2b3f7e', skin) +
    highCollar('#33498f') +
    face({ shape: 'slim', skin, eyes: red ? 'sharingan' : 'sharp', iris: '#1b1b22', brows: 'angry', browColor: hair, mouth: look === 'base' ? 'neutral' : 'frown', lips: c2 ? '#3b2a30' : undefined, under: marks }) +
    band +
    po('M50 26C43 27 37 30 35 36L34 57 30.4 49C29 38 31 30 36 25 40 21 45 19 50 19S60 21 64 25C69 30 71 38 69.6 49L66 57 65 36C63 30 57 27 50 26Z', hair) +
    po('M40 25L36.4 42 41.6 35ZM60 25L63.6 42 58.4 35Z', hair, 1)
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

/** Kakashi: cabelo prata inclinado, máscara até o nariz, a bandana torta sobre o olho esquerdo e o colete. */
export function kakashi(): string {
  const hair = '#dce1e8';
  const mask = '#2b3550';
  return (
    bg('kakashi', '#8ea2b8', '#131a24') +
    torso(NAVY, mask) +
    vest() +
    face({ shape: 'square', eyes: 'bored', brows: 'flat', browColor: '#9399a3', mouth: 'none', nose: false }) +
    po('M33 52Q50 47 67 52V54C67 62 59 67.6 50 68.4C41 67.6 33 62 33 54Z', mask) +
    ln('M50 50.4V57', '#1a2136', 1) +
    po('M31 36L26 26 33 28 30 15 38 22 40 8 47 18 54 5 57 17 67 7 66 19 77 13 72 25 80 26 69 37C64 33 58 31 50 31S36 33 31 36Z', hair) +
    po('M51 39L68.6 43 67.6 53 53 49Z', NAVY, 1) +
    `<g transform="rotate(20 50 36)">${headband('leaf', { y: 31 })}</g>`
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

/** Neji: cabelo longo e escuro, Byakugan, bandana de pano preto e a camisa bege. */
export function neji(): string {
  const hair = '#3b2e2c';
  return (
    bg('neji', '#beb6dc', '#1c1830') +
    po('M30 36C24 56 24 80 27 101H73C76 80 76 56 70 36Z', hair) +
    torso('#e3dac8') +
    po('M36 73L50 86 64 73 67 80 50 96 33 80Z', '#d2c7b0') +
    face({ shape: 'slim', eyes: 'byakugan', brows: 'angry', browColor: hair, mouth: 'frown' }) +
    po('M31 40C30 25 38 16 50 16S70 25 69 40C66 33 60 28 50 27 40 28 34 33 31 40Z', hair) +
    headband('leaf', { cloth: '#1f2026' }) +
    both(po('M34.6 36L30 62 33.6 68 36.6 41Z', hair, 1))
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

/** Akamaru: o cãozinho branco de orelhas caídas marrons. */
export function akamaru(): string {
  const fur = '#f4efe6';
  return (
    bg('akamaru', '#c25a60', '#2a0c10') +
    po('M22 101C22 83 34 73 50 73S78 83 78 101Z', fur) +
    both(po('M34 35C24 32 16 41 18 57 26 55 32 49 36 42Z', '#8a5a36')) +
    po('M28 50C28 36 38 28 50 28S72 36 72 50C72 64 62 75 50 75S28 64 28 50Z', fur) +
    po('M46 29L47.6 21 50.4 27 53 20 54.6 29Z', fur, 1) +
    po('M40 59C40 53.6 45 51.6 50 51.6S60 53.6 60 59C60 65 55 68.4 50 68.4S40 65 40 59Z', '#fffaf2', 1) +
    both(ln('M35.6 47.4Q40 43.4 44.4 47.4', INK, 1.9)) +
    `<ellipse cx="50" cy="55.4" rx="3.2" ry="2.3" fill="${INK}"/>` +
    ln('M50 57.6V61M45 61Q50 65.4 55 61') +
    po('M47.6 62.6H52.4V66Q50 68.8 47.6 66Z', '#e77a8c', 0.8)
  );
}

/** Jiraiya: juba branca, as linhas vermelhas descendo dos olhos, o protetor de chifres e o haori vermelho. */
export function jiraiya(): string {
  const hair = '#eef1f4';
  return (
    bg('jiraiya', '#c6584e', '#2a0c0a') +
    po('M30 30L14 25 22 36 7 40 20 48 7 58 20 62 11 77 26 74 23 92H77L74 74 89 77 80 62 93 58 80 48 93 40 78 36 86 25 70 30 63 11 50 20 37 11Z', hair) +
    torso('#6f8f5a') +
    kimono('#b23a34') +
    mesh() +
    face({ shape: 'square', eyes: 'sharp', browColor: '#a9aeb6', mouth: 'grin', under: both(ln('M40.4 50.6L39.4 64', '#c0392b', 1.9)) + `<circle cx="54.6" cy="54.4" r="1.1" fill="${shade(SKIN, -0.3)}"/>` }) +
    po('M32 33L28 20 36 24 38 12 45 20 50 9 55 20 62 12 64 24 72 20 68 33Q50 25 32 33Z', hair) +
    both(po('M34 36L27 45 30 72 35 61 36.6 42Z', hair)) +
    both(po('M37 31L31.6 19 42 28Z', STEEL, 1)) +
    po('M33 30Q50 24 67 30V38.6Q50 32.6 33 38.6Z', STEEL) +
    ln('M46.4 28V34M44.4 31H48.4M52 28.4H56V34H52ZM52 31.2H56', '#596172', 0.9)
  );
}

/** Tsunade: loira de franja partida e dois rabos, o losango na testa e o haori verde. */
export function tsunade(): string {
  const hair = '#f2d57e';
  return (
    bg('tsunade', '#93cb9e', '#12301c') +
    both(po('M33 50C26 62 24 82 28 99L37 93C35 80 36 66 38 56Z', hair)) +
    torso('#c9ccd4') +
    kimono('#4f9a62') +
    p('M43.6 73L50 87 56.4 73Z', SKIN) +
    face({ iris: '#b0763a', browColor: '#b8963a', mouth: 'smirk', lips: '#c8506a', under: po('M50 29.6L52.2 33.4 50 37.2 47.8 33.4Z', '#7a5ac0', 0.6) }) +
    po('M50 22C42 24 37 30 35 40L34 70 28 77C27 60 27 44 30 34 33 22 41 15 50 15S67 22 70 34C73 44 73 60 72 77L66 70 65 40C63 30 58 24 50 22Z', hair)
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
  kakashi,
  iruka,
  neji,
  lee,
  shikamaru,
  choji,
  kiba,
  akamaru,
  jiraiya,
  tsunade,
};
