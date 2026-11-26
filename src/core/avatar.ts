// Avatar do perfil (docs/base/perfil.md#avatar): o jogador escolhe entre os personagens que já liberou ou viu.
// O avatar é guardado como a mesma chave de retrato dos dados (`ninja:<chave>`); a imagem vem de img/ninja ou
// img/viloes (a mesma chave serve às duas pastas), com o desenho SVG de reserva.

/** Avatar padrão: o ninja comum, que todo mundo já tem. */
export const DEFAULT_AVATAR = 'ninja:common';

/** Origens e personagens que conquistas da Jornada liberam como avatar (fora do elenco dos arcos). */
const JORNADA_AVATARS: Record<string, string> = {
  j_unlockUchiha: 'ninja:uchiha',
  j_unlockHyuuga: 'ninja:hyuuga',
  j_sasukeEgg: 'ninja:sasuke',
};

/**
 * Elenco de cada arco da História: a conquista do arco libera os personagens que aparecem nele, só na forma base
 * (sem marca da maldição, Sharingan ou transformação). As chaves são as dos retratos.
 */
export const ARC_CAST: Readonly<Record<string, { allies: readonly string[]; villains: readonly string[] }>> = {
  j_bell: { allies: ['naruto', 'sasuke', 'sakura', 'kakashi', 'iruka'], villains: ['mizuki'] },
  j_waves: { allies: [], villains: ['demonBrothers', 'zabuza', 'haku'] },
  j_exam: { allies: ['shikamaru', 'choji', 'kiba', 'lee', 'neji'], villains: ['dosu', 'zaku', 'kin', 'kabuto', 'gaara', 'orochimaru'] },
  j_canonWin: { allies: ['jiraiya', 'tsunade'], villains: ['jirobo', 'kidomaru', 'tayuya', 'sakon', 'kimimaro'] },
};

const WIN_PREFIX = 'win_';
const key = (portrait: string) => `ninja:${portrait}`;

export interface AvatarSource {
  /** Linhagens das runs do Roleta no histórico (jogou pelo menos uma vez). */
  playedLineages: readonly string[];
  /** Conquistas liberadas no perfil. */
  achievements: readonly string[];
  /** Retratos dos vilões já enfrentados no Arcade (Livro Bingo). */
  seenVillains?: readonly string[];
}

/**
 * Avatares disponíveis, em ordem estável: o padrão, as origens jogadas no Roleta (ou com a vitória registrada, que
 * fica mesmo depois que a run sai do histórico), os personagens que as conquistas da Jornada liberam (o elenco do
 * arco) e os vilões já enfrentados no Arcade.
 */
export function avatarChoices(src: AvatarSource): string[] {
  const out = [DEFAULT_AVATAR];
  const add = (k: string) => {
    if (!out.includes(k)) out.push(k);
  };
  for (const lineage of src.playedLineages) add(key(lineage));
  for (const id of src.achievements) if (id.startsWith(WIN_PREFIX)) add(key(id.slice(WIN_PREFIX.length)));
  for (const [id, k] of Object.entries(JORNADA_AVATARS)) if (src.achievements.includes(id)) add(k);
  for (const [id, cast] of Object.entries(ARC_CAST)) {
    if (src.achievements.includes(id)) [...cast.allies, ...cast.villains].forEach((p) => add(key(p)));
  }
  for (const p of src.seenVillains ?? []) add(key(p));
  return out;
}

/** Avatar que vale: o escolhido, se ainda estiver liberado; senão, o padrão. */
export function currentAvatar(chosen: string | undefined, choices: readonly string[]): string {
  return chosen && choices.includes(chosen) ? chosen : DEFAULT_AVATAR;
}

export type AvatarGroup = 'origins' | 'allies' | 'villains';
/** Como um avatar se libera: jogar a origem no Arcade, uma conquista, ou enfrentar o vilão no Arcade. */
export type AvatarUnlock = { kind: 'default' } | { kind: 'lineage' } | { kind: 'achievement'; id: string } | { kind: 'villain' };
export interface AvatarEntry {
  key: string;
  group: AvatarGroup;
  unlock: AvatarUnlock[];
}

/**
 * Todos os avatares do jogo, liberados ou não, em grupos (para a escolha mostrar os bloqueados com o caminho):
 * as origens do Arcade, os aliados dos arcos e os vilões (dos arcos e do Arcade). Cada chave aparece uma vez,
 * no primeiro grupo em que entra, com todas as formas de liberar.
 */
export function avatarCatalog(src: { lineages: readonly string[]; arcadeVillains: readonly string[] }): AvatarEntry[] {
  const out: AvatarEntry[] = [];
  const add = (k: string, group: AvatarGroup, unlock: AvatarUnlock) => {
    const found = out.find((e) => e.key === k);
    if (!found) out.push({ key: k, group, unlock: [unlock] });
    else if (!found.unlock.some((u) => JSON.stringify(u) === JSON.stringify(unlock))) found.unlock.push(unlock);
  };
  add(DEFAULT_AVATAR, 'origins', { kind: 'default' });
  for (const lineage of src.lineages) if (key(lineage) !== DEFAULT_AVATAR) add(key(lineage), 'origins', { kind: 'lineage' });
  for (const [id, k] of Object.entries(JORNADA_AVATARS)) {
    add(k, src.lineages.some((l) => key(l) === k) ? 'origins' : 'allies', { kind: 'achievement', id });
  }
  for (const [id, cast] of Object.entries(ARC_CAST)) cast.allies.forEach((p) => add(key(p), 'allies', { kind: 'achievement', id }));
  for (const [id, cast] of Object.entries(ARC_CAST)) cast.villains.forEach((p) => add(key(p), 'villains', { kind: 'achievement', id }));
  for (const p of src.arcadeVillains) add(key(p), 'villains', { kind: 'villain' });
  return out;
}
