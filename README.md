# Ninja Roleta (nome provisório)

Jogo de browser de sessões curtas, movido a roletas, inspirado no universo ninja de Naruto.

> **Projeto de fã, sem fins lucrativos e sem afiliação oficial.**

## Estado atual

Núcleo de regras (`src/core`) com testes, uma simulação em terminal para ajustar o balanceamento e um **protótipo jogável** em HTML (`prototype/`), feito só para visualizar o jogo: roletas animadas, eventos pré-luta, combate com barras de HP/chakra, inventário, recompensas, exame chunin e histórico de runs. Não é a interface final.

**Jogar no navegador (celular ou PC):** https://guidxsa.github.io/ninja-roleta/ — atualizado automaticamente a cada push no `master`. Dá para instalar como aplicativo (o navegador oferece "Instalar" ou "Adicionar à tela inicial") e jogar sem internet depois da primeira visita ([docs/base/plataforma.md](docs/base/plataforma.md)).

## Comandos

```bash
npm install
npm test                                   # testes das regras (Vitest)
npm run typecheck                          # checagem de tipos
npm run sim -- --fights 2000 --seed 42     # simulação de balanceamento (--bare: sem eventos nem recompensas)
npm run sim:origens -- --runs 300          # campanha completa por origem, com eventos e recompensas automáticos
npm run proto                              # gera dist/prototipo.html (abre direto no navegador, funciona offline), sw.js e manifesto
```

## Reproduzir uma run

`?seed=42` na URL fixa as roletas: a mesma seed dá a mesma sequência de sorteios. É o link que o Compartilhar gera, e serve para reproduzir um bug. Exemplo: https://guidxsa.github.io/ninja-roleta/?seed=42

O laboratório de telas (UI Lab) roda só no computador de quem desenvolve: `npm run lab` gera `dist-lab/lab.html`, que abre por um servidor local (ex.: `python -m http.server 4178 --directory dist-lab`). Ele mostra cada tela do jogo num estado pronto, em várias larguras e nos dois temas, sem tocar nos saves. Ver [docs/ui-lab/ARCHITECTURE.md](docs/ui-lab/ARCHITECTURE.md).

## Estrutura

```
docs        design do jogo (regras e números de cada sistema)
src/core    regras puras: roleta, origem, iniciativa, acerto, dano, elementos, combate
src/data    números de balanceamento, linhagens, técnicas, vilões, campanha, textos (PT-BR)
src/state   histórico de runs (localStorage injetável)
src/sim     jogador automático e executor de lutas/campanha
prototype   protótipo jogável (HTML + TS), usa o core real; cenários e ícones em SVG original, retratos também por imagem
prototype/styles  design system "Shinobi": tokens, componentes e telas (CSS em camadas)
prototype/fonts   recorte de kanji em pincel (Yuji Boku); as outras fontes vêm do npm (@fontsource)
public/img  imagens opcionais que substituem os retratos (ver public/img/LEIAME.md)
public/audio  música de fundo (naruto_theme.mp3), embutida no protótipo pelo build
scripts     simulate.ts, build-prototype.ts
tests       testes do core
```

Todo número de balanceamento fica em `src/data/balance.ts` e nos arquivos de dados ao lado.

## Licença

MIT para o código. Veja o arquivo [LICENSE](LICENSE).

A licença não cobre imagens de personagens em `public/img/`: os direitos da arte são dos detentores, e ela é retirada se houver pedido.

## Versionamento

O jogo está em **0.x** (protótipo) e ainda longe do 1.0. Depois do `v0.9.0` vem o `v0.10.0`, depois `v0.11.0` e assim por diante; o número do meio pode passar de 9 quantas vezes for preciso.

- **Minor** (`v0.10.0` → `v0.11.0`): muda como se joga ou traz um sistema novo: mecânica, regra, origem ou vilão refeito, rebalanceamento de fórmulas, tela ou modo novo.
- **Patch** (`v0.10.0` → `v0.10.1`): ajuste ou complemento do que já existe: correção de bug, números, texto, documentação, polimento de interface, uma opção a mais numa tela ou na ferramenta de teste.

Cada versão do histórico tem uma tag `vX.Y.Z`. Algumas foram criadas depois, sem commit próprio ou com outro número no título do commit (quatro em 05 e 06/11/2026, duas em 14/11/2026, três em 17/11/2026):

| Tag | Commit | Observação |
|---|---|---|
| `v0.4.0` | `5cf7bff` | Sem commit próprio: entrou junto com a `v0.5.0`, então o `package.json` marca 0.5.0. |
| `v0.7.0` | `a191422` | Commit próprio da versão. |
| `v0.38.2` | `a2e4c3a` | Sem commit próprio no `master`: entrou junto com a `v0.38.3` no squash do #9, então o `package.json` marca 0.38.3. |
| `v0.47.2` | `8b09738` | Commit próprio da versão (#13). |
| `v0.74.0` | `0e04e3c` | Sem commit próprio: entrou junto com a `v0.75.0` e a `v0.76.0` no mesmo commit, então o `package.json` marca 0.76.0. |
| `v0.75.0` | `0e04e3c` | Sem commit próprio: mesmo commit da `v0.74.0` e da `v0.76.0`. |
| `v0.90.0` | `0856581` | Tag retroativa (criada em 17/11/2026): o merge da versão chegou ao `master` sem tag. |
| `v0.93.0` | `31cbef3` | Commit próprio, com o título "v0.91.0": a versão foi renumerada ao juntar as branches da fase 2 (outra branch já usava a v0.91.0). |
| `v0.93.1` | `ba8197c` | Commit próprio, com o título "v0.91.1": renumerada como a `v0.93.0`. |

O **v1.0.0** fica para quando o jogo estiver completo para quem joga:

- interface final em `src/ui` no lugar do protótipo;
- nome definitivo;
- campanha completa e balanceada, com todos os sistemas dos `docs/` implementados;
- textos visíveis em arquivos de strings, prontos para tradução.

## Histórico de versões

Em [CHANGELOG.md](CHANGELOG.md).
