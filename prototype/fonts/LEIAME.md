# Fontes embutidas

O build (`npm run proto`) embute as fontes no HTML como data URL, para o jogo funcionar offline.

| Fonte | Uso | Origem |
|---|---|---|
| Shojumaru | letreiros: logo, títulos de tela, nomes, chamada de jutsu | `@fontsource/shojumaru` (npm) |
| Zen Kaku Gothic New | texto corrido | `@fontsource/zen-kaku-gothic-new` (npm) |
| Barlow Condensed | HUD, números, rótulos, botões | `@fontsource/barlow-condensed` (npm) |
| Kalam | letra manuscrita: títulos de pergaminho, citação, nome dos modos (só o recorte latin) | `@fontsource/kalam` (npm) |
| Yuji Boku | kanji dos selos (só os usados) | `yuji-boku-kanji.woff2` (este diretório) |

Todas sob a SIL Open Font License 1.1 (`OFL-YujiBoku.txt`; as outras trazem a licença no pacote npm).

## Recorte de kanji

`yuji-boku-kanji.woff2` tem só os kanji abaixo. Para usar um kanji novo num selo, acrescente-o à lista e
baixe o recorte de novo (o Google Fonts gera o arquivo com o parâmetro `text=`):

```
運忍道録歴功手配族戦勝敗商休宝遺才修報火水風雷土体幻医術子丑寅卯辰巳午未申酉戌亥油天地謎強将話縁試賞昇装薬巻金具籍陽影一二三四史
```

```bash
K='運忍道...'  # a lista acima, completa
CSS=$(curl -sS -A 'Mozilla/5.0 Chrome/130' "https://fonts.googleapis.com/css2?family=Yuji+Boku&text=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$K")")
curl -sS -o prototype/fonts/yuji-boku-kanji.woff2 "$(echo "$CSS" | grep -o 'https://[^)]*')"
```
