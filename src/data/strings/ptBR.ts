// Todos os textos visíveis do jogo. Para traduzir, criar outro arquivo com as mesmas chaves.

export const ptBR = {
  elements: {
    fire: 'Fogo',
    wind: 'Vento',
    lightning: 'Raio',
    earth: 'Terra',
    water: 'Água',
  },
  lineages: {
    uchiha: 'Uchiha',
    hyuuga: 'Hyuuga',
    taijutsuProdigy: 'Prodígio do taijutsu',
    uzumaki: 'Uzumaki',
  } as Record<string, string>,
  origin: {
    common: 'Comum',
    special: 'Linhagem especial',
    jinchuuriki: 'Jinchuuriki',
    noAffinity: 'Sem afinidade',
  },
  villains: {
    mizuki: 'Mizuki',
    zabuza: 'Zabuza',
    haku: 'Haku',
    gaara: 'Gaara',
    jirobo: 'Jirobo',
    kidomaru: 'Kidomaru',
    tayuya: 'Tayuya',
    sakon: 'Sakon',
    kabuto: 'Kabuto',
    orochimaru: 'Orochimaru',
  } as Record<string, string>,
  stages: {
    exam: 'Exame chunin',
  },
  actions: {
    taijutsu: 'Taijutsu',
    ninjutsu: 'Ninjutsu',
    genjutsu: 'Genjutsu',
    gates: 'Abrir os portões',
    rest: 'Concentrar chakra',
  },
};

export type Strings = typeof ptBR;
