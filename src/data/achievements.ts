import { lineageKey, type AchievementContext, type AchievementDef } from '../core/achievements';
import type { FightSummary } from '../core/runStats';
import { roletaCategories } from './roleta/villains';

/** Linhagens com conquista própria de vitória (ids dos dados; o comum é `common`). */
export const ORIGIN_ACHIEVEMENT_LINEAGES = [
  'common',
  'nara',
  'akimichi',
  'yamanaka',
  'aburame',
  'inuzuka',
  'taijutsuProdigy',
  'uchiha',
  'hyuuga',
  'uzumaki',
  'senju',
] as const;

/** Chefes que contam para "Intocável". */
const BOSSES = ['gaara', 'kabuto', 'orochimaru'];
/** Limites das conquistas (não são balanceamento: só dizem quando uma conquista sai). */
const CLOSE_CALL_HP = 0.05;
const BIG_CRIT = 50;
const STREAK = 3;

export const winAchievementId = (lineage: string) => `win_${lineage}`;

const won = (c: AchievementContext) => c.result === 'victory';
const is = (c: AchievementContext, lineage: string) => lineageKey(c.origin) === lineage;
const fights = (c: AchievementContext) => c.stats.fights;
const anyFight = (c: AchievementContext, f: (x: FightSummary) => boolean) => fights(c).some(f);
const sum = (c: AchievementContext, f: (x: FightSummary) => number) => fights(c).reduce((a, x) => a + f(x), 0);
const examFights = (c: AchievementContext) => fights(c).filter((x) => x.exam);
const closeWin = (x: FightSummary) => x.won && x.hpPctEnd > 0 && x.hpPctEnd <= CLOSE_CALL_HP;
const isNaruto = (c: AchievementContext) => is(c, 'uzumaki') && c.origin.jinchuuriki && c.origin.elements.includes('wind');

const originWins: AchievementDef[] = ORIGIN_ACHIEVEMENT_LINEAGES.map((lineage) => ({
  id: winAchievementId(lineage),
  category: 'milestone',
  check: (c) => won(c) && is(c, lineage),
}));

const originIds = ORIGIN_ACHIEVEMENT_LINEAGES.map(winAchievementId);

/** Ordem da lista = ordem na tela (e na checagem). */
export const achievements: AchievementDef[] = [
  // Marcos
  // Roleta enxuto (v0.46.0): Genin vale com qualquer vilão genin; o exame chunin saiu (Chunin vira clássica).
  { id: 'genin', category: 'milestone', check: (c) => anyFight(c, (x) => x.won && roletaCategories.genin.includes(x.villainId)) },
  { id: 'chunin', legacy: true, category: 'milestone', check: (c) => examFights(c).filter((x) => x.won).length >= 3 },
  { id: 'leafNinja', category: 'milestone', check: won },
  // Modo infinito do Roleta (v0.46.0).
  { id: 'r_cycle2', category: 'milestone', check: (c) => (c.cyclesWon ?? 0) >= 2 },
  { id: 'r_cycle3', category: 'milestone', check: (c) => (c.cyclesWon ?? 0) >= 3 },
  { id: 'r_cycle5', category: 'milestone', check: (c) => (c.cyclesWon ?? 0) >= 5 },
  { id: 'awakened', category: 'milestone', check: (c) => c.level >= 7 },
  { id: 'noFear', category: 'milestone', check: (c) => won(c) && (c.difficulty === 'hard' || c.difficulty === 'hardcore') },
  { id: 'legend', category: 'milestone', check: (c) => won(c) && c.difficulty === 'hardcore' },
  { id: 'innerBeast', category: 'milestone', check: (c) => won(c) && c.origin.jinchuuriki },
  ...originWins,
  {
    id: 'clanMaster',
    category: 'milestone',
    check: (c) => originIds.every((id) => c.unlocked.has(id)),
    progress: (u) => [originIds.filter((id) => u.has(id)).length, originIds.length],
  },

  // Sorte e azar
  { id: 'closeCall', category: 'luck', check: (c) => anyFight(c, closeWin) },
  { id: 'coldFeet', category: 'luck', check: (c) => c.stats.jokenpo.loss >= STREAK },
  { id: 'beginnersLuck', category: 'luck', check: (c) => c.stats.jokenpo.win >= STREAK },
  { id: 'oldLadySon', category: 'luck', check: (c) => (c.stats.preEvents.oldLady ?? 0) >= 2 },
  { id: 'conned', legacy: true, category: 'luck', check: (c) => c.stats.guruCharlatan >= 1 },
  { id: 'spotted', category: 'luck', check: (c) => c.stats.akatsukiTookRevive >= 1 },
  { id: 'fatefulBlow', category: 'luck', check: (c) => anyFight(c, (x) => x.bestCrit >= BIG_CRIT) },
  { id: 'animalFriend', category: 'luck', check: (c) => c.stats.summonLevel >= 3 },
  { id: 'soClose', category: 'luck', hidden: true, check: (c) => c.result === 'defeat' && c.fallenTo === 'orochimaru' },
  { id: 'shame', category: 'luck', hidden: true, check: (c) => c.result === 'defeat' && c.fallenTo === 'mizuki' },

  // Estilo
  { id: 'unbroken', category: 'style', check: (c) => won(c) && sum(c, (x) => x.revivesUsed) === 0 },
  { id: 'emptyHands', category: 'style', check: (c) => won(c) && sum(c, (x) => x.itemsUsed) === 0 },
  { id: 'untouchable', category: 'style', check: (c) => anyFight(c, (x) => x.won && BOSSES.includes(x.villainId) && x.damageTaken === 0) },
  { id: 'pureStrength', category: 'style', check: (c) => won(c) && is(c, 'taijutsuProdigy') && sum(c, (x) => x.maxGate) === 0 },
  { id: 'copycat', legacy: true, category: 'style', check: (c) => sum(c, (x) => x.copies) >= 3 },
  {
    id: 'failedButAlive',
    legacy: true,
    category: 'style',
    hidden: true,
    check: (c) => won(c) && examFights(c).length > 0 && examFights(c).every((x) => !x.won),
  },

  // Segredos (easter eggs)
  { id: 'narutoUzumaki', category: 'secret', hidden: true, check: isNaruto },
  { id: 'dattebayo', category: 'secret', hidden: true, check: (c) => won(c) && isNaruto(c) },
  { id: 'troublesome', category: 'secret', hidden: true, check: (c) => is(c, 'nara') && c.stats.jokenpo.loss >= 1 },
  { id: 'youth', legacy: true, category: 'secret', hidden: true, check: (c) => is(c, 'taijutsuProdigy') && anyFight(c, (x) => x.maxGate >= 4) },
  {
    id: 'gaiApproves',
    category: 'secret',
    hidden: true,
    check: (c) => is(c, 'taijutsuProdigy') && anyFight(c, (x) => x.won && x.villainId === 'orochimaru' && x.maxGate > 0),
  },
  { id: 'butterfly', legacy: true, category: 'secret', hidden: true, check: (c) => is(c, 'akimichi') && anyFight(c, (x) => x.won && x.redPill) },
  { id: 'fateDefied', category: 'secret', hidden: true, check: (c) => is(c, 'hyuuga') && anyFight(c, closeWin) },
  { id: 'mindGames', category: 'secret', hidden: true, check: (c) => is(c, 'yamanaka') && anyFight(c, (x) => x.villainSelfHits >= 3) },
  { id: 'hungryBugs', legacy: true, category: 'secret', hidden: true, check: (c) => is(c, 'aburame') && anyFight(c, (x) => x.devourFinish) },
  { id: 'ichiraku', category: 'secret', hidden: true, check: (c) => (c.stats.preEvents.ramen ?? 0) >= 3 },
  { id: 'pervySage', category: 'secret', hidden: true, check: (c) => c.summon?.animal === 'toad' && c.summon.level >= 3 },
  { id: 'thatBody', category: 'secret', hidden: true, check: (c) => is(c, 'uchiha') && c.summon?.animal === 'snake' },
  { id: 'hokage', category: 'secret', hidden: true, check: (c) => won(c) && is(c, 'common') && c.difficulty === 'hardcore' },
  { id: 'secondHokage', category: 'secret', hidden: true, check: (c) => won(c) && is(c, 'senju') && c.origin.elements[0] === 'water' },
  { id: 'avenger', category: 'secret', hidden: true, check: (c) => is(c, 'uchiha') && c.origin.elements.includes('lightning') },
  { id: 'iceMirrors', category: 'secret', hidden: true, check: (c) => c.origin.kekkeiGenkai === 'ice' && anyFight(c, (x) => x.won && x.villainId === 'haku') },
  { id: 'sandGuard', category: 'secret', hidden: true, check: (c) => c.origin.kekkeiGenkai === 'sand' && c.origin.jinchuuriki },
  { id: 'godOfShinobi', category: 'secret', hidden: true, check: (c) => won(c) && is(c, 'senju') && c.origin.kekkeiGenkai === 'wood' },
  { id: 'bijuuTamer', legacy: true, category: 'secret', hidden: true, check: (c) => anyFight(c, (x) => x.villainId === 'gaara' && x.cloakSuppressed) },
  {
    id: 'slugPrincess',
    legacy: true,
    category: 'secret',
    hidden: true,
    check: (c) => is(c, 'senju') && c.summon?.animal === 'slug' && c.stats.premiums.includes('medical'),
  },
  { id: 'mistDemon', category: 'secret', hidden: true, check: (c) => (c.killedBy.zabuza ?? 0) >= 5 },
];
