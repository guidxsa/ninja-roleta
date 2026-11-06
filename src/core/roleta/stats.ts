// Resumo de uma luta do Roleta enxuto para as conquistas e o Livro Bingo (mesmo formato da base: `FightSummary`).
// Campos de mecânicas que saíram do Roleta (cópia, pílula vermelha, Devorar, manto suprimido) ficam zerados.
import type { FightSummary } from '../runStats';
import type { RBattle } from './battle';

export function summarizeRoletaFight(villainId: string, exam: boolean, battle: RBattle): FightSummary {
  const s: FightSummary = {
    villainId,
    exam,
    won: battle.status === 'won',
    damageTaken: 0,
    hpPctEnd: battle.player.maxHp > 0 ? battle.player.hp / battle.player.maxHp : 0,
    bestHit: 0,
    bestCrit: 0,
    worstHit: 0,
    villainSelfHits: 0,
    copies: 0,
    itemsUsed: 0,
    revivesUsed: 0,
    maxGate: 0,
    redPill: false,
    devourFinish: false,
    cloakSuppressed: false,
  };
  for (const e of battle.log) {
    if (e.type === 'damage' && e.side === 'player') {
      s.damageTaken += e.amount;
      if (e.source === 'attack') s.worstHit = Math.max(s.worstHit, e.amount);
    }
    if (e.type === 'damage' && e.side === 'villain' && e.source !== 'burn' && e.source !== 'poison') {
      s.bestHit = Math.max(s.bestHit, e.amount);
      if (e.crit) s.bestCrit = Math.max(s.bestCrit, e.amount);
      if (e.source === 'self') s.villainSelfHits++;
    }
    if (e.type === 'item') s.itemsUsed++;
    if (e.type === 'revive' && e.side === 'player') s.revivesUsed++;
    // Os Portões enxutos são um nível só: contam como o 1º portão.
    if (e.type === 'active' && e.kind === 'gates') s.maxGate = Math.max(s.maxGate, 1);
  }
  return s;
}
