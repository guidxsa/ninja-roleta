// Staging e release (docs/processo/fluxo.md). Cada PR para o staging traz um fragmento changelog.d/<tema>.md; a release
// junta os fragmentos numa linha do CHANGELOG.md. O PR permanente é onde o usuário revisa o lote: sem revisão cruzada no
// staging, ele lista à parte cada arquivo de processo alterado.
//   tsx scripts/staging.ts pr               → JSON {titulo, corpo, sugerir, sugestao} do PR permanente (workflow staging.yml)
//   tsx scripts/staging.ts release 0.96.0   → junta os fragmentos no CHANGELOG.md e apaga os fragmentos
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PROTECTED } from './check-regras';
import { matchesAny } from './harness';

export const PASTA = 'changelog.d';
export const LEIAME = 'LEIAME.md';

export interface Fragmento {
  tema: string;
  peso: 'alto' | 'normal';
  texto: string;
}

/** Lê um fragmento: frontmatter opcional com `peso: alto|normal` e o texto para quem joga (uma linha da tabela). */
export function parseFragmento(tema: string, md: string): Fragmento {
  let corpo = md.replace(/\r\n/g, '\n');
  let peso: Fragmento['peso'] = 'normal';
  const fm = /^---\n([\s\S]*?)\n---\n?/.exec(corpo);
  if (fm) {
    if (/^peso:\s*alto\s*$/m.test(fm[1]!)) peso = 'alto';
    corpo = corpo.slice(fm[0].length);
  }
  const texto = corpo.split('\n').map((l) => l.trim()).filter(Boolean).join(' ').replaceAll('|', '\\|');
  return { tema, peso, texto };
}

/** Próxima release: sobe o y e zera o z (0.95.2 → 0.96.0). O major só sobe por decisão do usuário (passado à mão). */
export function proximaVersao(atual: string): string {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(atual);
  if (!m) throw new Error(`versão inválida: ${atual}`);
  return `${m[1]}.${Number(m[2]) + 1}.0`;
}

/** Linha nova do CHANGELOG.md, no fim da tabela. */
export function aplicarRelease(changelog: string, versao: string, fragmentos: Fragmento[]): string {
  if (fragmentos.length === 0) throw new Error('sem fragmentos em changelog.d: nada para lançar');
  const linha = `| v${versao} | ${fragmentos.map((f) => f.texto).join(' ')} |`;
  const linhas = changelog.replace(/\r\n/g, '\n').split('\n');
  let ultima = -1;
  linhas.forEach((l, i) => {
    if (/^\| v\d+\.\d+\.\d+ \|/.test(l)) ultima = i;
  });
  if (ultima < 0) throw new Error('tabela de versões não encontrada no CHANGELOG.md');
  if (linhas.some((l) => l.startsWith(`| v${versao} |`))) throw new Error(`v${versao} já está no CHANGELOG.md`);
  linhas.splice(ultima + 1, 0, linha);
  return linhas.join('\n');
}

export interface Integrado {
  pr: number | null;
  titulo: string;
}

/** Merges do staging que ainda não estão no master (`git log --merges --first-parent --format=%s%x1f%b%x1e`). */
export function parseIntegrados(log: string): Integrado[] {
  return log
    .split('\x1e')
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => {
      const [assunto = '', corpo = ''] = r.split('\x1f');
      const pr = /Merge pull request #(\d+)/.exec(assunto)?.[1];
      return { pr: pr ? Number(pr) : null, titulo: corpo.trim().split('\n')[0] || assunto };
    });
}

/** Arquivos de processo (a lista protegida do check:regras) entre os alterados no lote. */
export function arquivosDeProcesso(files: string[]): string[] {
  return files.filter((f) => matchesAny(f, PROTECTED) || f === 'package.json').sort();
}

export interface PrPermanente {
  titulo: string;
  corpo: string;
  sugerir: boolean;
  sugestao: string;
}

export function montarPr(
  versaoAtual: string,
  fragmentos: Fragmento[],
  integrados: Integrado[],
  ponta: string,
  preview: string,
  sugerirCom: number,
  processo: string[] = [],
): PrPermanente {
  const proxima = proximaVersao(versaoAtual);
  const altos = fragmentos.filter((f) => f.peso === 'alto').length;
  const corpo = [
    `Próxima versão proposta: **v${proxima}** (o \`master\` está na v${versaoAtual}). Merge só com o "publica v${proxima}" do usuário, com **Create a merge commit**; a tag vem depois (docs/processo/fluxo.md, "Release").`,
    '',
    `Preview: ${preview} · último commit do staging: \`${ponta}\``,
    '',
    `## O que muda para quem joga (${fragmentos.length} item(ns), ${altos} de peso alto)`,
    '',
    ...(fragmentos.length ? fragmentos.map((f) => `- ${f.peso === 'alto' ? '**[alto]** ' : ''}${f.texto} (\`${PASTA}/${f.tema}.md\`)`) : ['- Nenhum fragmento ainda.']),
    '',
    `## PRs integrados (${integrados.length})`,
    '',
    ...(integrados.length ? integrados.map((i) => `- ${i.pr ? `#${i.pr} ` : ''}${i.titulo}`) : ['- Nenhum.']),
    '',
    `## Mudanças no processo (${processo.length} arquivo(s))`,
    '',
    ...(processo.length
      ? [
          'O staging não tem revisão cruzada: confira aqui o que mudou nas regras e nas verificações dos agentes (workflows, hooks, `AGENTS.md`, scripts de verificação, skills, `docs/processo/`; no `package.json`, os `scripts`).',
          '',
          ...processo.map((f) => `- \`${f}\``),
        ]
      : ['- Nenhuma.']),
    '',
    '## Como lançar',
    '',
    `1. Peça ao agente "prepara a v${proxima}": ele abre \`feature/release-v${proxima}\` para o staging com \`npx tsx scripts/staging.ts release ${proxima}\` e \`npm version ${proxima} --no-git-tag-version\`, e publica aqui uma revisão de IA do lote inteiro (só informa, não trava).`,
    `2. Teste o preview, leia a revisão e as mudanças no processo e diga "publica v${proxima}": merge deste PR e tag \`v${proxima}\` no merge commit.`,
    '',
  ].join('\n');
  const sugerir = altos > 0 || fragmentos.length >= sugerirCom;
  const sugestao = [
    `O staging acumulou ${fragmentos.length} item(ns), ${altos} de peso alto: pode ser hora da v${proxima}. Teste o preview (${preview}) e, se quiser lançar, peça "prepara a v${proxima}".`,
    '',
    '<!-- staging:sugestao -->',
  ].join('\n');
  return { titulo: `Próxima versão (proposta v${proxima})`, corpo, sugerir, sugestao };
}

export function lerFragmentos(pasta = PASTA): Fragmento[] {
  if (!existsSync(pasta)) return [];
  return readdirSync(pasta)
    .filter((f) => f.endsWith('.md') && f !== LEIAME)
    .sort()
    .map((f) => parseFragmento(f.slice(0, -3), readFileSync(join(pasta, f), 'utf8')));
}

const git = (...args: string[]): string => execFileSync('git', args, { encoding: 'utf8' });
const versaoDoPackage = (txt: string): string => (JSON.parse(txt) as { version: string }).version;

function main(): void {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === 'pr') {
    // Versão em produção: a do package.json no master (a do staging só muda na release).
    const atual = versaoDoPackage(git('show', 'origin/master:package.json'));
    const log = git('log', '--merges', '--first-parent', '--format=%s%x1f%b%x1e', 'origin/master..HEAD');
    const ponta = git('rev-parse', '--short', 'HEAD').trim();
    const alterados = git('diff', '--name-only', 'origin/master...HEAD').split('\n').map((l) => l.trim()).filter(Boolean);
    const pr = montarPr(
      atual,
      lerFragmentos(),
      parseIntegrados(log),
      ponta,
      process.env.PREVIEW ?? '/staging/',
      Number(process.env.SUGERIR_COM_ITENS) || 8,
      arquivosDeProcesso(alterados),
    );
    process.stdout.write(JSON.stringify(pr));
  } else if (cmd === 'release' && arg && /^\d+\.\d+\.\d+$/.test(arg)) {
    const fragmentos = lerFragmentos();
    writeFileSync('CHANGELOG.md', aplicarRelease(readFileSync('CHANGELOG.md', 'utf8'), arg, fragmentos));
    for (const f of fragmentos) rmSync(join(PASTA, `${f.tema}.md`));
    console.log(`CHANGELOG.md com a v${arg} (${fragmentos.length} fragmento(s) juntados e apagados). Agora: npm version ${arg} --no-git-tag-version`);
  } else {
    console.error('uso: tsx scripts/staging.ts pr | release <x.y.z>');
    process.exit(2);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
