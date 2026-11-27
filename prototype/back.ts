// Esc e voltar do navegador (botão voltar do Android): fecham a camada de cima, pelo mesmo caminho do botão dela
// (docs/visual.md#voltar). Cada camada (janela, página do Registro, partida) põe uma entrada no histórico; o voltar
// tira a entrada e fecha a camada. Fechar pelo botão da tela tira a entrada também, para o histórico não crescer.
// No Portão não há camada: o voltar sai da página, sem armadilha.

export interface LayerOptions {
  /** O Esc também fecha (janela, página). A partida não: o Esc ali não pode tirar o jogador da luta. */
  esc?: boolean;
}
interface Layer extends Required<LayerOptions> {
  /** Fecha a camada. Devolve `false` para ficar (o jogador cancelou a saída): a entrada volta ao histórico. */
  close: () => boolean | void;
  /** A entrada já está no histórico (ou espera um `back()` nosso chegar: ver `pushLayer`). */
  pushed: boolean;
}

const stack: Layer[] = [];
let skipPops = 0;
let installed = false;

/** Abre uma camada. Devolve a função que a solta quando ela fecha por outro caminho (botão, fim da partida). */
export function pushLayer(close: () => boolean | void, opts: LayerOptions = {}): () => void {
  install();
  const layer: Layer = { close, esc: opts.esc ?? true, pushed: false };
  stack.push(layer);
  // O `back()` de uma camada solta só é aplicado depois, e mira a entrada de antes: um `pushState` agora seria desfeito
  // por ele, e o app desceria uma entrada a cada troca de modo até sair do site (hotfix v0.96.1). A entrada espera.
  if (skipPops === 0) pushEntry(layer);
  return () => {
    const i = stack.indexOf(layer);
    if (i < 0) return;
    stack.splice(i, 1);
    // Ainda sem entrada no histórico: não há o que tirar.
    if (!layer.pushed) return;
    skipPops++;
    history.back();
  };
}

function pushEntry(layer: Layer): void {
  layer.pushed = true;
  history.pushState({ layer: stack.indexOf(layer) + 1 }, '');
}

function install(): void {
  if (installed) return;
  installed = true;
  window.addEventListener('popstate', () => {
    if (skipPops > 0) {
      skipPops--;
      // Os `back()` nossos chegaram: as camadas abertas no meio ganham a entrada delas.
      if (skipPops === 0) stack.filter((l) => !l.pushed).forEach(pushEntry);
      return;
    }
    const layer = stack.pop();
    if (layer && layer.close() === false) {
      stack.push(layer);
      pushEntry(layer);
    }
  });
  // Captura: decide antes do Esc da dica e da janela, que fazem o próprio trabalho.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    // Dica aberta, campo em edição e janela fecham sozinhos (tooltip.ts, o campo, openDialog).
    if (document.querySelector('.tip:not([hidden])')) return;
    if ((e.target as HTMLElement | null)?.closest?.('input, textarea, select')) return;
    if (document.querySelector('[aria-modal="true"]')) return;
    const top = stack.at(-1);
    if (top?.esc && top.pushed) {
      e.preventDefault();
      history.back();
      return;
    }
    // Tela com botão de voltar (entradas da História e da Campanha): o Esc aperta o voltar dela.
    const back = [...document.querySelectorAll<HTMLElement>('.screen [data-back], .screen [data-choice="back"]')].find((b) => b.offsetParent !== null);
    if (back) {
      e.preventDefault();
      back.click();
    }
  }, true);
}
