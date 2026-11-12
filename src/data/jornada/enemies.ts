import type { EnemyDef } from '../../core/jornada/types';

// Inimigos da História (docs/jornada/inimigos.md). A dificuldade multiplica HP, ataques, resistências
// e dano base (`balance.difficulty`). Valores provisórios.

const e = (
  id: string,
  hp: number,
  chakra: number,
  speed: number,
  [tai, nin, gen]: [number, number, number],
  [phys, ment]: [number, number],
  element: EnemyDef['element'],
  techniques: string[],
  ai: EnemyDef['ai'],
  portrait: string,
  passive?: EnemyDef['passive'],
): EnemyDef => ({
  id,
  hp,
  chakra,
  speed,
  offense: { taijutsu: tai, ninjutsu: nin, genjutsu: gen },
  resistance: { physical: phys, mental: ment },
  element,
  techniques,
  ai,
  portrait,
  ...(passive ? { passive } : {}),
});

export const enemies: EnemyDef[] = [
  // Estágio 1 · Academia e País das Ondas
  e('mizuki', 65, 10, 9, [7, 5, 3], [6, 6], 'wind', ['jeKunai', 'jeGiantShuriken'], 'brute', 'villain:mizuki'),
  e('kakashi', 170, 40, 15, [11, 11, 9], [9, 9], 'lightning', ['jeKakashiKick', 'jeThousandYears', 'jeHeadHunter'], 'tactician', 'ninja:kakashi'),
  e('gatoThug', 38, 0, 7, [6, 0, 0], [3, 2], null, ['jeClub', 'jeKatana'], 'brute', 'ninja:thug'),
  e('bandit', 42, 0, 9, [7, 0, 0], [3, 3], null, ['jeAmbush', 'jeClub'], 'brute', 'ninja:thug'),
  e('missingNin', 70, 18, 11, [9, 9, 4], [6, 5], null, ['jeKunai', 'jeMissingStrike'], 'striker', 'ninja:mist'),
  e('mistRogue', 55, 14, 10, [6, 8, 2], [5, 4], 'water', ['jeKunai', 'jeWaterBullet'], 'striker', 'ninja:mist'),
  e('gozu', 62, 8, 11, [8, 3, 0], [5, 4], 'water', ['jeChainClaw', 'jeChainSweep'], 'brute', 'ninja:mist'),
  e('meizu', 62, 8, 11, [8, 3, 0], [5, 4], 'water', ['jeChainClaw', 'jeChainSweep'], 'brute', 'ninja:mist'),
  e('zabuza', 160, 30, 12, [12, 11, 3], [9, 6], 'water', ['jeCleaver', 'jeWaterPrison', 'jeWaterDragon'], 'brute', 'villain:zabuza'),
  // Haku: natureza Gelo (Kekkei Genkai, v0.59.0).
  { ...e('haku', 150, 34, 16, [9, 11, 6], [7, 8], 'water', ['jeSenbon', 'jeIceMirrors', 'jePressurePoint'], 'tactician', 'villain:haku', {
    kind: 'enrage',
    atPct: 0.4,
    damageMult: 1.25,
  }), kekkeiGenkai: 'ice' },

  // Estágio 2 · Exame chunin
  e('dosu', 80, 20, 10, [8, 10, 4], [6, 6], null, ['jeKunai', 'jeSoundWave'], 'striker', 'villain:examSound'),
  e('zaku', 75, 20, 11, [6, 11, 3], [5, 5], 'wind', ['jeKunai', 'jeAirBlast'], 'striker', 'villain:examSound'),
  e('kin', 70, 20, 12, [6, 5, 11], [5, 7], null, ['jeKunai', 'jeBellGenjutsu'], 'tactician', 'villain:examSound'),
  e('grassNinja', 65, 16, 11, [9, 8, 4], [6, 5], 'earth', ['jeKunai', 'jeWaterBullet'], 'striker', 'ninja:grass'),
  e('rainNinja', 60, 18, 11, [8, 7, 8], [6, 6], 'water', ['jeUmbrellaNeedles', 'jeRainClone'], 'striker', 'ninja:rain'),
  e('kabutoSpy', 130, 30, 13, [10, 12, 6], [8, 8], null, ['jeKunai', 'jeChakraScalpel', 'jeMedicalHeal', 'jeReanimate'], 'healer', 'villain:kabuto'),
  e('kiba', 100, 18, 13, [11, 4, 2], [7, 5], null, ['jeFangOverFang', 'jeStinkBomb', 'jeKunai'], 'brute', 'ninja:inuzuka'),
  e('akamaru', 45, 0, 15, [9, 0, 0], [4, 3], null, ['jeDogBite'], 'brute', 'ninja:akamaru'),
  e('neji', 150, 30, 14, [14, 6, 4], [9, 9], null, ['jeGentleFist', 'jeRotation', 'jeSixtyFourPalms'], 'tactician', 'ninja:hyuuga'),
  // Gaara: natureza Areia (Kekkei Genkai, v0.59.0).
  { ...e('gaara', 230, 45, 10, [8, 15, 4], [12, 8], 'earth', ['jeSandCoffin', 'jeSandShield', 'jeSandTsunami', 'jeShukakuClaw'], 'brute', 'villain:gaara', {
    kind: 'startShieldPct',
    pct: 0.15,
  }), kekkeiGenkai: 'sand' },
  e('soundNinja', 75, 16, 12, [10, 8, 6], [6, 6], null, ['jeSoundBlade', 'jeSoundWave'], 'striker', 'villain:examSound'),
  // Shukaku: o Gaara transformado (roteiro: entra no lugar dele a 40% do HP).
  { ...e('shukaku', 300, 60, 8, [12, 16, 4], [13, 9], 'earth', ['jeShukakuClaw', 'jeSandTsunami', 'jeSandCoffin'], 'brute', 'villain:shukaku'), kekkeiGenkai: 'sand' },

  // Estágio 3 · Busca e resgate
  e('orochimaru', 240, 50, 13, [13, 15, 12], [10, 10], null, ['jeSnakeHands', 'jeKusanagi', 'jeManda'], 'brute', 'villain:orochimaru', {
    kind: 'enrage',
    atPct: 0.5,
    damageMult: 1.2,
  }),
  e('kabuto', 170, 36, 14, [12, 13, 6], [9, 9], null, ['jeKunai', 'jeChakraScalpel', 'jeMedicalHeal', 'jeReanimate'], 'healer', 'villain:kabuto'),
  e('sasukeHospital', 170, 34, 15, [13, 13, 7], [8, 8], 'fire', ['jeSasukeChidori', 'jeSasukeFireball', 'jeSasukeLion'], 'striker', 'ninja:uchiha'),
  e('snake', 90, 0, 9, [11, 0, 0], [7, 4], null, ['jeSnakeBite'], 'brute', 'villain:orochimaru'),
  e('jirobo', 180, 30, 9, [14, 8, 2], [11, 6], 'earth', ['jeHeavyPunch', 'jeEarthDome'], 'brute', 'villain:jirobo'),
  e('kidomaru', 160, 30, 13, [12, 10, 4], [8, 7], null, ['jeGoldenArrow', 'jeSpiderWeb', 'jeKunai'], 'tactician', 'villain:kidomaru'),
  e('tayuya', 150, 34, 12, [8, 8, 14], [7, 9], null, ['jeDemonFlute', 'jeKunai'], 'tactician', 'villain:tayuya'),
  e('sakon', 150, 26, 13, [13, 8, 4], [9, 6], null, ['jeTwinStrike', 'jeSoundBlade'], 'brute', 'villain:sakon'),
  e('kimimaro', 290, 40, 14, [17, 6, 4], [12, 8], null, ['jeBoneDrill', 'jeBoneBullets', 'jeBoneDance'], 'brute', 'ninja:kimimaro', {
    kind: 'enrage',
    atPct: 0.5,
    damageMult: 1.25,
  }),
  e('sasukeFinal', 330, 50, 16, [15, 16, 8], [10, 10], 'fire', ['jeSasukeChidori', 'jeDragonFlame', 'jeSasukeLion', 'jeSasukeFireball'], 'striker', 'ninja:uchiha', {
    kind: 'enrage',
    atPct: 0.5,
    damageMult: 1.3,
  }),
];

export const enemiesById: Record<string, EnemyDef> = Object.fromEntries(enemies.map((x) => [x.id, x]));
