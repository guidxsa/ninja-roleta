// Componentes visuais de roleta. O resultado já vem sorteado pelo core; aqui só se anima até ele.

export interface WheelSlice {
  label: string;
  weight: number;
  color: string;
  /** SVG opcional mostrado na legenda (símbolo do clã, elemento). */
  icon?: string;
}

export interface Wheel {
  el: HTMLElement;
  /** Gira até a fatia `index`. `ms` = 0 para resultado instantâneo. */
  spinTo(index: number, ms: number): Promise<void>;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const SIZE = 300;
const R = 140;
const C = SIZE / 2;
const HUB = 20;
/** Rótulo: da borda (R − LABEL_PAD) até perto do centro (HUB + LABEL_PAD). */
const LABEL_PAD = 8;
const LABEL_LEN = R - HUB - LABEL_PAD * 2;
const FONT_MAX = 13;
const FONT_MIN = 8;
/** Largura média de um caractere em negrito, em frações do tamanho da fonte (estimativa antes de medir). */
const CHAR_W = 0.6;

function point(angleDeg: number, radius: number): [number, number] {
  const a = (angleDeg * Math.PI) / 180;
  return [C + radius * Math.sin(a), C - radius * Math.cos(a)];
}

function arcPath(a0: number, a1: number): string {
  const [x0, y0] = point(a0, R);
  const [x1, y1] = point(a1, R);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${C} ${C} L ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`;
}

export function formatPct(fraction: number): string {
  const pct = Math.round(fraction * 1000) / 10;
  if (fraction > 0 && pct < 1) return '<1%';
  return `${pct < 10 && pct % 1 !== 0 ? pct.toFixed(1).replace('.', ',') : Math.round(pct)}%`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Faixas [início, fim) de cada fatia, em frações de 0 a 1. */
function spans(slices: { weight: number }[]): [number, number][] {
  const total = slices.reduce((t, s) => t + Math.max(0, s.weight), 0) || 1;
  let acc = 0;
  return slices.map((s) => {
    const start = acc;
    acc += Math.max(0, s.weight) / total;
    return [start, acc];
  });
}

/** Ponto aleatório (cosmético) dentro da fatia, longe das bordas. */
function landingPoint([a, b]: [number, number]): number {
  const pad = Math.min((b - a) * 0.2, 0.02);
  return a + pad + Math.random() * Math.max(0, b - a - 2 * pad);
}

export function createWheel(slices: WheelSlice[]): Wheel {
  const el = document.createElement('div');
  el.className = 'wheel-block';
  const wrap = document.createElement('div');
  wrap.className = 'wheel-wrap';
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
  svg.classList.add('wheel');
  const ranges = spans(slices);
  const paths: SVGElement[] = [];
  const labels: { el: SVGTextElement; label: string; font: number }[] = [];
  const rim = document.createElementNS(SVG_NS, 'circle');
  rim.setAttribute('cx', `${C}`);
  rim.setAttribute('cy', `${C}`);
  rim.setAttribute('r', `${R + 6}`);
  rim.setAttribute('class', 'rim');
  svg.appendChild(rim);

  slices.forEach((s, i) => {
    const [f0, f1] = ranges[i]!;
    if (f1 - f0 <= 0) {
      paths.push(document.createElementNS(SVG_NS, 'g'));
      return;
    }
    let shape: SVGElement;
    if (f1 - f0 >= 0.9999) {
      shape = document.createElementNS(SVG_NS, 'circle');
      shape.setAttribute('cx', `${C}`);
      shape.setAttribute('cy', `${C}`);
      shape.setAttribute('r', `${R}`);
    } else {
      shape = document.createElementNS(SVG_NS, 'path');
      shape.setAttribute('d', arcPath(f0 * 360, f1 * 360));
    }
    shape.setAttribute('fill', s.color);
    shape.classList.add('slice');
    svg.appendChild(shape);
    paths.push(shape);

    const span = (f1 - f0) * 360;
    // A altura da letra cabe na largura da fatia perto do meio do raio; senão, só a legenda mostra.
    const chord = 2 * (R * 0.5) * Math.sin(((Math.min(span, 180) / 2) * Math.PI) / 180);
    const font = Math.min(FONT_MAX, chord * 0.62);
    if (font >= FONT_MIN) {
      const mid = ((f0 + f1) / 2) * 360;
      const [x, y] = point(mid, R - LABEL_PAD);
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', `${x}`);
      text.setAttribute('y', `${y}`);
      text.setAttribute('class', 'slice-label');
      // Texto ao longo do raio, começando na borda e indo para o centro, sempre legível.
      const right = mid <= 180;
      text.setAttribute('transform', `rotate(${right ? mid - 90 : mid + 90} ${x} ${y})`);
      text.setAttribute('text-anchor', right ? 'end' : 'start');
      text.style.fontSize = `${font}px`;
      text.textContent = s.label;
      labels.push({ el: text, label: s.label, font });
      svg.appendChild(text);
    }
  });

  // Hub com a espiral da folha.
  const hub = document.createElementNS(SVG_NS, 'circle');
  hub.setAttribute('cx', `${C}`);
  hub.setAttribute('cy', `${C}`);
  hub.setAttribute('r', `${HUB}`);
  hub.setAttribute('class', 'hub');
  svg.appendChild(hub);
  const leaf = document.createElementNS(SVG_NS, 'path');
  leaf.setAttribute('d', `M${C} ${C + 1}a2 2 0 0 1 4 0a4 4 0 0 1-8 0a6 6 0 0 1 12 0`);
  leaf.setAttribute('class', 'hub-leaf');
  svg.appendChild(leaf);
  // Marcas na borda, a cada fatia.
  ranges.forEach(([f0, f1]) => {
    if (f1 - f0 <= 0 || f1 - f0 >= 0.9999) return;
    const [x, y] = point(f0 * 360, R + 3);
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', `${x}`);
    dot.setAttribute('cy', `${y}`);
    dot.setAttribute('r', '2.6');
    dot.setAttribute('class', 'peg');
    svg.appendChild(dot);
  });

  const pointer = document.createElement('div');
  pointer.className = 'wheel-pointer';
  wrap.append(svg, pointer);

  const legend = document.createElement('ul');
  legend.className = 'legend';
  const items = slices.map((s, i) => {
    const [f0, f1] = ranges[i]!;
    const li = document.createElement('li');
    li.innerHTML = `<i class="${s.icon ? 'has-ico' : ''}" style="--c:${s.color}">${s.icon ?? ''}</i><span></span><b>${formatPct(f1 - f0)}</b>`;
    li.querySelector('span')!.textContent = s.label;
    if (f1 - f0 <= 0) li.classList.add('zero');
    legend.appendChild(li);
    return li;
  });

  el.append(wrap, legend);
  let rotation = 0;

  // Estimativa antes de entrar na página: reduz a fonte e corta com reticências.
  for (const l of labels) {
    let font = l.font;
    while (font > FONT_MIN && l.label.length * font * CHAR_W > LABEL_LEN) font -= 0.5;
    const max = Math.floor(LABEL_LEN / (font * CHAR_W));
    l.el.style.fontSize = `${font}px`;
    l.el.textContent = l.label.length > max ? `${l.label.slice(0, Math.max(1, max - 1))}…` : l.label;
  }
  // Já na página, mede de verdade (a fonte real pode ser mais larga que a estimativa).
  requestAnimationFrame(() => {
    if (!svg.isConnected) return;
    for (const l of labels) {
      let text = l.el.textContent ?? '';
      while (text.length > 2 && l.el.getComputedTextLength() > LABEL_LEN) {
        text = `${text.replace(/…$/, '').slice(0, -1)}…`;
        l.el.textContent = text;
      }
    }
  });

  return {
    el,
    async spinTo(index, ms) {
      const p = landingPoint(ranges[index]!) * 360;
      // Gira no sentido horário até o ponto sorteado ficar sob o ponteiro (no topo).
      const target = Math.ceil((rotation + (ms > 0 ? 5 * 360 : 0) + p) / 360) * 360 - p;
      rotation = target;
      svg.style.transition = ms > 0 ? `transform ${ms}ms cubic-bezier(0.12, 0.75, 0.16, 1)` : 'none';
      svg.style.transform = `rotate(${target}deg)`;
      // Enquanto gira, tocar na roleta não prossegue (ver o atalho em main.ts).
      el.dataset.spinning = '1';
      if (ms > 0) await sleep(ms + 80);
      delete el.dataset.spinning;
      paths.forEach((path, i) => path.classList.toggle('dim', i !== index));
      items.forEach((li, i) => li.classList.toggle('win', i === index));
    },
  };
}

/** Roleta em faixa horizontal: rápida, usada nas rolagens de combate (iniciativa, acerto). */
export async function stripRoulette(
  container: HTMLElement,
  title: string,
  slices: WheelSlice[],
  index: number,
  ms: number,
): Promise<void> {
  const ranges = spans(slices);
  const segs = slices
    .map((s, i) => {
      const [a, b] = ranges[i]!;
      if (b - a <= 0) return '';
      const label = b - a >= 0.12 ? `${s.label} ${formatPct(b - a)}` : '';
      return `<div class="seg" data-i="${i}" style="flex-basis:${(b - a) * 100}%;background:${s.color}"><span>${label}</span></div>`;
    })
    .join('');
  container.innerHTML = `<div class="strip"><div class="strip-title">${title}</div><div class="strip-bar">${segs}<div class="strip-marker"></div></div></div>`;
  const marker = container.querySelector<HTMLElement>('.strip-marker')!;
  const pos = landingPoint(ranges[index]!) * 100;
  if (ms > 0) {
    marker.style.left = '0%';
    marker.getBoundingClientRect(); // força o layout antes da transição
    marker.style.transition = `left ${ms}ms cubic-bezier(0.2, 0.9, 0.25, 1.15)`;
  }
  marker.style.left = `${pos}%`;
  if (ms > 0) await sleep(ms);
  container.querySelectorAll<HTMLElement>('.seg').forEach((seg) => {
    seg.classList.toggle('dim', seg.dataset.i !== `${index}`);
  });
}
