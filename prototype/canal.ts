// Canal do build (docs/processo/fluxo.md, "Preview"): `npm run proto -- --canal=staging` gera o preview do staging.
// Fora do build (testes, UI Lab), é a produção.
import type { Canal } from '../src/state/canal';

declare const __CANAL__: Canal;
export const CANAL: Canal = typeof __CANAL__ === 'undefined' ? 'producao' : __CANAL__;
