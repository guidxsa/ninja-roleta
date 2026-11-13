# Roteiro de luta e marcos da história

> Infraestrutura na v0.66.0; História canônica e os recursos de `knock`, condição de marca, forma temporária e técnica sorteada na v0.67.0. Código em `src/core/jornada/script.ts`; marcos em `src/data/jornada/campaigns.ts`. Os momentos de cada luta estão em [historia.md](historia.md#momentos-canônicos).

A História separa dois tipos de progressão:

- **Progressão narrativa obrigatória**: o que o mangá garante que acontece. O Rasengan existe para finalizar o Kabuto, a Kyuubi se libera contra o Haku. Isso vem da campanha, não de escolha do jogador.
- **Progressão de personalização**: como o personagem se desenvolve. Isso vem da árvore de talentos, das relíquias e do moveset ([talentos.md](talentos.md)).

A árvore decide *como* o personagem cresce, nunca *se* os acontecimentos fundamentais da obra acontecem.

## Marcos

Um marco é uma técnica que a campanha dá a um personagem, protagonista ou aliado, sem passar pela árvore (`grants` na campanha).

- Fica preso a um **estágio** (índice contando do 0: estágio 1 é o Exame) ou a uma **parada** (vale depois que ela passa).
- Hoje: o Sasuke aprende o Chidori no Exame (era o antigo `stageTechniques`).
- Marco novo do protagonista entra no moveset se houver espaço; senão fica disponível na tela de moveset.
- Os marcos valem só na História. O Caminho Ninja não tem cânone a seguir.
- Um evento também pode ensinar uma técnica ao protagonista: efeito `learn` ([run.md](run.md#eventos)).

## Roteiro de luta

Uma parada de luta pode ter um `script`: uma lista de regras **quando → faça**. Tudo é declarado no dado da parada; nenhuma luta tem código próprio.

### Quando (gatilhos)

| Gatilho | Dispara quando |
|---|---|
| `start` | a luta abre, antes de qualquer turno |
| `round` | a rodada N começa (ou já passou) |
| `hpBelow` | o HP de um lutador fica em X% ou menos |
| `down` | um lutador cai |
| `tech` | uma técnica é usada (por qualquer um, ou só por quem for indicado) |

O motor confere as regras em pontos fixos: abertura da luta, toda perda de HP, toda virada de rodada e logo depois de cada técnica. Cada regra dispara **uma vez** por luta, na ordem do dado; uma regra que derruba alguém já dispara as de queda na mesma checagem.

Uma regra pode ter a condição **`if: { flag }`**: só vale com aquela marca na run (o selo do Sasuke só desperta depois do Orochimaru).

### Faça (ações)

| Ação | Efeito |
|---|---|
| `say` | fala de um personagem no banner e no histórico da luta (o texto fica em `strings/jornada.ts`, `script`). Com `narrator`, a fala sai sem nome |
| `knock` | o lutador cai pelo roteiro, sem ser derrotado (o Sasuke protegendo o Naruto do Haku) |
| `form` | liga uma **forma** do lutador (veja abaixo) |
| `enter` | um lutador da reserva entra na luta |
| `leave` | um lutador sai da luta sem ninguém no lugar (o Gamabunta vai embora depois da cabeçada no Shukaku) |
| `replace` | um lutador sai e outro da reserva entra no lugar: a troca de fase |
| `heal` | cura uma fração do HP máximo |
| `flag` | deixa uma marca na run, para eventos e paradas seguintes |
| `end` | encerra a luta com o resultado declarado (vitória ou derrota roteirizada) |

- A **reserva** sai do próprio roteiro: todo lutador citado em `enter` ou `replace` é montado com a força da run (inimigos) ou a ficha da run (aliados), um por ação (três mercenários iguais entram como três).
- A mesma forma não liga duas vezes no mesmo lutador. Depois que a luta acabou, uma regra que também a encerraria não dispara (duas saídas para o mesmo fim não repetem as falas).
- Quem **sai** por `replace` não volta nem conta para a vitória. Quem **entra** pelo roteiro é convidado: luta, mas não vira membro da equipe depois.
- O lutador que entra age a partir da rodada seguinte.

### Formas

A ficha de um personagem ou inimigo pode declarar **formas** (`forms`): transformações que o roteiro liga.

- Uma forma pode multiplicar ataques e resistências, multiplicar o HP máximo (o HP atual acompanha a proporção), trocar as técnicas e a passiva, **somar técnicas** enquanto dura, curar ao entrar e trocar o retrato.
- Pode ser **temporária** (`turns`): conta os turnos de quem a usa e, no fim, volta à ficha de antes.
- Pode trazer **modificadores** (`mods`): dano × um fator e, uma vez, 1 de HP em vez de cair (a determinação da promessa ao Neji ou do "você é meu amigo" no Vale).
- Hoje: o chakra da Kyuubi do Naruto (permanente na luta contra o Haku; 3 turnos contra o Orochimaru e o Neji), o manto de uma cauda (Vale do Fim), o selo amaldiçoado do Sasuke (4 turnos) e o selo nível 2 (Vale do Fim).

### Técnica sorteada

Uma técnica pode ter **`roll`**: ao usar, paga o custo dela e sorteia uma variante pelo peso; o efeito e o alvo são os da variante. Os talentos mexem nos pesos (`rollWeights`, um peso a mais ou a menos por variante; peso 0 ou menos sai do sorteio). Hoje: o Kuchiyose no Jutsu do Naruto.

## Condições de vitória

Além das que já existiam ([historia.md](historia.md#vitórias-especiais)):

- **Finalizador** (`finisher`): o alvo só cai com uma técnica. Um golpe fatal de outra técnica deixa o alvo com 1 de HP. A tela mostra o objetivo ("Kabuto só cai com o Rasengan"). A técnica entra na luta mesmo fora do moveset, e a IA (aliados e simulação) a usa com o alvo a 30% ou menos, concentrando chakra se faltar.

- **Derrota inevitável** (`inevitableLoss` na parada, v0.68.0): qualquer fim de luta conta como progresso; não gasta Vontade do Fogo nem encerra a run, e a recompensa da luta continua. A tela mostra "Derrota" com a lição da parada.

## Exemplo: o teste do sino

O teste do sino é uma derrota inevitável: o Kakashi abre a luta com uma fala e deixa a marca `bellsLesson`; com ele a 50% (Substituição: "foi só um tronco") ou na rodada 4, a luta termina em derrota roteirizada. A marca carimba a raiz do ramo Laços (`grantedBy`).
