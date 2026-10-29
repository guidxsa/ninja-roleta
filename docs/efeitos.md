# Efeitos

Efeitos negativos e mentais que ataques e técnicas aplicam. Valem para jogador e vilões. Valores em `balance.status`.

## Regras gerais

- O fim de cada luta, subir de nível e a Vontade do Fogo limpam todos os efeitos do jogador.
- Quem está Aprisionado, Dormindo, Paralisado ou Possuído **não reage**, recebe os golpes com a resistência passiva ([fundamentos.md](fundamentos.md#reações)) e toma dano extra (ver "Controles"). Por isso esses efeitos são a melhor preparação para um golpe forte.
- **Anti-trava**: ao sair de um efeito que tira a vez, o alvo age ao menos uma vez antes de perder a vez de novo.

## Controles

Controle = efeito que tira a vez: Aprisionado, Sono, Paralisia e Possessão. Valem para jogador e vilão.

- **Duração**: os controles mentais (Aprisionado, Sono, Possessão) duram pela **roleta de fuga** (ver [Duração dos efeitos mentais](#duração-dos-efeitos-mentais)). A Paralisia dura 2 vezes fixas.
- **Vulnerável**: quem perdeu a vez recebe **dano ×1,25** (taijutsu, ninjutsu, disputa e ilusões de dano).
- **Tenacidade**: cada controle que pega soma **+50%** de tenacidade no alvo (até 90%). A chance do próximo controle é multiplicada por **(1 − tenacidade)**: um controle logo depois do outro fica muito mais difícil.
- A tenacidade cai **15% por rodada** em que o alvo não está controlado, até voltar a zero (uns 3 a 4 turnos depois de um controle).
- No genjutsu e na Imitação de Sombra, a tenacidade entra na chance de acerto mostrada na tela. Na paralisia do crítico de raio, rola-se a tenacidade depois do crítico.

Configuração: `control: { tenacityPerControl: 0.5, decayPerRound: 0.15, maxTenacity: 0.9, vulnerableDamageMult: 1.25 }`.
- "Ataque elemental" = ataque com elemento (ninjutsu). Taijutsu é neutro.
- Além dos críticos, uma técnica pode ter **chance de efeito no acerto** (campo `efeito` da ficha, ver [tecnicas.md](tecnicas.md)).

## Efeitos físicos

| Efeito | Origem | Duração | Efeito |
|---|---|---|---|
| Paralisia | Crítico de raio | 2 vezes | Perde a vez. |
| Atordoamento | Crítico de vento, terra ou água; algumas técnicas | 2 ações do alvo | −20 na chance de acerto. |
| Queimadura | Crítico de fogo; algumas técnicas | 2 rodadas | Ver abaixo. |
| Envenenamento | Cobra (invocação e Orochimaru) | Até curar | Ver abaixo. |
| Sangramento | Crítico de espada (`blade: 'sword'`) | Luta inteira | Golpes cortantes causam ×1,5 de dano. |

### Queimadura

- No fim de cada rodada, o n-ésimo tique causa 2^n % do HP máximo (2%, 4%, 8%, 16%), no máximo 16%.
- Queimando, todo acerto de fogo prolonga 1 rodada.
- Ao apagar, a contagem reinicia. Como a queimadura já foi desbloqueada na luta, um acerto de fogo comum (sem crítico) reacende por 1 rodada.

### Envenenamento

- Tique no fim de cada rodada: 1% do HP máximo + bônus inicial da fonte + 1 por tique anterior.
- Teto: 30% do HP máximo por tique.
- Acertar um alvo já envenenado soma **+1** ao bônus do veneno (vale para os tiques seguintes).
- Teste de cura depois de cada tique, **a partir do segundo**: **40%** de chance de curar.
- Curado, a fonte pode envenenar de novo do zero no próximo acerto.

## Efeitos de genjutsu

Todos os efeitos mentais usam a mesma rolagem e a mesma fórmula de força. Só as **ilusões de dano** do Uchiha ferem (ver abaixo).

```
resistência = resistência_mental_do_alvo × fração_da_situação   (40%, 70% ou 100%, ver fundamentos)
acerto      = genjutsuHit(genjutsu_do_atacante, resistência)
poder       = genjutsu_do_atacante + poder_da_técnica + 3 × (nível_da_técnica − 1)
força       = força_base + max(0, poder − resistência) / 8      (sem arredondar; o Sono soma +1)
```

### Duração dos efeitos mentais

Nenhum efeito mental sem dano tem turnos fixos nem teto de turnos: Aprisionado, Sono, Possessão, Pavor, Confusão e Tormento duram pela **roleta de fuga**.

- O 1º turno é garantido.
- Depois de cada turno cumprido (k = 1, 2, 3...), o alvo gira a roleta para se livrar:

  ```
  fuga_inicial = clamp(0,35 − 0,15 × (força − 1), 5%, 100%)
  fuga(k)      = min(100%, fuga_inicial + (0,1 / força) × (k − 1)²)
  ```

- A força pesa duas vezes: baixa a chance de sair logo e faz a chance crescer mais devagar. Como a chance cresce com o quadrado dos turnos, ela sempre chega a 100%: ninguém fica preso para sempre.
- Turno = a unidade de cada efeito: vez perdida (Aprisionado, Sono, Possessão), ação do alvo (Pavor, Confusão) ou rodada (Tormento).
- Renovar um efeito que ainda vale fica com a força maior e recomeça a contagem.

| Força | Fuga depois do 1º, 2º, 3º, 4º, 5º turno | Duração média |
|---|---|---|
| 1 | 35%, 45%, 75%, 100% | 2,1 turnos |
| 2 | 20%, 25%, 40%, 65%, 100% | 2,9 turnos |
| 3 | 5%, 8%, 18%, 35%, 58% (88% no 6º) | 4,2 turnos |

Configuração: `mentalHold: { pointsPerStrength: 8, escapeBase: 0.35, escapePerStrength: 0.15, escapeMin: 0.05, escapeGrowth: 0.1 }` e `status.sleepStrengthBonus: 1`.

- O alvo resiste com a **resistência mental** (mais o bônus de Olhos treinados no Uchiha). A única reação possível é Resistir.
- Jinchuuriki (Demônio interno) é imune a todos.
- Não tem crítico e não consome o Foco. O Gênio do Nara vale (gira o acerto duas vezes).
- Controles (Aprisionado, Sono, Possessão) sofrem a tenacidade do alvo (ver "Controles").

| Efeito | O que faz | Uso tático |
|---|---|---|
| Aprisionado | Perde a vez. | Controle direto. |
| Sono | Perde a vez; tem +1 de força, mas acorda ao tomar dano. | Preparar um golpe forte. |
| Possessão | Perde a vez e golpeia a si mesmo com a própria técnica de dano mais forte, contra a própria resistência física passiva. | Controle que fere: quanto mais forte o vilão, mais ele se machuca. |
| Pavor | O alvo causa 35% menos dano e tem as resistências física e mental ×0,75. | Sobreviver a um chefe e bater mais forte nele. |
| Confusão | Em cada ação, 40% de chance de falhar; metade dessas falhas acerta a si mesmo com o próprio ataque (contra a própria resistência física passiva). | Aposta de RNG. |
| Tormento | Perde 5 de chakra no início de cada rodada. | Travar as técnicas do vilão. |

- Pavor e Confusão giram a fuga a cada ação do alvo; Tormento, a cada rodada.
- A Possessão vem da Transferência de Mente (Yamanaka). Configuração: `status.possession: { selfDamageMult: 1 }`.
- Pavor: `status.fear: { damageMult: 0.65, resistanceMult: 0.75 }`. Vale para jogador e vilão.

### Ilusões de dano (Uchiha)

Genjutsu com dano base: rola o acerto do genjutsu (sem crítico) e, se pegar, fere:

```
dano = dano_base + genjutsu (+ poder do Sharingan) − resistência_mental_do_alvo × fração
```

- Só Resistir (com a resistência mental); não há disputa nem Substituição. Jinchuuriki é imune.
- Ilusão da Dor (kit inicial) e Tsukuyomi (nível 7, só com o Sharingan, também aprisiona). Fichas em [tecnicas.md](tecnicas.md#genjutsu).

A Imitação de Sombra do Nara aplica Aprisionado usando ninjutsu no lugar de genjutsu na fórmula: rola a precisão da técnica (80%) e a duração compara o ninjutsu do Nara com a resistência física do alvo. Por isso funciona em jinchuuriki.