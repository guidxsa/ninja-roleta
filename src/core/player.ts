import type { Difficulty } from './difficulty';
import type { GameData } from './gameData';
import { lineageOf } from './origin';
import type { ActiveKind, AttackStats, AttackType, ConsumableId, DojutsuId, Element, KekkeiGenkaiId, Origin, PassiveKind, Resistances, SummonState, TechniqueDef, TechniqueElement, TechniqueSlot } from './types';

/** Quantos amuletos de cada tipo o jogador carrega. */
export interface Amulets {
  speed: number;
  resistance: number;
}

/** Pesos de treino: nunca ganhou, equipados, guardados (ganhou e não equipou) ou já tirados. */
export type TrainingWeights = 'none' | 'equipped' | 'stored' | 'removed';

export type Bag = Record<ConsumableId, number>;

export const BASIC_TAIJUTSU = 'basicTaijutsu';

export interface PlayerState {
  origin: Origin;
  /** Começa em 1. Não há nível máximo. */
  level: number;
  /** XP acumulado rumo ao próximo nível (a sobra passa adiante). */
  xp: number;
  /** HP e chakra máximos ganhos por nível (e por estágio de status), conforme a dificuldade. */
  growth: { hp: number; chakra: number };
  maxHp: number;
  hp: number;
  maxChakra: number;
  chakra: number;
  offense: AttackStats;
  /** Resistência física e mental (mesma ficha dos vilões). */
  resistance: Resistances;
  speed: number;
  /** Elementos dominados, o principal primeiro (vem da origem; não se aprende elemento novo na run). */
  elements: Element[];
  /** Kekkei genkai da origem (null = nenhuma). */
  kekkeiGenkai: KekkeiGenkaiId | null;
  /** Meio ponto de taijutsu guardado (origem com crescimento reduzido, prodígio). */
  taijutsuCarry: number;
  /** diferencial_de_dano_%: somado à chance base de crítico. */
  critBonus: number;
  /** Skill set: todas as técnicas conhecidas (kit inicial, nível, recompensa), várias por categoria. */
  techniques: string[];
  /** Upgrade genérico por técnica: níveis acima do I (técnicas sem linha própria). */
  techniqueLevels: Record<string, number>;
  /** Upgrades à escolha ainda não aplicados (marcos de nível, pergaminho, recompensa). */
  pendingUpgrades: number;
  /** Técnica ocular ativável em batalha (Sharingan, Byakugan). */
  dojutsu: DojutsuId | null;
  /** Ativa de linhagem (portões, expansão, clones). */
  active: ActiveKind | null;
  /** Ferramenta ninja: item único, evoluível. 0 = não tem. */
  ninjaToolLevel: number;
  /** Amuletos carregados (efeito permanente). O bônus já está em speed/resistance. */
  amulets: Amulets;
  /** Consumíveis da bolsa (máximo `balance.items.bagMax` de cada). */
  bag: Bag;
  /** Moedas viciadas: cada uma gira de novo uma roleta fora do combate. */
  coins: number;
  trainingWeights: TrainingWeights;
  summon: SummonState | null;
  forbiddenAttackTypes: AttackType[];
  passive: PassiveKind;
  jinchuuriki: boolean;
  /** Foco (premium do guru): usos por luta de um crítico garantido no próximo ataque. 0 = não tem. */
  focusUses: number;
  /** Mestre da Substituição (premium do guru): usos extras de Substituição por luta. */
  substitutionBonus: number;
  /** Clones das Sombras (premium do guru): nível; 0 = não sabe. */
  shadowClonesLevel: number;
  /** Corpo Cintilante (premium do guru): nível; 0 = não tem. */
  glimmerLevel: number;
  revives: number;
  revivesUsed: number;
}

export const EMPTY_BAG: Bag = { soldierPill: 0, medKit: 0, explosiveTag: 0, smokeBomb: 0 };

/** Ninjutsu básico de um elemento (kit inicial da afinidade). */
export function elementalBasic(element: Element, data: GameData): TechniqueDef | undefined {
  return Object.values(data.techniquesById).find((t) => t.elementalBasic && t.element === element);
}

export function createPlayer(
  origin: Origin,
  data: GameData,
  difficulty: Difficulty = data.balance.difficulty.default,
): PlayerState {
  const { balance } = data;
  const lineage = lineageOf(origin.lineageId, data);
  const st = lineage.stats;
  const forbidden = lineage.forbiddenAttackTypes ?? [];

  let maxChakra = st.chakra;
  if (origin.jinchuuriki) maxChakra = Math.floor(maxChakra * (1 + balance.jinchuuriki.chakraBonusPct));

  // Kit: Taijutsu básico, o básico do elemento principal (só no potencial pleno) e as técnicas da linhagem.
  const kit = [BASIC_TAIJUTSU];
  const primary = origin.elements[0];
  const fullPotential = lineage.elementalPotential === 'full' || lineage.elementalPotential === 'fixedOnly';
  const basic = primary && fullPotential && !forbidden.includes('ninjutsu') ? elementalBasic(primary, data) : undefined;
  if (basic) kit.push(basic.id);
  kit.push(...(lineage.startingTechniques ?? []));
  // Kekkei genkai: o nível I da linha e as técnicas extras do kit (prisões de Areia e Madeira).
  const kg = origin.kekkeiGenkai ?? null;
  if (kg) kit.push(...Object.values(data.techniquesById).filter((t) => t.kekkeiGenkai === kg && !t.minLevel && (t.lineLevel ?? 1) === 1).map((t) => t.id));

  return grantLevelTechniques(
    {
      origin,
      level: 1,
      xp: 0,
      growth: { ...balance.level.growth[difficulty] },
      maxHp: st.hp,
      hp: st.hp,
      maxChakra,
      chakra: maxChakra,
      offense: { taijutsu: st.taijutsu, ninjutsu: st.ninjutsu, genjutsu: st.genjutsu },
      resistance: { ...lineage.resistance },
      speed: st.speed,
      elements: [...origin.elements],
      kekkeiGenkai: kg,
      critBonus: lineage.passive === 'youth' ? balance.passives.youth.critBonus : 0,
      taijutsuCarry: 0,
      techniques: kit,
      techniqueLevels: {},
      pendingUpgrades: 0,
      dojutsu: lineage.dojutsu ?? null,
      active: lineage.active ?? null,
      ninjaToolLevel: 0,
      amulets: { speed: 0, resistance: 0 },
      bag: { ...EMPTY_BAG },
      coins: 0,
      trainingWeights: 'none',
      summon: null,
      forbiddenAttackTypes: [...forbidden],
      passive: lineage.passive,
      jinchuuriki: origin.jinchuuriki,
      focusUses: 0,
      substitutionBonus: 0,
      shadowClonesLevel: 0,
      glimmerLevel: 0,
      revives: balance.revive.initialItems + (lineage.extraRevives ?? 0),
      revivesUsed: 0,
    },
    data,
  );
}

/** Troca a dificuldade antes da primeira luta (muda o ganho de HP e chakra por nível). */
export function withDifficulty(player: PlayerState, difficulty: Difficulty, data: GameData): PlayerState {
  return { ...player, growth: { ...data.balance.level.growth[difficulty] } };
}

/** Vitória: recupera `combat.recoverAfterWinPct` do HP e do chakra máximos (sem passar do máximo). */
export function recoverAfterWin(player: PlayerState, data: GameData): PlayerState {
  const pct = data.balance.combat.recoverAfterWinPct;
  return {
    ...player,
    hp: Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * pct)),
    chakra: Math.min(player.maxChakra, player.chakra + Math.floor(player.maxChakra * pct)),
  };
}

/** Maior status de ataque que a origem pode usar (empate: taijutsu, ninjutsu, genjutsu). */
export function highestOffense(player: PlayerState): AttackType {
  const types = (['taijutsu', 'ninjutsu', 'genjutsu'] as const).filter((t) => !player.forbiddenAttackTypes.includes(t));
  return types.reduce((a, b) => (player.offense[b] > player.offense[a] ? b : a));
}

/** Restaura HP e chakra (subir de nível, fim do exame, Vontade do Fogo). */
export function fullRestore(player: PlayerState): PlayerState {
  return { ...player, hp: player.maxHp, chakra: player.maxChakra };
}

export function techniqueSlot(tech: TechniqueDef): TechniqueSlot {
  return tech.slot ?? tech.type;
}

/**
 * Ensina uma técnica e a soma ao skill set (não substitui as da mesma categoria).
 * Respeita a restrição da origem. Aprender um genjutsu libera a categoria (e as técnicas de nível dela).
 */
export function learnTechnique(player: PlayerState, techniqueId: string, data: GameData): PlayerState {
  const tech = data.techniquesById[techniqueId];
  if (!tech) throw new Error(`Técnica desconhecida: ${techniqueId}`);
  if (player.forbiddenAttackTypes.includes(tech.type)) {
    throw new Error(`Esta origem não aprende técnicas de ${tech.type}`);
  }
  if (!knowsElement(player, tech.element)) throw new Error(`O jogador não domina o elemento ${tech.element}`);
  if (!lineageAllows(player, tech)) throw new Error(`Esta origem não aprende ${tech.id}`);
  if (player.techniques.includes(tech.id)) return player;
  // Uma técnica por linha: o nível seguinte vem por upgrade, não por aprender de novo.
  if (tech.line && knownLine(player, tech.line, data)) return player;
  return grantLevelTechniques({ ...player, techniques: [...player.techniques, tech.id] }, data);
}

/** O jogador usa a categoria: tem ao menos uma técnica dela (e a origem permite). */
export function canUseType(player: PlayerState, type: AttackType, data: GameData): boolean {
  if (player.forbiddenAttackTypes.includes(type)) return false;
  return player.techniques.some((id) => {
    const t = data.techniquesById[id];
    return t !== undefined && techniqueSlot(t) === type;
  });
}

const SLOT_ORDER: TechniqueSlot[] = ['taijutsu', 'ninjutsu', 'genjutsu', 'medical'];

/** Skill set completo, na ordem das categorias. */
export function knownTechniques(player: PlayerState, data: GameData): TechniqueDef[] {
  const all = player.techniques.map((id) => data.techniquesById[id]).filter((t): t is TechniqueDef => !!t);
  return SLOT_ORDER.flatMap((slot) => all.filter((t) => techniqueSlot(t) === slot));
}

/** Técnicas de nível que o jogador já pode aprender (nível, origem, categoria e elemento). */
export function pendingLevelTechniques(player: PlayerState, data: GameData): string[] {
  return data.levelTechniques
    .filter(
      (t) =>
        (t.minLevel ?? 1) <= player.level &&
        !player.techniques.includes(t.id) &&
        !player.forbiddenAttackTypes.includes(t.type) &&
        // Genjutsu de nível só para quem já usa genjutsu; as exclusivas de linhagem valem sempre.
        (t.type !== 'genjutsu' || canUseType(player, 'genjutsu', data)) &&
        elementAllows(player, t, data) &&
        lineageAllows(player, t),
    )
    .map((t) => t.id);
}

/** Técnica exclusiva de linhagem só serve a quem é dela; a de kekkei genkai, a quem a tem. */
export function lineageAllows(player: PlayerState, tech: TechniqueDef): boolean {
  if (tech.kekkeiGenkai && player.kekkeiGenkai !== tech.kekkeiGenkai) return false;
  return !tech.lineages || (player.origin.lineageId !== null && tech.lineages.includes(player.origin.lineageId));
}

/** Aprende as técnicas de nível já liberadas. */
export function grantLevelTechniques(player: PlayerState, data: GameData): PlayerState {
  const ids = pendingLevelTechniques(player, data);
  return ids.length ? { ...player, techniques: [...player.techniques, ...ids] } : player;
}

/** Elemento principal (o primeiro da origem); null = nenhum. */
export function primaryElement(player: { elements: Element[] }): Element | null {
  return player.elements[0] ?? null;
}

/** Técnica sem elemento (ou do elemento principal) serve a qualquer um; elemental exige dominar o elemento. */
export function knowsElement(player: PlayerState, element: TechniqueElement): boolean {
  if (element === null || element === 'affinity') return true;
  return player.elements.includes(element);
}

/**
 * Até que nível de técnica a origem leva as técnicas de um elemento (docs/tecnicas.md#níveis-de-técnica):
 * 0 sem o elemento ou sem potencial; sem teto próprio no pleno (e no fixo do Uchiha); `partialCap` no resto.
 */
export function elementCap(player: PlayerState, element: Element, data: GameData): number {
  if (!player.elements.includes(element)) return 0;
  const lineage = lineageOf(player.origin.lineageId, data);
  switch (lineage.elementalPotential) {
    case 'none':
      return 0;
    case 'full':
      return Infinity;
    case 'fixedOnly':
      return element === lineage.elements.fixed ? Infinity : data.balance.elementalPotential.partialCap;
    case 'partial':
      return data.balance.elementalPotential.partialCap;
  }
}

/** Elemento da técnica (o `'affinity'` vira o principal; null = sem elemento). */
function techElement(player: PlayerState, tech: TechniqueDef): Element | null {
  return tech.element === 'affinity' ? primaryElement(player) : tech.element;
}

/** Nível de técnica correspondente a um nível do personagem (I do 1, II do 4, III do 7...). */
function tierAt(level: number, data: GameData): number {
  return 1 + Math.floor((level - 1) / data.balance.techniqueUpgrade.levelsPerTier);
}

/**
 * Técnica elemental: exige o elemento e um teto que alcance o nível dela (a barreira do nível 4 pede II,
 * a Armadura de Raio do nível 7 pede III). Sem elemento, sempre pode.
 */
export function elementAllows(player: PlayerState, tech: TechniqueDef, data: GameData): boolean {
  const element = techElement(player, tech);
  if (element === null) return tech.element !== 'affinity';
  return elementCap(player, element, data) >= tierAt(tech.minLevel ?? 1, data);
}


/** Fração do HP máximo que o ninjutsu médico cura, com os upgrades. 0 = não sabe. */
export function medicalHealPct(player: PlayerState, data: GameData): number {
  const tech = knownTechniques(player, data).find((t) => techniqueSlot(t) === 'medical');
  return tech ? (leveledTechnique(player, tech.id, data).healPct ?? 0) : 0;
}

// ---------------------------------------------------------------------------
// Níveis de técnica (tecnicas.md#níveis-de-técnica)

/** Técnica da linha que o jogador conhece (null = nenhuma). */
export function knownLine(player: PlayerState, line: string, data: GameData): TechniqueDef | null {
  return knownTechniques(player, data).find((t) => t.line === line) ?? null;
}

/** Teto de nível de técnica pelo nível do personagem: I do 1, II do 4, III do 7, IV do 10... */
export function techniqueTier(player: PlayerState, data: GameData): number {
  return 1 + Math.floor((player.level - 1) / data.balance.techniqueUpgrade.levelsPerTier);
}

/** Nível atual da técnica (I = 1). Linhas: o da ficha; demais: 1 + upgrades genéricos. */
export function techniqueLevel(player: PlayerState, techniqueId: string, data: GameData): number {
  const tech = data.techniquesById[techniqueId];
  if (tech?.line) return tech.lineLevel ?? 1;
  return 1 + (player.techniqueLevels[techniqueId] ?? 0);
}

/** Próximo nível de uma linha (null = a linha acabou ou a técnica não tem linha). */
export function nextLineTechnique(tech: TechniqueDef, data: GameData): TechniqueDef | null {
  if (!tech.line) return null;
  const level = (tech.lineLevel ?? 1) + 1;
  return Object.values(data.techniquesById).find((t) => t.line === tech.line && t.lineLevel === level) ?? null;
}

/** Estados elementais não sobem; linhas sobem até o último nível; o resto, até o teto. */
function canUpgrade(player: PlayerState, tech: TechniqueDef, data: GameData): boolean {
  if (tech.state || tech.devour || player.forbiddenAttackTypes.includes(tech.type)) return false;
  const next = techniqueLevel(player, tech.id, data) + 1;
  if (next > techniqueTier(player, data)) return false;
  // Teto elemental da origem (potencial parcial para no II).
  const element = techElement(player, tech);
  if (element !== null && next > elementCap(player, element, data)) return false;
  return tech.line ? nextLineTechnique(tech, data) !== null : true;

}

/** Técnicas do skill set que podem subir um nível agora. */
export function upgradableTechniques(player: PlayerState, data: GameData): string[] {
  return knownTechniques(player, data)
    .filter((t) => canUpgrade(player, t, data))
    .map((t) => t.id);
}

/** Sobe 1 nível: na linha, troca pela ficha seguinte (mesmo espaço); fora dela, upgrade genérico. */
export function upgradeTechnique(player: PlayerState, techniqueId: string, data: GameData): PlayerState {
  const tech = data.techniquesById[techniqueId];
  if (!tech || !player.techniques.includes(techniqueId)) throw new Error(`Técnica não aprendida: ${techniqueId}`);
  if (!canUpgrade(player, tech, data)) throw new Error(`Técnica sem upgrade agora: ${techniqueId}`);
  const next = nextLineTechnique(tech, data);
  if (next) {
    return { ...player, techniques: player.techniques.map((id) => (id === techniqueId ? next.id : id)) };
  }
  const levels = { ...player.techniqueLevels, [techniqueId]: (player.techniqueLevels[techniqueId] ?? 0) + 1 };
  return { ...player, techniqueLevels: levels };
}

/**
 * Ficha da técnica com o upgrade genérico aplicado (sem a ferramenta ninja): por nível acima do I,
 * +3 de dano por golpe, +4 de barreira, +3 de poder mental ou +5% de cura, e +1 de chakra
 * (técnica grátis continua grátis).
 */
export function leveledTechnique(player: PlayerState, techniqueId: string, data: GameData): TechniqueDef {
  const tech = data.techniquesById[techniqueId];
  if (!tech) throw new Error(`Técnica desconhecida: ${techniqueId}`);
  const n = tech.line ? 0 : (player.techniqueLevels[techniqueId] ?? 0);
  if (n === 0) return tech;
  const cfg = data.balance.techniqueUpgrade;
  return {
    ...tech,
    chakraCost: tech.chakraCost > 0 ? tech.chakraCost + n * cfg.chakraPerLevel : 0,
    baseDamage: tech.baseDamage > 0 ? tech.baseDamage + n * cfg.baseDamagePerLevel : tech.baseDamage,
    ...(tech.barrier !== undefined ? { barrier: tech.barrier + n * cfg.barrierPerLevel } : {}),
    ...(tech.mental ? { mentalPower: (tech.mentalPower ?? 0) + n * cfg.genjutsuPowerPerLevel } : {}),
    ...(tech.healPct !== undefined ? { healPct: tech.healPct + n * cfg.healPctPerLevel } : {}),
  };
}

/** XP para sair de `level` e ir ao próximo. */
export function xpToNextLevel(level: number, data: GameData): number {
  const cfg = data.balance.level;
  return cfg.xpBase + cfg.xpGrowth * (level - 1);
}

/** XP efetivamente ganho de uma fonte (a passiva Determinação soma 25%). */
export function xpGain(player: PlayerState, amount: number, data: GameData): number {
  const bonus = player.passive === 'determination' ? data.balance.passives.determination.xpBonusPct : 0;
  return Math.floor(amount * (1 + bonus));
}

/** Soma XP. Não sobe de nível sozinho: enquanto `canLevelUp`, a UI mostra uma subida por vez. */
export function gainXp(player: PlayerState, amount: number, data: GameData): PlayerState {
  return { ...player, xp: player.xp + xpGain(player, amount, data) };
}

export function canLevelUp(player: PlayerState, data: GameData): boolean {
  return player.xp >= xpToNextLevel(player.level, data);
}

/**
 * Sobe 1 nível, gastando o XP do nível: HP e chakra máximos sobem (`growth`, pela dificuldade) e o
 * jogador é restaurado por completo. Técnicas de nível liberadas são aprendidas na hora; os marcos
 * (4, 7, 10) dão 1 upgrade à escolha (`pendingUpgrades`).
 */
export function applyLevelUp(player: PlayerState, data: GameData): PlayerState {
  if (!canLevelUp(player, data)) throw new Error('XP insuficiente');
  const level = player.level + 1;
  const maxHp = player.maxHp + player.growth.hp;
  const maxChakra = player.maxChakra + player.growth.chakra;
  const milestone = data.balance.techniqueUpgrade.milestones.includes(level) ? 1 : 0;
  // Determinação (comum): o maior status de ataque sobe a cada nível.
  const offense = { ...player.offense };
  if (player.passive === 'determination') offense[highestOffense(player)] += data.balance.passives.determination.offensePerLevel;
  const p: PlayerState = {
    ...player,
    offense,
    level,
    xp: player.xp - xpToNextLevel(player.level, data),
    maxHp,
    hp: maxHp,
    maxChakra,
    chakra: maxChakra,
    pendingUpgrades: player.pendingUpgrades + milestone,
  };
  return grantLevelTechniques(p, data);
}

/**
 * Sobe `n` estágios em todos os status, inclusive as resistências. HP e chakra máximos sobem o mesmo
 * que numa subida de nível, sem restaurar. Tipos proibidos pela origem (ex.: ninjutsu do prodígio do
 * taijutsu) continuam zerados.
 */
/**
 * Ganho de taijutsu pela origem: no prodígio (`taijutsuGrowth` 0,5), ganhos de 2 ou mais caem pela metade
 * arredondando para cima; ganhos de 1 guardam meio ponto e viram +1 a cada dois.
 */
export function taijutsuGain(player: PlayerState, amount: number, data: GameData): { gain: number; carry: number } {
  const mult = lineageOf(player.origin.lineageId, data).taijutsuGrowth ?? 1;
  const carry = player.taijutsuCarry ?? 0;
  if (mult === 1 || amount <= 0) return { gain: amount, carry };
  if (amount >= 2) return { gain: Math.ceil(amount * mult), carry };
  const total = carry + amount * mult;
  const gain = Math.floor(total);
  return { gain, carry: total - gain };
}

export function applyStatStages(player: PlayerState, n: number, data: GameData): PlayerState {
  const st = data.balance.statStage;
  const offense = { ...player.offense };
  let taijutsuCarry = player.taijutsuCarry ?? 0;
  for (const type of ['taijutsu', 'ninjutsu', 'genjutsu'] as const) {
    if (player.forbiddenAttackTypes.includes(type)) continue;
    if (type === 'taijutsu') {
      const t = taijutsuGain(player, st.taijutsu * n, data);
      offense.taijutsu += t.gain;
      taijutsuCarry = t.carry;
    } else offense[type] += st[type] * n;
  }
  return {
    ...player,
    offense,
    taijutsuCarry,
    resistance: {
      physical: player.resistance.physical + st.physical * n,
      mental: player.resistance.mental + st.mental * n,
    },
    speed: player.speed + st.speed * n,
    maxHp: player.maxHp + player.growth.hp * n,
    hp: player.hp + player.growth.hp * n,
    maxChakra: player.maxChakra + player.growth.chakra * n,
    chakra: player.chakra + player.growth.chakra * n,
  };
}

/** Maior portão liberado pelo atributo de taijutsu (1, 2, 3...). 0 = não tem portões ou não liberou. */
export function gatesStage(player: PlayerState, data: GameData): number {
  if (player.active !== 'gates') return 0;
  let stage = 0;
  data.balance.gates.stages.forEach((st, i) => {
    if (player.offense.taijutsu >= st.minTaijutsu) stage = i + 1;
  });
  return stage;
}

// ---------------------------------------------------------------------------
// Pesos de treino (itens.md)

/** Equipar os pesos guardados: −2 de speed enquanto equipados. */
export function equipTrainingWeights(player: PlayerState, data: GameData): PlayerState {
  if (player.trainingWeights !== 'stored') throw new Error('Não há pesos para equipar');
  return { ...player, trainingWeights: 'equipped', speed: player.speed - data.balance.items.trainingWeights.speedPenalty };
}

/** Tirar os pesos (fora de combate): devolve o speed e dá o bônus extra. Depois de tirados, não voltam. */
export function removeTrainingWeights(player: PlayerState, data: GameData): PlayerState {
  if (player.trainingWeights !== 'equipped') throw new Error('Os pesos não estão equipados');
  const cfg = data.balance.items.trainingWeights;
  return { ...player, trainingWeights: 'removed', speed: player.speed + cfg.speedPenalty + cfg.removeSpeedBonus };
}

/** Vitória contra vilão com os pesos equipados: +1 de taijutsu. */
export function trainingWeightsWin(player: PlayerState, data: GameData): PlayerState {
  if (player.trainingWeights !== 'equipped') return player;
  const offense = { ...player.offense, taijutsu: player.offense.taijutsu + data.balance.items.trainingWeights.taijutsuPerWin };
  return { ...player, offense };
}
