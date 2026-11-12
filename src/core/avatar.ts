// Avatar do perfil (docs/base/perfil.md#avatar): o jogador escolhe entre os personagens jogáveis que já liberou.
// O avatar é guardado como a mesma chave de retrato dos dados (`ninja:<chave>`); hoje vira o desenho SVG, e no
// futuro pode vir de uma imagem própria com a mesma chave.

/** Avatar padrão: o ninja comum, que todo mundo já tem. */
export const DEFAULT_AVATAR = 'ninja:common';

/** Personagens que conquistas da Jornada liberam como avatar. */
const JORNADA_AVATARS: Record<string, string> = {
  j_bell: 'ninja:uzumaki',
  j_unlockUchiha: 'ninja:uchiha',
  j_unlockHyuuga: 'ninja:hyuuga',
  j_sasukeEgg: 'ninja:sasuke',
};

const WIN_PREFIX = 'win_';

export interface AvatarSource {
  /** Linhagens das runs do Roleta no histórico (jogou pelo menos uma vez). */
  playedLineages: readonly string[];
  /** Conquistas liberadas no perfil. */
  achievements: readonly string[];
}

/**
 * Avatares disponíveis, em ordem estável: o padrão, as origens jogadas no Roleta (ou com a vitória registrada, que
 * fica mesmo depois que a run sai do histórico) e os personagens que as conquistas da Jornada liberam.
 */
export function avatarChoices(src: AvatarSource): string[] {
  const out = [DEFAULT_AVATAR];
  const add = (key: string) => {
    if (!out.includes(key)) out.push(key);
  };
  for (const lineage of src.playedLineages) add(`ninja:${lineage}`);
  for (const id of src.achievements) if (id.startsWith(WIN_PREFIX)) add(`ninja:${id.slice(WIN_PREFIX.length)}`);
  for (const [id, key] of Object.entries(JORNADA_AVATARS)) if (src.achievements.includes(id)) add(key);
  return out;
}

/** Avatar que vale: o escolhido, se ainda estiver liberado; senão, o padrão. */
export function currentAvatar(chosen: string | undefined, choices: readonly string[]): string {
  return chosen && choices.includes(chosen) ? chosen : DEFAULT_AVATAR;
}
