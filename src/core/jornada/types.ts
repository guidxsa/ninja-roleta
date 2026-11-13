// Tipos do modo Jornada (docs/jornada/). O combate é de equipe e não depende do combate do Roleta;
// só as fórmulas puras (acerto, dano, elementos) são compartilhadas.
import type { AttackStats, AttackType, Element, KekkeiGenkaiId, Resistances } from '../types';
import type { FormDef, ScriptRule } from './script';

export type TeamSide = 'ally' | 'enemy';

/** Efeitos com duração em turnos de quem sofre (docs/jornada/combate.md#efeitos). */
/** `stunGuard`: a trava de quem acabou de sair de um atordoamento (não pode ser atordoado de novo enquanto durar). */
export type JEffect = 'stun' | 'burn' | 'poison' | 'chakraBlock' | 'stunGuard';

/** Bônus temporário em quem usa: dano, acerto, esquiva e penetração por `turns` turnos dele. */
export interface Boost {
  damageMult?: number;
  /** Somado aos três ataques (Esforço). */
  offense?: number;
  accuracy?: number;
  evasion?: number;
  penetration?: number;
  turns: number;
}

/** Quem a técnica atinge. `allEnemies`: todos os adversários de pé. */
export type JTarget = 'enemy' | 'allEnemies' | 'ally' | 'downedAlly' | 'self';

export interface JTechnique {
  id: string;
  /** Status de ataque usado. Genjutsu enfrenta a resistência mental; os outros, a física. */
  type: AttackType;
  element: Element | null;
  /** Técnica de Kekkei Genkai (Espelhos de Gelo, areia do Gaara): no encontro, vale como a natureza (os dois pais). */
  kekkeiGenkai?: KekkeiGenkaiId;
  target: JTarget;
  /** Dano base por golpe (0 = técnica sem dano). */
  baseDamage: number;
  hits?: number;
  /** Golpes a mais por clone ativo de quem usa (Rendan Uzumaki), até `maxCloneHits`. */
  hitsPerClone?: number;
  maxCloneHits?: number;
  chakraCost: number;
  /** Fração do HP máximo que custa (Lótus, Manto da Kyuubi). */
  hpCostPct?: number;
  accuracy?: number;
  critBonus?: number;
  penetration?: number;
  onHit?: { effect: JEffect; chance: number; turns?: number };
  /** Cura do alvo, em valor fixo de HP. */
  healHp?: number;
  /** Levanta um aliado caído com esta fração do HP máximo dele (alvo `downedAlly`). */
  reviveHpPct?: number;
  /** Escudo no alvo, em fração do HP máximo de quem usa. */
  shieldPct?: number;
  /** Tira atordoamento e bloqueio de chakra do alvo. */
  cleanse?: boolean;
  /** Clones criados em quem usa. */
  clones?: number;
  /** Rodadas de espera depois de usar. */
  cooldown?: number;
  /** Ativa de classe: fica fora do moveset e não gasta o turno, uma por turno (docs/jornada/combate.md#turno). */
  active?: boolean;
  /** Fortalecimento em quem usa por alguns turnos, contando o da ativação (Sharingan, Byakugan). */
  boost?: Boost;
  /** Abre os Portões (docs/jornada/combate.md#portões): a ativa vira a escolha do portão, sem efeito próprio. */
  gates?: boolean;
  /** Forma evoluída desta técnica: quem conhece as duas fica só com a evolução (3 tomoe substitui o Sharingan). */
  evolves?: string;
  /**
   * Técnica sorteada (Kuchiyose no Jutsu): ao usar, paga o custo desta e sorteia uma das variantes pelo peso; o efeito é
   * o da variante. Talentos mexem nos pesos (`rollWeights`).
   */
  roll?: { tech: string; weight: number }[];
}

/** Um dos Portões: números brutos, que se somam aos dos portões de baixo. */
export interface GateLevel {
  damageMult: number;
  accuracy?: number;
  critBonus?: number;
}

/** Como um lutador automático escolhe a ação (docs/jornada/personagens.md). */
export type AiProfile = 'striker' | 'tactician' | 'healer' | 'guardian' | 'brute';

/** Passiva de inimigo. `enrage`: abaixo de `atPct` do HP, dano × `damageMult`. */
export type EnemyPassive =
  | { kind: 'enrage'; atPct: number; damageMult: number }
  | { kind: 'startShieldPct'; pct: number };

/** Bônus somados de talentos, relíquias e passivas (aplicados no lutador no início da luta). */
export interface FighterMods {
  damageMult: number;
  /** Dano extra por tipo de ataque (mult). */
  typeDamageMult: Partial<Record<AttackType, number>>;
  /** Dano plano somado ao base de taijutsu. */
  taijutsuFlat: number;
  critBonus: number;
  accuracyBonus: number;
  /** Chance a menos de ser acertado (esquiva). */
  evasion: number;
  /** Fração do HP máximo recuperada no começo de cada rodada. */
  regenHp: number;
  /** Abaixo de 50% do HP, dano × este valor. */
  lowHpDamageMult: number;
  /** Clones no começo da luta. */
  startClones: number;
  /** Clones a mais em cada técnica que cria clones. */
  extraClones: number;
  /** Escudo no começo da luta (fração do HP máximo). */
  startShieldPct: number;
  /** Chakra a menos em toda técnica (mínimo 0). */
  chakraDiscount: number;
  /** Técnica → multiplicador de dano próprio (Domínio do Rasengan). */
  techDamageMult: Record<string, number>;
  /** Técnica → chakra a menos. */
  techChakraDiscount: Record<string, number>;
  /** Uma vez por luta, ao cair, fica com 1 de HP (Fúria da Kyuubi). */
  surviveOnce: boolean;
  /** Dano em quem acertou um clone. */
  cloneCounter: number;
  /** Clones a mais no limite. */
  maxClonesBonus: number;
  /** Dano a mais por clone ativo (fração). */
  damagePerClone: number;
  /** Dano × este valor contra alvo atordoado. */
  stunnedDamageMult: number;
  /** Chance a mais de aplicar o efeito da técnica. */
  effectChanceBonus: number;
  /** Volta com esta fração a mais do HP ao ser levantado. */
  reviveHpBonus: number;
  /** Chakra recuperado ao derrubar um inimigo. */
  onKillChakra: number;
  /** Defender cura esta fração do HP máximo. */
  guardHeal: number;
  /** Concentrar recupera esta fração a mais do chakra máximo. */
  restBonus: number;
  /** Kits curam esta fração a mais. */
  kitBonusPct: number;
  /** Começa a luta com esta fração a mais do chakra máximo. */
  startChakra: number;
  /** Cura de técnica × este valor (o inimigo cura com a força dele). */
  healMult: number;
  /** Portões a mais liberados além do 1º (Portão da Vida, Lótus Oculta). */
  gateLevels: number;
  /** Peso a mais (ou a menos) de cada variante de técnica sorteada (Sapos do Naruto). */
  rollWeights: Record<string, number>;
}

export interface CharacterDef {
  id: string;
  hp: number;
  chakra: number;
  speed: number;
  offense: AttackStats;
  resistance: Resistances;
  element: Element | null;
  /** Natureza de Kekkei Genkai da ficha (Gaara aliado: Areia). */
  kekkeiGenkai?: KekkeiGenkaiId;
  /**
   * Sem ninjutsu elemental (Hyuuga, Prodígio): a natureza existe (sorteada em silêncio no Caminho Ninja), mas não dá
   * técnica de elemento (v0.59.0).
   */
  noElement?: boolean;
  /** Técnicas conhecidas no início (as aprendidas depois vêm de talentos e eventos). */
  techniques: string[];
  /** Técnicas que conhece, mas só depois das outras: ficam fora do moveset inicial (Kunai do Comum). */
  spareTechniques?: string[];
  ai: AiProfile;
  /** Ganho por nível acima do 1 (frações acumulam; arredonda para baixo). */
  growth: { hp: number; chakra: number; speed: number; offense: AttackStats; resistance: Resistances };
  /** Retrato: arte de vilão (`villain:<id>`) ou de ninja por linhagem (`ninja:<chave>`). */
  portrait: string;
  /** Transformações que o roteiro (ou uma ativa) pode ligar (docs/jornada/roteiro.md). */
  forms?: FormDef[];
  /** Invocação (Gamabunta): entra pelo roteiro e não segue as regras de ninja (sem Bunshin). */
  summon?: boolean;
}

export interface EnemyDef {
  id: string;
  hp: number;
  chakra: number;
  speed: number;
  offense: AttackStats;
  resistance: Resistances;
  element: Element | null;
  /** Natureza de Kekkei Genkai (Gelo do Haku, Areia do Gaara): uma natureza só (src/core/nature.ts). */
  kekkeiGenkai?: KekkeiGenkaiId;
  techniques: string[];
  ai: AiProfile;
  passive?: EnemyPassive;
  portrait: string;
  /** Transformações que o roteiro pode ligar (Gaara → Shukaku). */
  forms?: FormDef[];
}

export interface Fighter {
  /** Id único na luta ('a0', 'e1'...). */
  uid: string;
  defId: string;
  side: TeamSide;
  protagonist: boolean;
  maxHp: number;
  hp: number;
  maxChakra: number;
  chakra: number;
  speed: number;
  offense: AttackStats;
  resistance: Resistances;
  element: Element | null;
  /** Natureza de Kekkei Genkai do lutador, quando houver. */
  kekkeiGenkai?: KekkeiGenkaiId;
  techniques: string[];
  ai: AiProfile;
  passive?: EnemyPassive;
  mods: FighterMods;
  effects: { kind: JEffect; turns: number }[];
  shield: number;
  clones: number;
  down: boolean;
  /** Postura defensiva até o próximo turno dele: usa a resistência inteira. */
  guarding: boolean;
  cooldowns: Record<string, number>;
  survivedOnce: boolean;
  /** A passiva de fúria já disparou (só para o log). */
  enraged: boolean;
  /** Fortalecimento ativo (uma técnica de boost por vez; usar de novo renova). */
  boost: (Boost & { techId: string }) | null;
  /** Portão aberto e turnos já mantidos (a próxima manutenção é a de número rounds + 1; trocar não zera). */
  gate: { level: number; rounds: number } | null;
  /** Forma ligada (roteiro), quando houver. */
  form?: string;
  /** Saiu da luta pelo roteiro (troca de fase): não volta nem conta para a vitória. */
  gone?: boolean;
  /** Caiu pelo roteiro (o Iruka protegendo o Naruto, o Sasuke contra o Haku): é cena, ninguém levanta nesta luta. */
  knocked?: boolean;
  /** Entrou pelo roteiro (invocação, convidado): não vai para a equipe da run no fim da luta. */
  guest?: boolean;
  /** Ficha de antes da forma e turnos que ainda restam dela (0 = até o fim da luta). */
  formBase?: { offense: AttackStats; resistance: Resistances; techniques: string[]; maxHp: number; mods: FighterMods; passive?: EnemyPassive };
  formTurns?: number;
}

/** Lutador pronto para entrar (sem uid, lado e estado de luta). */
export type FighterSeed = Omit<Fighter, 'uid' | 'side' | 'effects' | 'shield' | 'clones' | 'down' | 'guarding' | 'cooldowns' | 'survivedOnce' | 'enraged' | 'boost' | 'gate'>;

/** Como a luta se vence (docs/jornada/historia.md#vitórias-especiais). */
export type WinCondition =
  | { kind: 'defeatAll' }
  /** Levar o inimigo `target` (defId) a `pct` do HP máximo ou menos (sino do Kakashi). */
  | { kind: 'hpThreshold'; target: string; pct: number }
  /** Aguentar `rounds` rodadas de pé, ou levar `target` a `pct` (Sasuke no hospital). */
  | { kind: 'survive'; rounds: number; target: string; pct: number }
  /** Derrubar `target`, que só cai com a técnica `technique` (o Rasengan no Kabuto): outro golpe fatal deixa 1 de HP. */
  | { kind: 'finisher'; target: string; technique: string };

export type BattleStatus = 'ongoing' | 'won' | 'lost';

export type JEvent =
  | { type: 'round'; round: number }
  | { type: 'turn'; uid: string }
  | { type: 'skip'; uid: string; reason: 'stun' }
  /** `cost`: chakra pago, já com os descontos. */
  | { type: 'tech'; uid: string; techId: string; targets: string[]; cost: number }
  | { type: 'miss'; uid: string; target: string }
  | { type: 'damage'; uid: string; target: string; amount: number; crit: boolean; elementMult: number; absorbed: number }
  | { type: 'cloneBlock'; target: string; left: number }
  | { type: 'heal'; uid: string; target: string; amount: number }
  | { type: 'shield'; uid: string; target: string; amount: number }
  | { type: 'clones'; uid: string; total: number }
  | { type: 'effect'; target: string; effect: JEffect; turns: number }
  /** A trava segurou um atordoamento. */
  | { type: 'resist'; target: string; effect: JEffect }
  | { type: 'cleanse'; uid: string; target: string }
  | { type: 'tick'; target: string; effect: JEffect; amount: number }
  | { type: 'regen'; target: string; amount: number }
  /** `scripted`: caiu pelo roteiro (não foi derrotado). */
  | { type: 'down'; target: string; scripted?: boolean }
  | { type: 'survive'; target: string }
  /** `raise`: levantado pela ação universal (não por técnica nem pílula). */
  | { type: 'revive'; uid: string; target: string; hp: number; pill?: boolean; raise?: boolean }
  | { type: 'item'; uid: string; item: string; target: string }
  | { type: 'guard'; uid: string }
  | { type: 'rest'; uid: string; chakra: number }
  /** Chakra recuperado ao derrubar um inimigo. */
  | { type: 'chakraGain'; uid: string; amount: number }
  | { type: 'enrage'; uid: string }
  | { type: 'boost'; uid: string; techId: string; turns: number }
  /** Custo em HP de uma técnica (`source` = id) ou desgaste dos Portões (`source` = 'gates'). */
  | { type: 'hpCost'; uid: string; amount: number; source: string }
  /** Abriu ou trocou de portão (`level` 1–5; `cost` de chakra) ou fechou (0; `exhausted` quando faltou chakra). */
  | { type: 'gate'; uid: string; level: number; cost?: number; exhausted?: boolean }
  /** Manutenção dos Portões paga no fim do turno. */
  | { type: 'gateUpkeep'; uid: string; amount: number }
  /** Fala do roteiro (`line`: chave em strings/jornada.ts; `uid` null quando quem fala não está na luta). */
  | { type: 'say'; uid: string | null; who: string; line: string }
  /** Ligou uma forma (roteiro) ou a forma temporária acabou. */
  | { type: 'form'; uid: string; form: string }
  | { type: 'formEnd'; uid: string; form: string }
  /** Técnica sorteada: qual variante saiu. */
  | { type: 'roll'; uid: string; techId: string; variant: string }
  /** Entrou ou saiu da luta pelo roteiro. */
  | { type: 'enter'; uid: string }
  | { type: 'leave'; uid: string }
  /** O alvo do finalizador aguentou com 1 de HP (só cai com a técnica certa). */
  | { type: 'endure'; target: string; technique: string }
  | { type: 'end'; status: BattleStatus; scripted?: boolean };

export interface JBattle {
  round: number;
  fighters: Fighter[];
  /** Ordem dos turnos da rodada (uids). */
  order: string[];
  turnIndex: number;
  /** O turno atual já começou (efeitos do começo do turno aplicados). */
  turnStarted: boolean;
  status: BattleStatus;
  win: WinCondition;
  /** O protagonista já usou um item neste turno (item não gasta o turno, mas é um por turno). */
  itemUsed: boolean;
  /** O lutador do turno já usou uma ativa (ou trocou de portão): também não gasta o turno, uma por turno. */
  activeUsed: boolean;
  /** Quantas vezes os suportes já levantaram o protagonista nesta luta. */
  /** Pílulas de reanimação na bolsa: uma é usada sozinha quando o protagonista cai. */
  pills: number;
  pillHpPct: number;
  log: JEvent[];
  /** Roteiro da parada (docs/jornada/roteiro.md) e os índices das regras que já dispararam. */
  script: ScriptRule[];
  fired: number[];
  /** Lutadores que o roteiro pode pôr na luta (`enter`, `replace`). */
  reserve: { side: TeamSide; seed: FighterSeed }[];
  /** Marcas que o roteiro deixa na run (copiadas para `run.flags` no fim da luta). */
  flags: string[];
  /** Marcas que a run já tinha ao abrir a luta (condição `if` das regras do roteiro). */
  runFlags: string[];
  /** Trava contra recursão enquanto o roteiro executa. */
  scripting?: boolean;
}

/** Ação do protagonista. */
export type JAction =
  | { kind: 'tech'; techId: string; target: string }
  | { kind: 'guard' }
  | { kind: 'rest' }
  /** Levantar um aliado caído: gasta o turno; volta com pouco HP (`combat.raiseHpPct`). Só a equipe do jogador. */
  | { kind: 'raise'; target: string };

/** Ação grátis (não gasta o turno, uma por turno): ativa de classe ou troca de portão (0 = fechar). */
export type JFreeAction = { kind: 'active'; techId: string; target: string } | { kind: 'gate'; level: number };

export type ConsumableId = 'hpKit' | 'chakraKit' | 'reviveKit';
