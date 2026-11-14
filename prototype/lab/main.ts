// Entrada do UI Lab (dist-lab/lab.html, só local): com `frame=1` monta um cenário; sem, abre o catálogo.
// Ver docs/ui-lab/ARCHITECTURE.md. Nada fora de prototype/lab/ importa daqui, e o build do jogo não inclui este arquivo.
import { runCatalog } from './catalog';
import { runFrame } from './frame';

/** Marca do build do lab: o teste confere que ela não aparece no jogo. */
declare const __UILAB__: boolean;
if (typeof __UILAB__ === 'undefined' || !__UILAB__) throw new Error('UI Lab fora do build do lab');

const params = new URLSearchParams(window.location.search);
const id = params.get('s');
if (params.get('frame') === '1' && id) void runFrame(id, params);
else runCatalog(params);
