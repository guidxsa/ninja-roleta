import { isFight, type GenericDef, type StageDef } from './trail';
import type { JBattle } from './types';

// Livro Bingo da Jornada (docs/base/perfil.md#livro-bingo): o que uma luta encerrada diz de cada inimigo. Só lê a luta;
// não muda regra nem número.

export interface FoeFight {
  /** Id da ficha do inimigo (`src/data/jornada/enemies.ts`). */
  id: string;
  won: boolean;
  /** Maior golpe da equipe nele e maior golpe dele na equipe. */
  bestHit: number;
  worstHit: number;
}

/**
 * Um resumo por inimigo (vários do mesmo tipo, como os capangas do Gatō, contam como uma luta só). `won`: a equipe
 * venceu (a derrota inevitável do teste do sino conta como vitória, como no `finishFight`).
 */
export function foeFights(battle: JBattle, won = battle.status === 'won'): FoeFight[] {
  const byUid = new Map(battle.fighters.map((f) => [f.uid, f]));
  const out = new Map<string, FoeFight>();
  for (const f of battle.fighters) {
    if (f.side !== 'enemy' || out.has(f.defId)) continue;
    out.set(f.defId, { id: f.defId, won, bestHit: 0, worstHit: 0 });
  }
  for (const e of battle.log) {
    if (e.type !== 'damage') continue;
    const from = byUid.get(e.uid);
    const to = byUid.get(e.target);
    if (!from || !to || from.side === to.side) continue;
    const foe = out.get(from.side === 'enemy' ? from.defId : to.defId);
    if (!foe) continue;
    if (from.side === 'enemy') foe.worstHit = Math.max(foe.worstHit, e.amount);
    else foe.bestHit = Math.max(foe.bestHit, e.amount);
  }
  return [...out.values()];
}

/** Grau do inimigo no Livro Bingo (a moldura da ficha): luta comum, elite ou chefe. */
export type FoeTier = 'common' | 'elite' | 'boss';
export interface FoeGroup {
  /** Id do arco (História) ou do estágio (Caminho Ninja). */
  id: string;
  foes: { id: string; tier: FoeTier }[];
}

const TIER_RANK: Record<FoeTier, number> = { common: 0, elite: 1, boss: 2 };
const tierOf = (kind: string): FoeTier => (kind === 'boss' ? 'boss' : kind === 'elite' ? 'elite' : 'common');

/** Junta os inimigos de um arco ou estágio na ordem em que aparecem; quem aparece em mais de um grau fica com o maior. */
function group(id: string, entries: { ids: readonly string[]; tier: FoeTier }[], isEnemy: (id: string) => boolean): FoeGroup {
  const foes: FoeGroup['foes'] = [];
  for (const { ids, tier } of entries) {
    for (const foe of ids) {
      if (!isEnemy(foe)) continue;
      const found = foes.find((f) => f.id === foe);
      if (!found) foes.push({ id: foe, tier });
      else if (TIER_RANK[tier] > TIER_RANK[found.tier]) found.tier = tier;
    }
  }
  return { id, foes };
}

/** Quem entra no meio da luta pelo roteiro (os mercenários da ponte, o Ukon): inimigos que a lista da parada não traz. */
const scriptEntrants = (script: readonly { do: readonly { do: string; who?: string; with?: string }[] }[] | undefined) =>
  (script ?? []).flatMap((r) => r.do.flatMap((a) => (a.do === 'enter' && a.who ? [a.who] : a.do === 'replace' && a.with ? [a.with] : [])));

/** Livro Bingo da História: um grupo por arco, com o grau de cada inimigo pela parada (luta, elite ou chefe). */
export function storyFoeGroups(stages: readonly StageDef[], isEnemy: (id: string) => boolean): FoeGroup[] {
  return stages.map((stage) =>
    group(
      stage.id,
      stage.stops.filter(isFight).flatMap((stop) => [
        { ids: stop.enemies, tier: tierOf(stop.kind) },
        { ids: scriptEntrants(stop.script), tier: tierOf(stop.kind) },
      ]),
      isEnemy,
    ),
  );
}

/** Livro Bingo do Caminho Ninja: um grupo por estágio, com as lutas, as elites (e a rara) e os chefes. */
export function pathFoeGroups(generic: GenericDef, isEnemy: (id: string) => boolean): FoeGroup[] {
  return generic.stages.map((stage) =>
    group(
      stage.id,
      [
        { ids: [...stage.easyFights, ...stage.fights].flat(), tier: 'common' as const },
        { ids: [...stage.elites.flat(), ...(stage.rareElite?.enemies ?? [])], tier: 'elite' as const },
        { ids: stage.bosses.flat(), tier: 'boss' as const },
        { ids: Object.values(stage.encounters ?? {}).flatMap((e) => scriptEntrants(e.script)), tier: 'boss' as const },
      ],
      isEnemy,
    ),
  );
}
