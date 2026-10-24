# Efeitos

Efeitos negativos e mentais que ataques e técnicas aplicam. Valem para jogador e vilões. Valores em `balance.status`.

## Regras gerais

- O início de cada combate e a Vontade do Fogo limpam todos os efeitos do jogador.
- **Anti-trava**: ao sair de um efeito que tira a vez (Aprisionado, Sono, Paralisia), o alvo age ao menos uma vez antes de perder a vez de novo.
- "Ataque elemental" = ataque com elemento (ninjutsu). Taijutsu é neutro.
- Além dos críticos, uma técnica pode ter **chance de efeito no acerto** (campo `efeito` da ficha, ver [tecnicas.md](tecnicas.md)).

## Efeitos físicos

| Efeito | Origem | Duração | Efeito |
|---|---|---|---|
| Paralisia | Crítico de raio | 1 vez | Perde a próxima vez. |
| Atordoamento | Crítico de vento, terra ou água; algumas técnicas | 2 ações do alvo | −10 na chance de acerto. |
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

Genjutsu não causa dano. Todos os efeitos mentais usam a mesma rolagem e a mesma fórmula de duração.

```
acerto  = genjutsuHit(genjutsu_do_atacante, genjutsu_do_alvo)
poder   = genjutsu_do_atacante + poder_da_técnica + 3 × nível_do_pergaminho_de_genjutsu
turnos  = clamp(turnos_base + floor(max(0, poder − genjutsu_do_alvo) / 8), 1, 3)
```

- O alvo resiste com o próprio genjutsu (mais o bônus de Olhos treinados no Uchiha).
- Jinchuuriki (Demônio interno) é imune a todos.
- Não tem crítico e não consome o Foco.

| Efeito | O que faz | Uso tático |
|---|---|---|
| Aprisionado | Perde a vez. | Controle direto. |
| Sono | Perde a vez; a duração é +1 turno, mas acorda ao tomar dano. | Preparar um golpe forte. |
| Pavor | O alvo causa 25% menos dano. | Sobreviver a um chefe. |
| Confusão | Em cada ação, 30% de chance de falhar; metade dessas falhas acerta a si mesmo com o próprio ataque (resistência = metade da própria defesa do tipo). | Aposta de RNG. |
| Tormento | Perde 4 de chakra no início de cada rodada. | Travar as técnicas do vilão. |

- Pavor e Confusão contam as ações do alvo; Tormento conta rodadas.

A Imitação de Sombra do Nara aplica Aprisionado usando ninjutsu no lugar de genjutsu na fórmula: rola a precisão da técnica (80%) e a duração compara o ninjutsu do Nara com o ninjutsu do alvo. Por isso funciona em jinchuuriki.