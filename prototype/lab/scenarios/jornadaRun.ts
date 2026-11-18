// Cenários da Jornada com run em andamento. A run chega à parada jogando pelas regras reais (fixtures/jornada.ts);
// as paradas do fim da História usam o Fácil porque o bot da fixture não gasta talentos e cai antes no Médio.
import { canContinueCycle, continueCycle, currentStop, newGenericRun, choosingNode, stopScene, type JRun } from '../../../src/core/jornada/run';
import { isFight } from '../../../src/core/jornada/trail';
import { jornadaData as data } from '../../../src/data/jornada/index';
import { ptBR as S } from '../../../src/data/strings/ptBR';
import { show, h } from '../../dom';
import {
  bossChoiceScreen,
  endScreen,
  eventStop,
  fightStop,
  heroName,
  notice,
  playStop,
  relicReveal,
  restStop,
  revealScreen,
  setPendingGains,
  shopScreen,
  stopName,
  storyRelicScene,
  treasureStop,
} from '../../jornada';
import { jornadaBattle } from '../../jornada/battle';
import { playMinigame } from '../../jornada/minigames';
import { NO_BONUS } from '../../../src/core/jornada/minigames';
import type { Minigame, MinigameSkin } from '../../../src/core/jornada/events';
import { movesetScreen } from '../../jornada/moveset';
import { relicsModal } from '../../jornada/relics';
import { sceneScreen } from '../../jornada/scene';
import { openJornadaSheet } from '../../jornada/sheet';
import { coreChoiceScreen, talentTreeScreen } from '../../jornada/talentTree';
import { battleSetup } from '../../../src/core/jornada/run';
import { profiles } from '../fixtures/profiles';
import { battleAt, downAllies, hpAt, pathRun, playToEnd, playUntil, storyRun, type Until } from '../fixtures/jornada';
import type { LabContext, Scenario } from '../types';

const J = S.jornada;
const U = J.ui;

/** Corpo no modo Jornada e a Ficha do cabeçalho ligada à run (como o laço da Jornada deixa). */
const withRun = (ctx: LabContext, run: JRun): JRun => {
  document.body.classList.add('mode-jornada');
  ctx.jornadaHost.setSheet(() => openJornadaSheet(ctx.jornadaHost, run));
  return run;
};

/** História jogada até a parada `until` (id da parada ou teste). */
// No Fácil, a seed 2: com a força por estágio da História (v0.82.0), a run de seed 7 do bot da fixture cai no 2º estágio.
const EASY_SEED = 1;
const story = (until: Until, difficulty: 'normal' | 'easy' = 'normal') => playUntil(storyRun(difficulty === 'easy' ? EASY_SEED : 7, difficulty), until);
/** Caminho Ninja jogado até a condição. */
const path = (until: Until) => playUntil(pathRun(7), until);

/** Parada atual pela tela real do jogo (trilha da História ou mapa do Caminho). */
const stop = (make: () => JRun) => (ctx: LabContext) => playStop(ctx.jornadaHost, withRun(ctx, make()));

/** Luta da parada atual pela tela real (com aviso de vitória ou de nova tentativa no fim). */
const fight = (make: () => JRun) => (ctx: LabContext) => {
  const run = withRun(ctx, make());
  const s = currentStop(run, data)!;
  if (!isFight(s)) throw new Error('cenário: a parada não é uma luta');
  return fightStop(ctx.jornadaHost, run, s);
};

/** Luta aberta já no meio (estado ajustado), pela mesma tela de luta. */
const fightFrom = (make: () => JRun, patch: Parameters<typeof battleAt>[1]) => (ctx: LabContext) => {
  const run = withRun(ctx, make());
  const s = currentStop(run, data)!;
  return jornadaBattle(ctx.jornadaHost, data, run, battleSetup(run, data), ctx.rng, stopName(s), stopScene(run, data), null, { from: battleAt(run, patch) });
};

/** Minijogo dentro da cena, como o evento abre. */
const minigame = (kind: Minigame, title: string, extra: { skin?: MinigameSkin; calm?: boolean } = {}) => (ctx: LabContext) => {
  document.body.classList.add('mode-jornada');
  const root = show(h(sceneScreen({ place: 'forest', title, seal: U.sceneSeals.training!, body: '', footer: '<div data-slot></div>' })));
  return playMinigame(kind, root.querySelector<HTMLElement>('[data-slot]')!, data, ctx.rng, {
    instant: ctx.prefs.instant,
    difficulty: 'normal',
    bonus: NO_BONUS,
    ...(extra.skin ? { skin: extra.skin } : {}),
    calm: extra.calm ?? false,
  });
};

/** Fim da run: a tela de relatório com o próximo ciclo quando a run permite. */
const end = (make: () => JRun) => (ctx: LabContext) => {
  const run = withRun(ctx, make());
  const next = canContinueCycle(run, data) ? continueCycle(run, data) : null;
  return endScreen(ctx.jornadaHost, run, next, run.mode === 'generic');
};

// No Médio a run da seed 7 cai antes do exame (v0.77.0): o 2º estágio vem do Fácil.
const WRITTEN = () => story('writtenTest', 'easy');

/** Árvore de talentos da run, pela tela real. */
const tree = (make: () => JRun) => (ctx: LabContext) => {
  const run = withRun(ctx, make());
  return talentTreeScreen(ctx.jornadaHost, run, heroName(ctx.jornadaHost, run));
};

/** Caminho Ninja do Prodígio: o Comum que escolhe ficar sem elemento. */
const prodigyRun = (): JRun => newGenericRun(7, 'normal', 'common', data, new Set(), null, null);

/** Run de classe jogada até a escolha do 1º nó do 2º estágio. */
const classMid = (run: JRun): JRun => playUntil(run, (r) => choosingNode(r) && r.stageIndex === 1);

/**
 * Caminho Ninja vencido no Hardcore. O bot da fixture não vence o Hardcore; a vitória é a do Médio com a dificuldade
 * marcada como Hardcore, o único campo que o jogo confere para liberar o ciclo seguinte (`canContinueCycle`).
 */
const hardcoreWin = (): JRun => ({ ...playToEnd(pathRun(7)), difficulty: 'hardcore' });

export const jornadaRun: Scenario[] = [
  // Início do Caminho Ninja
  { id: 'jornada.path.reveal', title: 'Revelação: elemento sorteado', group: 'Jornada', mount: (ctx) => revealScreen(ctx.jornadaHost, withRun(ctx, pathRun(7))) },
  { id: 'jornada.path.reveal:uchiha', title: 'Revelação: Uchiha com o 2º elemento', group: 'Jornada', mount: (ctx) => revealScreen(ctx.jornadaHost, withRun(ctx, pathRun(7, 'normal', 'uchiha'))) },
  {
    id: 'jornada.path.reveal:prodigy',
    title: 'Revelação: prodígio sem elemento',
    group: 'Jornada',
    mount: (ctx) => revealScreen(ctx.jornadaHost, withRun(ctx, newGenericRun(7, 'normal', 'common', data, new Set(), null, null))),
  },

  // Trilha e mapa
  { id: 'jornada.trail', title: 'Trilha da História: próxima parada é evento', group: 'Jornada', mount: stop(() => story('team7')) },
  {
    id: 'jornada.trail:animado',
    title: 'Trilha da História no modo Animado (cena viva na arte do arco)',
    group: 'Jornada',
    mount: (ctx) => {
      document.documentElement.toggleAttribute('data-animated', true);
      return stop(() => story('team7'))(ctx);
    },
  },
  { id: 'jornada.trail:fight', title: 'Trilha: próxima parada é luta de elite (inimigos e equipe)', group: 'Jornada', mount: stop(() => story('demonBrothers')) },
  { id: 'jornada.trail:boss', title: 'Trilha: chefe do estágio', group: 'Jornada', mount: stop(() => story('haku')) },
  {
    id: 'jornada.trail:gains',
    title: 'Trilha com a faixa "O que mudou"',
    group: 'Jornada',
    mount: (ctx) => {
      setPendingGains([
        { icon: 'coin', text: U.gains.ryo(50) },
        { icon: 'scroll', text: U.gains.talent(1) },
        { icon: 'heart', text: U.gains.healFull },
      ]);
      return stop(() => story('bells'))(ctx);
    },
  },
  { id: 'jornada.trail:exam', title: 'Trilha no 2º estágio (Exame Chunin)', group: 'Jornada', mount: stop(() => story('orochimaruForest', 'easy')) },
  { id: 'jornada.trail:sannin', title: 'Trilha no 3º estágio (Sannin, Fácil)', group: 'Jornada', mount: stop(() => story('tsunade', 'easy')) },
  { id: 'jornada.trail:late', title: 'Trilha no último estágio (Fácil)', group: 'Jornada', mount: stop(() => story('valley', 'easy')) },
  { id: 'jornada.map', title: 'Mapa do Caminho Ninja (começo)', group: 'Jornada', mount: stop(() => pathRun(7)) },
  { id: 'jornada.map:mid', title: 'Mapa com rota feita', group: 'Jornada', mount: stop(() => path((r) => choosingNode(r) && r.path.length >= 4)) },
  { id: 'jornada.map:stage2', title: 'Mapa do 2º estágio', group: 'Jornada', mount: stop(() => path((r) => choosingNode(r) && r.stageIndex === 1)) },

  // Avisos
  ...(
    [
      ['stage', U.stageClear(J.stages.waves ?? ''), J.stages.exam ?? ''],
      ['cycle', U.cycle(2), U.cycleStartText(12)],
      ['victory', U.victoryTitle, `${U.rewards(40, 30, 1)}\n${U.recovered(10, 5)}`],
      ['lesson', U.lessonTitle, U.inevitableLoss],
      ['retry', J.battle.lost, U.retry],
      ['unknown', J.map.unknown, J.map.became(J.stopKinds.treasure ?? '')],
    ] as const
  ).map(
    ([seal, title, text]): Scenario => ({
      id: `jornada.notice:${seal}`,
      title: `Aviso: ${U.sceneSeals[seal]!.label}`,
      group: 'Jornada',
      mount: (ctx) => {
        const run = withRun(ctx, storyRun());
        return notice(title, text, { place: 'konoha', seal, face: run.hero });
      },
    }),
  ),

  // Narrativa
  { id: 'jornada.event', title: 'Evento da História (opções)', group: 'Narrativa', mount: (ctx) => eventStop(ctx.jornadaHost, withRun(ctx, story('team7'))) },
  { id: 'jornada.event:minigame', title: 'Evento com minijogo (opção com carta)', group: 'Narrativa', mount: (ctx) => eventStop(ctx.jornadaHost, withRun(ctx, story('treeClimbing'))) },
  { id: 'jornada.event:first', title: 'Primeiro evento da História', group: 'Narrativa', mount: (ctx) => eventStop(ctx.jornadaHost, withRun(ctx, storyRun())) },
  { id: 'jornada.minigame.memory', title: 'Minijogo da memória', group: 'Narrativa', mount: minigame('memory', 'Memória') },
  { id: 'jornada.minigame.seals', title: 'Minijogo dos selos', group: 'Narrativa', mount: minigame('seals', 'Selos') },
  { id: 'jornada.minigame.rps', title: 'Jokenpô da Jornada', group: 'Narrativa', mount: minigame('jokenpo', 'Jokenpô') },
  { id: 'jornada.minigame.kunai', title: 'Minijogo: kunai no alvo', group: 'Narrativa', mount: minigame('kunai', 'Treino de arremesso') },
  { id: 'jornada.minigame.kunai:power', title: 'Minijogo: força no ápice (bola de borracha)', group: 'Narrativa', mount: minigame('kunai', 'Bola de borracha', { skin: 'power' }) },
  { id: 'jornada.minigame.water', title: 'Minijogo: andar sobre a água (árvore)', group: 'Narrativa', mount: minigame('water', 'Subir na árvore', { skin: 'tree' }) },
  { id: 'jornada.minigame.clone', title: 'Minijogo: o clone verdadeiro', group: 'Narrativa', mount: minigame('clone', 'As cópias do Itachi') },
  { id: 'jornada.minigame.bell', title: 'Minijogo: pegar o sino', group: 'Narrativa', mount: minigame('bell', 'O teste do mestre') },
  { id: 'jornada.minigame.water:calm', title: 'Minijogo sem pressa (água)', group: 'Narrativa', mount: minigame('water', 'Lago do santuário', { calm: true }) },
  {
    id: 'jornada.story-relic',
    title: 'Relíquia de história com troca (bandana)',
    group: 'Narrativa',
    mount: (ctx) => {
      const run = withRun(ctx, story('graduation'));
      return storyRelicScene(ctx.jornadaHost, run, 'irukaHeadband', run.relics[0]);
    },
  },
  {
    id: 'jornada.story-relic:new',
    title: 'Relíquia de história sem troca (colar)',
    group: 'Narrativa',
    mount: (ctx) => storyRelicScene(ctx.jornadaHost, withRun(ctx, story('tsunade', 'easy')), 'firstHokageNecklace'),
  },

  // Combate
  { id: 'jornada.battle', title: 'Luta comum da História', group: 'Combate', mount: fight(() => story('thugs')) },
  { id: 'jornada.battle:elite', title: 'Luta de elite (equipe de 3)', group: 'Combate', mount: fight(() => story('demonBrothers')) },
  { id: 'jornada.battle:boss', title: 'Chefe com falas (Haku)', group: 'Combate', mount: fight(() => story('haku')) },
  { id: 'jornada.battle:lesson', title: 'Teste do sino (derrota vira lição)', group: 'Combate', mount: fight(() => story('bells')) },
  { id: 'jornada.battle:path', title: 'Luta do Caminho Ninja', group: 'Combate', mount: fight(() => path((r) => !choosingNode(r) && !r.bossChoice && currentStop(r, data)?.kind === 'fight')) },
  // v0.94.0: o Hyuuga no cânone (Byakugan como postura, Palmas que pedem o Byakugan) numa luta do 2º estágio.
  { id: 'jornada.battle:hyuuga', title: 'Luta do Hyuuga (Byakugan em postura)', group: 'Combate', mount: fight(() => playUntil(pathRun(1, 'normal', 'hyuuga'), (r) => r.stageIndex === 1 && !choosingNode(r) && !r.bossChoice && currentStop(r, data)?.kind === 'fight')) },
  { id: 'jornada.battle:downed', title: 'Luta com aliados caídos (aba Reerguer)', group: 'Combate', mount: fightFrom(() => story('demonBrothers'), downAllies) },
  { id: 'jornada.battle:low-hp', title: 'Luta com os dois lados feridos', group: 'Combate', mount: fightFrom(() => story('zabuza'), hpAt(0.3, 0.25)) },
  { id: 'jornada.battle:late', title: 'Chefe do último estágio (Fácil)', group: 'Combate', mount: fight(() => story('valley', 'easy')) },

  // Progressão
  { id: 'jornada.talents', title: 'Árvore de talentos com pontos', group: 'Progressão', mount: (ctx) => { const run = withRun(ctx, WRITTEN()); return talentTreeScreen(ctx.jornadaHost, run, heroName(ctx.jornadaHost, run)); } },
  { id: 'jornada.talents:start', title: 'Árvore no começo (sem pontos)', group: 'Progressão', mount: (ctx) => { const run = withRun(ctx, storyRun()); return talentTreeScreen(ctx.jornadaHost, run, heroName(ctx.jornadaHost, run)); } },
  {
    id: 'jornada.talents:late',
    title: 'Árvore no fim da História (muitos pontos, Fácil)',
    group: 'Progressão',
    profile: profiles.full,
    mount: (ctx) => { const run = withRun(ctx, story('valley', 'easy')); return talentTreeScreen(ctx.jornadaHost, run, heroName(ctx.jornadaHost, run)); },
  },
  { id: 'jornada.talents:path', title: 'Árvore do Comum (cor do elemento)', group: 'Progressão', mount: tree(() => pathRun(7)) },
  // Rascunho de talentos (v0.93.0): escolha do núcleo no começo e a oferta com pontos (3 cartões; 4 com 3 pontos guardados).
  { id: 'jornada.talents:core', title: 'Escolha do núcleo (Comum)', group: 'Progressão', mount: (ctx) => coreChoiceScreen(withRun(ctx, pathRun(7, 'normal', 'common', false))) },
  { id: 'jornada.talents:draft', title: 'Rascunho de talentos (Comum, 2 pontos)', group: 'Progressão', mount: tree(() => ({ ...pathRun(7), talentPoints: 2 })) },
  { id: 'jornada.talents:draft-held', title: 'Rascunho com pontos guardados (4 cartões)', group: 'Progressão', mount: tree(() => ({ ...path((r) => r.stageIndex === 1 && choosingNode(r)), talentPoints: 4 })) },
  // Classes do Caminho Ninja: cada uma tem árvore e tema próprios. Jogadas até o 2º estágio, para ter pontos e nós comprados.
  { id: 'jornada.talents:uchiha', title: 'Árvore do Uchiha (2º estágio)', group: 'Progressão', profile: profiles.full, mount: tree(() => classMid(pathRun(7, 'normal', 'uchiha'))) },
  { id: 'jornada.talents:hyuuga', title: 'Árvore do Hyuuga (2º estágio)', group: 'Progressão', profile: profiles.full, mount: tree(() => classMid(pathRun(7, 'normal', 'hyuuga'))) },
  { id: 'jornada.talents:prodigy', title: 'Árvore do Prodígio (2º estágio)', group: 'Progressão', profile: profiles.full, mount: tree(() => classMid(prodigyRun())) },
  { id: 'jornada.moveset:uchiha', title: 'Moveset do Uchiha (2º estágio)', group: 'Progressão', profile: profiles.full, mount: (ctx) => movesetScreen(withRun(ctx, classMid(pathRun(7, 'normal', 'uchiha')))) },
  { id: 'jornada.moveset:hyuuga', title: 'Moveset do Hyuuga (2º estágio)', group: 'Progressão', profile: profiles.full, mount: (ctx) => movesetScreen(withRun(ctx, classMid(pathRun(7, 'normal', 'hyuuga')))) },
  { id: 'jornada.moveset:prodigy', title: 'Moveset do Prodígio (2º estágio)', group: 'Progressão', profile: profiles.full, mount: (ctx) => movesetScreen(withRun(ctx, classMid(prodigyRun()))) },
  { id: 'jornada.moveset', title: 'Moveset', group: 'Progressão', mount: (ctx) => movesetScreen(withRun(ctx, WRITTEN())) },
  { id: 'jornada.moveset:path', title: 'Moveset do Caminho Ninja', group: 'Progressão', mount: (ctx) => movesetScreen(withRun(ctx, pathRun(7))) },

  // Recompensas
  { id: 'jornada.treasure', title: 'Tesouro fechado', group: 'Recompensas', mount: (ctx) => treasureStop(ctx.jornadaHost, withRun(ctx, story('treasure1'))) },
  { id: 'jornada.rest', title: 'Descanso (curar ou treinar)', group: 'Recompensas', mount: (ctx) => restStop(ctx.jornadaHost, withRun(ctx, story('rest1'))) },
  {
    id: 'jornada.relic-reveal',
    title: 'Relíquia de elite revelada',
    group: 'Recompensas',
    mount: (ctx) => (withRun(ctx, storyRun()), relicReveal(U.eliteRelic, data.relics.find((r) => r.tier === 'rare')!.id, 'forest')),
  },
  { id: 'jornada.boss-choice', title: 'Escolha do chefe (3 relíquias)', group: 'Recompensas', mount: (ctx) => bossChoiceScreen(withRun(ctx, path((r) => Boolean(r.bossChoice)))) },

  // Loja
  { id: 'jornada.shop', title: 'Loja', group: 'Loja', mount: (ctx) => shopScreen(ctx.jornadaHost, withRun(ctx, WRITTEN())) },
  { id: 'jornada.shop:rich', title: 'Loja com ryō de sobra', group: 'Loja', mount: (ctx) => shopScreen(ctx.jornadaHost, withRun(ctx, { ...WRITTEN(), ryo: 5000 })) },
  {
    id: 'jornada.shop:cursed',
    title: 'Loja amaldiçoada com inflação (Purificar)',
    group: 'Loja',
    mount: (ctx) => {
      const run = WRITTEN();
      return shopScreen(ctx.jornadaHost, withRun(ctx, { ...run, ryo: 900, flags: [...run.flags, 'shopCurse'], shopPurchases: 4 }));
    },
  },

  // Fim da run
  { id: 'jornada.end:story-victory', title: 'Fim: História vencida (Fácil)', group: 'Fim da run', mount: end(() => playToEnd(storyRun(EASY_SEED, 'easy'))) },
  { id: 'jornada.end:story-defeat', title: 'Fim: derrota na História', group: 'Fim da run', mount: end(() => playToEnd(storyRun(7))) },
  { id: 'jornada.end:path-victory', title: 'Fim: Caminho Ninja vencido no Médio', group: 'Fim da run', mount: end(() => playToEnd(pathRun(7))) },
  { id: 'jornada.end:path-victory-hardcore', title: 'Fim: Caminho Ninja vencido no Hardcore (Seguir ciclo)', group: 'Fim da run', mount: end(hardcoreWin) },
  { id: 'jornada.end:infinite', title: 'Fim: queda no modo infinito (ciclo 2)', group: 'Fim da run', mount: end(() => playToEnd(continueCycle(hardcoreWin(), data))) },

  // Sistemas
  {
    id: 'meta.sheet.jornada',
    title: 'Ficha da Jornada (abas da equipe)',
    group: 'Sistemas',
    mount: (ctx) => {
      const run = withRun(ctx, story('demonBrothers'));
      const screen = playStop(ctx.jornadaHost, run);
      openJornadaSheet(ctx.jornadaHost, run);
      return screen;
    },
  },
  {
    id: 'meta.relics-modal',
    title: 'Relíquias da run',
    group: 'Sistemas',
    mount: (ctx) => {
      const run = withRun(ctx, story('valley', 'easy'));
      const screen = playStop(ctx.jornadaHost, run);
      relicsModal(run);
      return screen;
    },
  },
];
