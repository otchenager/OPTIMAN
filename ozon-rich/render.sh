#!/bin/sh
# Render rich-content banners via headless Chrome; needs `python -m http.server 8765` in repo root.
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
OUT="$(cd "$(dirname "$0")" && pwd -W)/out"
render() { # slide variant width height
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --virtual-time-budget=4000 --window-size=$3,$4 \
    --screenshot="$OUT/$1-$2.png" "http://127.0.0.1:8765/ozon-rich/render.html?s=$1&v=$2" 2>/dev/null
}
render banner d 1440 720;      render banner m 1080 1350
render numeri d 1440 560;      render numeri m 1080 1340
render formula d 1440 740;     render formula m 1080 1760
render disciplina d 1440 720;  render disciplina m 1080 1300
render origo d 1440 560;       render origo m 1080 1100
