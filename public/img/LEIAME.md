# Imagens: retratos e ilustrações

Coloque aqui imagens para substituir os retratos desenhados do jogo e preencher as vagas de ilustração. A arte oficial é permitida nos retratos de personagens e nas ilustrações de `cenas/` ([docs/visual.md](../../docs/visual.md)). Os direitos dessas imagens são dos detentores, não entram na licença MIT do código e a imagem é retirada se houver pedido. Tudo que entra aqui fica público no repositório e no jogo.

Formatos: `.webp` (preferido), `.png`, `.jpg` ou `.svg`. Retratos: quadrados, de 256×256 e até cerca de 30 KB, com o rosto na parte de cima. Ilustrações de `cenas/`: horizontais, cerca de 800×500 (miniaturas de capítulo, 240×160), até cerca de 120 KB. Depois de adicionar, rode `npm run proto`.

| Pasta | Nome do arquivo | Onde aparece |
|---|---|---|
| `jornada/` | id da personagem ou do inimigo na Jornada (abaixo) | toda a Jornada |
| `viloes/` | id do vilão: `mizuki`, `haku`, `zabuza`, `examSand`, `examSound`, `examLeaf`, `gaara`, `jirobo`, `kidomaru`, `tayuya`, `sakon`, `kabuto`, `orochimaru` | ficha do vilão, mapa e luta do Roleta; inimigos da Jornada sem arquivo próprio |
| `cenas/` | ilustrações: `dia` e `noite` (Portão: o Naruto de dia, o Sasuke à noite), `jornada`, `modo-jornada`, `modo-roleta`, os arcos `waves`, `chunnin`, `sannin`, `sasuke` (equipe do resgate, arco Vale do Fim) `caminho-ninja` (card e pôster do Caminho Ninja), `g1`, `g2`, `g3` e, no Roleta do PC (opcionais), `roleta` (palco do sorteio) e `roleta-genin`, `roleta-chunin`, `roleta-jounin`, `roleta-chefe` (mapa, roletas e luta, pela categoria) | destaque do Portão, banner da Jornada, cards de modo, faixa de arcos e card de progresso. Quem liga cada vaga ao arquivo é o mapa `SCENE_ART` em `prototype/art.ts` ([docs/visual.md](../../docs/visual.md#vagas-de-ilustração)) |
| `ninja/` | id da linhagem: `common`, `akimichi`, `inuzuka`, `uchiha`, `hyuuga`, `taijutsuProdigy`, `uzumaki`, `senju`; ou `ninja` para todas | retrato do jogador |

**Cenas animadas** (`cenas/`, opcionais): ponha um vídeo com o mesmo nome da imagem (`dia.webm`, de preferência, ou `.mp4`): sem som, 6 a 10 s em loop, até 1280×720 e cerca de 3 MB. Deixe também a imagem estática com o mesmo nome: ela é o modo **Leve** (o padrão) e a capa do vídeo. Quando há vídeo, aparece o botão **Animado** na barra superior; com movimento reduzido no aparelho, fica sempre a imagem. GIF e WebP animado também funcionam, mas animam sempre (nos dois modos) e pesam bem mais.

**Texturas da interface** (`ui/`, opcionais): `papel` (fundo dos pergaminhos), `madeira` (rolos e barra lateral do PC), `pincel` (máscara das pinceladas: forma em preto com fundo transparente) e `fundo` (textura da página). Use imagens que repitam bem, de cerca de 512×512. Sem elas, vale o desenho do CSS.

**Imagens provisórias**: as vagas de `cenas/` sem arte própria vêm com um `.svg` genérico. Os estágios do Caminho Ninja (`g1`, `g2`, `g3`) têm uma arte simples, sem texto: estrada ao entardecer, vila em guerra e o vale do Som à noite. Para trocar, ponha a sua imagem com o mesmo nome (`.webp`, `.png` ou `.jpg`), apague o `.svg` e rode `npm run proto`.

**Primeiros arquivos do piloto**, em `jornada/`: `naruto`, `sasuke`, `sakura` e `kakashi`.

**Demais ids da Jornada:**

- Equipe: `jiraiya`, `tsunade`, `lee`, `gaaraAlly`, `shikamaru`, `choji`, `kibaAlly`, `nejiAlly`
- Inimigos: `mizuki`, `zabuza`, `haku`, `gozu`, `meizu`, `dosu`, `zaku`, `kin`, `kabutoSpy`, `kiba`, `akamaru`, `neji`, `gaara`, `orochimaru`, `kabuto`, `sasukeHospital`, `jirobo`, `kidomaru`, `tayuya`, `sakon`, `kimimaro`, `sasukeFinal`

Exemplo: `public/img/jornada/naruto.webp`. Sem o arquivo, o desenho em SVG continua valendo.
