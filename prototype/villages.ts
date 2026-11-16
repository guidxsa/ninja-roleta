// Símbolos das vilas (24×24, traço em `currentColor`): a interface (art.ts) e as bandanas dos retratos usam os mesmos.

/**
 * Símbolo de Konoha (24×24), usado na vila e no clã comum: a espiral larga que sai para a ponta da folha, no alto à
 * direita, e o triângulo do talo embaixo, à esquerda.
 */
export const VILLAGE_LEAF =
  '<path d="M12.2 13A1.2 1.2 0 0 0 9.8 13A2.4 2.4 0 0 0 14.6 13A3.6 3.6 0 0 0 7.4 13A4.8 4.8 0 0 0 17 13C17 9.2 18.4 5.8 20.6 3L15.6 6.2"/><path d="M7.9 15.9 3 20.8l6.6-2.6z" fill="currentColor" stroke="none"/>';

/**
 * Símbolos das vilas (24×24, traço em `currentColor`), no formato da obra (liberado pelo usuário, v0.57.9):
 * Folha (espiral com a ponta da folha e o triângulo do talo), Névoa (quatro traços ondulados inclinados),
 * Areia (a ampulheta) e Som (a nota musical).
 */
export const VILLAGES = {
  leaf: VILLAGE_LEAF,
  mist: '<path d="M4.6 19.5c1.4-2.4-.6-4.6.8-7s1.5-4.3 1.7-6.6M9 19.5c1.4-2.4-.6-4.6.8-7s1.5-4.3 1.7-6.6M13.4 19.5c1.4-2.4-.6-4.6.8-7s1.5-4.3 1.7-6.6M17.8 19.5c1.4-2.4-.6-4.6.8-7s1.5-4.3 1.7-6.6"/>',
  sand: '<path d="M5 4.5h14M5 19.5h14M7.2 4.5c0 4.2 4.3 5 4.3 7.5s-4.3 3.3-4.3 7.5M16.8 4.5c0 4.2-4.3 5-4.3 7.5s4.3 3.3 4.3 7.5"/>',
  sound: '<path d="M14 4v12.5"/><path d="M14 4c1.6 2.4 5.2 2.6 5.2 6"/><ellipse cx="10.4" cy="17" rx="3.6" ry="2.8" fill="currentColor"/>',
} as const;
