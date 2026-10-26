// Componentes visuais de roleta. O resultado já vem sorteado pelo core; aqui só se anima até ele.

export interface WheelSlice {
  label: string;
  weight: number;
  color: string;
}

export interface Wheel {
  el: HTMLElement;
  /** Gira até a fatia `index`. `ms` = 0 para resultado instantâneo. */
  spinTo(index: number, ms: number): Promise<void>;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const SIZE = 300;
const R = 146;
const C = SIZE / 2;

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
    if (span >= 16) {
      const mid = ((f0 + f1) / 2) * 360;
      const [x, y] = point(mid, R * 0.62);
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', `${x}`);
      text.setAttribute('y', `${y}`);
      text.setAttribute('class', 'slice-label');
      // Texto ao longo do raio, sempre legível da borda para o centro.
      const rot = mid <= 180 ? mid - 90 : mid + 90;
      text.setAttribute('transform', `rotate(${rot} ${x} ${y})`);
      const max = span >= 60 ? 16 : span >= 30 ? 11 : 7;
      text.textContent = s.label.length > max ? `${s.label.slice(0, max - 1)}…` : s.label;
      svg.appendChild(text);
    }
  });

  const hub = document.createElementNS(SVG_NS, 'circle');
  hub.setAttribute('cx', `${C}`);
  hub.setAttribute('cy', `${C}`);
  hub.setAttribute('r', '14');
  hub.setAttribute('class', 'hub');
  svg.appendChild(hub);

  const pointer = document.createElement('div');
  pointer.className = 'wheel-pointer';
  wrap.append(svg, pointer);

  const legend = document.createElement('ul');
  legend.className = 'legend';
  const items = slices.map((s, i) => {
    const [f0, f1] = ranges[i]!;
    const li = document.createElement('li');
    li.innerHTML = `<i style="background:${s.color}"></i><span></span><b>${formatPct(f1 - f0)}</b>`;
    li.querySelector('span')!.textContent = s.label;
    if (f1 - f0 <= 0) li.classList.add('zero');
    legend.appendChild(li);
    return li;
  });

  el.append(wrap, legend);
  let rotation = 0;

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
