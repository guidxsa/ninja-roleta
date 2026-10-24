# Fundamentos

Regras centrais que valem para todo combate: status, roleta, iniciativa, acerto, dano, chakra e restauração. Os números são provisórios e vivem em `balance` / `data/*.ts`.

## Roleta e RNG

- Toda decisão aleatória passa por uma **roleta**: uma lista de fatias (rótulo, peso, efeito) e um `rng()` injetável que devolve a fatia sorteada.
- A roleta é visível por padrão (animação). Configuração para desligar: modo "resultado instantâneo".
- Funções do `core` nunca chamam `Math.random`; recebem o `rng`, para testes com seed.

## Status

| Status | Função |
|---|---|
| HP | Vida. Chegou a 0, é um fracasso (ver "Vontade do Fogo"). |
| Taijutsu | Poder físico. Base da resistência a taijutsu. |
| Ninjutsu | Poder das técnicas com chakra. Base da resistência a ninjutsu. |
| Genjutsu | Poder de ilusões. Base da resistência a genjutsu e do tempo preso em ilusões. |
| Chakra | Recurso das técnicas. Tem máximo próprio. |
| Speed | Iniciativa. |

Status iniciais por origem: [origens.md](origens.md).

## Restauração

- **O início de cada combate restaura HP e chakra por completo e limpa os efeitos negativos.** Vale para toda luta, inclusive dentro de blocos (Haku e Zabuza, Quarteto do Som) e do exame chunin.
- **Subir de nível não restaura.**
- Penalidades de "começar a próxima luta com X" (ex.: Akatsuki) são aplicadas **depois** da restauração.
- Dentro da luta, só restauram: Vontade do Fogo, técnicas de cura, consumíveis, passivas de regeneração e invocações.
- Configuração: `combat.restoreOnStart: true`. Para voltar a ter o HP carregando dentro de blocos, `combat.restoreWithinBlock: false`.

## Turno e ações

- **Iniciativa**: rolada uma vez no início da luta; define a ordem da luta toda.
  ```
  chance_A = speedA² / (speedA² + speedB²)
  ```
  Vantagem ou desvantagem de ação (eventos) substitui essa roleta na próxima luta contra vilão.
- Técnicas com **prioridade** agem antes naquela rodada, mesmo sem a iniciativa. Dois lados com prioridade: vale a iniciativa.
- Em cada turno o jogador escolhe uma ação:
  - **Técnica** (de uma das categorias do skill set, ver [tecnicas.md](tecnicas.md)).
  - **Ativa de linhagem** (dōjutsu, portões, expansão etc.).
  - **Ações universais**: Concentrar chakra, Substituição, Usar item (ver [tecnicas.md](tecnicas.md#ações-universais)).

## Rolagem de acerto

Toda técnica de dano rola uma roleta de três fatias: **crítico**, **acerto** e **erro**.

```
chance_acerto  = clamp(precisão_da_técnica + bônus_de_acerto − penalidades, 5%, 100%)
chance_crítico = min(50%, 5% + diferencial_de_dano_% + bônus_de_crítico_da_técnica, chance_acerto)

r = rng() × 100
r < chance_crítico  → crítico
r < chance_acerto   → acerto
senão               → erro (dano 0)
```

- Precisão padrão de uma técnica: **85%**. Cada técnica tem a sua (ver a ficha em [tecnicas.md](tecnicas.md)).
- Penalidades comuns: Atordoado −10, passiva Yamanaka −10 nos ataques do vilão. A névoa do Zabuza multiplica a chance de **erro** por 1,5.
- Técnicas com vários golpes rolam um acerto **por golpe**.
- Genjutsu usa uma rolagem própria (ver [efeitos.md](efeitos.md#efeitos-de-genjutsu)) e não tem crítico.
- O crítico garantido (Foco) pula a roleta: o golpe é crítico.

## Dano

Cada técnica tem um `tipo` (taijutsu, ninjutsu ou genjutsu).

### Dano do jogador

```
defesa     = atributo_defensivo_do_vilão[tipo] × (1 − penetração)
dif_status = atributo_ofensivo_do_jogador[tipo] − defesa
bruto      = dano_base_da_técnica + bônus_de_dano + dif_status
dano       = max(1, bruto × mult_elemento × mult_crítico × outros_mult)
```

- `bônus_de_dano`: ferramenta ninja e similares.
- `penetração`: da técnica, do sapo, da passiva Hyuuga. Somam, com teto de 60%.
- `outros_mult`: portões, manto, expansão, pavor etc.

### Dano dos vilões

```
resistência[tipo] = max(piso_de_resistência, atributo_do_jogador[tipo] / 2) + diferencial_de_resistência
dano = max(1, dano_base_do_vilão × mult_elemento × mult_crítico × outros_mult − resistência[tipo])
```

- `diferencial_de_resistência` começa em **1**.
- `piso_de_resistência`: **2** para todos (evita resistência zero em quem tem o status zerado). O prodígio do taijutsu tem piso 4 em ninjutsu e genjutsu pela passiva.

### Multiplicadores

| Multiplicador | Valor |
|---|---|
| Crítico | ×2 |
| Elemento em vantagem | ×1,5 |
| Elemento em desvantagem | ×0,75 |
| Neutro | ×1 |

Valores arredondados para baixo (`Math.floor`) no fim do cálculo. Um ataque que acerta causa no mínimo **1** de dano.

## Elementos

- Ciclo: **fogo > vento > raio > terra > água > fogo**.
- Taijutsu é sempre neutro.
- Técnicas elementais só podem ser aprendidas no próprio elemento (afinidade ou elemento secundário).
- Cada vilão tem um elemento fixo (ver [viloes.md](viloes.md)).

## Chakra

- Ninjutsu, genjutsu, ativas e algumas técnicas de taijutsu custam chakra. Sem chakra suficiente, a ação fica indisponível.
- Taijutsu básico é grátis.
- **Concentrar chakra** (ação universal) recupera chakra gastando o turno.
- Vilões também têm reserva de chakra e sorteiam a técnica só entre as que podem pagar (ver [viloes.md](viloes.md)).

## Vontade do Fogo (revive)

- Ao chegar a 0 de HP com uma Vontade do Fogo, ela é consumida e o jogador volta à luta com HP e chakra cheios e sem efeitos negativos.
- Sem nenhuma: fim da run. No exame chunin a derrota não consome o item nem encerra a run (ver [campanha.md](campanha.md#exame-chunin)).
- Como conseguir: [itens.md](itens.md).