// Retratos que mudam com a situação (docs/visual.md#personagens). Só visual: nenhuma regra lê estes dados.

/**
 * Retrato de fúria: com metade do HP ou menos, o lutador mostra outra face (a máscara cai, o Sharingan aparece, a marca
 * da maldição toma o corpo). Chave: id do personagem, do inimigo da Jornada ou do vilão do Roleta.
 */
export const ragePortraits: Record<string, string> = {
  kakashi: 'ninja:kakashiSharingan',
  kakashiAlly: 'ninja:kakashiSharingan',
  neji: 'ninja:nejiByakugan',
  nejiAlly: 'ninja:nejiByakugan',
  zabuza: 'villain:zabuzaUnmasked',
  haku: 'villain:hakuUnmasked',
  gaara: 'villain:gaaraInsane',
  jirobo: 'villain:jiroboCurse',
  kidomaru: 'villain:kidomaruCurse',
  tayuya: 'villain:tayuyaCurse',
  sakon: 'villain:sakonCurse',
};

/** Fração do HP a partir da qual vale o retrato de fúria. */
export const RAGE_AT = 0.5;

/** O retrato de fúria de `id` com este HP, se houver. */
export const ragePortrait = (id: string, hp: number, maxHp: number): string | undefined =>
  hp > 0 && hp <= maxHp * RAGE_AT ? ragePortraits[id] : undefined;

/** Quem aparece só em cena (não luta) e tem desenho: o Haku sem máscara, colhendo ervas na floresta. */
export const scenePortraits: Record<string, string> = {
  hakuUnmasked: 'villain:hakuCivil',
};
