import { icon } from '../art';
import { jornadaPtBR as words } from '../../src/data/strings/jornada';
import type { JRun } from '../../src/core/jornada/run';
const motifs: Record<string, string> = {
  clones: 'clones',
  pranks: 'trickster',
  bonds: 'willOfFire',
  toads: 'toad',
  kyuubi: 'beast',
  rasengan: 'wind',
  element: 'ninjutsu',
  tools: 'kit',
  leafStyle: 'taijutsu',
  team: 'clones',
  will: 'sprout',
  gates: 'gates',
  youth: 'fire',
  drunken: 'dodge',
  training: 'weights',
  rivalry: 'clash',
  mentor: 'shinobi',
  sharingan: 'sharingan',
  fire: 'fire',
  illusions: 'genjutsu',
  weapons: 'kunai',
  pride: 'willOfFire',
  police: 'stance',
  byakugan: 'byakugan',
  gentleFist: 'paper',
  rotation: 'cycle',
  trigrams: 'barrier',
  mainHouse: 'home',
  branchHouse: 'antlers',
};
const classArt: Record<string, [string, string]> = {
  naruto: ['img/shinobi/vale-esq.png', 'img/shinobi/vale-dir.png'],
  commonNinja: ['img/shinobi/pergaminho-caminho.png', 'img/ninja/common.webp'],
  uchihaNinja: ['img/cenas/noite.jpg', 'img/ninja/uchiha.webp'],
  hyuugaNinja: ['img/shinobi/serra-rodape.png', 'img/ninja/hyuuga.webp'],
  prodigy: ['img/shinobi/pergaminho-historia.png', 'img/ninja/taijutsuProdigy.webp'],
};
const branchViews: Record<string, string> = {
  pranks: 'img/shinobi/telhado.png',
  bonds: 'img/cenas/waves.webp',
  toads: 'img/cenas/sannin.webp',
  kyuubi: 'img/shinobi/vale-esq.png',
  leafStyle: 'img/shinobi/pergaminho-caminho.png',
  team: 'img/shinobi/telhado.png',
  will: 'img/shinobi/serra-rodape.png',
  youth: 'img/shinobi/vale-esq.png',
  drunken: 'img/cenas/dia.webp',
  training: 'img/shinobi/serra.png',
  rivalry: 'img/shinobi/vale-dir.png',
  mentor: 'img/shinobi/pergaminho-caminho.png',
  fire: 'img/shinobi/pergaminho-historia.png',
  illusions: 'img/cenas/noite.jpg',
  weapons: 'img/shinobi/pergaminho-jornada.png',
  pride: 'img/shinobi/serra-rodape.png',
  police: 'img/shinobi/telhado.png',
  rotation: 'img/shinobi/serra.png',
  mainHouse: 'img/shinobi/telhado.png',
  branchHouse: 'img/shinobi/pergaminho-caminho.png',
};
const narutoScenes: Record<string, string> = { toads: 'img/ninja/jiraiya.webp', kyuubi: 'img/ninja/narutoKyuubi.webp' };
export function branchScenery(run: JRun, b: string) {
  const [first, second] = classArt[run.hero] ?? classArt.commonNinja!;
  const left = branchViews[b] ?? first,
    right = run.hero === 'naruto' ? (narutoScenes[b] ?? second) : second;
  const id = b === 'element' ? (run.elements[run.hero] ?? 'ninjutsu') : (motifs[b] ?? 'scroll');
  const theme = words.talents.branchKanji[b] ?? '';
  return `<div class="branch-scenery" data-school="${run.hero}" data-motif="${id}" data-branch-art="${b}" aria-hidden="true"><span class="school-l" style="background-image:url('${left}')"></span><span class="school-r" style="background-image:url('${right}')"></span><span class="branch-pattern"></span><span class="branch-mark">${icon(id)}</span><span class="branch-script kanji">${theme}</span></div>`;
}
