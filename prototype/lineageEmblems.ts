import type { WheelSlice } from './wheel';
const shapes: Record<string, string> = {
  common:
    '<path d="M7 19 3 22l1.7-7.1C5.9 8.5 10.4 4.2 16 5.8c5.7 1.6 5.6 9.4 1 12.3-3.1 2.1-7.4.9-8.1-2.5-.8-3.6 2.9-6.4 5.8-4.9 2.2 1.2 1.7 4.6-.5 5" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/><path d="m15.2 5.6 6.4-3.3-3.3 5.3" fill="currentColor"/>',
  uchiha:
    '<path d="M4.2 11.6a7.8 7.8 0 1 1 15.6 0l-.2.7c-4.4-1.4-10.7-1.4-15.2 0z" fill="currentColor"/><path d="M5 14.5c4-1.4 10-1.4 14 0a8 8 0 0 1-5.7 4.4V22h-2.6v-3.1A8 8 0 0 1 5 14.5z" fill="currentColor"/>',
  hyuuga:
    '<path d="M2 12C5.1 7.7 8.4 5.9 12 5.9s7 1.8 10 6.1c-3 4.1-6.5 6.1-10 6.1S5 16.3 2 12Z" fill="none" stroke="currentColor" stroke-width="2.1"/><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4.8 7 3.4 4.8M19.3 7l1.4-2.2M4.8 17l-1.4 2.2m15.9-2.2 1.4 2.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  uzumaki:
    '<path d="M21 12.6a9 9 0 1 1-9-9 7.5 7.5 0 0 1 7.6 7.6A6 6 0 0 1 13.4 17a4.8 4.8 0 0 1-5-4.7 3.4 3.4 0 0 1 3.3-3.6 2.3 2.3 0 0 1 2.5 2.3" fill="none" stroke="currentColor" stroke-width="2.15" stroke-linecap="round"/>',
  inuzuka:
    '<path d="M2.4 5.2c2.3.8 5.2 1.1 8 .4l-2.1 6.8L4.4 21l.7-10.2Zm19.2 0c-2.3.8-5.2 1.1-8 .4l2.1 6.8 3.9 8.6-.7-10.2Z" fill="currentColor"/>',
  akimichi:
    '<path d="M10.4 11.2C8.8 6.4 4.9 3.2 2.3 4.4.9 7.8 3.2 12.2 8 13.1c-3.4.4-5.8 3.2-4.4 6 2.9 1.8 6.6-1 7.4-5.8Zm3.2 0c1.6-4.8 5.5-8 8.1-6.8 1.4 3.4-.9 7.8-5.7 8.7 3.4.4 5.8 3.2 4.4 6-2.9 1.8-6.6-1-7.4-5.8Z" fill="currentColor"/><path d="M12 9v8.6m0-8.1L9.7 6.2M12 9.5l2.3-3.3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  senju:
    '<path d="M12.1 14.6c-1.6-5.7 1.3-10 7.8-12-.1 6.3-2.3 10.7-7.8 12Zm-.8 2C5.9 17.2 3.4 13.5 2.9 8.3c5.2.2 8.4 3.1 8.4 8.3Zm1.6.1c1.7-3.8 5.1-5 8.4-4.2-1.6 3.9-4.6 5.9-8.4 4.2Z" fill="currentColor"/><path d="M11.7 21.7v-6.1m-4.5 6.3h9.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  taijutsuProdigy:
    '<path d="M12 19C7.7 14.6 8 9.5 12 3c4.1 6.4 4.2 11.7 0 16Zm-1-.1C5.9 19 2.8 15.9 2.1 10.9c4.3.8 7.2 3.4 8.9 8Zm2 0c5 .1 8.2-3 8.9-8-4.4.8-7.2 3.4-8.9 8Z" fill="currentColor"/><path d="M4 20q8 3.3 16 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
};
export const clanPaint: Record<string, string> = {
  common: '#d7bb8a',
  inuzuka: '#b98259',
  akimichi: '#a75e72',
  uchiha: '#a43e37',
  hyuuga: '#71658b',
  senju: '#66795f',
  uzumaki: '#80526d',
};
export function crest(id: string) {
  return shapes[id]
    ? `<svg class="origin-seal" data-origin="${id}" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">${shapes[id]}</svg>`
    : '';
}
const perc = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const svgNS = 'http://www.w3.org/2000/svg';
export function enhanceWheel(
  el: HTMLElement,
  svg: SVGSVGElement,
  slices: WheelSlice[],
  ranges: readonly (readonly [number, number])[],
  items: HTMLLIElement[],
  paths: SVGElement[],
) {
  if (!slices[0]?.originId) return;
  const total = slices.reduce((v, s) => v + s.weight, 0);
  el.classList.add('lineage-wheel');
  for (let i = 0; i < slices.length; i++) {
    const s = slices[i]!,
      id = s.originId!,
      [lo, hi] = ranges[i]!,
      pct = perc.format((s.weight * 100) / total) + '%';
    const deg = (lo + hi) * Math.PI,
      span = (hi - lo) * 2 * Math.PI,
      rad = 94;
    const side = Math.min(43, Math.max(12, 2 * rad * Math.sin(Math.min(Math.PI, span) / 2) * 0.78));
    const group = document.createElementNS(svgNS, 'g');
    group.setAttribute(
      'transform',
      `translate(${150 + rad * Math.sin(deg) - side / 2} ${150 - rad * Math.cos(deg) - side / 2}) scale(${side / 24})`,
    );
    group.setAttribute('class', 'origin-on-wheel ' + (['uchiha', 'uzumaki', 'hyuuga'].includes(id) ? 'pale' : 'ink'));
    group.setAttribute('aria-hidden', 'true');
    group.innerHTML = shapes[id] || '';
    svg.appendChild(group);
    if (hi - lo > 0.18) {
      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('class', 'range-name');
      label.setAttribute('x', String(150 + rad * Math.sin(deg)));
      label.setAttribute('y', String(150 - rad * Math.cos(deg) + side * 0.76));
      label.setAttribute('text-anchor', 'middle');
      label.textContent = s.label;
      svg.appendChild(label);
    }
    const title = document.createElementNS(svgNS, 'title');
    title.textContent = s.label + ' · ' + pct;
    paths[i]!.appendChild(title);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.origin = id;
    btn.setAttribute('aria-label', s.label + ', ' + pct + ' de chance. Destacar na roda.');
    btn.setAttribute('aria-pressed', 'false');
    btn.innerHTML = crest(id) + '<span></span><strong></strong>';
    btn.querySelector('span')!.textContent = s.label;
    btn.querySelector('strong')!.textContent = pct;
    items[i]!.replaceChildren(btn);
    const set = (n: number) => {
      el.classList.toggle('is-reading', n >= 0);
      paths.forEach((p, k) => p.classList.toggle('read', k === n));
      items.forEach((row, k) => row.firstElementChild?.setAttribute('aria-pressed', String(n === k)));
    };
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      if (!el.dataset.spinning) set(btn.getAttribute('aria-pressed') === 'true' ? -1 : i);
    });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') set(-1);
    });
  }
}
