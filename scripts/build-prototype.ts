// Gera dist/prototipo.html: um único arquivo, sem dependências, que abre direto no navegador.
// O CSS vem de prototype/styles/index.css (camadas do design system), empacotado pelo esbuild com as
// fontes embutidas como data URL (funciona offline; ver prototype/fonts/LEIAME.md).
// Imagens próprias em public/img/ (ex.: public/img/viloes/zabuza.webp) são copiadas para dist/img/
// e substituem os desenhos; sem elas, o protótipo usa só os SVG embutidos.
// A música (public/audio/naruto_theme.mp3) vai embutida em base64, para o arquivo seguir único e offline.
// PWA (prototype/pwa/LEIAME.md): dist/sw.js (de prototype/sw.ts), dist/manifest.webmanifest e os ícones.
// Uso: `npm run proto`
import { build } from 'esbuild';
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { imageSize } from './image-size';

const IMG_DIR = 'public/img';
const MUSIC_FILE = 'public/audio/naruto_theme.mp3';
const IMAGE_EXT = /\.(webp|png|jpe?g|svg|webm|mp4)$/i;
const VIDEO_EXT = /\.(webm|mp4)$/i;
const PWA_ICONS = ['icon-192.png', 'icon-512.png'];

function listImages(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return listImages(path);
    return IMAGE_EXT.test(e.name) ? [`img/${relative(IMG_DIR, path).replaceAll('\\', '/')}`] : [];
  });
}

const images = listImages(IMG_DIR);
// Largura e altura de cada imagem: a arte conhece a própria proporção antes de carregar (vídeo mede ao carregar).
const imageMeta: Record<string, readonly [number, number]> = {};
for (const path of images) {
  if (VIDEO_EXT.test(path)) continue;
  const size = imageSize(readFileSync(join(IMG_DIR, path.slice('img/'.length))));
  if (size) imageMeta[path] = size;
}
const version = (JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }).version;
const music = existsSync(MUSIC_FILE) ? readFileSync(MUSIC_FILE).toString('base64') : '';

const result = await build({
  entryPoints: ['prototype/main.ts'],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  write: false,
  charset: 'utf8',
  minify: true,
  define: { __IMAGES__: JSON.stringify(images), __IMAGE_META__: JSON.stringify(imageMeta), __MUSIC__: JSON.stringify(music), __VERSION__: JSON.stringify(version) },
});

const styles = await build({
  entryPoints: ['prototype/styles/index.css'],
  bundle: true,
  write: false,
  charset: 'utf8',
  minify: true,
  target: ['chrome105', 'safari15.4', 'firefox110'],
  loader: { '.woff2': 'dataurl' },
  logLevel: 'error',
});

const worker = await build({
  entryPoints: ['prototype/sw.ts'],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  write: false,
  minify: true,
  define: { __VERSION__: JSON.stringify(version) },
});

/** Troca o marcador do HTML; sem ele, o build para (antes saía um HTML sem o jogo, em silêncio). */
function inject(html: string, marker: string, content: string): string {
  if (html.split(marker).length !== 2) throw new Error(`prototype/index.html precisa ter ${marker} exatamente uma vez`);
  return html.replace(marker, () => content);
}

const js = result.outputFiles[0]!.text.replace(/<\/script/gi, '<\\/script');
const css = styles.outputFiles[0]!.text.replace(/<\/style/gi, '<\\/style');
// O script entra antes do estilo: um comentário do CSS com /*SCRIPT*/ não recebe o JS.
const template = readFileSync('prototype/index.html', 'utf8');
const html = inject(inject(template, '/*SCRIPT*/', js), '/*STYLE*/', css);

// Manifesto do jogo instalável: abre em tela cheia, nas cores do tema escuro (o padrão).
const manifest = {
  name: 'Ninja Roleta',
  short_name: 'Ninja Roleta',
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
if (images.length) cpSync(IMG_DIR, 'dist/img', { recursive: true });
console.log(
  `dist/prototipo.html (${Math.round(html.length / 1024)} KB, ${images.length} imagem(ns) própria(s), ${music ? 'com' : 'sem'} música) + sw.js e manifesto`,
);
