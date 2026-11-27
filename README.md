# Ninshu Roots

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

O laboratório de telas (UI Lab) roda só no computador de quem desenvolve: `npm run lab` gera `dist-lab/lab.html`, que abre por um servidor local (ex.: `python -m http.server 4178 --directory dist-lab`). Ele mostra cada tela do jogo num estado pronto, em várias larguras em grafite, sem tocar nos saves. Ver [docs/ui-lab/ARCHITECTURE.md](docs/ui-lab/ARCHITECTURE.md).

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

O trabalho chega à produção em duas camadas ([docs/processo/fluxo.md](docs/processo/fluxo.md)): os PRs aprovados pelos agentes entram sozinhos no `staging`, e o `staging` vai para o `master` (produção) de uma vez, quando o mantenedor aprova. O v1.0.0 está próximo e sai do staging, quando o mantenedor decidir.

- **y, release** (`v0.95.2` → `v0.96.0`): o que se acumulou no staging, testado no preview e publicado de uma vez. Junta mecânicas, telas e correções menores numa versão só.
- **z, hotfix** (`v0.96.0` → `v0.96.1`): correção urgente direto no `master`, que não espera a release.
- **x, major**: só por decisão do mantenedor (o próximo é o `v1.0.0`). Depois do `v0.9.0` veio o `v0.10.0`: o número do meio passa de 9 quantas vezes for preciso.

No staging não há versão: cada mudança traz um fragmento em `changelog.d/` que vira a linha da release no [CHANGELOG](CHANGELOG.md). O preview do staging fica em https://guidxsa.github.io/ninja-roleta/staging/ (save separado do jogo publicado).

Até a v0.95.2, cada mudança ganhava a própria versão: minor para mecânica, sistema, tela ou rebalanceamento; patch para ajuste, correção, texto ou documentação.

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

Critérios antigos do **v1.0.0**, de antes da decisão de 18/11/2026 de lançá-lo em breve a partir do staging; o mantenedor decide o que deles ainda vale ([decisões](docs/decisoes.md), item 50):

- interface final em `src/ui` no lugar do protótipo;
- nome definitivo;
- campanha completa e balanceada, com todos os sistemas dos `docs/` implementados;
- textos visíveis em arquivos de strings, prontos para tradução.

## Histórico de versões

Em [CHANGELOG.md](CHANGELOG.md).
