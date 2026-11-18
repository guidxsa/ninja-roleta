// Arquivos dos retratos (docs/visual.md, "Ficha de estilo dos retratos"; public/img/retratos.json). O outro lado, toda
// chave dos dados com desenho de reserva, fica em tests/portraits.test.ts.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { imageSize } from '../scripts/image-size';
import { PORTRAIT_KEYS } from '../prototype/portraits/index';

const IMG = 'public/img';
const PASTAS = ['ninja', 'viloes', 'jornada'];
const MAX_KB = 30;
/** Data do manifesto: entradas depois dela precisam dizer como a imagem foi feita (para refazer no mesmo estilo). */
const MANIFESTO_DESDE = '2026-11-18';

interface Retrato {
  arquivo: string;
  chave: string;
  uso: 'dados' | 'variante';
  origem: 'ia' | 'oficial' | 'desenho';
  ferramenta: string | null;
  data: string;
  referencias: string | string[] | null;
  prompt: string | null;
  ajustes: string | string[] | null;
  parametros: unknown;
  aprovado: boolean;
}

const manifesto = JSON.parse(readFileSync(join(IMG, 'retratos.json'), 'utf8')) as { retratos: Retrato[] };
const arquivos = PASTAS.flatMap((d) => readdirSync(join(IMG, d)).filter((f) => /\.(webp|png|jpe?g|svg)$/i.test(f)).map((f) => `${d}/${f}`));

const listTs = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listTs(join(dir, e.name)) : e.name.endsWith('.ts') ? [join(dir, e.name)] : [],
  );
const fonte = [...listTs('src'), ...listTs('prototype')].map((f) => readFileSync(f, 'utf8')).join('\n');
const chaves = new Set<string>(PORTRAIT_KEYS as readonly string[]);
const usada = (k: string) => chaves.has(k) || new RegExp(`['"\`](?:ninja:|villain:)?${k}['"\`]`).test(fonte);

describe('retratos: arquivos e manifesto', () => {
  it('cada imagem tem uma entrada no manifesto e cada entrada tem a imagem', () => {
    const noManifesto = manifesto.retratos.map((r) => r.arquivo);
    expect(new Set(noManifesto).size, 'entrada repetida').toBe(noManifesto.length);
    expect(arquivos.filter((f) => !noManifesto.includes(f)), 'imagem sem entrada em retratos.json').toEqual([]);
    expect(noManifesto.filter((f) => !existsSync(join(IMG, f))), 'entrada sem imagem').toEqual([]);
  });

  it('a chave é o nome do arquivo e os campos têm valores válidos', () => {
    for (const r of manifesto.retratos) {
      expect(r.chave, r.arquivo).toBe(r.arquivo.split('/')[1]!.replace(/\.[^.]+$/, ''));
      expect(['dados', 'variante'], r.arquivo).toContain(r.uso);
      expect(['ia', 'oficial', 'desenho'], r.arquivo).toContain(r.origem);
      expect(r.data, r.arquivo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof r.aprovado, r.arquivo).toBe('boolean');
    }
  });

  it('retrato novo diz como foi feito (imagens-modelo e ferramenta) e passou pela revisão humana', () => {
    for (const r of manifesto.retratos.filter((x) => x.data > MANIFESTO_DESDE && x.origem === 'ia')) {
      expect(r.referencias, `${r.arquivo}: referencias (as imagens-modelo)`).toBeTruthy();
      expect(r.ferramenta, `${r.arquivo}: ferramenta`).toBeTruthy();
      expect(r.aprovado, `${r.arquivo}: aprovado na revisão humana`).toBe(true);
    }
  });

  it('toda entrada tem os campos do manifesto', () => {
    const campos = ['arquivo', 'chave', 'uso', 'origem', 'ferramenta', 'data', 'referencias', 'prompt', 'ajustes', 'parametros', 'aprovado'];
    for (const r of manifesto.retratos) expect(Object.keys(r).sort(), r.arquivo).toEqual([...campos].sort());
  });

  it('256 × 256 e até 30 KB', () => {
    for (const f of arquivos) {
      const path = join(IMG, f);
      if (!f.endsWith('.svg')) expect(imageSize(readFileSync(path)), f).toEqual([256, 256]);
      expect(statSync(path).size / 1024, `${f} (KB)`).toBeLessThanOrEqual(MAX_KB);
    }
  });

  it('imagem que nenhuma ficha usa está marcada como variante', () => {
    const soltas = manifesto.retratos.filter((r) => r.uso === 'dados' && !usada(r.chave)).map((r) => r.arquivo);
    expect(soltas, 'sem uso nos dados: marque "uso": "variante" ou ligue a uma ficha').toEqual([]);
  });
});
