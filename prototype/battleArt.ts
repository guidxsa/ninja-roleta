import { fighterPortrait } from './art';
import { HOME, untilHome } from './dom';
import { ragePortraits } from '../src/data/portraits';
import type { Fighter, JBattle } from '../src/core/jornada/types';
import type { JornadaData } from '../src/core/jornada/data';
const cache = new Map<string, Promise<boolean>>();
const images = new Map<string, HTMLImageElement>();
function warm(url: string): Promise<boolean> {
  if (cache.has(url)) return cache.get(url)!;
  const img = new Image();
  img.decoding = 'async';
  images.set(url, img);
  const job = new Promise<boolean>((resolve) => {
    let finished = false;
    const done = (worked: boolean) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (!worked) {
        images.delete(url);
        cache.delete(url);
      }
      resolve(worked);
    };
    const timer = setTimeout(() => done(false), 2500);
    img.onerror = () => done(false);
    img.onload = () => {
      if (!img.decode) {
        done(true);
        return;
      }
      img.decode().then(
        () => done(true),
        () => done(img.naturalWidth > 0),
      );
    };
    img.src = url;
  });
  cache.set(url, job);
  return job;
}
/** Se a sessão terminar durante a carga, o combate antigo para antes de montar a tela. */
async function preload(resources: Set<string>): Promise<void> {
  if ((await untilHome(Promise.all([...resources].map(warm)))) === HOME) await new Promise<void>(() => {});
}

function urls(markup: string) {
  const tpl = document.createElement('template');
  tpl.innerHTML = markup;
  return [...tpl.content.querySelectorAll('img[src]')].map((i) => i.getAttribute('src')!);
}
export async function preBattle(state: JBattle, data: JornadaData, bridge: boolean, draw: (f: Fighter, d: JornadaData) => string) {
  const resources = new Set<string>();
  for (const f of state.fighters) {
    const definition = data.characters[f.defId] ?? data.enemies[f.defId];
    const markup = [
      draw(f, data),
      ...(definition?.forms ?? []).filter((v) => v.portrait).map((v) => fighterPortrait(f.defId + '-' + v.id, v.portrait!, 'md')),
    ];
    const rage = ragePortraits[f.defId];
    if (rage) markup.push(fighterPortrait(f.defId + '-rage', rage, 'md'));
    for (const html of markup) for (const path of urls(html)) resources.add(path);
  }
  if (bridge) resources.add('img/shinobi/ponte-limpa.png');
  const visitors = new Set<string>((state.reserve ?? []).map((row) => row.seed.defId));
  for (const rule of state.script ?? [])
    for (const act of rule.do ?? []) if (act.do === 'say' && act.who !== 'narrator') visitors.add(act.who);
  for (const id of visitors) {
    const def = data.characters[id] ?? data.enemies[id];
    if (!def?.portrait) continue;
    const arts = [
      fighterPortrait(id, def.portrait, 'md'),
      ...(def.forms ?? []).filter((form) => form.portrait).map((form) => fighterPortrait(id + '-' + form.id, form.portrait!, 'md')),
    ];
    if (ragePortraits[id]) arts.push(fighterPortrait(id + '-rage', ragePortraits[id], 'md'));
    for (const html of arts) for (const path of urls(html)) resources.add(path);
  }
  await preload(resources);
}
export async function preRoleta(markup: string) {
  await preload(new Set(urls(markup)));
}
