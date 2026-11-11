# Plataforma

O que vale para os dois modos fora das regras do jogo: offline e instalação, acessibilidade e o que acontece quando algo falha. O visual está em [visual.md](../visual.md).

## Offline e instalação

Desde a v0.60.0 o jogo é um PWA: pode ser instalado no celular e no computador e abre sem internet.

- **Arquivos**: `manifest.webmanifest`, `sw.js` e os ícones (`icon-192.png`, `icon-512.png`, o selo 忍 em desenho próprio) saem do build ao lado da página ([prototype/pwa/LEIAME.md](../../prototype/pwa/LEIAME.md)). O service worker é `prototype/sw.ts`.
- **Página**: vem da rede primeiro e a cópia fica guardada. Online, a versão nova chega no próximo acesso, sem ninguém ficar preso numa versão antiga; sem rede, abre a cópia. `?seed=` e `index.html` abrem a mesma cópia.
- **Imagens**: do cache, depois de vistas uma vez. Sem a imagem (offline e nunca vista), o jogo usa o desenho em SVG, como sempre.
- **Cache**: um por versão (`ninja-roleta-<versão>`); ativar uma versão apaga as antigas. O GitHub Pages divide a origem com outros projetos, então o service worker só responde dentro do próprio escopo e só apaga caches com o prefixo dele.
- Aberto como arquivo (`dist/prototipo.html`, endereço `file:`), não há service worker: o arquivo único já funciona sem rede.
- O que é salvo no aparelho (perfil, histórico, Jornada) não muda: continua no `localStorage`.

## Acessibilidade

- **Dicas** (`tip()`): pela regra do projeto, efeitos, regras e o motivo de um bloqueio ficam na dica. Por isso ela abre por todos os caminhos: passar o mouse, segurar o dedo, **tocar num botão bloqueado** e **receber o foco pelo teclado** (Tab). Chips, selos e linhas com dica recebem foco sozinhos (fora de botões, que já recebem). A dica aberta é lida pelo leitor de tela (`aria-describedby`); Escape fecha.
- **Troca de tela**: o foco vai para o começo da tela nova (antes ficava num botão que saiu da tela).
- **Janelas** (Ficha, Registro, relíquias, loja, árvore, moveset): diálogo modal; o foco entra, o Tab fica dentro, Escape fecha (o mesmo caminho do botão Fechar, então o moveset sem salvar descarta as mudanças, como o botão) e o foco volta a quem abriu.
- **Roletas**: o resultado é lido pelo leitor de tela. Com **menos movimento** pedido pelo aparelho (`prefers-reduced-motion`), a roleta para direto no resultado, sem esperar o giro, e as cenas ficam paradas.
- Botões só com ícone têm nome: nós do mapa do Caminho Ninja (o tipo da parada; no chefe, o nome dele), jokenpô e cartas do jogo da memória.

## Quando algo falha

- **Uma tela quebra** (exceção no meio do fluxo): aparece "Um jutsu falhou", com o detalhe recolhido para relatar, e o botão **Voltar ao Portão**. A Jornada salva fica como estava; a run do Roleta em andamento conta como abandonada. Antes, a tela congelava sem aviso.
- **Erro fora do fluxo** (um clique, uma animação): a tela segue, e um aviso curto aparece (no máximo um a cada 10 segundos).
- **O aparelho não salva** (cheio ou bloqueado) e **dados que não deu para ler**: [perfil.md](perfil.md) e [jornada/run.md](../jornada/run.md#salvamento).
