#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build da LP Quirk Clinics.

Embute o conteúdo de assets/styles.css dentro do index.html.

POR QUE: uma folha de estilo externa bloqueia a renderização e custa um
round trip inteiro antes do primeiro pixel aparecer. Numa 4G lenta isso é
150-300 ms somados ao FCP e ao LCP. Esta é uma LP de tráfego pago, onde
quase todo visitante é novo — o cache separado do CSS quase não é usado,
então o round trip é puro prejuízo.

COMO USAR: edite sempre assets/styles.css (é a fonte), depois rode:

    python3 build.py

O script reescreve o bloco <style id="app-css"> do index.html. Se você
esquecer de rodar, o site simplesmente não muda — falha visível, não
silenciosa.
"""
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).parent
HTML = RAIZ / 'index.html'
CSS = RAIZ / 'assets' / 'styles.css'

ABRE = '<style id="app-css">'
FECHA = '</style><!-- /app-css -->'


def main():
    if not CSS.exists():
        sys.exit('assets/styles.css não encontrado')

    css = CSS.read_text(encoding='utf-8')
    html = HTML.read_text(encoding='utf-8')

    # As urls do CSS eram relativas a assets/; inline, passam a ser
    # relativas ao index.html, então precisam do prefixo assets/.
    #
    # A aspa é capturada num grupo nomeado e fechada por retrovisor
    # (?P=q). Sem isso, um grupo de aspas OPCIONAL retrocede para string
    # vazia, o lookahead que deveria barrar `data:` passa, e o prefixo
    # entra ANTES da aspa — gerando url(assets/'data:image/svg…) e
    # quebrando o ícone de play dos vídeos. Já aconteceu.
    padrao = re.compile(r'''url\(\s*(?P<q>["']?)(?P<v>.*?)(?P=q)\s*\)''', re.S)

    def reescreve(m):
        q, v = m.group('q'), m.group('v')
        if v.startswith(('data:', 'http://', 'https://', '//', '/', 'assets/')):
            return m.group(0)
        return 'url(' + q + 'assets/' + v + q + ')'

    css_inline = padrao.sub(reescreve, css)

    i = html.find(ABRE)
    j = html.find(FECHA)
    if i < 0 or j < 0:
        sys.exit('marcadores <style id="app-css"> … </style><!-- /app-css --> '
                 'não encontrados no index.html')

    novo = html[:i + len(ABRE)] + '\n' + css_inline.strip() + '\n' + html[j:]
    HTML.write_text(novo, encoding='utf-8')

    print('CSS embutido no index.html')
    print('  styles.css : %6d bytes' % len(css))
    print('  index.html : %6d bytes' % len(novo))


if __name__ == '__main__':
    main()
