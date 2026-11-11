// Faixas de tela (docs/visual.md, "Celular e desktop"). As mesmas condições se repetem nos @media dos estilos
// (a CSS não aceita var() em @media); a referência fica no topo de prototype/styles/base.css.

/** Composição de desktop: largura de notebook e altura que comporta colunas (celular deitado fica fora). */
export const DESK = '(min-width: 900px) and (min-height: 560px)';
/** Widescreen: mais uma região (equipe, campo e ações; contexto ao lado do mapa). */
export const WIDE = '(min-width: 1280px) and (min-height: 560px)';

/** O aparelho pede menos movimento: imagem parada nas cenas e roletas sem giro (o CSS já zera as transições). */
export const prefersStill = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
