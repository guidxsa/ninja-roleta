// UI Lab (docs/ui-lab/ARCHITECTURE.md): cenários batem com o inventário, fixtures são determinísticas e o lab fica isolado
// do jogo (saves, código e build publicado).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadJornada } from '../src/state/jornadaSave';
import { loadProfile, PROFILE_STORAGE_KEY } from '../src/state/profile';
import { loadRuns } from '../src/state/runHistory';
import { labContext, memoryStorage } from '../prototype/lab/context';
import { pathRun, saveRun, storyRun } from '../prototype/lab/fixtures/jornada';
import { profiles, seedRunHistory } from '../prototype/lab/fixtures/profiles';
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
  const outside = [...files('prototype').filter((f) => !f.startsWith('prototype/lab/')), ...files('src'), ...files('scripts')];

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
