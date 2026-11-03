import { describe, expect, it } from 'vitest';
import { hasIcon } from '../prototype/art';
import { EFFECT_ICONS } from '../prototype/jornada/battle';

// O icon() cai no ícone neutro sem avisar: os nomes usados no lugar dos emojis precisam existir.
describe('ícones da interface', () => {
  it('existem os ícones que substituem os emojis', () => {
    const names = [
      'check', 'close', 'lock', 'chevron', 'advantage', 'disadvantage', 'book', 'medal', 'sparkle', 'card', 'heart', 'block',
      'rock', 'paper', 'scissors', 'mind', 'blast', 'antlers', 'gourd', 'steam', 'sprout', 'tree', 'bug', 'ice',
      'barrier', 'clones', 'sleep', 'prison', 'lightning', 'fear', 'confusion', 'torment', 'stun', 'fire', 'poison', 'bleed',
      'warning', 'sharingan', 'byakugan', 'pill', 'toad', 'mist', 'sandArmor', 'dodge', 'armor', 'cloak', 'snake', 'coin',
    ];
    expect(names.filter((n) => !hasIcon(n))).toEqual([]);
  });

  it('cada efeito da Jornada tem ícone', () => {
    expect(Object.values(EFFECT_ICONS).filter((n) => !hasIcon(n))).toEqual([]);
  });
});
