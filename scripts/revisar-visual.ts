// Fotografa cenários do UI Lab em celular e desktop, em grafite e com menos movimento (skill revisar-visual).
// Uso: npm run lab && npx tsx scripts/revisar-visual.ts <id do cenário>... [--prefixo=jornada.shop] [--todos] [--saida=dir]
//      [--chromium=/caminho/do/chromium]   (ou a variável PW_CHROMIUM; sem nenhum, tenta o padrão e /opt/pw-browsers/chromium)
// Saída: PNGs em dist-lab/revisao/ (fora do git) e, no terminal, os erros do console de cada foto.
// Precisa do Playwright com o Chromium (no ambiente na nuvem já vem; na sua máquina: npx playwright install chromium).
import { existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SCENARIOS } from '../prototype/lab/registry';

const LAB = 'dist-lab/lab.html';
const FALLBACK_CHROMIUM = '/opt/pw-browsers/chromium';
/** Celular (360, 390), tablet (768), desktop (1024) e widescreen (1280, onde a faixa começa, e 1440): docs/visual.md. */
export const VIEWPORTS = [
  { nome: '360', width: 360, height: 780 },
  { nome: '390', width: 390, height: 844 },
  { nome: '768', width: 768, height: 1024 },
  { nome: '1024', width: 1024, height: 720 },
  { nome: '1280', width: 1280, height: 800 },
  { nome: '1440', width: 1440, height: 900 },
];
export const VARIANTES = [
  { nome: 'sumi', still: false },
  { nome: 'sumi-still', still: true },
];

/**
 * Ids dos cenários, da lista registrada no lab (`prototype/lab/registry.ts`), inclusive os montados por template (#68).
 * A lista carrega sem DOM, como no tests/uilab.test.ts: o DOM só entra quando um cenário é montado.
 */
export function scenarioIds(): string[] {
  return [...new Set(SCENARIOS.map((s) => s.id))].sort();
}

export const shotUrl = (lab: string, id: string, still: boolean): string =>
  `${pathToFileURL(resolve(lab)).href}?s=${encodeURIComponent(id)}&frame=1&instant=1${still ? '&still=1' : ''}`;

// Tipos mínimos do Playwright (não é dependência do projeto: vem do ambiente ou de quem roda).
interface PwPage {
  on(ev: 'console', fn: (m: { type(): string; text(): string }) => void): void;
  on(ev: 'pageerror', fn: (e: Error) => void): void;
  goto(url: string): Promise<unknown>;
  waitForTimeout(ms: number): Promise<void>;
  evaluate<T>(fn: () => T): Promise<T>;
  screenshot(o: { path: string; fullPage: boolean }): Promise<unknown>;
  close(): Promise<void>;
}
interface PwContext {
  newPage(): Promise<PwPage>;
  close(): Promise<void>;
}
interface PwBrowser {
  newContext(o: Record<string, unknown>): Promise<PwContext>;
  close(): Promise<void>;
}
interface Pw {
  chromium: { launch(o?: { executablePath?: string }): Promise<PwBrowser> };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const all = scenarioIds();
  const prefix = args.find((a) => a.startsWith('--prefixo='))?.slice(10);
  const out = args.find((a) => a.startsWith('--saida='))?.slice(8) ?? 'dist-lab/revisao';
  const asked = args.filter((a) => !a.startsWith('--'));
  const ids = args.includes('--todos') ? all : prefix ? all.filter((id) => id.startsWith(prefix)) : asked;
  if (!ids.length) {
    console.log(`Diga os cenários (ids) ou use --prefixo= ou --todos. Existem ${all.length}, por exemplo: ${all.slice(0, 8).join(', ')}`);
    process.exitCode = 1;
    return;
  }
  const unknown = ids.filter((id) => !all.includes(id));
  if (unknown.length) {
    console.log(`Cenário(s) desconhecido(s): ${unknown.join(', ')}. Confira os ids em prototype/lab/scenarios/.`);
    process.exitCode = 1;
    return;
  }
  if (!existsSync(LAB)) {
    console.log(`Sem ${LAB}: rode npm run lab antes.`);
    process.exitCode = 1;
    return;
  }

  let chromium: Pw['chromium'];
  try {
    chromium = (createRequire(import.meta.url)('playwright') as Pw).chromium;
  } catch {
    console.log('Playwright não encontrado. Na sua máquina: npm i --no-save playwright && npx playwright install chromium (skill revisar-visual).');
    process.exitCode = 1;
    return;
  }

  mkdirSync(out, { recursive: true });
  const pinned = args.find((a) => a.startsWith('--chromium='))?.slice(11) ?? process.env.PW_CHROMIUM;
  let browser: PwBrowser;
  try {
    browser = await chromium.launch(pinned ? { executablePath: pinned } : undefined);
  } catch (e) {
    if (pinned || !existsSync(FALLBACK_CHROMIUM)) {
      console.log(`Não consegui abrir o Chromium${pinned ? ` em ${pinned}` : ''}: ${(e as Error).message.split('\n')[0]}`);
      console.log('Indique o executável com --chromium=<caminho> ou PW_CHROMIUM, ou instale com npx playwright install chromium.');
      process.exitCode = 1;
      return;
    }
    browser = await chromium.launch({ executablePath: FALLBACK_CHROMIUM });
  }
  let problems = 0;
  for (const vp of VIEWPORTS)
    for (const v of VARIANTES) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
        reducedMotion: v.still ? 'reduce' : 'no-preference',
        colorScheme: 'dark',
      });
      for (const id of ids) {
        const page = await ctx.newPage();
        const errors: string[] = [];
        page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
        page.on('pageerror', (e) => errors.push(e.message));
        await page.goto(shotUrl(LAB, id, v.still));
        await page.waitForTimeout(400);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
        // O lab mostra "Cenário desconhecido" sem lançar erro (prototype/lab/frame.ts): isso não pode virar foto "ok".
        const title = await page.evaluate(() => document.querySelector('#screen h2')?.textContent ?? '');
        if (title.includes('Cenário desconhecido')) errors.push('o lab não montou o cenário (Cenário desconhecido)');
        const file = join(out, `${id.replace(/[^\w.-]/g, '_')}--${vp.nome}--${v.nome}.png`);
        await page.screenshot({ path: file, fullPage: true });
        const notes = [...(overflow ? ['rolagem horizontal'] : []), ...errors.map((e) => `console: ${e}`)];
        if (notes.length) problems++;
        console.log(`${notes.length ? 'VER ' : 'ok  '} ${file}${notes.length ? `\n       ${notes.join('\n       ')}` : ''}`);
        await page.close();
      }
      await ctx.close();
    }
  await browser.close();
  console.log(`${ids.length} cenário(s) × ${VIEWPORTS.length * VARIANTES.length} fotos em ${out}; ${problems} com algo a ver.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) void main();
