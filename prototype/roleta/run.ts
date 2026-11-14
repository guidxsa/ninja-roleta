// Roleta: o laço da run (mapa → evento → luta → recompensa → fim), o abandono e o recorde.
import { drawVillain, currentCategory, villainFor, finishRoletaFight, chooseChest, continueRoletaCycle, cycleMult } from '../../src/core/roleta/run';
import { type TrailEntry } from '../../src/core/share';
import { roletaData as rdata } from '../../src/data/roleta/index';
import { roletaVillainsById as villainsById } from '../../src/data/roleta/villains';
import { ptBR as S } from '../../src/data/strings/ptBR';
import { recordRoletaReach, saveProfile } from '../../src/state/profile';
import { icon } from '../art';
import { relicName } from '../jornada/relics';
import { setRun, getRun, track, villainName, noteFight, checkAchievements, stepLog } from './common';
import { battleScreen } from './screens/battle';
import { endScreen } from './screens/end';
import { eventScreen } from './screens/event';
import { mapScreen } from './screens/map';
import { levelUps, relicRewardScreen, chestScreen, noticeScreen } from './screens/rewards';
import { ses } from './session';

// ---------------------------------------------------------------------------
// Fluxo da campanha

/**
 * Run do Roleta enxuto (docs/roleta/run.md): a cada passo, sorteia o vilão da categoria, gira o evento, luta, ganha o
 * XP e a recompensa. Depois do chefe: baú e o próximo ciclo (no 1º, a tela de vitória pergunta se segue).
 */
export async function runCampaign(): Promise<void> {
  const c = ses.camp!;
  const RR = S.roleta.run;
  for (;;) {
    if (!c.run.villainId) setRun(drawVillain(getRun(), rdata, ses.rng));
    const run = getRun();
    const id = run.villainId!;
    track({ furthestStage: run.step, cycle: run.cycle, fights: run.wins });
    const entry: TrailEntry = { name: villainName(id), exam: false, results: [] };
    c.trail.push(entry);
    // Mapa → evento pré-luta (uma vez) → luta. Do evento dá para voltar ao mapa; aí o botão vira Lutar.
    let eventDone = false;
    let go: 'event' | 'fight' | 'abandon';
    for (;;) {
      go = await mapScreen(eventDone);
      if (go !== 'event') break;
      eventDone = true;
      if ((await eventScreen(villainName(id))) === 'fight') {
        go = 'fight';
        break;
      }
    }
    if (go === 'abandon') return abandonRun();
    const fightCat = currentCategory(getRun(), rdata);
    const cat = RR.categories[fightCat]!;
    const result = await battleScreen(
      {
        villainId: id,
        options: { villainStartsFirst: c.mods.villainStartsFirst, playerStartsFirst: c.mods.playerStartsFirst },
        label: RR.fightLabel(c.run.cycle + 1, cat, villainName(id)),
        exam: false,
        def: villainFor(getRun(), villainsById, rdata),
      },
      true,
    );
    if (!result) return abandonRun();
    entry.results.push(result.status === 'won' ? 'win' : 'loss');
    noteFight(id, false, result);
    const { run: next, outcome } = finishRoletaFight(getRun(), result, rdata, ses.rng);
    setRun(next);
    if (!outcome.won) {
      // A partir do ciclo 2 a run já foi vencida: o registro continua como vitória.
      if (c.run.cycle === 0) track({ status: 'defeat', cycle: 0, fights: c.run.wins });
      else track({ cycle: c.run.cycle, fights: c.run.wins });
      const record = recordRoleta();
      checkAchievements('defeat', id);
      await endScreen(false, villainName(id), record);
      return;
    }
    await levelUps();
    // Depois da luta (fora o chefe): a roleta de relíquia, com a raridade pela categoria do vilão.
    if (!outcome.boss) await relicRewardScreen(fightCat);
    if (c.run.bossChoice) {
      const relic = await chestScreen(c.run.bossChoice);
      setRun(chooseChest(getRun(), relic, rdata));
      stepLog()?.items.push(`${icon('sparkle')} ${relicName(relic)}`);
    }
    if (!outcome.boss) continue;
    // Fim de ciclo.
    const record = recordRoleta();
    if (c.run.status === 'victory') {
      track({ status: 'victory', cycle: 0, fights: c.run.wins });
      checkAchievements('victory', null);
      if ((await endScreen(true, null, record)) !== 'continue') return;
      setRun(continueRoletaCycle(getRun()));
    } else {
      // Do 2º ciclo em diante, o próximo emenda sozinho.
      track({ cycle: c.run.cycle, fights: c.run.wins });
      checkAchievements('victory', null);
    }
    await noticeScreen(RR.cycle(c.run.cycle + 1), RR.cycleStart(Math.round((cycleMult(getRun(), rdata) - 1) * 100)));
  }
}

/** Abandonar a run (mapa ou luta): conta como abandonada e mostra o fim da run. */
export async function abandonRun(): Promise<void> {
  const c = ses.camp!;
  track({ status: 'abandoned', cycle: c.run.cycle, fights: c.run.wins });
  const record = recordRoleta();
  ses.campLive = false;
  await endScreen(false, null, record, true);
}

/** Recorde do Roleta (ciclo alcançado e lutas vencidas); devolve se bateu. */
export function recordRoleta(): boolean {
  if (!ses.camp) return false;
  const next = recordRoletaReach(ses.profile, { cycle: ses.camp.run.cycle + 1, fights: ses.camp.run.wins });
  if (next === ses.profile) return false;
  ses.profile = next;
  saveProfile(ses.storage, ses.profile);
  return true;
}
