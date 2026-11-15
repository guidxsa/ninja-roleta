// Cenários do modo Roleta: origem, mapa, eventos (com o resultado garantido pela seed), luta, recompensas e fim.
import { xpToNextLevel } from '../../../src/core/player';
import { rollWeighted } from '../../../src/core/progression';
import { startRoletaBattle, type RBattle } from '../../../src/core/roleta/battle';
import { cycleMult, relicPool, villainFor } from '../../../src/core/roleta/run';
import { bossChoices } from '../../../src/core/jornada/relics';
import { createRng, type Rng } from '../../../src/core/rng';
import { roletaData as rdata } from '../../../src/data/roleta/index';
import { roletaVillainsById as villainsById } from '../../../src/data/roleta/villains';
import { ptBR as S } from '../../../src/data/strings/ptBR';
import { getRun, openSheet, villainName } from '../../roleta/common';
import { battleScreen } from '../../roleta/screens/battle';
import { endScreen } from '../../roleta/screens/end';
import { eventScreen } from '../../roleta/screens/event';
import { mapScreen } from '../../roleta/screens/map';
import { originScreen } from '../../roleta/screens/origin';
import { chestScreen, levelUps, noticeScreen, relicRewardScreen } from '../../roleta/screens/rewards';
import { ses } from '../../roleta/session';
import { profiles } from '../fixtures/profiles';
import { roletaCamp, type RoletaFixture } from '../fixtures/roleta';
import type { Scenario } from '../types';

const data = rdata.base;
const RR = S.roleta.run;

/** O evento que o RNG da tela sorteia primeiro (é o primeiro uso do RNG na tela de evento). */
const firstEvent = (rng: Rng): string => rollWeighted(data.preFightEvents, rng).value;

/** Tela de evento a caminho do vilão do passo, com a run da fixture. */
const event = (f: RoletaFixture = {}) => () => {
  roletaCamp(f);
  return eventScreen(villainName(ses.camp!.run.villainId!));
};

/** Luta do passo atual da run (com o vilão já escalado pelo ciclo), como a run monta. */
const fight = (f: RoletaFixture, from?: (s: RBattle) => RBattle) => () => {
  const c = roletaCamp(f);
  const id = c.run.villainId!;
  const def = villainFor(getRun(), villainsById, rdata);
  const label = RR.fightLabel(c.run.cycle + 1, RR.categories[rdata.cycle[c.run.step]!]!, villainName(id));
  const start = from ? from(startRoletaBattle(c.player, def, {}, rdata, createRng(77))) : undefined;
  return battleScreen({ villainId: id, options: {}, label, exam: false, def, ...(start ? { from: start } : {}) }, true);
};

/**
 * Evento do jogo → [id do cenário, título]. Os eventos são os da roleta pré-luta do Roleta (`roletaPreFightEvents`):
 * Guru e Lição do clã existem no código mas não saem no Roleta atual, então não têm cenário.
 */
const EVENTS: [string, string, string][] = [
  ['training', 'roleta.event.training', 'Treino'],
  ['jokenpo', 'roleta.event.jokenpo', 'Jokenpô'],
  ['foundItem', 'roleta.event.item', 'Item encontrado'],
  ['summon', 'roleta.event.summon', 'Invocação (aprende o animal)'],
  ['akatsuki', 'roleta.event.akatsuki', 'Akatsuki'],
  ['oldLady', 'roleta.event.simple:old-lady', 'Velhinha'],
  ['ramen', 'roleta.event.simple:ramen', 'Ramen'],
];

/** Seed de cada cenário de sorteio, achada por `npm run lab:seed -- <id>` (o teste confere cada uma). */
const SEEDS: Record<string, number> = {
  'roleta.event.training': 1,
  'roleta.event.jokenpo': 2,
  'roleta.event.item': 4,
  'roleta.event.summon': 7,
  'roleta.event.akatsuki': 18,
  'roleta.event.simple:old-lady': 8,
  'roleta.event.simple:ramen': 12,
  'roleta.event.summon:level': 7,
};

export const roleta: Scenario[] = [
  { id: 'roleta.origin', title: 'Roletas de origem e dificuldade', group: 'Roleta', mount: () => originScreen() },
  { id: 'roleta.origin:hardcore', title: 'Origem com o Hardcore liberado', group: 'Roleta', profile: profiles.full, mount: () => originScreen() },

  { id: 'roleta.map', title: 'Mapa do ciclo, antes do evento', group: 'Roleta', mount: () => (roletaCamp(), mapScreen(false)) },
  { id: 'roleta.map:fight', title: 'Mapa depois do evento (botão Lutar)', group: 'Roleta', mount: () => (roletaCamp({ step: 2, level: 3 }), mapScreen(true)) },
  { id: 'roleta.map:boss', title: 'Mapa no chefe, com etapas vencidas', group: 'Roleta', mount: () => (roletaCamp({ step: 5, level: 6, lineage: 'uchiha' }), mapScreen(false)) },
  { id: 'roleta.map:cycle2', title: 'Mapa no ciclo 2 (chip de ciclo)', group: 'Roleta', mount: () => (roletaCamp({ cycle: 1, step: 1, level: 8, difficulty: 'hardcore' }), mapScreen(false)) },
  {
    id: 'roleta.map:weights',
    title: 'Mapa com Pesos de treino guardados',
    group: 'Roleta',
    mount: () => (roletaCamp({ step: 1, player: { trainingWeights: 'stored' } }), mapScreen(false)),
  },

  ...EVENTS.map(
    ([ev, id, name]): Scenario => ({
      id,
      title: `Evento: ${name}`,
      group: 'Roleta',
      seed: SEEDS[id] ?? 1,
      expect: (rng) => firstEvent(rng) === ev,
      mount: event(),
    }),
  ),
  {
    id: 'roleta.event.summon:level',
    title: 'Evento: Invocação que sobe de nível (sem roleta)',
    group: 'Roleta',
    seed: SEEDS['roleta.event.summon:level'] ?? 1,
    expect: (rng) => firstEvent(rng) === 'summon',
    mount: event({ player: { summon: { animal: 'toad', level: 1 } } }),
  },

  { id: 'roleta.battle', title: 'Luta contra genin (início)', group: 'Combate', mount: fight({}) },
  { id: 'roleta.battle:boss', title: 'Luta contra o chefe', group: 'Combate', mount: fight({ step: 5, level: 6, lineage: 'uchiha' }) },
  {
    // v0.77.0: técnica de 2 golpes (uma roleta por golpe), Mizu Bunshin, Parede d'Água e item que não gasta a vez.
    id: 'roleta.battle:water',
    title: 'Luta com a água: 2 golpes, clone, barreira e item',
    group: 'Combate',
    mount: fight({ step: 1, level: 3, elements: ['water'] }, (s) => ({ ...s, player: { ...s.player, bag: { ...s.player.bag, soldierPill: 1, medKit: 1 } } })),
  },
  {
    // v0.77.0: o vilão de terra com a Muralha de Terra de pé; o botão mostra o encontro de elementos no escudo.
    id: 'roleta.battle:barrier',
    title: 'Vilão atrás da barreira (raio contra terra)',
    group: 'Combate',
    mount: fight({ step: 3, level: 4, elements: ['lightning'] }, (s) => ({
      ...s,
      villain: { ...s.villain, barrier: { points: 28, max: 28, nature: 'earth', turns: 3, techId: 'earthWall' } },
    })),
  },
  {
    id: 'roleta.battle:low-hp',
    title: 'Luta no meio, os dois com pouco HP',
    group: 'Combate',
    mount: fight({ step: 3, level: 4, lineage: 'hyuuga', elements: [] }, (s) => ({
      ...s,
      round: 4,
      player: { ...s.player, hp: Math.max(1, Math.floor(s.player.maxHp * 0.2)) },
      villain: { ...s.villain, hp: Math.max(1, Math.floor(s.villain.maxHp * 0.25)) },
    })),
  },

  { id: 'roleta.levelup', title: 'Subiu de nível', group: 'Progressão', mount: () => (roletaCamp({ player: { xp: xpToNextLevel(1, data) } }), levelUps()) },
  { id: 'roleta.upgrade', title: 'Upgrade de técnica pendente', group: 'Progressão', mount: () => (roletaCamp({ level: 4, player: { pendingUpgrades: 1 } }), levelUps()) },
  { id: 'roleta.relic', title: 'Relíquia da vitória (genin)', group: 'Recompensas', mount: () => (roletaCamp({ step: 1 }), relicRewardScreen('genin')) },
  { id: 'roleta.relic:jounin', title: 'Relíquia da vitória (jounin)', group: 'Recompensas', seed: 5, mount: () => (roletaCamp({ step: 5, level: 5 }), relicRewardScreen('jounin')) },
  {
    id: 'roleta.chest',
    title: 'Baú do chefe (3 relíquias)',
    group: 'Recompensas',
    mount: () => {
      const c = roletaCamp({ step: 5, level: 6 });
      return chestScreen(bossChoices(relicPool(c.player, rdata), c.player.relics ?? [], rdata.r.run.bossChoices, 0, createRng(11)));
    },
  },
  {
    id: 'roleta.notice',
    title: 'Aviso de ciclo novo',
    group: 'Roleta',
    mount: () => {
      roletaCamp({ cycle: 1, level: 7, difficulty: 'hardcore' });
      return noticeScreen(RR.cycle(2), RR.cycleStart(Math.round((cycleMult(getRun(), rdata) - 1) * 100)));
    },
  },

  {
    id: 'roleta.end:defeat',
    title: 'Fim da run: derrota no meio do ciclo',
    group: 'Fim da run',
    mount: () => {
      const c = roletaCamp({ step: 3, level: 3, run: { status: 'defeat' } });
      return endScreen(false, villainName(c.run.villainId!));
    },
  },
  {
    id: 'roleta.end:victory',
    title: 'Fim da run: vitória no Médio (ciclo 2 travado)',
    group: 'Fim da run',
    mount: () => (roletaCamp({ step: 5, level: 7, run: { status: 'victory', wins: 6 } }), endScreen(true, null, true)),
  },
  {
    id: 'roleta.end:victory-hardcore',
    title: 'Fim da run: vitória no Hardcore (Seguir para o ciclo 2)',
    group: 'Fim da run',
    profile: profiles.full,
    mount: () => (roletaCamp({ step: 5, level: 7, difficulty: 'hardcore', run: { status: 'victory', wins: 6 } }), endScreen(true, null)),
  },
  {
    id: 'roleta.end:infinite',
    title: 'Fim da run: queda no modo infinito (ciclo 3)',
    group: 'Fim da run',
    mount: () => {
      const c = roletaCamp({ cycle: 2, step: 4, level: 10, difficulty: 'hardcore' });
      return endScreen(false, villainName(c.run.villainId!), true);
    },
  },
  { id: 'roleta.end:abandoned', title: 'Fim da run: abandonada', group: 'Fim da run', mount: () => (roletaCamp({ step: 2, level: 2 }), endScreen(false, null, false, true)) },

  { id: 'meta.sheet.roleta', title: 'Ficha ninja da Roleta (sobre o mapa)', group: 'Sistemas', mount: () => {
    roletaCamp({ step: 3, level: 5, lineage: 'uchiha', relics: [] });
    const map = mapScreen(false);
    openSheet();
    return map;
  } },
];
