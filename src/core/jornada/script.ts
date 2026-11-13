// Roteiro de luta (docs/jornada/roteiro.md, v0.66.0): momentos canônicos declarados no dado da parada, sem código por
// luta. Uma regra é "quando → faça": o motor confere as regras em três pontos fixos (abertura, perda de HP, virada de
// rodada, e ao usar uma técnica) e cada regra dispara uma vez. Funções puras sobre o estado da luta.
import type { EnemyPassive, Fighter, JBattle } from './types';
import type { JornadaData } from './data';

/** Transformação de um lutador (manto da Kyuubi, Shukaku, selo amaldiçoado). Declarada na ficha (`forms`). */
export interface FormDef {
  id: string;
  /** Ataques e resistências × isto (para baixo). */
  statMult?: number;
  /** HP máximo × isto; o HP atual acompanha a proporção. */
  maxHpMult?: number;
  /** Técnicas da forma (troca as de antes). */
  techniques?: string[];
  /** Passiva da forma (troca a de antes). */
  passive?: EnemyPassive;
  /** Cura esta fração do HP máximo ao entrar na forma. */
  healPct?: number;
  /** Retrato da forma (a interface usa no lugar do da ficha). */
  portrait?: string;
  /** Técnicas a mais enquanto a forma dura (Garras da Kyuubi). */
  addTechniques?: string[];
  /** Turnos do lutador que a forma dura; sem o campo, até o fim da luta. Ao acabar, volta à ficha de antes. */
  turns?: number;
  /** Modificadores enquanto dura: dano × damageMult; uma vez, 1 de HP em vez de cair. */
  mods?: { damageMult?: number; surviveOnce?: boolean };
}

/** Quando a regra dispara. `who` é o id da ficha (defId) do lutador. */
export type ScriptTrigger =
  | { on: 'start' }
  | { on: 'round'; round: number }
  | { on: 'hpBelow'; who: string; pct: number }
  | { on: 'down'; who: string }
  | { on: 'tech'; tech: string; who?: string };

/** O que a regra faz. `line` é a chave da fala em `strings/jornada.ts` (`script`). */
export type ScriptAction =
  | { do: 'say'; who: string; line: string }
  /** O lutador cai pelo roteiro (o Sasuke protegendo o Naruto do Haku). */
  | { do: 'knock'; who: string }
  | { do: 'form'; who: string; form: string }
  /** Entra um lutador da reserva da luta (montada pela parada). */
  | { do: 'enter'; who: string }
  /** Sai `who` e entra `with` (da reserva) no lugar: troca de fase (Gaara → Shukaku contra o Gamabunta). */
  | { do: 'replace'; who: string; with: string }
  | { do: 'heal'; who: string; pct: number }
  /** Marca na run (vai para `run.flags` no fim da luta). */
  | { do: 'flag'; id: string }
  /** Encerra a luta com o resultado roteirizado (o desmaio que ainda conta como vitória). */
  | { do: 'end'; status: 'won' | 'lost' };

export interface ScriptRule {
  when: ScriptTrigger;
  /** A regra só vale com esta marca na run (o selo do Sasuke só desperta depois da Floresta da Morte). */
  if?: { flag: string };
  do: ScriptAction[];
}

/** Contexto do ponto de checagem: a técnica que acabou de ser usada, se for o caso. */
export interface ScriptContext {
  tech?: string;
  by?: Fighter;
}

/** Lutador do roteiro: o primeiro com esse id de ficha que ainda está na luta. */
const byDef = (s: JBattle, defId: string) => s.fighters.find((f) => f.defId === defId && !f.gone);

/** Forma declarada na ficha do lutador (personagem ou inimigo). */
export function formOf(defId: string, formId: string, data: JornadaData): FormDef | undefined {
  const def = data.characters[defId] ?? data.enemies[defId];
  return def?.forms?.find((x) => x.id === formId);
}

/** Liga uma forma no lutador. Guarda a ficha de antes para a forma temporária voltar. */
export function applyForm(f: Fighter, form: FormDef): void {
  if (!f.formBase) f.formBase = { offense: { ...f.offense }, resistance: { ...f.resistance }, techniques: [...f.techniques], maxHp: f.maxHp, mods: { ...f.mods }, ...(f.passive ? { passive: f.passive } : {}) };
  f.form = form.id;
  f.formTurns = form.turns ?? 0;
  if (form.statMult) {
    const m = form.statMult;
    f.offense = { taijutsu: Math.floor(f.offense.taijutsu * m), ninjutsu: Math.floor(f.offense.ninjutsu * m), genjutsu: Math.floor(f.offense.genjutsu * m) };
    f.resistance = { physical: Math.floor(f.resistance.physical * m), mental: Math.floor(f.resistance.mental * m) };
  }
  if (form.maxHpMult) {
    const ratio = f.maxHp > 0 ? f.hp / f.maxHp : 1;
    f.maxHp = Math.max(1, Math.floor(f.maxHp * form.maxHpMult));
    f.hp = Math.max(1, Math.floor(f.maxHp * ratio));
  }
  if (form.techniques) f.techniques = [...form.techniques];
  if (form.addTechniques) f.techniques = [...new Set([...f.techniques, ...form.addTechniques])];
  if (form.passive) f.passive = form.passive;
  if (form.healPct) f.hp = Math.min(f.maxHp, f.hp + Math.floor(f.maxHp * form.healPct));
  if (form.mods) f.mods = { ...f.mods, damageMult: f.mods.damageMult * (form.mods.damageMult ?? 1), surviveOnce: f.mods.surviveOnce || Boolean(form.mods.surviveOnce) };
}

/** A forma temporária acabou: volta à ficha de antes (o HP acompanha a proporção, nunca abaixo de 1). */
export function endForm(f: Fighter): void {
  const base = f.formBase;
  if (!base) return;
  const ratio = f.maxHp > 0 ? f.hp / f.maxHp : 1;
  f.offense = { ...base.offense };
  f.resistance = { ...base.resistance };
  f.techniques = [...base.techniques];
  f.maxHp = base.maxHp;
  f.mods = { ...base.mods };
  if (!f.down) f.hp = Math.max(1, Math.floor(f.maxHp * ratio));
  if (base.passive) f.passive = base.passive;
  else delete f.passive;
  delete f.form;
  delete f.formBase;
  delete f.formTurns;
}

function triggered(s: JBattle, w: ScriptTrigger, ctx: ScriptContext): boolean {
  switch (w.on) {
    case 'start':
      return true;
    case 'round':
      return s.round >= w.round;
    case 'hpBelow': {
      const f = byDef(s, w.who);
      return Boolean(f && !f.down && f.hp <= f.maxHp * w.pct);
    }
    case 'down':
      return s.fighters.some((f) => f.defId === w.who && f.down && !f.gone);
    case 'tech':
      return ctx.tech === w.tech && (!w.who || ctx.by?.defId === w.who);
  }
}

/**
 * Executa as ações. `enter` e `replace` usam a reserva da luta; quem sai fica marcado como fora (`gone`: não volta nem
 * conta para a vitória). Devolve se alguma ação mudou quem está na luta (a interface redesenha).
 */
function perform(s: JBattle, a: ScriptAction, data: JornadaData, enterFighter: (s: JBattle, defId: string) => Fighter | null): void {
  switch (a.do) {
    case 'say': {
      const f = byDef(s, a.who);
      s.log.push({ type: 'say', uid: f?.uid ?? null, who: a.who, line: a.line });
      return;
    }
    case 'knock': {
      const f = byDef(s, a.who);
      if (!f || f.down) return;
      f.down = true;
      f.hp = 0;
      f.effects = [];
      f.clones = 0;
      f.shield = 0;
      f.boost = null;
      f.gate = null;
      s.log.push({ type: 'down', target: f.uid, scripted: true });
      return;
    }
    case 'form': {
      const f = byDef(s, a.who);
      const form = f ? formOf(f.defId, a.form, data) : undefined;
      if (!f || !form) return;
      applyForm(f, form);
      s.log.push({ type: 'form', uid: f.uid, form: form.id });
      return;
    }
    case 'enter': {
      const f = enterFighter(s, a.who);
      if (f) s.log.push({ type: 'enter', uid: f.uid });
      return;
    }
    case 'replace': {
      const out = byDef(s, a.who);
      if (out) {
        out.gone = true;
        out.down = true;
        s.log.push({ type: 'leave', uid: out.uid });
      }
      const f = enterFighter(s, a.with);
      if (f) s.log.push({ type: 'enter', uid: f.uid });
      return;
    }
    case 'heal': {
      const f = byDef(s, a.who);
      if (!f || f.down) return;
      const amount = Math.min(f.maxHp - f.hp, Math.floor(f.maxHp * a.pct));
      if (amount <= 0) return;
      f.hp += amount;
      s.log.push({ type: 'heal', uid: f.uid, target: f.uid, amount });
      return;
    }
    case 'flag':
      if (!s.flags.includes(a.id)) s.flags.push(a.id);
      return;
    case 'end':
      if (s.status !== 'ongoing') return;
      s.status = a.status;
      s.log.push({ type: 'end', status: a.status, scripted: true });
      return;
  }
}

/**
 * Confere as regras que ainda não dispararam, na ordem do dado, e executa as que valem agora. Cada regra dispara uma
 * vez por luta. Ações que mexem em HP não chamam o roteiro de novo (sem recursão): a próxima checagem pega o resto.
 */
export function runScript(s: JBattle, data: JornadaData, enterFighter: (s: JBattle, defId: string) => Fighter | null, ctx: ScriptContext = {}): void {
  if (!s.script.length || s.scripting) return;
  s.scripting = true;
  try {
    s.script.forEach((rule, i) => {
      if (s.fired.includes(i) || (rule.if && !s.runFlags.includes(rule.if.flag)) || !triggered(s, rule.when, ctx)) return;
      s.fired.push(i);
      for (const a of rule.do) perform(s, a, data, enterFighter);
    });
  } finally {
    s.scripting = false;
  }
}
