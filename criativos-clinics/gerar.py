#!/usr/bin/env python3
"""
Gera os criativos da Calculadora Quirk Clinics.

Compõe em HTML e renderiza com Chrome headless, em vez de desenhar a tipografia
num gerador de imagem. O motivo é fidelidade: assim a Inter é a fonte real do
projeto, o azul é o #4A8FE8 exato e o logo é o arquivo, não uma reconstrução.
Gerador de imagem erra grafia em português e inventa logo.

O layout é lavrado em cima da LP (clinics/assets/styles.css), não inventado:
grade de 64px em rgba(74,143,232,.06) mascarada por radial, lavagens radiais,
badge-pílula com bolinha, linha-assinatura e CTA em degradê 135°.

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

# Identidade Clinics (light) — não é a Growth, que é dark.
AZUL, DEEP, SOFT = '#4A8FE8', '#2F6FC4', '#E8F1FE'
TINTA, MUDO, LINHA, FUNDO = '#0A0A0A', '#5C6373', '#E4E8EF', '#F8FAFE'

# A LP usa INTER nos títulos; Sora aparece só no wordmark do logo. Trocar isso
# foi o que mais aproximou a peça da página.
#
# `cta_bot` existe pela interface do Instagram, não por estética: no story a
# barra de resposta come os ~300px de baixo.
FORMATOS = {
    'feed': {
        'w': 1080, 'h': 1350, 'foto_top': 56, 'foto_h': 712, 'foto_esq': 176,
        'cartao_top': 664, 'cartao_dir': 150, 'cartao_pad': 52,
        'cta_bot': 58, 'h1': 54, 'apoio': 25, 'badge': 18,
    },
    'story': {
        'w': 1080, 'h': 1920, 'foto_top': 132, 'foto_h': 1000, 'foto_esq': 176,
        'cartao_top': 1058, 'cartao_dir': 150, 'cartao_pad': 58,
        'cta_bot': 296, 'h1': 60, 'apoio': 28, 'badge': 20,
    },
}


def pagina(peca: dict, fmt: dict) -> str:
    foto = (FOTOS / peca['foto']).as_uri()
    h1 = round(fmt['h1'] * peca.get('escala_h1', 1))
    pad = fmt['cartao_pad']
    return f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>
@font-face{{font-family:'Inter';font-weight:100 900;font-display:block;
  src:url('{(FONTES / "inter-var-latin.woff2").as_uri()}') format('woff2');}}
@font-face{{font-family:'Sora';font-weight:100 800;font-display:block;
  src:url('{(FONTES / "sora-var-latin.woff2").as_uri()}') format('woff2');}}

*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{fmt['w']}px;height:{fmt['h']}px;overflow:hidden}}
body{{font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;background:{FUNDO}}}
.peca{{position:relative;width:{fmt['w']}px;height:{fmt['h']}px;overflow:hidden}}

/* Fundo: as lavagens radiais e a grade de 64px da LP, com a mesma máscara —
   é o que faz a peça parecer a página, e não um banner qualquer. */
.fundo{{position:absolute;inset:0;background:
  radial-gradient(58% 42% at -6% 14%, rgba(74,143,232,.16), transparent 62%),
  radial-gradient(52% 40% at 108% 90%, rgba(74,143,232,.12), transparent 60%),
  {FUNDO};}}
.grade{{position:absolute;inset:0;opacity:.62;background:
  linear-gradient(rgba(74,143,232,.06) 1px, transparent 1px) 0 0/64px 64px,
  linear-gradient(90deg, rgba(74,143,232,.06) 1px, transparent 1px) 0 0/64px 64px;
  -webkit-mask-image:radial-gradient(100% 70% at 50% 0%, #000 30%, transparent 78%);}}

/* O movimento vem do desencontro: a foto sangra à direita, o cartão sangra à
   esquerda e sobe por cima dela. O borrão de degradê ancora a diagonal. */
.blob{{position:absolute;left:-160px;top:{fmt['foto_top'] - 80}px;
  width:540px;height:540px;border-radius:50%;
  background:linear-gradient(135deg,{AZUL} 0%,{DEEP} 100%);
  filter:blur(85px);opacity:.30}}

.foto{{position:absolute;left:{fmt['foto_esq']}px;right:-56px;
  top:{fmt['foto_top']}px;height:{fmt['foto_h']}px;
  border-radius:30px 0 0 30px;overflow:hidden;
  box-shadow:0 28px 70px rgba(31,36,48,.14)}}
.foto img{{width:100%;height:100%;object-fit:cover;display:block;
  filter:brightness({peca['brilho']}) saturate(.95)}}
.foto::after{{content:'';position:absolute;inset:0;background:
  linear-gradient(200deg, rgba(74,143,232,.22) 0%, transparent 46%,
  rgba(255,255,255,.28) 100%)}}

.cartao{{position:absolute;left:-40px;right:{fmt['cartao_dir']}px;
  top:{fmt['cartao_top']}px;background:#fff;border:1px solid {LINHA};
  border-radius:0 30px 30px 0;padding:{pad}px {pad}px {pad}px {pad + 40}px;
  box-shadow:0 30px 80px rgba(31,36,48,.12)}}

.badge{{display:inline-flex;align-items:center;gap:9px;padding:9px 17px;
  background:{SOFT};border-radius:999px;font-size:{fmt['badge']}px;
  font-weight:600;letter-spacing:.14em;text-transform:uppercase;
  color:{DEEP};margin-bottom:24px}}
.badge i{{width:9px;height:9px;border-radius:999px;background:{AZUL};display:block}}

h1{{font-weight:700;font-size:{h1}px;line-height:1.1;letter-spacing:-.028em;
  color:{TINTA};margin-bottom:22px}}
h1 b{{font-weight:700;background:linear-gradient(100deg,{AZUL} 0%,{DEEP} 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent}}

.apoio{{font-size:{fmt['apoio']}px;line-height:1.52;color:{MUDO}}}

/* Linha-assinatura do brandbook: bloquinho preto + fio. */
.assin{{display:flex;align-items:center;gap:10px;margin:26px 0 30px}}
.assin i{{width:14px;height:6px;background:{TINTA};display:block;flex-shrink:0}}
.assin span{{flex:1;height:1px;background:{LINHA};display:block}}

.marca{{position:absolute;right:{pad + 8}px;bottom:{fmt['cta_bot']}px;
  display:flex;align-items:center;gap:11px}}
.cta{{display:inline-flex;align-items:center;background:
  linear-gradient(135deg,{AZUL} 0%,{DEEP} 100%);color:#fff;font-weight:600;
  font-size:{fmt['apoio']}px;padding:21px 36px;border-radius:999px;
  white-space:nowrap;box-shadow:0 14px 34px rgba(74,143,232,.34)}}
.marca img{{width:40px;height:40px}}
.wm{{font-family:'Sora','Inter',sans-serif;font-weight:300;font-size:25px;
  letter-spacing:-.01em;color:{TINTA};line-height:1;white-space:nowrap}}
.wm strong{{font-weight:500}}
.wm em{{font-style:normal;color:{DEEP}}}
</style></head><body>
<div class="peca">
  <div class="fundo"></div>
  <div class="grade"></div>
  <div class="blob"></div>
  <div class="foto"><img src="{foto}" alt=""></div>
  <div class="cartao">
    <span class="badge"><i></i>{peca['eyebrow']}</span>
    <h1>{peca['headline']}</h1>
    <p class="apoio">{peca['apoio']}</p>
    <div class="assin"><i></i><span></span></div>
    <span class="cta">{peca['cta']}</span>
  </div>
  <span class="marca">
    <img src="{LOGO.as_uri()}" alt="">
    <span class="wm"><strong>Quirk</strong><em>Clinics</em></span>
  </span>
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
    for nome in (sys.argv[1:] or list(pecas)):
        for chave, fmt in FORMATOS.items():
            print(f'  {renderiza(nome, pecas[nome], chave, fmt).name}')


if __name__ == '__main__':
    main()
