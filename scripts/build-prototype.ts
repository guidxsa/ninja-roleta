// Gera dist/prototipo.html: um único arquivo, sem dependências, que abre direto no navegador.
// O CSS vem de prototype/styles/index.css (camadas do design system), empacotado pelo esbuild com as
// fontes embutidas como data URL (funciona offline; ver prototype/fonts/LEIAME.md).
// Imagens próprias em public/img/ (ex.: public/img/viloes/zabuza.webp) são copiadas para dist/img/
// e substituem os desenhos; sem elas, o protótipo usa só os SVG embutidos.
// A música (public/audio/naruto_theme.mp3) vai embutida em base64, para o arquivo seguir único e offline.
// PWA (prototype/pwa/LEIAME.md): dist/sw.js (de prototype/sw.ts), dist/manifest.webmanifest e os ícones.
// O empacotamento comum com o UI Lab fica em scripts/page-build.ts. O lab não entra aqui (npm run lab, dist-lab/).
// Uso: `npm run proto` (produção) ou `npm run proto -- --canal=staging` (preview do staging em /staging/, com versão
// marcada, chaves de armazenamento e cache próprios; docs/processo/fluxo.md, "Preview").
import { build } from 'esbuild';
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bundleCss, bundleJs, IMG_DIR, images, page, version as readVersion } from './page-build';

const MUSIC_FILE = 'public/audio/naruto_theme.mp3';
const PWA_ICONS = ['icon-192.png', 'icon-512.png'];

const { list: imageList, meta: imageMeta } = images();
const canal = process.argv.includes('--canal=staging') ? 'staging' : 'producao';
const commit = (process.env.GITHUB_SHA ?? '').slice(0, 7) || 'local';
const version = canal === 'staging' ? `${readVersion()}-staging.${commit}` : readVersion();
const music = existsSync(MUSIC_FILE) ? readFileSync(MUSIC_FILE).toString('base64') : '';

const js = await bundleJs('prototype/main.ts', {
  __IMAGES__: JSON.stringify(imageList),
  __IMAGE_META__: JSON.stringify(imageMeta),
  __MUSIC__: JSON.stringify(music),
  __VERSION__: JSON.stringify(version),
  __CANAL__: JSON.stringify(canal),
});
const css = await bundleCss('prototype/styles/index.css');

const worker = await build({
  entryPoints: ['prototype/sw.ts'],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  write: false,
  minify: true,
  define: { __VERSION__: JSON.stringify(version), __CANAL__: JSON.stringify(canal) },
});

const pagina = page('prototype/index.html', js, css);
const html = canal === 'staging' ? pagina.replace('<title>Ninja Roleta</title>', '<title>Ninja Roleta (staging)</title>') : pagina;

// Manifesto do jogo instalável: abre em tela cheia, nas cores do tema escuro (o padrão).
const manifest = {
  name: canal === 'staging' ? 'Ninja Roleta (staging)' : 'Ninja Roleta',
  short_name: canal === 'staging' ? 'NR staging' : 'Ninja Roleta',
  description: 'Jogo de fã, de roleta e estratégia, no universo ninja. Sem afiliação oficial.',
  lang: 'pt-BR',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'any',
  background_color: '#0d0c0b',
  theme_color: '#0d0c0b',
  // O selo fica na zona segura, então cada ícone serve aos dois usos (entradas separadas, como pede a especificação).
  icons: PWA_ICONS.flatMap((src) => {
    const n = src.match(/\d+/)![0];
    return (['any', 'maskable'] as const).map((purpose) => ({ src, sizes: `${n}x${n}`, type: 'image/png', purpose }));
  }),
};

mkdirSync('dist', { recursive: true });
writeFileSync('dist/prototipo.html', html);
writeFileSync('dist/sw.js', worker.outputFiles[0]!.text);
writeFileSync('dist/manifest.webmanifest', JSON.stringify(manifest, null, 2));
for (const icon of PWA_ICONS) copyFileSync(join('prototype/pwa', icon), join('dist', icon));
if (imageList.length) cpSync(IMG_DIR, 'dist/img', { recursive: true });
console.log(
  `dist/prototipo.html (${Math.round(html.length / 1024)} KB, ${imageList.length} imagem(ns) própria(s), ${music ? 'com' : 'sem'} música) + sw.js e manifesto`,
);
