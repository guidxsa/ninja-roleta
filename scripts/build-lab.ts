// Gera dist-lab/lab.html: o UI Lab (docs/ui-lab/ARCHITECTURE.md). Só local: fica fora de dist/, que é o que o Pages
// publica, e não é gerado pelo `npm run proto`. Sem música embutida (o lab não toca som) e sem service worker.
// Uso: `npm run lab` e abrir dist-lab/lab.html por um servidor local (configuração "ui-lab" do .claude/launch.json).
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { bundleCss, bundleJs, IMG_DIR, images, page, version } from './page-build';

const OUT = 'dist-lab';
const { list, meta } = images();
const js = await bundleJs('prototype/lab/main.ts', {
  __IMAGES__: JSON.stringify(list),
  __IMAGE_META__: JSON.stringify(meta),
  __MUSIC__: JSON.stringify(''),
  __VERSION__: JSON.stringify(version()),
  __UILAB__: 'true',
});
const css = await bundleCss('prototype/lab/lab.css');
const html = page('prototype/lab/lab.html', js, css);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/lab.html`, html);
if (list.length) cpSync(IMG_DIR, `${OUT}/img`, { recursive: true });
console.log(`${OUT}/lab.html (${Math.round(html.length / 1024)} KB, ${list.length} imagem(ns))`);
