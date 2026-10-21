// Gera dist/prototipo.html: um único arquivo, sem dependências, que abre direto no navegador.
// Uso: `npm run proto`
import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const result = await build({
  entryPoints: ['prototype/main.ts'],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  write: false,
  charset: 'utf8',
});

const js = result.outputFiles[0]!.text.replace(/<\/script/gi, '<\\/script');
const css = readFileSync('prototype/style.css', 'utf8');
const html = readFileSync('prototype/index.html', 'utf8')
  .replace('/*STYLE*/', () => css)
  .replace('/*SCRIPT*/', () => js);

mkdirSync('dist', { recursive: true });
writeFileSync('dist/prototipo.html', html);
console.log(`dist/prototipo.html (${Math.round(html.length / 1024)} KB)`);
