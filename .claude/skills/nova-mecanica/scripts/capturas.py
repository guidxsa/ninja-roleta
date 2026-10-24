"""Capturas do protótipo em largura de celular (360px), com o Edge headless.

Uso (da raiz do repositório, depois de `npm run proto`):
    python .claude/skills/nova-mecanica/scripts/capturas.py --out <pasta> [--difficulty hard] [--telas origem,mapa,ficha,luta]

Gera <pasta>/<tela>.png. Cada tela é o dist/prototipo.html com um script que liga o modo
instantâneo e clica até chegar lá. Edite TELAS se os seletores do protótipo mudarem.
"""
import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

EDGE_CANDIDATES = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
]

# Passos em JS executados depois que a tela de origem termina (modo instantâneo). `w(ms)` espera.
TELAS = {
    "origem": "",
    "mapa": "document.querySelector('[data-choice=start]').click();await w(400);",
    "ficha": "document.querySelector('[data-choice=start]').click();await w(400);"
             "document.getElementById('sheet-btn').click();",
    "luta": "document.querySelector('[data-choice=start]').click();await w(400);"
            "document.querySelector('[data-choice=go]').click();await w(1500);"
            "document.querySelector('#cta [data-choice=go]')?.click();await w(800);",
    # Joga rodadas (Concentrar chakra) até o vilão atacar e o painel de reação aparecer.
    "reacao": "document.querySelector('[data-choice=start]').click();await w(400);"
              "document.querySelector('[data-choice=go]').click();await w(1500);"
              "document.querySelector('#cta [data-choice=go]')?.click();await w(800);"
              "for(let i=0;i<8&&!document.querySelector('.react-box');i++){"
              "document.querySelector('[data-tab=special]')?.click();await w(100);"
              "document.querySelector('#actions [data-choice=rest]:not([disabled])')?.click();await w(1500);}",
}


def browser() -> str:
    for p in EDGE_CANDIDATES:
        if os.path.exists(p):
            return p
    sys.exit("Nenhum Edge/Chrome encontrado; ajuste EDGE_CANDIDATES.")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dist", default="dist/prototipo.html")
    ap.add_argument("--out", required=True, help="pasta de saída (use o scratchpad)")
    ap.add_argument("--difficulty", default="normal")
    ap.add_argument("--telas", default=",".join(TELAS))
    ap.add_argument("--largura", type=int, default=360)
    args = ap.parse_args()

    out = Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)
    html = Path(args.dist).read_text(encoding="utf-8")
    settings = json.dumps({"instant": True, "difficulty": args.difficulty})
    pre = f"<script>try{{localStorage.setItem('proto_settings_v1',{json.dumps(settings)})}}catch(e){{}}</script>"
    exe = browser()

    for tela in args.telas.split(","):
        steps = TELAS[tela]
        js = ("<script>(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));await w(2500);"
              + steps + "})()</script>")
        page = out / f"{tela}.html"
        page.write_text(html.replace("<head>", "<head>" + pre, 1).replace("</body>", js + "</body>"), encoding="utf-8")
        # Iframe: o headless tem largura mínima de janela, então a largura de celular vem do iframe.
        frame = out / f"_frame_{tela}.html"
        frame.write_text(
            f'<!doctype html><body style="margin:0;background:#888"><iframe src="{page.name}" '
            f'style="width:{args.largura}px;height:1000px;border:0;display:block"></iframe></body>',
            encoding="utf-8",
        )
        png = out / f"{tela}.png"
        subprocess.run(
            [exe, "--headless=new", "--disable-gpu", "--window-size=800,1000",
             "--virtual-time-budget=9000", f"--screenshot={png}", frame.as_uri()],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60,
        )
        print(png if png.exists() else f"falhou: {tela}")


if __name__ == "__main__":
    main()
