// UI Lab (docs/ui-lab/ARCHITECTURE.md): cenários batem com o inventário, fixtures são determinísticas e o lab fica isolado
// do jogo (saves, código e build publicado).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { loadJornada } from '../src/state/jornadaSave';
import { loadProfile, PROFILE_STORAGE_KEY } from '../src/state/profile';
import { loadRuns } from '../src/state/runHistory';
import { labContext, memoryStorage } from '../prototype/lab/context';
import { pathRun, playToEnd, playUntil, saveRun, storyRun } from '../prototype/lab/fixtures/jornada';
import { canContinueCycle, choosingNode, continueCycle, currentStop } from '../src/core/jornada/run';
import { jornadaData } from '../src/data/jornada/index';
import { profiles, seedRunHistory } from '../prototype/lab/fixtures/profiles';
import { roletaCamp } from '../prototype/lab/fixtures/roleta';
import { SCENARIOS } from '../prototype/lab/registry';
import { ses, SETTINGS_KEY } from '../prototype/roleta/session';
import { bundleJs } from '../scripts/page-build';

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.ts$/.test(f) ? [p.replaceAll('\\', '/')] : [];
  });

describe('cenários', () => {
  const inventory = readFileSync('docs/ui-lab/SCREEN_INVENTORY.md', 'utf8');
  const known = new Set([...inventory.matchAll(/`((?:gate|roleta|jornada|meta)\.[a-z.-]+)/g)].map((m) => m[1]!));

  it('ids únicos, no formato modo.sistema.tela[:variante]', () => {
    const ids = SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z]+(\.[a-z-]+)+(:[a-z0-9-]+)?$/);
  });

  it('toda tela de cenário existe no inventário', () => {
    for (const s of SCENARIOS) expect(known, s.id).toContain(s.id.split(':')[0]);
  });

  it('a seed de cada cenário de sorteio ainda dá o resultado do título (senão: npm run lab:seed -- --all)', () => {
    for (const s of SCENARIOS) if (s.expect) expect(s.expect(createRng(s.seed ?? 1)), s.id).toBe(true);
  });

  it('o preparo de cada cenário monta a sessão só no armazenamento em memória', () => {
    for (const s of SCENARIOS) {
      const ctx = labContext(s, { theme: 'dark', instant: true });
      expect(ses.storage).toBe(ctx.storage);
      expect(ctx.storage.getItem(PROFILE_STORAGE_KEY)).not.toBeNull();
      expect(JSON.parse(ctx.storage.getItem(SETTINGS_KEY)!)).toMatchObject({ sfx: false, music: false, instant: true });
    }
  });
});

describe('fixtures', () => {
  it('a run do Roleta sobe de nível pelas regras e fica na sessão', () => {
    labContext(SCENARIOS[0]!, { theme: 'dark', instant: true });
    const c = roletaCamp({ level: 6, step: 5, cycle: 1, lineage: 'uchiha', elements: [] });
    expect(c.player.level).toBe(6);
    expect(c.run.step).toBe(5);
    expect(c.run.used).toHaveLength(5);
    expect(c.run.villainId).toBeTruthy();
    expect(ses.camp).toBe(c);
  });

  it('perfis são determinísticos e sobrevivem ao save', () => {
    for (const make of Object.values(profiles)) {
      expect(make()).toEqual(make());
      const s = memoryStorage();
      s.setItem(PROFILE_STORAGE_KEY, JSON.stringify(make()));
      expect(loadProfile(s)).toEqual(make());
    }
  });

  it('o perfil completo libera mais que o médio, que libera mais que o vazio', () => {
    const n = (p: ReturnType<typeof profiles.empty>) => Object.keys(p.achievements).length + Object.keys(p.relics).length + Object.keys(p.villains).length;
    expect(n(profiles.empty())).toBe(0);
    expect(n(profiles.mid())).toBeGreaterThan(0);
    expect(n(profiles.full())).toBeGreaterThan(n(profiles.mid()));
  });

  it('a run jogada pela fixture alcança as paradas que os cenários usam', () => {
    const normal = ['team7', 'bells', 'graduation', 'demonBrothers', 'zabuza', 'treeClimbing', 'thugs', 'treasure1', 'rest1', 'haku'];
    for (const id of normal) expect(currentStop(playUntil(storyRun(7), id), jornadaData)?.id, id).toBe(id);
    for (const id of ['writtenTest', 'orochimaruForest', 'tsunade', 'valley']) expect(currentStop(playUntil(storyRun(1, 'easy'), id), jornadaData)?.id, id).toBe(id);
    // Árvores das classes: a run de cada classe chega ao 2º estágio.
    // Seed 1 desde a v0.94.0: com os inimigos novos, a run do Uchiha na seed 7 cai antes (num trio de bandidos).
    for (const cls of ['uchiha', 'hyuuga']) expect(playUntil(pathRun(1, 'normal', cls), (r) => choosingNode(r) && r.stageIndex === 1).talentPoints).toBeGreaterThan(0);
    expect(playUntil(pathRun(7), (r) => Boolean(r.bossChoice)).bossChoice).toHaveLength(3);
    expect(playToEnd(storyRun(1, 'easy')).status).toBe('victory');
    expect(playToEnd(storyRun(7)).status).toBe('defeat');
    expect(playToEnd(pathRun(7)).status).toBe('victory');
    // Vitória marcada como Hardcore (cenário jornada.end:path-victory-hardcore) libera o ciclo 2, e nele o bot cai.
    const hardcore = { ...playToEnd(pathRun(7)), difficulty: 'hardcore' as const };
    expect(canContinueCycle(hardcore, jornadaData)).toBe(true);
    expect(playToEnd(continueCycle(hardcore, jornadaData))).toMatchObject({ status: 'defeat', cycle: 1 });
  });

  it('histórico e saves da Jornada são lidos como os do jogo', () => {
    const s = memoryStorage();
    seedRunHistory(s, 6);
    expect(loadRuns(s)).toHaveLength(6);
    saveRun(s, pathRun());
    expect(loadJornada(s)?.mode).toBe('generic');
    saveRun(s, storyRun());
    expect(loadJornada(s)?.mode).toBe('canon');
    expect(pathRun()).toEqual(pathRun());
  });
});

describe('isolamento', () => {
  const lab = files('prototype/lab');
  // As ferramentas do lab (scripts/lab-*.ts) podem importar dele; o jogo e o build do jogo não.
  const outside = [...files('prototype').filter((f) => !f.startsWith('prototype/lab/')), ...files('src'), ...files('scripts').filter((f) => !/\/lab-[^/]+\.ts$/.test(f))];

  it('nada fora de prototype/lab importa do lab', () => {
    for (const f of outside) expect(readFileSync(f, 'utf8'), f).not.toMatch(/from '[^']*\/lab\/[^']*'/);
  });

  it('no lab, só o catálogo usa o localStorage, e só com a chave dele', () => {
    for (const f of lab) {
      const src = readFileSync(f, 'utf8');
      if (f.endsWith('/catalog.ts')) expect(src).toMatch(/PREFS_KEY = 'uilab_prefs_v1'/);
      else expect(src, f).not.toMatch(/localStorage/);
    }
  });

  it('o build do jogo não leva o lab; o do lab leva a marca', async () => {
    const define = { __IMAGES__: '[]', __IMAGE_META__: '{}', __MUSIC__: '""', __VERSION__: '"teste"' };
    const game = await bundleJs('prototype/main.ts', define);
    expect(game).not.toMatch(/UI Lab|uilab/);
    const labJs = await bundleJs('prototype/lab/main.ts', { ...define, __UILAB__: 'true' });
    expect(labJs).toMatch(/uilab/);
  });

  it('o Pages publica só arquivos de dist/, nunca dist-lab/', () => {
    const pages = readFileSync('.github/workflows/pages.yml', 'utf8');
    expect(pages).not.toMatch(/dist-lab|lab\.html/);
    expect(readFileSync('.gitignore', 'utf8')).toMatch(/^dist-lab\/$/m);
  });
});
