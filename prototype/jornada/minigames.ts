// Minijogos dos eventos da Jornada: memória, sequência de selos e jokenpô. Devolvem se o jogador ganhou.
import type { JornadaData } from '../../src/core/jornada/data';
import type { Minigame } from '../../src/core/jornada/events';
import { checkSequence, jokenpo, memoryDeck, sealSequence, type Hand, type Seal } from '../../src/core/jornada/minigames';
import type { Rng } from '../../src/core/rng';
import { ptBR as S } from '../../src/data/strings/ptBR';
import { h, sleep } from '../dom';

const M = S.jornada.minigames;
const glyph = (s: Seal) => `<span class="seal-glyph">${S.jornada.sealGlyphs[s]}</span><small>${S.jornada.seals[s]}</small>`;

export async function playMinigame(kind: Minigame, slot: HTMLElement, data: JornadaData, rng: Rng, instant: boolean): Promise<boolean> {
  const won = kind === 'memory' ? await memory(slot, data, rng, instant) : kind === 'seals' ? await seals(slot, data, rng, instant) : await rps(slot, rng);
  slot.insertAdjacentHTML('beforeend', `<p class="center mg-result ${won ? 'good' : 'bad'}">${won ? M.won : M.lost}</p>`);
  await sleep(instant ? 200 : 700);
  return won;
}

function memory(slot: HTMLElement, data: JornadaData, rng: Rng, instant: boolean): Promise<boolean> {
  const cfg = data.j.minigames;
  const deck = memoryDeck(cfg.memoryPairs, rng);
  let misses = cfg.memoryMaxMisses;
  const box = h(`<div class="mg"><h3>${M.memoryTitle}</h3><p class="muted small">${M.memoryHelp(misses)}</p>
    <p class="mg-status">${M.missesLeft(misses)}</p>
    <div class="mg-grid">${deck.map((_, i) => `<button class="mg-card" data-i="${i}" type="button"></button>`).join('')}</div></div>`);
  slot.replaceChildren(box);
  const status = box.querySelector<HTMLElement>('.mg-status')!;
  return new Promise((resolve) => {
    let open: number[] = [];
    let found = 0;
    let busy = false;
    box.addEventListener('click', async (ev) => {
      const b = (ev.target as HTMLElement).closest<HTMLElement>('.mg-card');
      if (!b || busy || b.classList.contains('up')) return;
      const i = Number(b.dataset.i);
      b.classList.add('up');
      b.innerHTML = glyph(deck[i]!);
      open.push(i);
      if (open.length < 2) return;
      const [a, c] = open as [number, number];
      open = [];
      if (deck[a] === deck[c]) {
        found++;
        box.querySelectorAll(`[data-i="${a}"],[data-i="${c}"]`).forEach((x) => x.classList.add('match'));
        if (found === cfg.memoryPairs) resolve(true);
        return;
      }
      misses--;
      status.textContent = M.missesLeft(Math.max(0, misses));
      busy = true;
      await sleep(instant ? 250 : 700);
      for (const k of [a, c]) {
        const el = box.querySelector<HTMLElement>(`[data-i="${k}"]`)!;
        el.classList.remove('up');
        el.innerHTML = '';
      }
      busy = false;
      if (misses < 0) resolve(false);
    });
  });
}

async function seals(slot: HTMLElement, data: JornadaData, rng: Rng, instant: boolean): Promise<boolean> {
  const cfg = data.j.minigames;
  const { sequence, options } = sealSequence(cfg.sealLength, cfg.sealPool, rng);
  const box = h(`<div class="mg"><h3>${M.sealsTitle}</h3><p class="mg-status">${M.sealsWatch}</p>
    <div class="mg-seq"></div><div class="mg-grid seals"></div></div>`);
  slot.replaceChildren(box);
  const seq = box.querySelector<HTMLElement>('.mg-seq')!;
  const status = box.querySelector<HTMLElement>('.mg-status')!;
  // Mostra um selo de cada vez; o modo instantâneo não encurta a memorização.
  for (const s of sequence) {
    seq.innerHTML = `<span class="mg-show">${glyph(s)}</span>`;
    await sleep(instant ? 650 : 900);
    seq.innerHTML = '';
    await sleep(150);
  }
  status.textContent = M.sealsRepeat;
  const grid = box.querySelector<HTMLElement>('.mg-grid')!;
  grid.innerHTML = options.map((s) => `<button class="mg-card up" data-s="${s}" type="button">${glyph(s)}</button>`).join('');
  return new Promise((resolve) => {
    const typed: Seal[] = [];
    grid.addEventListener('click', (ev) => {
      const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-s]');
      if (!b) return;
      typed.push(b.dataset.s as Seal);
      seq.innerHTML = typed.map((s) => `<span class="mg-typed">${S.jornada.sealGlyphs[s]}</span>`).join('');
      const r = checkSequence(sequence, typed);
      if (r === 'ok') return;
      grid.querySelectorAll('button').forEach((x) => x.setAttribute('disabled', ''));
      resolve(r === 'done');
    });
  });
}

function rps(slot: HTMLElement, rng: Rng): Promise<boolean> {
  const hands: Hand[] = ['rock', 'paper', 'scissors'];
  const box = h(`<div class="mg"><h3>${M.jokenpoTitle}</h3><p class="muted small">${M.jokenpoHelp}</p>
    <div class="mg-duel"></div><div class="row center-row">${hands.map((x) => `<button class="btn big-hand" data-h="${x}">${S.handIcons[x]}</button>`).join('')}</div></div>`);
  slot.replaceChildren(box);
  const duel = box.querySelector<HTMLElement>('.mg-duel')!;
  return new Promise((resolve) => {
    box.addEventListener('click', (ev) => {
      const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-h]');
      if (!b) return;
      const choice = b.dataset.h as Hand;
      const r = jokenpo(choice, rng);
      duel.innerHTML = `<b>${S.handIcons[choice]}</b><span>vs</span><b>${S.handIcons[r.other]}</b>`;
      if (r.result === 'tie') return;
      box.querySelectorAll('button').forEach((x) => x.setAttribute('disabled', ''));
      resolve(r.result === 'win');
    });
  });
}
