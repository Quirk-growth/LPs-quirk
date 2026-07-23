#!/bin/bash
# Sincroniza as páginas do projeto LP -> pasta no Desktop.
# Roda sempre que editar qualquer HTML/asset pra manter as duas cópias iguais.
#
# Uso:  ./sync_desktop.sh

set -e

SRC="/Users/renanreal/lp-quirk-auto-ads"
DEST="/Users/renanreal/Desktop/Quirk Auto Ads - Páginas"

mkdir -p "$DEST/assets/img/onboarding"

# HTMLs
cp "$SRC"/*.html "$DEST/"

# Assets (CSS + imagens) preservando estrutura
cp "$SRC/assets/styles.css" "$DEST/assets/"
cp "$SRC/assets/img/"*.png "$SRC/assets/img/"*.svg "$SRC/assets/img/"*.jpg "$DEST/assets/img/" 2>/dev/null || true
cp "$SRC/assets/img/onboarding/"*.png "$DEST/assets/img/onboarding/" 2>/dev/null || true

echo "✓ Sincronizado para: $DEST"
echo "  HTMLs:    $(ls -1 "$DEST"/*.html | wc -l | tr -d ' ')"
echo "  Prints:   $(ls -1 "$DEST/assets/img/onboarding/"*.png 2>/dev/null | wc -l | tr -d ' ')"
