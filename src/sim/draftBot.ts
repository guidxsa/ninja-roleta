// Bot do rascunho de talentos (docs/jornada/talentos.md#rascunho): escolhe o núcleo e compra na oferta por pontuação.
// É o que um jogador médio faria: segue o núcleo, pega técnica nova e mira no talento final e nas combinações; guarda
// o ponto quando o melhor cartão ainda não cabe; troca a oferta quando ela não tem nada do núcleo nem técnica.
import type { JornadaData } from '../core/jornada/data';
import { buyTalent, chooseCore, draftRerollsLeft, needsCore, rerollTalents, runCoreOffer, talentLearns, talentOffer, type JRun } from '../core/jornada/run';
import { talentRankCost } from '../core/jornada/talents';

/** Pontuação de um cartão da oferta. */
export function draftScore(run: JRun, id: string, data: JornadaData): number {
  const n = data.talents.find((t) => t.id === id)!;
  const learn = talentLearns(run, id, data);
  const upgrade = run.talents.includes(id);
  let s = 1;
  if (n.branch === run.draft?.core) s += 3;
  if (!upgrade && learn && !run.learned.includes(learn)) s += 3;
  if (n.capstone) s += 4;
  if (n.requiresAll) s += 2;
  if (upgrade) s -= 0.5;
  return s;
}

const costOf = (run: JRun, id: string, data: JornadaData) => {
  const n = data.talents.find((t) => t.id === id)!;
  return run.talents.includes(id) ? talentRankCost(n) : n.cost;
};

/**
 * Escolhe o núcleo (o pedido, ou o primeiro oferecido) e gasta os pontos no rascunho. `core`: força um núcleo (medir
 * cada um com `--ramos --classe=commonNinja`).
 */
export function spendDraft(run0: JRun, data: JornadaData, unlocked: ReadonlySet<string>, core?: string): JRun {
  let run = run0;
  if (needsCore(run)) run = chooseCore(run, core ?? runCoreOffer(run, data)[0]!, data, Boolean(core));
  for (let guard = 0; guard < 60; guard++) {
    const offer = talentOffer(run, data, unlocked);
    if (!offer.length) return run;
    const ranked = [...offer].sort((a, b) => draftScore(run, b, data) - draftScore(run, a, data));
    const best = ranked[0]!;
    if (draftScore(run, best, data) < 3 && draftRerollsLeft(run, data) > 0 && run.talentPoints > 0) {
      run = rerollTalents(run, data);
      continue;
    }
    // O melhor ainda não cabe: guarda o ponto (a oferta fica a mesma até a próxima compra).
    if (costOf(run, best, data) > run.talentPoints) return run;
    run = buyTalent(run, best, unlocked, data);
  }
  return run;
}
