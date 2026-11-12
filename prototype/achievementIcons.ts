// Ícone de cada conquista (docs/base/perfil.md#conquistas): desenhos do `ICONS` (art.ts), e as vitórias por origem
// usam o símbolo do clã. `tests/achievements.test.ts` confere que toda conquista tem o seu.
import { clanSymbol, icon } from './art';

const WIN_PREFIX = 'win_';

/** Conquista → nome do ícone em `ICONS`. As de vitória por origem (`win_<linhagem>`) ficam de fora: usam o clã. */
export const ACHIEVEMENT_ICONS: Record<string, string> = {
  // Marcos
  genin: 'kunai',
  chunin: 'scroll',
  leafNinja: 'sprout',
  r_cycle2: 'cycle',
  r_cycle3: 'cycle',
  r_cycle5: 'cycle',
  awakened: 'sparkle',
  noFear: 'moon',
  legend: 'medal',
  innerBeast: 'beast',
  clanMaster: 'home',
  // Sorte
  closeCall: 'heart',
  coldFeet: 'warning',
  beginnersLuck: 'dice',
  oldLadySon: 'kit',
  conned: 'trickster',
  spotted: 'cloak',
  fatefulBlow: 'crit',
  animalFriend: 'toad',
  soClose: 'timer',
  shame: 'disadvantage',
  // Estilo
  unbroken: 'willOfFire',
  emptyHands: 'taijutsu',
  untouchable: 'dodge',
  pureStrength: 'blast',
  // Segredos
  copycat: 'sharingan',
  failedButAlive: 'book',
  narutoUzumaki: 'clones',
  dattebayo: 'wind',
  troublesome: 'sleep',
  youth: 'gates',
  gaiApproves: 'stance',
  butterfly: 'expansion',
  fateDefied: 'byakugan',
  mindGames: 'mind',
  hungryBugs: 'bug',
  ichiraku: 'steam',
  pervySage: 'scroll',
  thatBody: 'snake',
  hokage: 'willOfFire',
  secondHokage: 'water',
  slugPrincess: 'slug',
  avenger: 'lightning',
  iceMirrors: 'mirrors',
  sandGuard: 'gourd',
  godOfShinobi: 'tree',
  bijuuTamer: 'cloak',
  mistDemon: 'mist',
  // Jornada
  j_bell: 'bell',
  j_waves: 'water',
  j_exam: 'scroll',
  j_canonWin: 'swords',
  j_canonHard: 'medal',
  j_canonHardcore: 'crit',
  j_noneLeftBehind: 'heart',
  j_rich: 'coin',
  j_collector: 'card',
  j_sexy: 'smoke',
  j_genericWin: 'sun',
  j_unlockUchiha: 'fire',
  j_unlockHyuuga: 'byakugan',
  j_winUchiha: 'sharingan',
  j_winHyuuga: 'stance',
  j_cycle2: 'cycle',
  j_cycle3: 'cycle',
  j_cycle5: 'cycle',
  j_sasukeEgg: 'lightning',
};

/** Diz se a conquista tem um desenho próprio (mapa ou símbolo do clã). */
export const hasAchievementIcon = (id: string) => id.startsWith(WIN_PREFIX) || id in ACHIEVEMENT_ICONS;

/** SVG do ícone da conquista; sem desenho, o selo 功 de antes. */
export function achievementIcon(id: string): string {
  if (id.startsWith(WIN_PREFIX)) return clanSymbol(id.slice(WIN_PREFIX.length));
  const name = ACHIEVEMENT_ICONS[id];
  return name ? icon(name) : '功';
}
