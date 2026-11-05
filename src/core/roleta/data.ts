import type { GameData } from '../gameData';
import type { RoletaBalance } from '../../data/roleta/balance';
import type { RKit } from '../../data/roleta/kits';
import type { RTechniqueDef } from '../../data/roleta/techniques';

/** Pacote de dados do Roleta enxuto que o core recebe por parâmetro (montado em src/data/roleta/index.ts). */
export interface RoletaData {
  /** Base do jogo com os eventos, itens e recompensas do Roleta enxuto (sem pool de técnicas nem upgrades). */
  base: GameData;
  r: RoletaBalance;
  techniques: Record<string, RTechniqueDef>;
  /** Linhagem (ou `common`) → kit enxuto. */
  kits: Record<string, RKit>;
}
