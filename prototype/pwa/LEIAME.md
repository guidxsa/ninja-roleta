# Instalação (PWA)

Arquivos do jogo instalável. O build (`npm run proto`) copia os ícones para `dist/`, gera `dist/manifest.webmanifest` e `dist/sw.js` (de `prototype/sw.ts`).

- `icon-192.png` e `icon-512.png`: a folha de Konoha em traço marfim sobre azulejo vermelho e fundo grafite. O selo fica na zona segura de 80%, então o mesmo arquivo serve de ícone `maskable` (o sistema recorta em círculo ou quadrado).
- `icon.html`: a fonte SVG, com o mesmo traçado de `icon('konoha')`. Para refazer, abra no Edge ou no Chrome sem interface:

```sh
msedge --headless=new --hide-scrollbars --window-size=512,512 --force-device-scale-factor=1 --screenshot=icon-512.png icon.html
msedge --headless=new --hide-scrollbars --window-size=192,192 --force-device-scale-factor=1 --screenshot=icon-192.png icon.html
```

Trocar por uma arte do usuário: substitua os dois PNGs com o mesmo nome e o mesmo tamanho.
