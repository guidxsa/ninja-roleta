import { describe, expect, it } from 'vitest';
import { ARC_CAST, avatarCatalog, avatarChoices, currentAvatar, DEFAULT_AVATAR } from '../src/core/avatar';
import { emptyProfile, loadProfile } from '../src/state/profile';

describe('avatar do perfil (v0.63.0)', () => {
  it('sem nada liberado, só o ninja comum', () => {
    expect(avatarChoices({ playedLineages: [], achievements: [] })).toEqual([DEFAULT_AVATAR]);
  });

  it('origens jogadas no Roleta e vitórias registradas liberam a origem, sem repetir', () => {
    const out = avatarChoices({ playedLineages: ['uchiha', 'common', 'uchiha'], achievements: ['win_senju', 'win_uchiha', 'genin'] });
    expect(out).toEqual(['ninja:common', 'ninja:uchiha', 'ninja:senju']);
  });

  it('conquistas da Jornada liberam origens e o elenco do arco', () => {
    const out = avatarChoices({ playedLineages: [], achievements: ['j_bell', 'j_unlockHyuuga'] });
    expect(out).toEqual(['ninja:common', 'ninja:hyuuga', 'ninja:naruto', 'ninja:sasuke', 'ninja:sakura', 'ninja:kakashi', 'ninja:iruka', 'ninja:mizuki']);
  });

  it('vilões enfrentados no Arcade viram avatar, sem repetir o que o arco já deu', () => {
    const out = avatarChoices({ playedLineages: [], achievements: ['j_waves'], seenVillains: ['haku', 'thug', 'thug'] });
    expect(out).toEqual(['ninja:common', 'ninja:demonBrothers', 'ninja:zabuza', 'ninja:haku', 'ninja:thug']);
  });

  it('o catálogo traz todos, em grupos, cada um uma vez e com todas as formas de liberar', () => {
    const cat = avatarCatalog({ lineages: ['common', 'uchiha', 'hyuuga'], arcadeVillains: ['thug', 'haku', 'neji'] });
    const keys = cat.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(cat[0]).toEqual({ key: DEFAULT_AVATAR, group: 'origins', unlock: [{ kind: 'default' }] });
    expect(cat.find((e) => e.key === 'ninja:uchiha')).toEqual({
      key: 'ninja:uchiha', group: 'origins', unlock: [{ kind: 'lineage' }, { kind: 'achievement', id: 'j_unlockUchiha' }],
    });
    // Neji é aliado no Exame e vilão no Arcade: fica nos aliados, com os dois caminhos.
    expect(cat.find((e) => e.key === 'ninja:neji')).toEqual({
      key: 'ninja:neji', group: 'allies', unlock: [{ kind: 'achievement', id: 'j_exam' }, { kind: 'villain' }],
    });
    expect(cat.find((e) => e.key === 'ninja:thug')?.group).toBe('villains');
  });

  it('todo avatar liberado está no catálogo, e o catálogo cheio é o que tudo liberado dá', () => {
    const lineages = ['common', 'uchiha', 'hyuuga', 'nara'];
    const arcadeVillains = ['thug', 'mist', 'dosu'];
    const cat = avatarCatalog({ lineages, arcadeVillains }).map((e) => e.key);
    const all = avatarChoices({ playedLineages: lineages, achievements: Object.keys(ARC_CAST).concat('j_unlockUchiha', 'j_unlockHyuuga', 'j_sasukeEgg'), seenVillains: arcadeVillains });
    expect([...all].sort()).toEqual([...cat].sort());
  });

  it('o escolhido vale só se ainda estiver liberado', () => {
    const choices = ['ninja:common', 'ninja:uchiha'];
    expect(currentAvatar('ninja:uchiha', choices)).toBe('ninja:uchiha');
    expect(currentAvatar('ninja:senju', choices)).toBe(DEFAULT_AVATAR);
    expect(currentAvatar(undefined, choices)).toBe(DEFAULT_AVATAR);
  });

  it('o perfil guarda o avatar e ignora valor estranho', () => {
    const store: Record<string, string> = {};
    const storage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => void (store[k] = v) };
    store.profile_v1 = JSON.stringify({ ...emptyProfile(), avatar: 'ninja:uchiha' });
    expect(loadProfile(storage).avatar).toBe('ninja:uchiha');
    store.profile_v1 = JSON.stringify({ ...emptyProfile(), avatar: 42 });
    expect(loadProfile(storage).avatar).toBeUndefined();
  });
});
