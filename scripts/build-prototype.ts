// Gera dist/prototipo.html: um único arquivo, sem dependências, que abre direto no navegador.
// Imagens próprias em public/img/ (ex.: public/img/viloes/zabuza.webp) são copiadas para dist/img/
// e substituem os desenhos; sem elas, o protótipo usa só os SVG embutidos.
// A música (public/audio/naruto_theme.mp3) vai embutida em base64, para o arquivo seguir único e offline.
// Uso: `npm run proto`
import { build } from 'esbuild';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const IMG_DIR = 'public/img';
const MUSIC_FILE = 'public/audio/naruto_theme.mp3';
const IMAGE_EXT = /\.(webp|png|jpe?g|svg)$/i;

function listImages(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return listImages(path);
    return IMAGE_EXT.test(e.name) ? [`img/${relative(IMG_DIR, path).replaceAll('\\', '/')}`] : [];
  });
}

const images = listImages(IMG_DIR);
const version = (JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }).version;
const music = existsSync(MUSIC_FILE) ? readFileSync(MUSIC_FILE).toString('base64') : '';

const result = await build({
  entryPoints: ['prototype/main.ts'],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  write: false,
  charset: 'utf8',
  define: { __IMAGES__: JSON.stringify(images), __MUSIC__: JSON.stringify(music), __VERSION__: JSON.stringify(version) },
});

const js = result.outputFiles[0]!.text.replace(/<\/script/gi, '<\\/script');
const css = readFileSync('prototype/style.css', 'utf8');
const html = readFileSync('prototype/index.html', 'utf8')
  .replace('/*STYLE*/', () => css)
  .replace('/*SCRIPT*/', () => js);

mkdirSync('dist', { recursive: true });
writeFileSync('dist/prototipo.html', html);
if (images.length) cpSync(IMG_DIR, 'dist/img', { recursive: true });
console.log(
  `dist/prototipo.html (${Math.round(html.length / 1024)} KB, ${images.length} imagem(ns) própria(s), ${music ? 'com' : 'sem'} música)`,
);
