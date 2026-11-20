// Empacotamento comum ao jogo (build-prototype.ts) e ao UI Lab (build-lab.ts): JS e CSS num HTML só, com as imagens de
// public/img/ listadas para a arte (copiadas ao lado) e as fontes embutidas no CSS (ver prototype/fonts/LEIAME.md).
import { build } from 'esbuild';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { imageSize } from './image-size';

export const IMG_DIR = 'public/img';
const IMAGE_EXT = /\.(webp|png|jpe?g|svg|webm|mp4)$/i;
const VIDEO_EXT = /\.(webm|mp4)$/i;

function listImages(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return listImages(path);
    return IMAGE_EXT.test(e.name) ? [`img/${relative(IMG_DIR, path).replaceAll('\\', '/')}`] : [];
  });
}

/** Imagens próprias e o tamanho de cada uma: a arte conhece a própria proporção antes de carregar (vídeo mede ao carregar). */
export function images(): { list: string[]; meta: Record<string, readonly [number, number]> } {
  const list = listImages(IMG_DIR);
  const meta: Record<string, readonly [number, number]> = {};
  for (const path of list) {
    if (VIDEO_EXT.test(path)) continue;
    const size = imageSize(readFileSync(join(IMG_DIR, path.slice('img/'.length))));
    if (size) meta[path] = size;
  }
  return { list, meta };
}

export const version = (): string => (JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }).version;

/** JS de uma entrada, num bloco só (IIFE), pronto para ir dentro de `<script>`. */
export async function bundleJs(entry: string, define: Record<string, string>): Promise<string> {
  const result = await build({ entryPoints: [entry], bundle: true, format: 'iife', target: 'es2020', write: false, charset: 'utf8', minify: true, define });
  return result.outputFiles[0]!.text.replace(/<\/script/gi, '<\\/script');
}

/** CSS de uma entrada, com as fontes em data URL, pronto para ir dentro de `<style>`. */
export async function bundleCss(entry: string): Promise<string> {
  const styles = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    charset: 'utf8',
    minify: true,
    target: ['chrome105', 'safari15.4', 'firefox110'],
    external: ['img/*'], // Assets públicos copiados ao lado do HTML do jogo e do Lab.
    loader: { '.woff2': 'dataurl' },
    logLevel: 'error',
  });
  return styles.outputFiles[0]!.text.replace(/<\/style/gi, '<\\/style');
}

/** Troca o marcador do HTML; sem ele, o build para (antes saía um HTML sem o jogo, em silêncio). */
export function inject(html: string, marker: string, content: string, template = 'o template'): string {
  if (html.split(marker).length !== 2) throw new Error(`${template} precisa ter ${marker} exatamente uma vez`);
  return html.replace(marker, () => content);
}

/** Template com o JS e o CSS. O script entra antes do estilo: um comentário do CSS com /*SCRIPT*\/ não recebe o JS. */
export function page(templatePath: string, js: string, css: string): string {
  const template = readFileSync(templatePath, 'utf8');
  return inject(inject(template, '/*SCRIPT*/', js, templatePath), '/*STYLE*/', css, templatePath);
}
