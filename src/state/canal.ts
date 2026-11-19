// Canal do build (docs/processo/fluxo.md, "Preview"): a produção fica na raiz do site e o staging em /staging/, na mesma
// origem. O staging grava com prefixo, para nunca ler nem sobrescrever o save, o perfil e o histórico de quem joga.
import type { KeyValueStorage } from './runHistory';

export type Canal = 'producao' | 'staging';

export const prefixoDoCanal = (canal: Canal): string => (canal === 'staging' ? 'staging:' : '');

/** O armazenamento como o canal enxerga: na produção, o próprio (mesmas chaves de sempre); no staging, com prefixo. */
export function storageDoCanal(storage: KeyValueStorage, canal: Canal): KeyValueStorage {
  const p = prefixoDoCanal(canal);
  if (!p) return storage;
  return { getItem: (k) => storage.getItem(p + k), setItem: (k, v) => storage.setItem(p + k, v) };
}
