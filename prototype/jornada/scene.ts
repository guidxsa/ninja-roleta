// Cena narrativa da Jornada (docs/visual.md#cena-narrativa, v0.72.0): o quadro em que a história acontece.
// Um componente só para evento, vitória, lição, estágio concluído e relíquia: o local da parada como requadro de
// mangá, quem está em cena no canto do quadro e o texto num pergaminho. O card grafite fica para ferramenta (HUD).
// Nada aqui muda regra: é só apresentação.
import { jornadaData as data } from '../../src/data/jornada';
import { ptBR as S } from '../../src/data/strings/ptBR';
import { fighterPortrait } from '../art';
import { esc } from '../dom';

const J = S.jornada;

export interface SceneView {
  /** Local do quadro (`scene-<id>` em styles/scenes.css). */
  place: string;
  /** Quem está em cena (id de personagem ou inimigo). Sem ele, o quadro mostra só o local. */
  face?: string | null;
  /** Retrato a usar no lugar do da ficha (a skin do protagonista). */
  faceSpec?: string;
  /** Nome de quem está em cena (padrão: o nome da ficha). */
  faceName?: string;
  title: string;
  /** Selo no canto do pergaminho (kanji do recorte) e o que ele quer dizer, para leitor de tela. */
  seal?: { kanji: string; label: string; gold?: boolean };
  /** Miolo do pergaminho, já em HTML. */
  body: string;
  /** O que vem abaixo do pergaminho (opções, botão de continuar), já em HTML. */
  footer: string;
  /** Faixa acima do quadro ("O que mudou"), já em HTML. */
  above?: string;
  /** Classes a mais na tela (as que o TS e o CSS já usam: `jevent`, `jrtreasure`). */
  cls?: string;
}

/** Retrato de quem está em cena, pela ficha (personagem ou inimigo). */
export function scenePortrait(id: string, spec?: string): string {
  const def = data.characters[id] ?? data.enemies[id];
  return fighterPortrait(id, spec ?? def?.portrait ?? 'ninja:common', 'lg');
}

/** A tela da cena: quadro do local com quem está em cena, pergaminho e o rodapé de ações. */
export function sceneScreen(v: SceneView): string {
  const name = v.face ? (v.faceName ?? J.names[v.face] ?? '') : '';
  const cast = v.face
    ? `<span class="jc-cast">${scenePortrait(v.face, v.faceSpec)}${name ? `<b class="jc-name">${esc(name)}</b>` : ''}</span>`
    : '';
  const seal = v.seal ? `<span class="seal jc-seal${v.seal.gold ? ' gold' : ''}" role="img" aria-label="${esc(v.seal.label)}">${v.seal.kanji}</span>` : '';
  return `<div class="screen jcene${v.cls ? ` ${v.cls}` : ''}">${v.above ?? ''}
    <div class="jc-frame">
      <figure class="jc-panel jscene scene-${v.place}${v.face ? '' : ' empty'}" aria-hidden="${v.face ? 'false' : 'true'}">${cast}</figure>
      <div class="jc-side">
        <section class="parchment jc-paper">${seal}<h2 class="jc-title">${esc(v.title)}</h2>${v.body}</section>
        <div class="jc-foot">${v.footer}</div>
      </div>
    </div></div>`;
}

/** Linhas que entram uma a uma (ganhos da vitória, a lição): cada linha é um parágrafo do pergaminho. */
export function sceneLines(lines: readonly string[], lead = 0): string {
  return lines
    .filter(Boolean)
    .map((l, i) => `<p class="jc-line${i < lead ? ' lead' : ''}" style="--i:${i}">${esc(l)}</p>`)
    .join('');
}
