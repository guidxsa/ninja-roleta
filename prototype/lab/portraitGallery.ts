// Galeria de retratos (só no UI Lab): todos os desenhos de prototype/portraits/ lado a lado, nos tamanhos em que a
// interface os usa (da ordem de iniciativa, 24px, à cena, 120px), para conferir se cada personagem se distingue.
import { h, show } from '../dom';
import { PORTRAIT_KEYS, portraitArt } from '../portraits/index';

const SIZES = [120, 78, 48, 24];

export function portraitGallery(): Promise<never> {
  const pic = (key: string, px: number) =>
    `<svg class="art" viewBox="0 0 100 100" width="${px}" height="${px}" aria-hidden="true">${portraitArt(key)}</svg>`;
  const card = (key: string) =>
    `<figure style="margin:0;padding:8px;border:1px solid var(--line);background:var(--surface)">
      <div style="display:flex;gap:6px;align-items:flex-end">${SIZES.map((px) => pic(key, px)).join('')}</div>
      <figcaption style="font-family:var(--font-hud);font-size:12px;margin-top:4px">${key}</figcaption>
    </figure>`;
  show(h(`<div class="screen" style="max-width:none;width:100%"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:8px;width:100%">${PORTRAIT_KEYS.map(card).join('')}</div></div>`));
  return new Promise<never>(() => {});
}
