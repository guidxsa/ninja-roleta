// Base única de origens (docs/base/origens.md#base-única, v0.64.0): as classes do Caminho Ninja saem das origens do
// Roleta. A origem tem um bloco `jornada` com o que é próprio do modo (técnicas, IA, suportes, desbloqueio), e os
// status do protagonista são calculados dos status da origem (`originScale` no balance da Jornada). Funções puras.
import type { AttackStats, LineageDef, Resistances } from '../types';
import type { ClassDef } from './trail';
import type { AiProfile, CharacterDef } from './types';

/** Protagonista da classe: tudo menos os status, que vêm da origem. */
export interface OriginHero {
  /** Id do personagem (o mesmo dos saves). */
  id: string;
  techniques: string[];
  spareTechniques?: string[];
  ai: AiProfile;
  portrait: string;
  /** Ajuste fino por cima da fórmula (soma; só com aprovação do usuário). */
  adjust?: { hp?: number; chakra?: number; speed?: number; offense?: Partial<AttackStats>; resistance?: Partial<Resistances> };
}

/** Classe do Caminho Ninja que a origem abre. */
export interface OriginClass {
  id: string;
  /** Conquista que libera a classe (sem o campo, liberada desde o início). */
  unlock?: string;
  /** Fichas da versão suporte (escritas à mão em `characters.ts`). */
  supports: string[];
  supportNames: string[];
  /** Origem cujo protagonista entra quando o sorteio não dá elemento (Comum → Prodígio). */
  noElementOrigin?: string;
  /** Sorteia um segundo elemento. */
  secondElement?: boolean;
}

export interface OriginJornada {
  hero: OriginHero;
  /** Sem o campo, a origem só empresta o protagonista (o Prodígio entra pela classe Comum). */
  class?: OriginClass;
}

/** Fórmula da origem para a Jornada (números em `jornadaBalance.originScale`). */
export interface OriginScale {
  offense: number;
  resistance: number;
  hp: number;
  chakra: number;
  /** Somado à speed da origem. */
  speedBonus: number;
  /** Crescimento por nível em fração do status inicial do protagonista (speed: fração da speed). */
  growth: { hp: number; chakra: number; speed: number; offense: number; resistance: number };
}

export interface HeroStats {
  hp: number;
  chakra: number;
  speed: number;
  offense: AttackStats;
  resistance: Resistances;
}

const ATTACKS = ['taijutsu', 'ninjutsu', 'genjutsu'] as const;
const RESISTANCES = ['physical', 'mental'] as const;
/** Crescimento com duas casas (as frações acumulam por nível). */
const two = (n: number) => Math.round(n * 100) / 100;

/** Status do protagonista: os da origem pela fórmula, arredondados para baixo, mais o ajuste da classe. */
export function jornadaHeroStats(lineage: LineageDef, scale: OriginScale): HeroStats {
  const adj = lineage.jornada?.hero.adjust ?? {};
  const s = lineage.stats;
  return {
    hp: Math.floor(s.hp * scale.hp) + (adj.hp ?? 0),
    chakra: Math.floor(s.chakra * scale.chakra) + (adj.chakra ?? 0),
    speed: s.speed + scale.speedBonus + (adj.speed ?? 0),
    offense: Object.fromEntries(ATTACKS.map((k) => [k, Math.floor(s[k] * scale.offense) + (adj.offense?.[k] ?? 0)])) as unknown as AttackStats,
    resistance: Object.fromEntries(RESISTANCES.map((k) => [k, Math.floor(lineage.resistance[k] * scale.resistance) + (adj.resistance?.[k] ?? 0)])) as unknown as Resistances,
  };
}

/** Crescimento por nível: proporcional ao perfil do protagonista (quem começa forte num status cresce mais nele). */
export function jornadaHeroGrowth(stats: HeroStats, scale: OriginScale): CharacterDef['growth'] {
  const g = scale.growth;
  return {
    hp: two(stats.hp * g.hp),
    chakra: two(stats.chakra * g.chakra),
    speed: two(stats.speed * g.speed),
    offense: Object.fromEntries(ATTACKS.map((k) => [k, two(stats.offense[k] * g.offense)])) as unknown as AttackStats,
    resistance: Object.fromEntries(RESISTANCES.map((k) => [k, two(stats.resistance[k] * g.resistance)])) as unknown as Resistances,
  };
}

/** Ficha do protagonista da origem (null sem bloco `jornada`). */
export function jornadaHero(lineage: LineageDef, scale: OriginScale): CharacterDef | null {
  const h = lineage.jornada?.hero;
  if (!h) return null;
  const stats = jornadaHeroStats(lineage, scale);
  const silent = lineage.elementalPotential === 'none';
  return {
    id: h.id,
    ...stats,
    element: lineage.elements.fixed ?? null,
    ...(silent ? { noElement: true } : {}),
    techniques: [...h.techniques],
    ...(h.spareTechniques ? { spareTechniques: [...h.spareTechniques] } : {}),
    ai: h.ai,
    growth: jornadaHeroGrowth(stats, scale),
    portrait: h.portrait,
  };
}

/**
 * Classes do Caminho Ninja, na ordem das origens. A natureza vem da regra da origem: elemento fixo (Uchiha),
 * natureza silenciosa (Hyuuga) ou o protagonista sem elemento (Comum → Prodígio).
 */
export function jornadaClasses(lineages: readonly LineageDef[]): ClassDef[] {
  const heroOf = (id: string) => lineages.find((l) => l.id === id)?.jornada?.hero.id;
  return lineages.flatMap((l): ClassDef[] => {
    const c = l.jornada?.class;
    if (!c) return [];
    const noElementHero = c.noElementOrigin ? heroOf(c.noElementOrigin) : undefined;
    return [
      {
        id: c.id,
        hero: l.jornada!.hero.id,
        ...(noElementHero ? { noElementHero } : {}),
        ...(l.elements.fixed ? { fixedElement: l.elements.fixed } : {}),
        ...(c.secondElement ? { secondElement: true } : {}),
        ...(l.elementalPotential === 'none' ? { noElement: true } : {}),
        ...(c.unlock ? { unlock: c.unlock } : {}),
        supports: [...c.supports],
        supportNames: [...c.supportNames],
      },
    ];
  });
}
