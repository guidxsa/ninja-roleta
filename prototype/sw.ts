// Service worker do jogo (PWA offline). O build gera dist/sw.js a partir daqui, com a versão do package.json.
//
// Estratégia (docs/base/plataforma.md, "Offline e instalação"):
// - A página (o jogo inteiro num HTML) vem da rede primeiro, e a cópia fica guardada: online, a versão nova chega no
//   próximo acesso, e ninguém fica preso numa versão antiga; sem rede, abre a cópia.
// - Imagens vêm do cache quando já foram vistas; sem elas, o jogo usa os desenhos em SVG.
// - O GitHub Pages divide a origem com outros projetos: o service worker só responde dentro do próprio escopo e só
//   apaga caches com o prefixo dele.
export {};

declare const __VERSION__: string;

interface WaitEvent extends Event {
  waitUntil(p: Promise<unknown>): void;
}
interface FetchEvent extends WaitEvent {
  request: Request;
  respondWith(r: Promise<Response> | Response): void;
}
declare const self: {
  registration: { scope: string };
  skipWaiting(): Promise<void>;
  clients: { claim(): Promise<void> };
  addEventListener(type: 'install' | 'activate', listener: (e: WaitEvent) => void): void;
  addEventListener(type: 'fetch', listener: (e: FetchEvent) => void): void;
};

const PREFIX = 'ninja-roleta-';
const CACHE = `${PREFIX}${__VERSION__}`;
/** O que a instalação já deixa guardado: a página e o que o manifesto pede. */
const SHELL = ['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
/** Chave única da página: `index.html`, `./` e `?seed=` são o mesmo jogo. */
const PAGE = new URL('./', self.registration.scope).href;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function page(req: Request): Promise<Response> {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) await cache.put(PAGE, res.clone());
    return res;
  } catch {
    return (await cache.match(PAGE)) ?? Response.error();
  }
}

async function cacheFirst(req: Request): Promise<Response> {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) await cache.put(req, res.clone());
  return res;
}

async function networkFirst(req: Request): Promise<Response> {
  try {
    return await fetch(req);
  } catch {
    return (await caches.match(req)) ?? Response.error();
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.registration.scope)) return;
  if (req.mode === 'navigate') return e.respondWith(page(req));
  const path = new URL(req.url).pathname;
  if (/\.(webp|png|jpe?g|svg|webm|mp4)$/i.test(path)) return e.respondWith(cacheFirst(req));
  e.respondWith(networkFirst(req));
});
