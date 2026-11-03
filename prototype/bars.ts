// Barras de HP/chakra com rastro de dano (Roleta e Jornada). Só apresentação: os valores vêm do estado da luta.
// A barra é atualizada no lugar (sem trocar o elemento) para a transição do CSS funcionar: o preenchimento
// cai rápido e o rastro claro (`.bar-trail`) alcança depois; num ganho, o rastro pula junto (`.snap`).

export function barPct(cur: number, max: number): number {
  return max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0;
}

/** Tom da barra de HP: `mid` até 60%, `low` até 30%. */
export function barTone(kind: 'hp' | 'ck', pct: number): '' | 'mid' | 'low' {
  if (kind !== 'hp') return '';
  return pct <= 30 ? 'low' : pct <= 60 ? 'mid' : '';
}

/** Camadas internas de uma barra (rastro + preenchimento) na largura `pct`. */
export function barLayers(pct: number): string {
  return `<i class="bar-trail" style="width:${pct}%"></i><div class="fill" style="width:${pct}%"></div>`;
}

/** Atualiza a barra no lugar: largura, rastro, tom e o rótulo. */
export function patchBar(el: HTMLElement, kind: 'hp' | 'ck', cur: number, max: number, label: string): void {
  const pct = barPct(cur, max);
  const fill = el.querySelector<HTMLElement>(':scope > .fill');
  if (fill) fill.style.width = `${pct}%`;
  const trail = el.querySelector<HTMLElement>(':scope > .bar-trail');
  if (trail) {
    trail.classList.toggle('snap', pct >= parseFloat(trail.style.width || '0'));
    trail.style.width = `${pct}%`;
  }
  const tone = barTone(kind, pct);
  el.classList.toggle('mid', tone === 'mid');
  el.classList.toggle('low', tone === 'low');
  const span = el.querySelector<HTMLElement>(':scope > span');
  if (span) span.textContent = label;
}

/**
 * Antes de redesenhar um bloco que contém barras, guarda onde cada rastro está agora (largura visível);
 * depois do redesenho, `restoreTrails` faz o rastro novo continuar dali até o valor atual.
 */
export function captureTrails(root: ParentNode, keyOf: (bar: HTMLElement) => string | null): Map<string, number> {
  const out = new Map<string, number>();
  root.querySelectorAll<HTMLElement>('.bar').forEach((bar) => {
    const key = keyOf(bar);
    const trail = bar.querySelector<HTMLElement>(':scope > .bar-trail');
    const w = bar.getBoundingClientRect().width;
    if (key && trail && w > 0) out.set(key, (trail.getBoundingClientRect().width / w) * 100);
  });
  return out;
}

export function restoreTrails(root: ParentNode, keyOf: (bar: HTMLElement) => string | null, before: Map<string, number>): void {
  root.querySelectorAll<HTMLElement>('.bar').forEach((bar) => {
    const key = keyOf(bar);
    const trail = bar.querySelector<HTMLElement>(':scope > .bar-trail');
    const was = key ? before.get(key) : undefined;
    if (!trail || was === undefined) return;
    const target = parseFloat(trail.style.width || '0');
    if (was <= target) return;
    trail.classList.add('snap');
    trail.style.width = `${was}%`;
    void trail.offsetWidth;
    trail.classList.remove('snap');
    trail.style.width = `${target}%`;
  });
}
