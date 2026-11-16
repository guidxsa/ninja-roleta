// Galeria de retratos (só no UI Lab): todos os desenhos de prototype/portraits/ lado a lado, nos tamanhos em que a
// interface os usa (da ordem de iniciativa, 24px, à cena, 120px). Auditoria: a imagem base de cada um, quando existe em
// prototype/lab/refs/<chave>.png|jpg|webp (ver o LEIAME de lá), aparece ao lado do desenho.
// Filtro pela URL: `&refs=com` (só os que têm imagem base) ou `&refs=sem` (só os que faltam).
import { h, show } from '../dom';
import { PORTRAIT_KEYS, portraitArt } from '../portraits/index';

declare const __LAB_REFS__: string[];
const REFS: readonly string[] = typeof __LAB_REFS__ === 'undefined' ? [] : __LAB_REFS__;
const SIZES = [78, 48, 24];

/** Arquivo da imagem base da chave, se foi enviado. */
export const refFile = (key: string, files: readonly string[] = REFS): string | undefined =>
  files.find((f) => f.replace(/\.[^.]+$/, '') === key);

export function portraitGallery(): Promise<never> {
  const filter = new URLSearchParams(location.search).get('refs');
  const keys = PORTRAIT_KEYS.filter((k) => (filter === 'com' ? refFile(k) : filter === 'sem' ? !refFile(k) : true));
  const pic = (key: string, px: number) =>
    `<svg class="art" viewBox="0 0 100 100" width="${px}" height="${px}" aria-hidden="true">${portraitArt(key)}</svg>`;
  const ref = (key: string) => {
    const file = refFile(key);
    return file
      ? `<img src="refs/${file}" alt="" width="120" height="120" style="object-fit:cover;object-position:50% 20%">`
      : `<span style="width:120px;height:120px;display:grid;place-items:center;border:1px dashed var(--line);font-family:var(--font-hud);font-size:11px;opacity:.7">sem referência</span>`;
  };
  const card = (key: string) =>
    `<figure style="margin:0;padding:8px;border:1px solid var(--line);background:var(--surface)">
      <div style="display:flex;gap:6px;align-items:flex-end;flex-wrap:wrap">${ref(key)}${pic(key, 120)}${SIZES.map((px) => pic(key, px)).join('')}</div>
      <figcaption style="font-family:var(--font-hud);font-size:12px;margin-top:4px">${key}</figcaption>
    </figure>`;
  const done = PORTRAIT_KEYS.filter((k) => refFile(k)).length;
  show(h(`<div class="screen" style="max-width:none;width:100%">
    <p style="font-family:var(--font-hud);font-size:12px;margin:0 0 8px">${done} de ${PORTRAIT_KEYS.length} com imagem base</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:8px;width:100%">${keys.map(card).join('')}</div></div>`));
  return new Promise<never>(() => {});
}
