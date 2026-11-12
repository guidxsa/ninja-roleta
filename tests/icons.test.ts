import { describe, expect, it } from 'vitest';
import { hasIcon } from '../prototype/art';
import { EFFECT_ICONS } from '../prototype/jornada/battle';
import { ACHIEVEMENT_ICONS, hasAchievementIcon } from '../prototype/achievementIcons';
import { achievements } from '../src/data/achievements';
import { jornadaAchievements } from '../src/data/jornada/achievements';

// O icon() cai no ícone neutro sem avisar: os nomes usados no lugar dos emojis precisam existir.
describe('ícones da interface', () => {
  it('existem os ícones que substituem os emojis', () => {
    const names = [
      'check', 'close', 'lock', 'chevron', 'advantage', 'disadvantage', 'book', 'medal', 'sparkle', 'card', 'heart', 'block',
      'rock', 'paper', 'scissors', 'mind', 'blast', 'antlers', 'gourd', 'steam', 'sprout', 'tree', 'bug', 'ice',
      'barrier', 'clones', 'sleep', 'prison', 'lightning', 'fear', 'confusion', 'torment', 'stun', 'fire', 'poison', 'bleed',
      'warning', 'sharingan', 'byakugan', 'pill', 'toad', 'mist', 'sandArmor', 'dodge', 'armor', 'cloak', 'snake', 'coin', 'home', 'cycle',
    ];
    expect(names.filter((n) => !hasIcon(n))).toEqual([]);
  });

  it('cada efeito da Jornada tem ícone', () => {
    expect(Object.values(EFFECT_ICONS).filter((n) => !hasIcon(n))).toEqual([]);
  });

  it('cada conquista tem ícone próprio (v0.63.0), e os nomes existem', () => {
    const ids = [...achievements, ...jornadaAchievements].map((a) => a.id);
    expect(ids.filter((id) => !hasAchievementIcon(id))).toEqual([]);
    expect(Object.values(ACHIEVEMENT_ICONS).filter((n) => !hasIcon(n))).toEqual([]);
    // Sem sobra: todo id do mapa é uma conquista que existe.
    expect(Object.keys(ACHIEVEMENT_ICONS).filter((id) => !ids.includes(id))).toEqual([]);
  });
});
