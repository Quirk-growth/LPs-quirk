#!/usr/bin/env python3
"""
Gera os criativos da Calculadora Quirk Clinics.

Compõe em HTML e renderiza com Chrome headless, em vez de desenhar a tipografia
num gerador de imagem. O motivo é fidelidade de marca: assim a Sora e a Inter
são as fontes reais do projeto, o azul é o #4A8FE8 exato e o logo é o arquivo,
não uma reconstrução. Gerador de imagem erra texto e inventa logo.

    python3 gerar.py          # todas as peças
    python3 gerar.py A2 B1    # só as citadas
"""
import json
import pathlib
import subprocess
import sys

AQUI = pathlib.Path(__file__).resolve().parent
RAIZ = AQUI.parent
FONTES = RAIZ / 'calculadora-clinics' / 'assets' / 'fonts'
LOGO = RAIZ / 'calculadora-clinics' / 'assets' / 'img' / 'logo-quirk.webp'
FOTOS = AQUI / 'fotos'
SAIDA = AQUI / 'saida'
TMP = AQUI / '.html'

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

# Tokens da identidade Clinics (light). Não são os da Growth, que é dark.
AZUL, AZUL_DEEP, TINTA, MUDO, LINHA = '#4A8FE8', '#2F6FC4', '#0A0A0A', '#5C6373', '#E4E8EF'

# `pad_bot` existe por causa da interface do Instagram, não por estética: no
# story, a barra de resposta come os ~260px de baixo. Com o rodapé colado no
# fim, o CTA e o logo ficam atrás dela. A foto também desce para não sobrar um
# vão morto de branco entre o texto de apoio e o CTA.
FORMATOS = {
    'feed':  {'w': 1080, 'h': 1350, 'foto_h': 772,  'pad_top': 56,
              'pad_bot': 60,  'h1': 60, 'apoio': 27, 'eyebrow': 20},
    'story': {'w': 1080, 'h': 1920, 'foto_h': 1050, 'pad_top': 72,
              'pad_bot': 300, 'h1': 68, 'apoio': 30, 'eyebrow': 22},
}


def pagina(peca: dict, fmt: dict) -> str:
    foto = (FOTOS / peca['foto']).as_uri()
    return f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>
@font-face{{font-family:'Inter';font-weight:100 900;font-display:block;
  src:url('{(FONTES / "inter-var-latin.woff2").as_uri()}') format('woff2');}}
@font-face{{font-family:'Sora';font-weight:100 800;font-display:block;
  src:url('{(FONTES / "sora-var-latin.woff2").as_uri()}') format('woff2');}}

*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{fmt['w']}px;height:{fmt['h']}px;overflow:hidden}}
body{{background:#fff;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}}

.peca{{position:relative;width:{fmt['w']}px;height:{fmt['h']}px;display:flex;flex-direction:column}}

.foto{{position:relative;height:{fmt['foto_h']}px;flex:0 0 {fmt['foto_h']}px;overflow:hidden}}
.foto img{{width:100%;height:100%;object-fit:cover;display:block;
  filter:brightness({peca['brilho']}) saturate(.94)}}
/* Véu azul levíssimo: costura a foto à paleta sem virar filtro chapado. */
.foto::after{{content:'';position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(74,143,232,.10) 0%,rgba(74,143,232,.04) 55%,rgba(255,255,255,.55) 100%)}}

.texto{{flex:1;background:#fff;padding:{fmt['pad_top']}px 72px 0;display:flex;flex-direction:column}}

.eyebrow{{font-size:{fmt['eyebrow']}px;font-weight:600;letter-spacing:.16em;
  text-transform:uppercase;color:{AZUL_DEEP};margin-bottom:22px}}

h1{{font-family:'Sora','Inter',sans-serif;font-weight:700;font-size:{round(fmt['h1'] * peca.get('escala_h1', 1)) }px;
  line-height:1.12;letter-spacing:-.025em;color:{TINTA};margin-bottom:26px}}
h1 b{{font-weight:700;color:{AZUL}}}

.apoio{{font-size:{fmt['apoio']}px;line-height:1.5;color:{MUDO};max-width:30ch}}

.rodape{{margin-top:auto;padding-top:52px;padding-bottom:{fmt['pad_bot']}px;
  display:flex;align-items:center;gap:20px}}
.cta{{display:inline-flex;align-items:center;gap:12px;background:{AZUL};color:#fff;
  font-weight:600;font-size:{fmt['apoio']}px;padding:22px 38px;border-radius:999px;white-space:nowrap}}
.marca{{margin-left:auto;display:flex;align-items:center;gap:11px}}
.marca img{{width:42px;height:42px}}
.wm{{font-family:'Sora','Inter',sans-serif;font-weight:300;font-size:26px;
  letter-spacing:-.01em;color:{TINTA};line-height:1;white-space:nowrap}}
.wm strong{{font-weight:500}}
.wm span{{color:{AZUL_DEEP}}}
</style></head><body>
<div class="peca">
  <div class="foto"><img src="{foto}" alt=""></div>
  <div class="texto">
    <p class="eyebrow">{peca['eyebrow']}</p>
    <h1>{peca['headline']}</h1>
    <p class="apoio">{peca['apoio']}</p>
    <div class="rodape">
      <span class="cta">{peca['cta']}</span>
      <span class="marca">
        <img src="{LOGO.as_uri()}" alt="">
        <span class="wm"><strong>Quirk</strong><span>Clinics</span></span>
      </span>
    </div>
  </div>
</div>
</body></html>"""


def renderiza(nome: str, peca: dict, chave: str, fmt: dict) -> pathlib.Path:
    TMP.mkdir(exist_ok=True)
    SAIDA.mkdir(exist_ok=True)
    html = TMP / f'{nome}-{chave}.html'
    html.write_text(pagina(peca, fmt), encoding='utf-8')
    png = SAIDA / f'{nome}-{chave}-{fmt["w"]}x{fmt["h"]}.png'
    subprocess.run([
        CHROME, '--headless', '--disable-gpu', '--hide-scrollbars',
        '--allow-file-access-from-files', '--force-device-scale-factor=1',
        '--default-background-color=ffffffff',
        f'--window-size={fmt["w"]},{fmt["h"]}',
        f'--screenshot={png}', '--virtual-time-budget=4000',
        html.as_uri(),
    ], check=True, capture_output=True)
    return png


def main() -> None:
    pecas = json.loads((AQUI / 'copy.json').read_text(encoding='utf-8'))
    alvos = sys.argv[1:] or list(pecas)
    for nome in alvos:
        for chave, fmt in FORMATOS.items():
            png = renderiza(nome, pecas[nome], chave, fmt)
            print(f'  {png.name}')


if __name__ == '__main__':
    main()
