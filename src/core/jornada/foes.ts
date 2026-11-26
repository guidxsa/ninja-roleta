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
