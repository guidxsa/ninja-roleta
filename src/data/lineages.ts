import { COMMON_LINEAGE } from '../core/origin';
import type { ElementRule, LineageDef } from '../core/types';

// Origens (docs/base/origens.md). Textos visíveis ficam em strings/ptBR.ts.
// Uma roleta só, com os pesos de cada linhagem abaixo (a soma e as porcentagens estão em docs/base/origens.md).
// Status iniciais absolutos com o orçamento de referência de 90 pontos: taijutsu/ninjutsu/genjutsu e as resistências valem 1,
// speed 1,5, 10 de HP valem 1 e 2 de chakra valem 1. Distribuição pela lore (v0.30), com o total perto de 90. Kit inicial: Taijutsu básico; o ninjutsu básico do elemento principal só no potencial
// pleno (Comum e o fogo do Uchiha). As origens com kit dedicado começam com as técnicas da linhagem.

/**
 * Natureza das origens sem ninjutsu elemental (docs/base/origens.md#natureza): uma, sorteada em silêncio (sem roleta),
 * só na ficha e na vantagem elemental (v0.59.0).
 */
const SILENT_NATURE: ElementRule = { countWeights: [0, 1], silent: true };


export const lineages: LineageDef[] = [
  {
    id: COMMON_LINEAGE,
    tier: 'common',
    // Leva o peso do Prodígio do taijutsu (30 + 9): o Comum sem elemento vira Prodígio (`rollOrigin`).
    weight: 39,
    // Base de ninjutsu elemental; genjutsu baixo (antes 10/10/10, com o genjutsu desperdiçado).
    stats: { taijutsu: 12, ninjutsu: 13, genjutsu: 5, speed: 10, hp: 100, chakra: 32 },
    resistance: { physical: 10, mental: 9 },
    // Roleta de proficiência: sem proficiência (9 de 39 no total) = Prodígio do taijutsu; com, uma natureza (v0.59.0).
    elements: { countWeights: [18, 60] },
    elementalPotential: 'full',
    passive: 'determination',
    active: 'effort',
    // Caminho Ninja: classe Comum; sem elemento no sorteio, o protagonista vira o do Prodígio.
    jornada: {
      hero: {
        id: 'commonNinja',
        techniques: ['jStrike', 'jShuriken', 'jBunshin', 'jEffort'],
        spareTechniques: ['jKunai'],
        ai: 'striker',
        portrait: 'ninja:common',
        // v0.65.0 (aprovado pelo usuário): o Comum ficava bem abaixo das outras classes com os inimigos mais fortes.
        adjust: { hp: 15, chakra: 4, offense: { taijutsu: 1, ninjutsu: 1 } },
      },
      class: { id: 'common', noElementOrigin: 'taijutsuProdigy', supports: ['leafGeninA', 'leafGeninB', 'leafMedic'], supportNames: ['daichi', 'hana', 'kenta', 'yui', 'sora', 'aiko', 'haruto', 'rin', 'takumi', 'mei', 'riku', 'nanami'] },
    },
  },
  {
    id: 'nara',
    tier: 'clan',
    weight: 8,
    stats: { taijutsu: 7, ninjutsu: 14, genjutsu: 9, speed: 9, hp: 100, chakra: 34 },
    resistance: { physical: 9, mental: 12 },
    elements: SILENT_NATURE,
    elementalPotential: 'none',
    passive: 'genius',
    startingTechniques: ['shadowImitation', 'shadowStrangle', 'shadowSlash'],
  },
  {
    id: 'akimichi',
    tier: 'clan',
    weight: 8,
    stats: { taijutsu: 15, ninjutsu: 7, genjutsu: 4, speed: 6, hp: 150, chakra: 34 },
    resistance: { physical: 14, mental: 7 },
    elements: SILENT_NATURE,
    elementalPotential: 'none',
    passive: 'heavyBody',
    active: 'expansion',
    startingTechniques: ['expandedHand'],
  },
  {
    id: 'yamanaka',
    tier: 'clan',
    weight: 8,
    stats: { taijutsu: 8, ninjutsu: 9, genjutsu: 16, speed: 10, hp: 100, chakra: 32 },
    resistance: { physical: 8, mental: 15 },
    elements: SILENT_NATURE,
    elementalPotential: 'none',
    passive: 'mindReading',
    active: 'transmission',
    startingTechniques: ['mindTransfer', 'petalIllusion'],
  },
  {
    id: 'aburame',
    tier: 'clan',
    weight: 8,
    stats: { taijutsu: 7, ninjutsu: 13, genjutsu: 8, speed: 8, hp: 105, chakra: 38 },
    resistance: { physical: 11, mental: 12 },
    elements: SILENT_NATURE,
    elementalPotential: 'none',
    passive: 'hive',
    active: 'plague',
    startingTechniques: ['insectSwarm', 'insectDevour'],
  },
  {
    id: 'inuzuka',
    tier: 'clan',
    weight: 8,
    stats: { taijutsu: 15, ninjutsu: 7, genjutsu: 5, speed: 14, hp: 100, chakra: 24 },
    resistance: { physical: 13, mental: 7 },
    elements: SILENT_NATURE,
    elementalPotential: 'none',
    passive: 'duo',
    active: 'beast',
    startingTechniques: ['fangOverFang'],
  },
  {
    // Portões evoluem com o taijutsu (estágios em `balance.gates`).
    id: 'taijutsuProdigy',
    tier: 'rare',
    // Fora da roleta da linhagem: sai do Comum que tira 0 elementos (`rollOrigin`).
    weight: 0,
    stats: { taijutsu: 18, ninjutsu: 0, genjutsu: 0, speed: 13, hp: 110, chakra: 22 },
    resistance: { physical: 12, mental: 8 },
    elements: SILENT_NATURE,
    elementalPotential: 'none',
    passive: 'youth',
    // O taijutsu dele já é concentrado: cresce pela metade.
    taijutsuGrowth: 0.5,
    active: 'gates',
    startingTechniques: ['leafHurricane'],
    forbiddenAttackTypes: ['ninjutsu', 'genjutsu'],
    // Caminho Ninja: o protagonista da classe Comum quando o sorteio não dá elemento.
    jornada: {
      hero: {
        id: 'prodigy',
        techniques: ['jStrike', 'jLeafWhirlwind', 'jShuriken', 'jGates'],
        ai: 'striker',
        portrait: 'ninja:taijutsuProdigy',
        // v0.65.0 (pedido do usuário: o Prodígio perto de 70% no Médio, de 92%).
        adjust: { hp: -10, offense: { taijutsu: -3 } },
      },
    },
  },
  {
    id: 'uchiha',
    tier: 'rare',
    weight: 7,
    stats: { taijutsu: 10, ninjutsu: 12, genjutsu: 13, speed: 11, hp: 100, chakra: 28 },
    resistance: { physical: 10, mental: 11 },
    // Sempre e só Fogo (v0.59.0).
    elements: { fixed: 'fire', countWeights: [0, 1] },
    elementalPotential: 'fixedOnly',
    passive: 'genjutsuResistance',
    startingTechniques: ['basicGenjutsu', 'painIllusion'],
    dojutsu: 'sharingan',
    // Caminho Ninja: sempre e só Fogo (a regra da origem).
    jornada: {
      hero: {
        id: 'uchihaNinja',
        techniques: ['jStrike', 'jShuriken', 'jFireball', 'jSharingan', 'jBunshin'],
        ai: 'striker',
        portrait: 'ninja:uchiha',
        // As técnicas da Jornada são de ninjutsu e taijutsu: o perfil por igual da origem derrubava o Uchiha (v0.64.0,
        // aprovado pelo usuário). Volta ao perfil de antes da base única.
        adjust: { hp: 5, chakra: 4, offense: { taijutsu: 3, ninjutsu: 3, genjutsu: -1 }, resistance: { mental: 1 } },
      },
      class: { id: 'uchiha', unlock: 'j_unlockUchiha', supports: ['uchihaGenin', 'uchihaGeninB'], supportNames: ['ren', 'akane', 'hikaru', 'tetsu', 'kaede', 'ryo', 'suzu', 'jin', 'kiyomi', 'nao'] },
    },
  },
  {
    id: 'hyuuga',
    tier: 'rare',
    weight: 7,
    stats: { taijutsu: 15, ninjutsu: 6, genjutsu: 6, speed: 12, hp: 100, chakra: 28 },
    resistance: { physical: 11, mental: 10 },
    elements: SILENT_NATURE,
    elementalPotential: 'none',
    passive: 'preciseFist',
    startingTechniques: ['chakraBlockStrike'],
    dojutsu: 'byakugan',
    // Caminho Ninja: natureza silenciosa, sem ninjutsu elemental (Byakugan e Punho Suave bastam).
    jornada: {
      hero: {
        id: 'hyuugaNinja',
        techniques: ['jStrike', 'jGentlePalm', 'jShuriken', 'jByakugan', 'jBunshin'],
        ai: 'striker',
        portrait: 'ninja:hyuuga',
        // O ajuste da v0.64.0 (+1 taijutsu, +5 HP) saiu na v0.65.0: com os inimigos mais fortes, a fórmula pura basta.
      },
      class: { id: 'hyuuga', unlock: 'j_unlockHyuuga', supports: ['hyuugaGenin', 'hyuugaGeninB'], supportNames: ['mio', 'sei', 'haru', 'yuki', 'kenji', 'emi', 'tomo', 'aya', 'shun', 'mai'] },
    },
  },
  {
    id: 'uzumaki',
    tier: 'rare',
    weight: 7,
    stats: { taijutsu: 12, ninjutsu: 12, genjutsu: 3, speed: 11, hp: 120, chakra: 38 },
    resistance: { physical: 12, mental: 9 },
    // Uma natureza com ninjutsu elemental: ela ocupa o lugar da Etiqueta Explosiva no kit (v0.59.0).
    elements: { countWeights: [0, 1] },
    elementalPotential: 'full',
    passive: 'vitality',
    active: 'seal',
  },
  {
    // Senju (lendária): vida e chakra como o Uzumaki, um degrau acima; domina qualquer elemento.
    id: 'senju',
    tier: 'legendary',
    weight: 3,
    stats: { taijutsu: 12, ninjutsu: 13, genjutsu: 5, speed: 12, hp: 125, chakra: 40 },
    resistance: { physical: 12, mental: 10 },
    // Uma natureza; a rolagem especial do Mokuton está em kekkeiGenkai.ts.
    elements: { countWeights: [0, 1] },
    elementalPotential: 'full',
    passive: 'vitalForce',
    extraRevives: 1,
  },
];

export const lineagesById: Record<string, LineageDef> = Object.fromEntries(lineages.map((l) => [l.id, l]));
