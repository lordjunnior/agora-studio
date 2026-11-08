#!/bin/sh
# Abre o painel da Máquina Preguiça 3D no navegador: dois cliques neste arquivo.
# Na primeira vez, se o Mac disser que não pode abrir, peça pra IA: "instalar" (ela libera este atalho).
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "Falta o Node.js neste computador. Abra a conversa com a IA e diga: instalar"
  echo ""
  read -r _
  exit 1
fi
node motor/painel.js --atalho
