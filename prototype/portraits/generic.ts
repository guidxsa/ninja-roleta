// Retratos genéricos: as linhagens do jogador, os ninjas das vilas e os capangas. Cada origem lembra os membros
// conhecidos dela (cabelo, olhos, traje), sem repetir o desenho de um personagem nomeado.
import { type Art, INK, NAVY, TAN, bg, both, face, headband, highCollar, kimono, ln, neck, p, plate, po, shade, shoulders, torso, vest } from './kit';

const NIGHT = '#0d1222';
const collar = (c: string): string => po('M35 74Q50 84 65 74L66.6 80Q50 91 33.4 80Z', c);

/** Ninja comum da Folha: cabelo castanho curto e a camisa azul. */
const common: Art = (j) => {
  const hair = '#5a3a22';
  return (
    bg('common', '#f28c28', NIGHT) +
    torso(NAVY) +
    collar('#31457a') +
    face({ iris: '#3a2a20', browColor: hair, mouth: 'smirk', whiskers: j }) +
    po('M31 38L27 28 33 29 31 19 39 24 41 14 48 22 53 13 57 23 65 16 65 27 72 24 69 38C64 33 58 31 50 31S36 33 31 38Z', hair) +
    headband('leaf')
  );
};

/** Uchiha: cabelo preto revolto caindo na testa e a gola alta do clã. */
const uchiha: Art = (j) => {
  const hair = '#15161c';
  return (
    bg('uchiha', '#d1232a', NIGHT) +
    torso('#1f2a44') +
    highCollar('#27365a') +
    face({ eyes: 'sharp', iris: '#15161c', browColor: hair, mouth: 'neutral', whiskers: j }) +
    po('M31 45L29 35 25 31 31 28 28 20 36 22 38 13 45 19 50 11 55 19 62 13 64 22 72 20 69 28 75 31 71 35 69 45 66 36 62 41 58 33 54 40 50 32 46 40 42 33 38 41 34 36Z', hair)
  );
};

/** Uchiha de cabelo longo preso atrás, com as duas mechas na frente. */
const uchihaB: Art = () => {
  const hair = '#1a1a22';
  return (
    bg('uchihaB', '#b02a3a', NIGHT) +
    po('M58 34C72 40 76 62 70 86L62 78C66 62 64 48 56 42Z', hair) +
    torso('#2a2f4a') +
    highCollar('#3a4066') +
    face({ shape: 'slim', eyes: 'sharp', iris: '#15161c', browColor: hair, mouth: 'neutral' }) +
    po('M31 41C30 26 38 17 50 17S70 26 69 41C66 34 60 30 50 29 40 30 34 34 31 41Z', hair) +
    headband('leaf') +
    both(po('M34.6 37L31 63 35 58 37 41Z', hair, 1))
  );
};

/** Hyuuga: os olhos brancos, o cabelo longo e liso de risca ao meio e o quimono claro. */
const hyuuga: Art = (j) => {
  const hair = '#2a2430';
  return (
    bg('hyuuga', '#9d93c7', NIGHT) +
    po('M30 38C26 54 27 74 31 90H69C73 74 74 54 70 38Z', hair) +
    torso('#ebe6f2') +
    kimono('#ebe6f2', '#8d86a8') +
    face({ eyes: 'byakugan', browColor: hair, mouth: 'neutral', whiskers: j }) +
    po('M50 25C43 26 37 31 35 40L33.6 58 30.6 49C29 30 37 16 50 16S71 30 69.4 49L66.4 58 65 40C63 31 57 26 50 25Z', hair)
  );
};

/** Hyuuga de cabelo curto e franja reta, com o casaco de gola de pelo. */
const hyuugaB: Art = () => {
  const hair = '#2a2f4e';
  return (
    bg('hyuugaB', '#8a86c0', NIGHT) +
    torso('#e6dcc4') +
    po('M30 80L34 73 38 79 42 72 46 79 50 73 54 79 58 72 62 79 66 73 70 80 66 87 58 84 50 88 42 84 34 87Z', '#f6f1e4') +
    face({ eyes: 'byakugan', browColor: hair, mouth: 'smile' }) +
    po('M30.6 54C27 30 36 15 50 15S73 30 69.4 54L66 44 65 38Q50 43 35 38L34 44Z', hair) +
    ln('M38 22Q50 16 62 22', '#6a70a0', 2, 'opacity=".6"')
  );
};

/** Nara: o rabo de cavalo em abacaxi, o cavanhaque e as cicatrizes do veterano. */
const nara: Art = (j) => {
  const hair = '#2a2420';
  return (
    bg('nara', '#6f8f3a', NIGHT) +
    po('M42 25L33 10 42 16 41 4 48 13 50 2 52 13 59 4 58 16 67 10 58 25Z', hair) +
    torso('#3a3f48') +
    vest('#6a7f55') +
    face({ shape: 'square', eyes: 'sharp', iris: '#3a2a20', brows: 'flat', browColor: hair, mouth: 'smirk', whiskers: j,
      under: ln('M36 51L42 55M58 38L63 44', '#a86a55', 1.3) }) +
    po('M46.6 63.6H53.4L50 68.6Z', hair, 0.8) +
    po('M31 42C30 26 38 17 50 17S70 26 69 42C67 37 64 33 61 31L50 35 39 31C36 33 33 37 31 42Z', hair)
  );
};

/** Akimichi: rosto largo, a juba ruiva espetada, as marcas roxas nas bochechas e a armadura. */
const akimichi: Art = (j) => {
  const hair = '#a8502a';
  return (
    bg('akimichi', '#e0582b', NIGHT) +
    po('M29 34L15 30 23 40 11 46 22 52 13 62 26 62 24 76H76L74 62 87 62 78 52 89 46 77 40 85 30 71 34 64 16 50 24 36 16Z', hair) +
    shoulders('#b8322a', true) +
    neck() +
    po('M26 82Q50 70 74 82L76 101H24Z', '#8d939d') +
    ln('M50 78V101M28 90H72', INK, 1) +
    face({ shape: 'wide', eyes: 'dot', browColor: hair, mouth: 'smile', whiskers: j, under: both(ln('M34 53L41.6 57.6M33.6 58L40 61.6', '#7a4a9a', 2)) }) +
    po('M30 36L28 24 36 28 39 17 46 25 50 15 54 25 61 17 64 28 72 24 70 36Q50 27 30 36Z', hair) +
    headband('leaf', { y: 31 })
  );
};

/** Yamanaka: loira de rabo de cavalo alto e a franja cobrindo um olho. */
const yamanaka: Art = (j) => {
  const hair = '#f0d27a';
  return (
    bg('yamanaka', '#b77ad8', NIGHT) +
    po('M52 18C66 10 80 22 78 44 77 62 72 78 66 90L60 84C66 66 68 50 66 38Z', hair) +
    torso('#6a4a8a') +
    collar('#7a58a0') +
    face({ iris: '#7fc4c0', browColor: '#b8963a', mouth: 'smile', lips: '#b8506a', whiskers: j }) +
    po('M31 42C30 26 38 16 50 16S70 26 69 42L67.4 58 62 62C64 50 60 38 50 30 42 32 36 36 33 42Z', hair) +
    `<circle cx="56" cy="19" r="3.4" fill="#7a58a0" stroke="${INK}"/>`
  );
};

/** Aburame: óculos escuros redondos, o cabelo armado e a gola que cobre a boca. */
const aburame: Art = (j) => {
  const hair = '#2a2620';
  const coat = '#8d9a86';
  return (
    bg('aburame', '#4f7a45', NIGHT, p('M12 20h2.4v2.4H12zM84 28h2.4v2.4H84zM18 64h2v2h-2zM88 60h2v2h-2zM78 12h2v2h-2z', '#1a1a14')) +
    torso(coat) +
    face({ eyes: 'none', brows: 'none', mouth: 'none', whiskers: j }) +
    both(`<circle cx="41" cy="47" r="5.6" fill="#17171c" stroke="${INK}" stroke-width="1.2"/>` + ln('M38 44.6L40.4 43', '#8d96a4', 1.1)) +
    ln('M46.6 47H53.4', INK, 1.4) +
    po('M30 60Q50 53 70 60L73 86Q50 94 27 86Z', coat) +
    ln('M50 57V92', shade(coat, -0.3), 1.2) +
    po('M30 40L24 34 29 30 25 22 32 22 32 14 39 18 43 10 49 16 55 9 59 17 66 13 67 21 74 21 71 29 76 34 70 40C66 34 59 31 50 31S34 34 30 40Z', hair) +
    headband('leaf')
  );
};

/** Inuzuka: as presas vermelhas no rosto, o cabelo arrepiado e a gola de pelo. */
const inuzuka: Art = (j) => {
  const hair = '#5a3a26';
  return (
    bg('inuzuka', '#c0392b', NIGHT) +
    po('M29 46L18 44 25 37 16 30 26 29 22 18 32 22 34 11 42 18 47 8 52 17 59 9 62 20 71 14 70 25 80 24 74 33 82 38 72 42 71 46Z', hair) +
    torso('#5a5a62') +
    po('M30 79L34 72 38 78 42 71 46 78 50 72 54 78 58 71 62 78 66 72 70 79 66 87 60 83 55 89 50 84 45 89 40 83 34 87Z', '#3b3330') +
    face({ eyes: 'sharp', iris: '#111', brows: 'angry', browColor: hair, mouth: 'fangs', whiskers: j, under: both(po('M36 50H41L38.4 60.6Z', '#c0392b', 0.6)) }) +
    po('M31 39L33 27 38 33 42 24 46 32 50 25 54 32 58 24 62 33 67 27 69 39Q50 31 31 39Z', hair) +
    headband('leaf', { y: 31 })
  );
};

/** Uzumaki: o cabelo ruivo do clã, espetado e com mechas longas; o jinchūriki leva as marcas no rosto. */
const uzumaki: Art = (j) => {
  const hair = '#d1382e';
  return (
    bg('uzumaki', '#e2482f', NIGHT) +
    po('M31 38C26 50 26 64 30 76H70C74 64 74 50 69 38Z', hair) +
    torso('#e8742a') +
    collar('#f4f1ea') +
    face({ shape: 'round', iris: '#5a6ac0', browColor: '#8a241c', mouth: 'grin', whiskers: j }) +
    po('M31 38L25 31 31 30 26 20 35 23 35 12 43 19 47 8 52 18 58 9 60 20 69 14 68 25 76 23 72 32 77 36 69 38C65 33 58 31 50 31S35 33 31 38Z', hair) +
    headband('leaf') +
    both(po('M33 38L30 60 34.6 54 36 41Z', hair, 1))
  );
};

/** Senju: cabelo longo e liso de risca ao meio e a armadura vermelha de placas. */
const senju: Art = (j) => {
  const hair = '#3b2a1e';
  return (
    bg('senju', '#2fa36b', NIGHT) +
    po('M30 38C25 56 25 78 28 98H72C75 78 75 56 70 38Z', hair) +
    torso('#2a2a30') +
    both(po('M9 99C10 87 21 78 38 74.4L40 88 22 99Z', '#b23a34')) +
    both(ln('M14 92L36 80M18 97L38 85', '#7a2420', 1)) +
    collar('#b23a34') +
    face({ shape: 'square', iris: '#3a2a20', browColor: hair, mouth: 'smile', whiskers: j }) +
    po('M50 25C43 26 37 31 35 40L33.6 66 30 56C28 30 37 16 50 16S72 30 70 56L66.4 66 65 40C63 31 57 26 50 25Z', hair) +
    headband('leaf', { y: 29 })
  );
};

/** Prodígio do taijutsu: o corte de tigela repartido, as sobrancelhas grossas e o colete sobre o macacão verde. */
const taijutsuProdigy: Art = (j) => {
  return (
    bg('taijutsuProdigy', '#3fa34d', NIGHT) +
    torso('#3f8a3c') +
    vest('#6a7f55') +
    face({ shape: 'square', eyes: 'normal', iris: '#17171c', brows: 'thick', mouth: 'grin', whiskers: j }) +
    po('M29.6 50C27 28 36 15 50 15S73 28 70.4 50C69.6 44 68 40 66 38L50 30 34 38C32 40 30.4 44 29.6 50Z', '#17171c') +
    ln('M37 24Q50 17 63 24', '#ffffff', 2.4, 'opacity=".4"')
  );
};

/** Capanga: lenço na cabeça, barba por fazer e a cicatriz no olho. */
const thug: Art = () => {
  return (
    bg('thug', '#8a6a44', '#1a120a') +
    shoulders('#6b5a44', true) +
    neck(TAN) +
    po('M30 78L50 92 70 78 74 101H26Z', '#4a3a2a') +
    face({ shape: 'square', skin: TAN, eyes: 'sharp', iris: '#2a1d14', brows: 'angry', mouth: 'frown',
      under: p('M36 58h1.4v1.4H36zM40 62h1.4v1.4H40zM45 64.6h1.4V66H45zM50 65.4h1.4v1.4H50zM55 64.6h1.4V66H55zM59.6 62H61v1.4h-1.4zM63 58h1.4v1.4H63zM42 58.6h1.4V60H42zM57 58.6h1.4V60H57z', '#5a3a22') + ln('M57 37L62 56', '#8a4630', 1.5) }) +
    po('M30.6 40C30 25 38 16 50 16S70 25 69.4 40Q50 30 30.6 40Z', '#8a2f22') +
    po('M68 35L80 40 73 43 78 51 67 42Z', '#8a2f22', 1) +
    p('M40 22h2.4v2.4H40zM52 20h2.4v2.4H52zM60 26h2.4v2.4H60zM46 27h2.4v2.4H46z', '#e8dcc0')
  );
};

/** Ninja da Névoa: o pano cobrindo a boca, o cabelo escuro e o colete listrado. */
const mist: Art = () => {
  const hair = '#1d2a33';
  const cloth = '#5a6a78';
  return (
    bg('mist', '#6f93a8', '#0e1a22', ln('M0 24Q30 14 56 26T100 22M0 74Q24 66 50 76T100 70', '#dbe8f0', 2, 'opacity=".3"')) +
    torso('#4a6a80', cloth) +
    ln('M18 90L40 80M24 98L44 86M82 90L60 80M76 98L56 86', '#2f4656', 1.6) +
    po('M33 74Q50 85 67 74L69 80Q50 92 31 80Z', cloth) +
    face({ skin: '#e6cdb0', eyes: 'sharp', iris: '#2b3a44', brows: 'angry', browColor: hair, mouth: 'none', nose: false }) +
    po('M33 52Q50 56 67 52V54C67 62 59 67.6 50 68.4C41 67.6 33 62 33 54Z', cloth) +
    po('M31 38L28 27 35 30 37 19 44 26 50 16 56 26 63 19 65 30 72 27 69 38C64 33 58 31 50 31S36 33 31 38Z', hair) +
    headband('mist', { cloth: '#2f3a48' })
  );
};

/** Ninja da Grama: o chapéu de palha cônico fazendo sombra nos olhos. */
const grass: Art = () => {
  const hair = '#2a2a22';
  return (
    bg('grass', '#8aa84a', '#141c0a', ln('M10 100Q14 80 8 66M20 100Q22 84 28 72M88 100Q86 82 92 68M80 100Q78 86 72 76', '#b8d27a', 1.6, 'opacity=".5"')) +
    po('M31 40C28 54 28 66 31 78H69C72 66 72 54 69 40Z', hair) +
    torso('#5c7a2c') +
    collar('#d8cfa0') +
    face({ eyes: 'sharp', iris: '#2a2a22', browColor: hair, mouth: 'smirk' }) +
    p('M33 36H67V44Q50 40 33 44Z', '#000', 'opacity=".22"') +
    po('M10 40Q50 2 90 40Q50 30 10 40Z', '#d8c078') +
    ln('M50 12V33M36 20L30 36M64 20L70 36M43 15L40 33M57 15L60 33', '#a08a48', 0.9) +
    ln('M33 39Q31 56 40 66M67 39Q69 56 60 66', '#a08a48', 0.9)
  );
};

/** Ninja da Chuva: o capuz do macacão, o respirador e a placa de quatro riscos. */
const rain: Art = () => {
  const suit = '#d8c88a';
  return (
    bg('rain', '#6a7896', '#10141e', ln('M12 4L8 18M30 2L26 16M72 4L68 18M90 8L86 22M20 40L16 54M84 44L80 58', '#c9d6f0', 1.2, 'opacity=".5"')) +
    po('M27 62C22 34 32 12 50 12S78 34 73 62L70 80H30Z', suit) +
    torso(suit, suit) +
    face({ skin: '#e6cdb0', eyes: 'sharp', iris: '#2b2b33', brows: 'angry', mouth: 'none', nose: false, ears: false }) +
    po('M29 50C29 30 38 20 50 20S71 30 71 50L67 40C64 31 58 27 50 27S36 31 33 40Z', suit) +
    po('M33.6 52H66.4V60Q50 70 33.6 60Z', '#3a3f48') +
    both(`<circle cx="40.6" cy="59" r="3.4" fill="#6a7280" stroke="${INK}"/>`) +
    ln('M46 57H54', '#8d96a4', 1.2) +
    plate(41, 27, 18, 9, 'rain')
  );
};

/** Ninja da Areia: o turbante com o véu caindo sobre meio rosto. */
const examSand: Art = () => {
  const cloth = '#e6dcc0';
  return (
    bg('examSand', '#cfa25c', '#3b2410', p('M14 22h2.4v2.4H14zM86 30h2.4v2.4H86zM20 76h2v2h-2zM90 70h2v2h-2z', '#f3d9a6', 'opacity=".7"')) +
    torso('#8c6a44', TAN) +
    po('M26 82Q50 72 74 82L78 101H22Z', '#6f5233') +
    face({ skin: TAN, eyes: 'sharp', iris: '#3a2a20', brows: 'angry', mouth: 'neutral', under: ln('M56 52L62 60M59 51L65 58', '#a8382e', 1.6) }) +
    po('M29 40C28 24 37 14 50 14S72 24 71 40Q50 30 29 40Z', cloth) +
    ln('M33 30Q50 20 67 30M31 36Q50 26 69 36', shade(cloth, -0.2), 1) +
    po('M30 38L47 34 46 70 34 74Z', cloth) +
    ln('M38 38L37 70M43 36L42 70', shade(cloth, -0.2), 0.9) +
    plate(42, 24, 16, 8.6, 'sand')
  );
};

/** Ninja do Som: a touca preta, a máscara de pano e o cachecol camuflado. */
const examSound: Art = () => {
  const cloth = '#2a2a30';
  return (
    bg('examSound', '#5e567a', '#14111e') +
    torso('#55506a', cloth) +
    po('M29 79Q50 68 71 79L73 89Q50 80 27 89Z', '#8d8a7a') +
    p('M36 78q3-2 5 1-3 2-5-1zM48 75q3-2 5 1-3 2-5-1zM60 79q3-2 5 1-3 2-5-1zM42 82q3-2 5 1-3 2-5-1zM56 83q3-2 5 1-3 2-5-1z', '#4f4d44') +
    face({ eyes: 'sharp', iris: '#2b2b33', brows: 'angry', mouth: 'none', nose: false }) +
    po('M33 51Q50 55 67 51V54C67 62 59 67.6 50 68.4C41 67.6 33 62 33 54Z', cloth) +
    po('M30.6 37C31 23 39 15.6 50 15.6S69 23 69.4 37Q50 28 30.6 37Z', cloth) +
    headband('sound', { y: 31 })
  );
};

/** Genin da Folha no Exame: o cabelo preso, a faixa verde e a bandana. */
const examLeaf: Art = () => {
  const hair = '#3a2a1e';
  return (
    bg('examLeaf', '#67884b', '#121c0d', p('M10 20q8-6 12 2-8 4-12-2zM80 70q8-6 12 2-8 4-12-2z', '#8fb35a', 'opacity=".4"')) +
    po('M44 22L40 10 48 14 52 6 56 14 62 11 57 22Z', hair) +
    torso('#4a5a78') +
    po('M22 82Q32 76 38 74L50 86 62 74Q68 76 78 82L76 101H24Z', '#5f7a3a') +
    face({ iris: '#3a2a20', browColor: hair, mouth: 'neutral' }) +
    po('M31 41C30 26 38 17 50 17S70 26 69 41L66.6 46 65 36C60 32 56 31 50 31S40 32 35 36L33.4 46Z', hair) +
    both(po('M33.6 40L32 54 36 48Z', hair, 1)) +
    headband('leaf', { cloth: '#3a5a34' })
  );
};

/** Daichi: o cabelo castanho bagunçado e os óculos de proteção na testa. */
const leafGeninA: Art = () => {
  const hair = '#6a4426';
  return (
    bg('leafGeninA', '#e8a04a', NIGHT) +
    torso('#3f6a55') +
    collar('#e8dcc0') +
    face({ shape: 'round', iris: '#3a5a2a', browColor: hair, mouth: 'grin' }) +
    po('M31 38L25 33 30 29 27 21 35 23 37 14 44 20 49 12 54 20 61 13 63 23 71 20 68 29 75 32 69 38C65 33 58 31 50 31S35 33 31 38Z', hair) +
    po('M32 30Q50 24 68 30V38Q50 32 32 38Z', '#3a3f48') +
    both(`<rect x="36" y="27.6" width="11.6" height="8.4" rx="3" fill="#9ad0e6" stroke="${INK}" stroke-width="1.1"/>`) +
    both(ln('M38.4 30L41 29', '#fff', 1.2))
  );
};

/** Hana: duas marias-chiquinhas baixas e a blusa amarela. */
const leafGeninB: Art = () => {
  const hair = '#c8642a';
  return (
    bg('leafGeninB', '#f0c85a', NIGHT) +
    both(po('M33 50C24 54 20 68 24 84L32 80C30 70 32 62 37 56Z', hair) + `<circle cx="33" cy="52" r="2.6" fill="#3f8a55" stroke="${INK}"/>`) +
    torso('#e8c23a') +
    collar('#f6e9a0') +
    face({ iris: '#6a4a2a', browColor: '#8a441c', mouth: 'smile', lips: '#b8506a' }) +
    po('M31 42C30 26 38 16 50 16S70 26 69 42C66 36 62 32 56 31L50 36 44 31C38 32 34 36 31 42Z', hair) +
    headband('leaf', { y: 29 })
  );
};

/** Mika: a ninja médica de cabelo curto, olhar gentil e o avental branco. */
const leafMedic: Art = () => {
  const hair = '#8a6aa8';
  return (
    bg('leafMedic', '#8fd0c0', NIGHT) +
    torso('#f1ece0') +
    collar('#d8e8e4') +
    ln('M50 90V98M46 94H54', '#c0392b', 2.4) +
    face({ eyes: 'happy', browColor: '#5a4470', mouth: 'smile', lips: '#b8506a' }) +
    po('M30.6 56C27 30 36 15 50 15S73 30 69.4 56L66 44C63 38 58 34 50 30 44 36 38 39 34.6 40L34 46Z', hair) +
    headband('leaf', { y: 27, cloth: '#3a6a8a' })
  );
};

export const GENERIC: Record<string, Art> = {
  common, uchiha, uchihaB, hyuuga, hyuugaB, nara, akimichi, yamanaka, aburame, inuzuka, uzumaki, senju, taijutsuProdigy,
  thug, mist, grass, rain, examSand, examSound, examLeaf, leafGeninA, leafGeninB, leafMedic,
};
