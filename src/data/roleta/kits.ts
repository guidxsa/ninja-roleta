// Kits do Roleta (docs/roleta/combate.md#kits; docs/base/origens.md). Desde a v0.92.0 (Roleta rápido e explosivo,
// decisoes.md item 40), cada origem do sorteio tem UMA passiva, que faz sozinha o que as ativas faziam (`auto`), e 2 ou 3
// técnicas-chave (`techniques`); não há botão de ativa. Números em `roletaBalance.auto` e no `balance` da base
// (`passives`, `awakening`, `dojutsu`, `gates`, `expansion`, `effort`, `beast`, `seal`, `vitalForce`, `jinchuuriki`).
// Textos em strings/roleta.ts. Yamanaka, Aburame e Nara seguem guardados (fora do sorteio), com os kits enxutos de antes.

/** Passiva da linhagem no Roleta. */
export type RPassive =
  | 'determination' // Comum: +25% de XP; +1 no maior ataque por nível; Esforço na 1ª rodada; Nunca desistir (nível 4)
  | 'genius' // Nara (guardado): vê a próxima ação do vilão
  | 'heavyBody' // Akimichi: taijutsu pela razão de peso; Expansão e Pílula sozinhas
  | 'mindReading' // Yamanaka (guardado): o vilão tem −acerto
  | 'hive' // Aburame (guardado): o veneno do Enxame dói mais
  | 'duo' // Inuzuka: o cão bate junto; Fera nas primeiras rodadas
  | 'youth' // Prodígio: +crítico; Portões que abrem sozinhos pelo HP perdido
  | 'trainedEyes' // Uchiha: Sharingan sempre aceso, imune a Medo, Cópia sozinha
  | 'preciseFist' // Hyuuga: Byakugan sempre aceso; taijutsu ignora parte da resistência; Rotação sozinha
  | 'vitality' // Uzumaki: recupera chakra e HP por rodada; Selamento na 1ª rodada
  | 'vitalForce'; // Senju: abaixo de 30% do HP, regenera por algumas rodadas; curas rendem mais

/** Ativa da linhagem (só as linhagens guardadas ainda têm botão): grátis, uma por turno. */
export type RActive =
  | 'effort'
  | 'expansion'
  | 'pills'
  | 'beast'
  | 'gates'
  | 'drunkenFist'
  | 'sharingan'
  | 'copy'
  | 'byakugan'
  | 'seal'
  // Guardadas com as linhagens fora do sorteio.
  | 'shadow'
  | 'mindTransfer'
  | 'plague';

/** O que a passiva faz sozinha na luta (v0.92.0). */
export type RAuto =
  | 'effort' // Esforço na 1ª rodada (nível 7: volta uma vez abaixo de 50% do HP)
  | 'expansion' // Expansão na 1ª vez abaixo de 50% do HP, até o fim da luta
  | 'clanPill' // nível 7: abaixo de 25% do HP, taijutsu maior até o fim da luta
  | 'beast' // Fera de quatro patas nas primeiras rodadas
  | 'gates' // Portões que abrem sozinhos pelo HP perdido
  | 'sharingan' // Sharingan aceso a luta inteira, sem manutenção
  | 'copy' // copia a técnica de dano que o acertou
  | 'byakugan' // Byakugan aceso a luta inteira, sem manutenção
  | 'rotation' // nível 4: Rotação no golpe que tiraria muito HP
  | 'seal'; // Selamento na 1ª rodada (a técnica mais forte do vilão)

export interface RKitActive {
  kind: RActive;
  /** Nível em que a ativa aparece (despertar). */
  minLevel?: number;
}

export interface RKit {
  passive: RPassive;
  /** Botões de ativa: só nas linhagens guardadas. */
  actives: RKitActive[];
  /** O que a passiva faz sozinha. */
  auto: RAuto[];
  /** Técnicas da linhagem, na ordem do kit (as do despertar entram pelo `minLevel` da técnica). */
  techniques: string[];
  /** Ganha a técnica de cada elemento (e a da kekkei genkai), além das da linhagem. */
  elementTechniques: boolean;
}

/** Linhagem → kit (null = Comum). */
export const roletaKits: Record<string, RKit> = {
  common: { passive: 'determination', actives: [], auto: ['effort'], techniques: ['rKunai'], elementTechniques: true },
  akimichi: { passive: 'heavyBody', actives: [], auto: ['expansion', 'clanPill'], techniques: ['rExpandedHand', 'rHumanBoulder'], elementTechniques: false },
  inuzuka: { passive: 'duo', actives: [], auto: ['beast'], techniques: ['rFangs', 'rDogClaw'], elementTechniques: false },
  taijutsuProdigy: { passive: 'youth', actives: [], auto: ['gates'], techniques: ['rLeafHurricane', 'rPrimaryLotus', 'rHiddenLotus'], elementTechniques: false },
  uchiha: { passive: 'trainedEyes', actives: [], auto: ['sharingan', 'copy'], techniques: ['rGreatFireball', 'rPainIllusion', 'rTsukuyomi'], elementTechniques: false },
  hyuuga: { passive: 'preciseFist', actives: [], auto: ['byakugan', 'rotation'], techniques: ['rGentleFist', 'rVitalSeal', 'rSixtyFour'], elementTechniques: false },
  uzumaki: { passive: 'vitality', actives: [], auto: ['seal'], techniques: ['rExplosiveSeal', 'rChakraChains'], elementTechniques: true },
  senju: { passive: 'vitalForce', actives: [], auto: [], techniques: ['rFounderFist'], elementTechniques: true },
  // Guardados (fora do sorteio desde a v0.52.0): os kits enxutos de antes, para o dado não se perder.
  nara: { passive: 'genius', actives: [{ kind: 'shadow' }], auto: [], techniques: ['rShadowSlash'], elementTechniques: true },
  yamanaka: { passive: 'mindReading', actives: [{ kind: 'mindTransfer' }], auto: [], techniques: ['rPetals'], elementTechniques: true },
  aburame: { passive: 'hive', actives: [{ kind: 'plague' }], auto: [], techniques: ['rSwarm'], elementTechniques: true },
};
