import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Histórico de mentira com o comportamento visto no navegador (hotfix v0.96.1): o `back()` mira a entrada anterior à
// atual na hora da chamada, mas só é aplicado depois, numa tarefa à parte; um `pushState` no meio não muda o alvo.
// Antes da correção, trocar de modo (soltar a camada da partida e abrir a da nova) descia uma entrada a cada troca até
// sair do site.
function fakeBrowser() {
  const entries: unknown[] = ['fora do site', null];
  let index = 1;
  const pops: ((e: { state: unknown }) => void)[] = [];
  const pending: number[] = [];
  const history = {
    get state() {
      return entries[index];
    },
    pushState(state: unknown) {
      entries.splice(index + 1);
      entries.push(state);
      index = entries.length - 1;
    },
    back() {
      pending.push(index - 1);
      setTimeout(() => {
        index = Math.max(0, pending.shift()!);
        pops.forEach((f) => f({ state: entries[index] }));
      }, 0);
    },
  };
  const win = { addEventListener: (type: string, f: (e: { state: unknown }) => void) => type === 'popstate' && pops.push(f) };
  const doc = { addEventListener: () => {}, querySelector: () => null, querySelectorAll: () => [] };
  vi.stubGlobal('history', history);
  vi.stubGlobal('window', win);
  vi.stubGlobal('document', doc);
  return {
    get index() {
      return index;
    },
    get state() {
      return entries[index];
    },
    /** O voltar do navegador apertado pelo jogador. */
    userBack: () => history.back(),
  };
}

const settle = () => new Promise((r) => setTimeout(r, 5));

describe('camadas do voltar (back.ts)', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllGlobals());

  it('soltar uma camada e abrir outra em seguida não desce no histórico (trocar de modo sem passar pelo Início)', async () => {
    const b = fakeBrowser();
    const { pushLayer } = await import('../prototype/back');
    let release = pushLayer(() => {}, { esc: false });
    await settle();
    for (let i = 0; i < 5; i++) {
      release();
      release = pushLayer(() => {}, { esc: false });
      await settle();
      expect(b.index).toBe(2);
      expect(b.state).toEqual({ layer: 1 });
    }
  });

  it('do Registro direto para um modo: solta a página e abre a partida sem sair do site', async () => {
    const b = fakeBrowser();
    const { pushLayer } = await import('../prototype/back');
    const releasePage = pushLayer(() => {});
    await settle();
    releasePage();
    pushLayer(() => {}, { esc: false });
    await settle();
    expect(b.index).toBe(2);
    expect(b.state).toEqual({ layer: 1 });
  });

  it('o voltar do jogador depois das trocas fecha a camada de cima e fica no site', async () => {
    const b = fakeBrowser();
    const { pushLayer } = await import('../prototype/back');
    let closed = 0;
    let release = pushLayer(() => void closed++, { esc: false });
    await settle();
    release();
    release = pushLayer(() => void closed++, { esc: false });
    await settle();
    b.userBack();
    await settle();
    expect(closed).toBe(1);
    expect(b.index).toBe(1);
  });

  it('camada solta antes de chegar ao histórico não deixa entrada nem tira outra', async () => {
    const b = fakeBrowser();
    const { pushLayer } = await import('../prototype/back');
    const first = pushLayer(() => {});
    await settle();
    first();
    const second = pushLayer(() => {});
    second();
    await settle();
    expect(b.index).toBe(1);
    expect(b.state).toBeNull();
  });
});
