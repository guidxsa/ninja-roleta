// Tipos do modo Jornada (docs/jornada/). O combate é de equipe e não depende do combate do Roleta;
// só as fórmulas puras (acerto, dano, elementos) são compartilhadas.
import type { AttackStats, AttackType, Element, KekkeiGenkaiId, Resistances } from '../types';
import type { FormDef, ScriptRule } from './script';
import type { BarrierState } from '../barriers';
import type { CloneKind } from '../clones';

export type TeamSide = 'ally' | 'enemy';

/** Efeitos com duração em turnos de quem sofre (docs/jornada/combate.md#efeitos). */
/** `stunGuard`: a trava de quem acabou de sair de um atordoamento (não pode ser atordoado de novo enquanto durar). */
export type JEffect = 'stun' | 'burn' | 'poison' | 'chakraBlock' | 'fear' | 'stunGuard';

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
  /**
   * O escudo é uma barreira elemental (src/core/barriers.ts, v0.77.0): tem o elemento (ou a Kekkei Genkai) da técnica,
   * dura `balance.barrier.turns` turnos de quem a recebe e só ele sente a vantagem de elemento.
   */
  barrier?: boolean;
  /** Tira atordoamento e bloqueio de chakra do alvo. */
  cleanse?: boolean;
  /** Clones criados em quem usa. */
  clones?: number;
  /** Tipo dos clones criados (src/core/clones.ts). Sem o campo: Kage Bunshin. */
  cloneKind?: CloneKind;
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
  // Regras dos talentos finais e de combinação do Naruto (v0.71.0, docs/jornada/talentos.md).
  /** Clones: com clone ativo, o golpe de alvo único cai sempre no clone (sem o sorteio de bloqueio). */
  cloneShield: boolean;
  /** Pegadinhas: golpe que acerta um alvo atordoado é sempre crítico. */
  stunnedAlwaysCrit: boolean;
  /** Sapos: a técnica sorteada gira duas vezes e fica com a variante que vem depois na lista (a melhor). */
  rollTwice: boolean;
  /** Kyuubi: ao ficar com 1 de HP em vez de cair (`surviveOnce`), liga esta forma da ficha ('' = nenhuma). */
  surviveForm: string;
  /** Rasengan: fração do dano que sobra de um golpe fatal desta técnica e passa para o próximo inimigo de pé. */
  techOverflow: Record<string, number>;
  /** Sapos + Kyuubi: peso a mais das variantes sorteadas com o HP abaixo da metade. */
  lowHpRollWeights: Record<string, number>;
  // Relíquias refeitas (v0.78.0, docs/balanceamento/diagnostico.md P3).
  /** Turnos a mais nos efeitos que as técnicas aplicam (Frasco de toxina). */
  effectTurnsBonus: number;
  /** Dano × este valor contra alvo atordoado, com Medo ou com o chakra bloqueado (Linha de sombra). */
  controlledDamageMult: number;
  /** Chance de dar Medo em cada golpe que acerta (Incenso dos sonhos). */
  fearOnHit: number;
  /** Defender cura esta fração do HP máximo (Colete acolchoado). */
  guardHealPct: number;
  // Árvore do Comum (v0.84.0, docs/jornada/talentos.md#comum-caminho-ninja).
  /** Penetração a mais por tipo de ataque (Punho firme, Mestre do elemento). */
  typePen: Partial<Record<AttackType, number>>;
  /** Com clone de pé, quem ataca tem este acerto a menos (Ilusão perfeita). */
  cloneEnemyAccuracy: number;
  /** Golpes a mais nas técnicas de taijutsu de dano (Combo da Folha). */
  taijutsuExtraHits: number;
  /** Golpes a mais no taijutsu por clone de pé, até 2 (Mil golpes). */
  taijutsuHitsPerClone: number;
  /** Cada golpe de taijutsu seguido que acerta na mesma técnica: +este dano, até +30% (Combo da Folha). */
  comboStepPct: number;
  /** Chakra devolvido por golpe de taijutsu que acerta (Ritmo de luta). */
  taijutsuHitChakra: number;
  /** O clone de qualquer tipo bate junto com pelo menos esta fração do dano de um golpe (Clone de ataque). */
  cloneStrikePct: number;
  /** Ninjutsu em alvo atordoado: esta fração do dano vai para os outros inimigos (Explosão em cadeia). */
  stunnedSplashPct: number;
  /** Ao sobreviver com 1 de HP: recupera esta fração e fica firme (Vontade do Fogo). */
  surviveHealPct: number;
  /** Ao sobreviver com 1 de HP: a equipe recupera esta fração (Nunca sozinho). */
  surviveTeamHealPct: number;
  // Árvore do prodígio (v0.85.0, docs/jornada/talentos.md#prodígio-caminho-ninja).
  /** Abrir cada portão custa menos chakra (Abertura rápida). */
  gateOpenDiscount: number;
  /** Abaixo de 25% do HP, o portão aberto sobe um nível sozinho (Portões sem freio). */
  gateAutoUp: boolean;
  /** Somado ao multiplicador do crítico (Chama da juventude). */
  critMultBonus: number;
  /** Chakra devolvido por crítico (Chama da juventude). */
  critChakra: number;
  /** Golpes a mais em técnicas específicas (Bêbado de verdade, Furacão embriagado). */
  techExtraHits: Record<string, number>;
  /** O primeiro golpe da luta é crítico, se acertar (Tirar os pesos). */
  openingCrit: boolean;
  /** Chance de revidar ao apanhar de golpe de alvo único, e o dano do revide (Contra-ataque). */
  counterChance: number;
  counterDamage: number;
  /** Contra quem tem mais HP máximo que você: dano × e acerto + (Duelo). */
  duelDamageMult: number;
  duelAccuracy: number;
  /** Dano × contra quem está acima da metade do HP (Desafio). */
  healthyTargetMult: number;
  /** Quando alguém da equipe cai (1 vez por luta): os de pé ganham este dano por 3 turnos (Lição do mestre). */
  fallenRally: number;
  /** Com o portão deste nível ou acima aberto, as técnicas não cobram HP (Lótus Oculta perfeita). */
  hpCostFreeAtGate: number;
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
  /** Barreira elemental de pé (src/core/barriers.ts), ou null. */
  barrier: BarrierState | null;
  clones: number;
  /** Tipo dos clones (todos do mesmo: o último criado manda) e golpes que o da frente já segurou. */
  cloneKind: CloneKind;
  cloneWear: number;
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
  /** Forma à mostra (a última que entrou), quando houver. */
  form?: string;
  /** Já rolou o golpe de abertura (Tirar os pesos). */
  openerUsed?: boolean;
  /** A Lição do mestre já disparou nesta luta. */
  rallied?: boolean;
  /** Saiu da luta pelo roteiro (troca de fase): não volta nem conta para a vitória. */
  gone?: boolean;
  /** Caiu pelo roteiro (o Iruka protegendo o Naruto, o Sasuke contra o Haku): é cena, ninguém levanta nesta luta. */
  knocked?: boolean;
  /** Entrou pelo roteiro (invocação, convidado): não vai para a equipe da run no fim da luta. */
  guest?: boolean;
  /** Ficha de antes das formas. */
  formBase?: { offense: AttackStats; resistance: Resistances; techniques: string[]; maxHp: number; mods: FighterMods; passive?: EnemyPassive };
  /** Formas ligadas, na ordem em que entraram, e os turnos que restam de cada uma (0 = até o fim da luta). */
  forms?: { def: FormDef; turns: number }[];
}

/** Lutador pronto para entrar (sem uid, lado e estado de luta). */
export type FighterSeed = Omit<Fighter, 'uid' | 'side' | 'effects' | 'shield' | 'barrier' | 'clones' | 'cloneKind' | 'cloneWear' | 'down' | 'guarding' | 'cooldowns' | 'survivedOnce' | 'enraged' | 'boost' | 'gate'>;

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
  /** Um clone segurou o golpe (`left`: os que sobram; `broken`: o clone da frente se desfez). */
  | { type: 'cloneBlock'; target: string; left: number; kind?: CloneKind; broken?: boolean }
  /** Clones bateram junto com o dono (Mizu, Mokuton). */
  | { type: 'cloneStrike'; uid: string; target: string; amount: number }
  /** Barreira elemental: erguida, golpeada (encontro de elementos no escudo), quebrada, apagou o fogo ou acabou. */
  | { type: 'barrier'; uid: string; action: 'raise' | 'hit' | 'break' | 'douse' | 'end'; techId: string; points?: number; absorbed?: number; left?: number; mult?: number }
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
  /** Ganhou uma técnica pelo roteiro, até o fim da luta. */
  | { type: 'teach'; uid: string; techId: string }
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
