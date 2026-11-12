import { describe, expect, it } from 'vitest';
import { avatarChoices, currentAvatar, DEFAULT_AVATAR } from '../src/core/avatar';
import { emptyProfile, loadProfile } from '../src/state/profile';

describe('avatar do perfil (v0.63.0)', () => {
  it('sem nada liberado, só o ninja comum', () => {
    expect(avatarChoices({ playedLineages: [], achievements: [] })).toEqual([DEFAULT_AVATAR]);
  });

  it('origens jogadas no Roleta e vitórias registradas liberam a origem, sem repetir', () => {
    const out = avatarChoices({ playedLineages: ['uchiha', 'common', 'uchiha'], achievements: ['win_senju', 'win_uchiha', 'genin'] });
    expect(out).toEqual(['ninja:common', 'ninja:uchiha', 'ninja:senju']);
  });

  it('conquistas da Jornada liberam personagens', () => {
    const out = avatarChoices({ playedLineages: [], achievements: ['j_bell', 'j_sasukeEgg', 'j_unlockHyuuga'] });
    expect(out).toEqual(['ninja:common', 'ninja:uzumaki', 'ninja:hyuuga', 'ninja:sasuke']);
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
