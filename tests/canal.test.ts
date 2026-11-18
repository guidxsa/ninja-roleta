// Canal do build (docs/processo/fluxo.md, "Preview"; src/state/canal.ts): o staging não toca o save da produção.
import { describe, expect, it } from 'vitest';
import { prefixoDoCanal, storageDoCanal } from '../src/state/canal';
import { JORNADA_SAVE_KEY } from '../src/state/jornadaSave';
import { PROFILE_STORAGE_KEY } from '../src/state/profile';

const memoria = () => {
  const m = new Map<string, string>();
  return { m, s: { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } };
};

describe('canal', () => {
  it('a produção usa o armazenamento e as chaves de sempre', () => {
    const { s } = memoria();
    expect(storageDoCanal(s, 'producao')).toBe(s);
    expect(prefixoDoCanal('producao')).toBe('');
  });

  it('o staging grava e lê com prefixo, sem enxergar o save da produção', () => {
    const { m, s } = memoria();
    m.set(JORNADA_SAVE_KEY, 'save-da-producao');
    const st = storageDoCanal(s, 'staging');
    expect(st.getItem(JORNADA_SAVE_KEY)).toBeNull();
    st.setItem(PROFILE_STORAGE_KEY, 'perfil-staging');
    expect(m.get(`staging:${PROFILE_STORAGE_KEY}`)).toBe('perfil-staging');
    expect(m.get(PROFILE_STORAGE_KEY)).toBeUndefined();
    expect(m.get(JORNADA_SAVE_KEY)).toBe('save-da-producao');
  });
});
