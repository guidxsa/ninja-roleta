// Rascunho de talentos (docs/jornada/talentos.md#rascunho; proposta em docs/jornada/proposta-arvore.md): no começo da
// run o protagonista escolhe um núcleo entre 3 (um de dano, um de apoio e um livre) e, a cada compra, a árvore oferece
// 3 talentos sorteados (4 com pontos guardados), pesados pelo ramo do núcleo e pelas tags das relíquias. Uma troca
// grátis por estágio. Funções puras: o sorteio sai da seed da run, então reabrir a tela mostra a mesma oferta.
import type { Rng } from '../rng';
import type { JornadaData } from './data';
import type { RelicDef } from './relics';
import { canBuyTalent, talentContextOpen, type TalentContext, type TalentNode } from './talents';
import type { FighterMods } from './types';

/** Estado do rascunho na run. Sem o campo, a run usa a árvore clássica (saves antigos e classes fora do rascunho). */
export interface DraftState {
  /** Ramo do núcleo escolhido; `null` enquanto a escolha do começo está pendente. */
  core: string | null;
  /** Muda a cada troca: sorteia outra oferta. */
  nonce: number;
  /** Ciclo e estágio da última troca (`ciclo:estágio`) e quantas foram usadas nele. */
  rerollKey: string;
  rerollsUsed: number;
  /** Talentos do ramo que liberam o talento final (copiado do balance ao criar a run). */
  capstoneNeeds: number;
}

export type Tag = 'taijutsu' | 'ninjutsu' | 'genjutsu' | 'clones' | 'controle' | 'equipe' | 'defesa' | 'critico';

type ModBag = Partial<FighterMods> | undefined;
const has = (v: unknown) => (typeof v === 'object' && v !== null ? Object.keys(v).length > 0 : Boolean(v));

/** Tags tiradas dos bônus: o que o talento ou a relíquia favorece. */
export function modTags(mods: ModBag, team: ModBag, extra: { allyHpPct?: number; learnType?: string; learnStun?: boolean } = {}): Tag[] {
  const out = new Set<Tag>();
  for (const m of [mods, team]) {
    if (!m) continue;
    const t = m.typeDamageMult ?? {};
    if (t.taijutsu || m.taijutsuFlat || m.taijutsuExtraHits || m.comboStepPct || m.taijutsuHitChakra || m.typePen?.taijutsu) out.add('taijutsu');
    if (t.ninjutsu || m.typePen?.ninjutsu || m.chakraDiscount) out.add('ninjutsu');
    if (t.genjutsu || m.genjutsuStunChance || m.illusionSureHit) out.add('genjutsu');
    if (m.startClones || m.extraClones || m.cloneCounter || m.cloneStrikePct || m.cloneEnemyAccuracy || m.maxClonesBonus || m.taijutsuHitsPerClone) out.add('clones');
    if (m.stunnedDamageMult || m.stunnedSplashPct || m.effectChanceBonus || m.effectTurnsBonus) out.add('controle');
    if (m.evasion || m.regenHp || m.startShieldPct || m.surviveOnce || m.guardHealPct || m.healMult) out.add('defesa');
    if (m.critBonus || m.critMultBonus) out.add('critico');
  }
  if (has(team) || extra.allyHpPct) out.add('equipe');
  if (extra.learnType === 'taijutsu' || extra.learnType === 'ninjutsu' || extra.learnType === 'genjutsu') out.add(extra.learnType);
  if (extra.learnStun) out.add('controle');
  return [...out];
}

export function nodeTags(node: TalentNode, data: JornadaData): Tag[] {
  const learn = node.learn ?? Object.values(node.learnByElement ?? {})[0];
  const tech = learn ? data.techniques[learn] : undefined;
  const base = modTags(node.mods, node.teamMods, { allyHpPct: node.allyHpPct, learnType: tech?.type, learnStun: tech?.onHit?.effect === 'stun' });
  return [...new Set([...base, ...((node.tags ?? []) as Tag[])])];
}

export const relicTags = (r: RelicDef): Tag[] => modTags(r.mods, r.teamMods, { allyHpPct: r.allyHpPct });

/** O que o rascunho precisa da run (sem importar a run: a run importa este arquivo). */
export interface DraftInput {
  hero: string;
  seed: number;
  draft: DraftState;
  owned: readonly string[];
  /** Quantas compras já fez (talentos + níveis): muda a oferta depois de cada compra. */
  bought: number;
  points: number;
  relics: readonly RelicDef[];
  ctx: TalentContext;
}

function mix(a: number): Rng {
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sorteio com pesos, sem repetir. */
function pickWeighted<T>(pool: readonly T[], weight: (x: T) => number, n: number, rng: Rng): T[] {
  const left = [...pool];
  const out: T[] = [];
  while (out.length < n && left.length) {
    const total = left.reduce((a, x) => a + weight(x), 0);
    let r = rng() * total;
    let i = 0;
    while (i < left.length - 1 && (r -= weight(left[i]!)) >= 0) i++;
    out.push(left.splice(i, 1)[0]!);
  }
  return out;
}

/** Núcleos oferecidos no começo: um de dano, um de apoio e um livre, da seed da run. */
export function coreOffer(hero: string, seed: number, data: JornadaData): string[] {
  const cores = data.talents.filter((n) => n.owner === hero && n.core);
  const rng = mix((seed ^ 0x3c6ef372) >>> 0);
  const pick = (list: TalentNode[]) => (list.length ? list[Math.floor(rng() * list.length)]! : undefined);
  const out: TalentNode[] = [];
  for (const kind of ['dano', 'apoio'] as const) {
    const c = pick(cores.filter((n) => n.core === kind));
    if (c) out.push(c);
  }
  while (out.length < Math.min(data.j.talentDraft.coreChoices, cores.length)) out.push(pick(cores.filter((n) => !out.includes(n)))!);
  return out.map((n) => n.branch);
}

/** Talentos que o rascunho pode oferecer: os que dariam para comprar com pontos de sobra (aprender ou subir). */
export function draftPool(input: DraftInput, data: JornadaData): TalentNode[] {
  const open = talentContextOpen(input.ctx);
  return data.talents.filter((n) => n.owner === input.hero && canBuyTalent(n, data.talents, open));
}

/** Quantos cartões a oferta mostra agora: 3, ou 4 quando há pontos guardados. */
export const draftSize = (points: number, data: JornadaData) => (points >= data.j.talentDraft.heldPoints ? data.j.talentDraft.cardsHeld : data.j.talentDraft.cards);

/**
 * A oferta atual. O primeiro cartão é do ramo do núcleo enquanto houver; os outros saem pelos pesos: ramo do núcleo,
 * tags em comum com as relíquias, combinação ou talento final (o objetivo de uma build) e técnica nova.
 */
export function draftOffer(input: DraftInput, data: JornadaData): string[] {
  const cfg = data.j.talentDraft;
  const pool = draftPool(input, data);
  const rng = mix((input.seed ^ Math.imul(input.bought + 1, 0x9e3779b1) ^ Math.imul(input.draft.nonce + 1, 0x85ebca6b)) >>> 0);
  const relicTagSet = new Set(input.relics.flatMap(relicTags));
  const core = input.draft.core;
  const weight = (n: TalentNode) => {
    let w = 1;
    if (n.branch === core) w += cfg.coreWeight;
    w += cfg.relicTagWeight * nodeTags(n, data).filter((t) => relicTagSet.has(t)).length;
    if (n.capstone || n.requiresAll) w += cfg.goalWeight;
    return w;
  };
  const size = draftSize(input.points, data);
  const first = pickWeighted(
    pool.filter((n) => n.branch === core && !n.requiresAll),
    weight,
    1,
    rng,
  );
  const rest = pickWeighted(
    pool.filter((n) => !first.includes(n)),
    weight,
    size - first.length,
    rng,
  );
  return [...first, ...rest].map((n) => n.id);
}

/** Chave do estágio para as trocas: uma por estágio de cada ciclo. */
export const rerollKey = (cycle: number, stageIndex: number) => `${cycle}:${stageIndex}`;

export function rerollsLeft(draft: DraftState, key: string, data: JornadaData): number {
  const used = draft.rerollKey === key ? draft.rerollsUsed : 0;
  return Math.max(0, data.j.talentDraft.rerollsPerStage - used);
}
