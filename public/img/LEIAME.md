# Imagens: retratos e ilustrações

Coloque aqui imagens para substituir os retratos desenhados do jogo e preencher as vagas de ilustração. A arte oficial é permitida nos retratos de personagens e nas ilustrações de `cenas/` ([docs/visual.md](../../docs/visual.md)). Os direitos dessas imagens são dos detentores, não entram na licença MIT do código e a imagem é retirada se houver pedido. Tudo que entra aqui fica público no repositório e no jogo.

Formatos: `.webp` (preferido), `.png`, `.jpg` ou `.svg`. Retratos: quadrados, de 256×256 e até cerca de 30 KB, com o rosto na parte de cima. Ilustrações de `cenas/`: horizontais, cerca de 800×500 (miniaturas de capítulo, 240×160), até cerca de 120 KB. Depois de adicionar, rode `npm run proto`.

| Pasta | Nome do arquivo | Onde aparece |
|---|---|---|
| `jornada/` | id da personagem ou do inimigo na Jornada (abaixo) | toda a Jornada |
| `viloes/` | id do vilão: `mizuki`, `haku`, `zabuza`, `examSand`, `examSound`, `examLeaf`, `gaara`, `jirobo`, `kidomaru`, `tayuya`, `sakon`, `kabuto`, `orochimaru` | ficha do vilão, mapa e luta do Roleta; inimigos da Jornada sem arquivo próprio |
| `cenas/` | ilustrações: `portao`, `jornada`, `modo-jornada`, `modo-roleta` e os capítulos `waves`, `exam`, `retrieval`, `g1`, `g2`, `g3` | destaque do Portão, banner da Jornada, cards de modo e card de progresso ([docs/visual.md](../../docs/visual.md#vagas-de-ilustração)) |
| `ninja/` | id da linhagem: `common`, `akimichi`, `inuzuka`, `uchiha`, `hyuuga`, `taijutsuProdigy`, `uzumaki`, `senju`; ou `ninja` para todas | retrato do jogador |

**Primeiros arquivos do piloto**, em `jornada/`: `naruto`, `sasuke`, `sakura` e `kakashi`.

**Demais ids da Jornada:**

- Equipe: `jiraiya`, `tsunade`, `lee`, `gaaraAlly`, `shikamaru`, `choji`, `kibaAlly`, `nejiAlly`
- Inimigos: `mizuki`, `zabuza`, `haku`, `gozu`, `meizu`, `dosu`, `zaku`, `kin`, `kabutoSpy`, `kiba`, `akamaru`, `neji`, `gaara`, `orochimaru`, `kabuto`, `sasukeHospital`, `jirobo`, `kidomaru`, `tayuya`, `sakon`, `kimimaro`, `sasukeFinal`

Exemplo: `public/img/jornada/naruto.webp`. Sem o arquivo, o desenho em SVG continua valendo.
