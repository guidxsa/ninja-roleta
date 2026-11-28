// Arcade: o lobby entre o Portão e as roletas de origem (docs/roleta/run.md, "Dificuldade e histórico"; docs/visual.md,
// "Lobby do Arcade"). Escolhe a dificuldade e mostra o desempenho do jogador no modo; Girar segue para a origem.
import { type Difficulty } from '../../../src/core/difficulty';
import { achievements } from '../../../src/data/achievements';
import { ptBR as S } from '../../../src/data/strings/ptBR';
import { arcadeLobbySummary, difficultyRecord, recentArcadeAchievements } from '../../../src/state/arcadeLobby';
import { loadRuns, type RunRecord } from '../../../src/state/runHistory';
import { achievementIcon } from '../../achievementIcons';
import { clanSymbol, icon, sceneFx, sceneMedia } from '../../art';
import { choose, esc, h, show } from '../../dom';
import { difficultyStats } from '../../gate';
import { tip } from '../../tooltip';
import { diffChip, hardcoreUnlocked, originLabel, syncSheetBtn } from '../common';
import { DEFAULT_DIFFICULTY, DIFFICULTIES, saveSettings, ses } from '../session';

const DAY_MS = 86_400_000;
const ARCADE_IDS = achievements.map((a) => a.id);

/**
 * Lobby do Arcade, na casca das telas de modo da Jornada (`.gate.jgate.jhub`, a composição aprovada na História): o painel
 * com a arte e o letreiro, o bloco de começar (dificuldade e Girar) e a coluna com o desempenho, as últimas runs e as
 * conquistas do Arcade. A ordem do HTML é a da tela, também no celular (issue #95). Devolve `spin` ou `back`.
 */
export async function arcadeLobby(): Promise<'spin' | 'back'> {
  // Uma run anterior acabou (ou nunca houve): nada de Ficha nem de pontos do ciclo no cabeçalho.
  ses.camp = null;
  ses.campLive = false;
  syncSheetBtn();
  document.getElementById('dots')?.replaceChildren();

  const L = S.roleta.lobby;
  const hardcoreOk = hardcoreUnlocked();
  if (ses.settings.difficulty === 'hardcore' && !hardcoreOk) ses.settings.difficulty = DEFAULT_DIFFICULTY;
  const runs = loadRuns(ses.storage);
  const sum = arcadeLobbySummary(ses.profile, runs);
  const hero = sceneMedia('modo-roleta');

  const root = show(
    h(`<div class="screen gate jgate jhub rlobby">
      <div class="gate-main">
        <div class="gate-banner">
          <header class="gate-head"><h1 class="logo jlogo"><span class="l1">${S.jornada.start.logoTop}</span><span class="l2">${L.logo}</span></h1></header>
          <div class="gate-hero" aria-hidden="true">${hero ?? ''}${hero ? sceneFx() : ''}</div>
          <p class="parchment gate-quote rlobby-tag">${S.jornada.modes.roleta.desc}</p>
        </div>
        <section class="rlobby-start">
          <div class="difficulty-box parchment">
            <h3>${S.ui.difficulty}</h3>
            <div class="segmented">${DIFFICULTIES.map(
              (d) => `<button type="button" class="btn seg diff-${d}" data-diff="${d}" aria-pressed="${d === ses.settings.difficulty}" ${d === 'hardcore' && !hardcoreOk ? 'disabled' : ''}>${d === 'hardcore' && !hardcoreOk ? `${icon('lock')} ` : ''}${S.difficulty[d].name}</button>`,
            ).join('')}</div>
            <p class="muted center small" id="diff-desc">${S.difficulty[ses.settings.difficulty].desc}</p>
            <p class="center small" data-diff-stats>${diffLine(runs, ses.settings.difficulty)}</p>
            ${hardcoreOk ? '' : `<p class="muted center small">${icon('lock')} ${S.ui.hardcoreLocked}</p>`}
          </div>
          <button type="button" class="btn primary big rlobby-spin" data-choice="spin"${tip(L.spin, L.spinTip)}>${icon('fortuneWheel')} ${L.spin}</button>
        </section>
      </div>
      <aside class="gate-aside">
        <section class="parchment rlobby-stats"><h3>${L.statsTitle}</h3>
          <dl class="rlobby-totals">
            <div><dt>${L.runsLabel}</dt><dd>${sum.runs}</dd></div>
            <div><dt>${L.winsLabel}</dt><dd>${sum.wins}</dd></div>
            <div><dt>${L.bestCycleLabel}</dt><dd>${sum.bestCycle ?? S.ui.desk.none}</dd></div>
            <div><dt>${L.originsLabel}</dt><dd>${L.originsValue(sum.originsWon, sum.originsPlayed)}</dd></div>
          </dl>
          ${sum.runs ? `<details class="rlobby-diffs"><summary>${L.byDifficulty} ${icon('chevron')}</summary>${difficultyStats()}</details>` : ''}
        </section>
        <section class="parchment jrecent rlobby-runs"><h3>${L.lastTitle}${sum.lastRuns.length ? ` <button type="button" class="btn small desk-all" data-profile="history">${L.seeHistory} ${icon('chevron')}</button>` : ''}</h3>
          ${sum.lastRuns.length ? `<ul>${sum.lastRuns.map(runItem).join('')}</ul>` : `<p class="small">${L.lastEmpty}</p>`}
        </section>
        ${achSection()}
        <button type="button" class="btn small jstart-back" data-choice="back">${S.jornada.start.back}</button>
      </aside>
    </div>`),
  );

  // A dificuldade vale para a próxima run e fica salva no aparelho (a mesma da Jornada: `ses.settings.difficulty`).
  root.querySelector('.difficulty-box .segmented')!.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-diff]');
    if (!btn || btn.disabled) return;
    const d = btn.dataset.diff as Difficulty;
    ses.settings.difficulty = d;
    saveSettings();
    root.querySelectorAll('[data-diff]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    root.querySelector('#diff-desc')!.textContent = S.difficulty[d].desc;
    root.querySelector('[data-diff-stats]')!.textContent = diffLine(runs, d);
  });
  return choose<'spin' | 'back'>(root);
}

/** A linha do desempenho na dificuldade escolhida, embaixo do seletor. */
function diffLine(runs: readonly RunRecord[], d: Difficulty): string {
  const D = S.ui.desk;
  const rec = difficultyRecord(runs, d);
  if (!rec.runs) return D.diffEmpty;
  const pct = S.profile.winRate(Math.round((rec.wins / rec.runs) * 100));
  return [D.diffLine(rec.runs, rec.wins), pct, rec.bestCycle !== null ? D.diffBest(rec.bestCycle) : ''].filter(Boolean).join(' · ');
}

/** Uma das últimas runs: o símbolo da origem, o nome, até onde foi e quando, e os chips de dificuldade e resultado. */
function runItem(r: RunRecord): string {
  const reached = r.fights !== undefined ? S.roleta.run.reached((r.cycle ?? 0) + 1, r.fights) : '';
  const started = Date.parse(r.startedAt);
  const when = Number.isNaN(started) ? '' : S.jornada.start.when(Math.max(0, Math.floor((Date.now() - started) / DAY_MS)));
  return `<li class="rlobby-run"><span class="seal" aria-hidden="true">${clanSymbol(r.origin.lineageId)}</span>
    <span class="rlobby-run-txt"><b>${esc(originLabel(r.origin))}</b><small>${[reached, when].filter(Boolean).join(' · ')}</small></span>
    <span class="rlobby-run-tags">${r.difficulty ? diffChip(r.difficulty) : ''}<span class="chip st-${r.status}">${S.ui.runStatus[r.status]}</span></span></li>`;
}

/** As 3 conquistas do Arcade mais novas (as da Jornada ficam nas telas dela). */
function achSection(): string {
  const L = S.roleta.lobby;
  const J = S.jornada.start;
  const recent = recentArcadeAchievements(ses.profile, ARCADE_IDS, new Date(), 3);
  const all = ` <button type="button" class="btn small desk-all" data-profile="achievements">${L.seeAchievements} ${icon('chevron')}</button>`;
  return `<section class="parchment jrecent rlobby-ach"><h3>${L.achTitle}${recent.length ? all : ''}</h3>${recent.length ? `<ul>${recent
    .map((a) => {
      const t = S.achievements.list[a.id];
      return `<li><span class="seal ach-ico" aria-hidden="true">${achievementIcon(a.id)}</span><span><b>${esc(t?.name ?? a.id)}</b><small>${esc(t?.desc ?? '')}</small></span><time>${J.when(a.days)}</time></li>`;
    })
    .join('')}</ul>` : `<p class="small">${L.achEmpty}</p>`}</section>`;
}
