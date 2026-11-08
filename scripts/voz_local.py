# Narração GRÁTIS e offline com Piper (roda em CPU, PC fraco serve). Voz pt-BR "faber" por padrão.
# 1ª vez: python -m pip install piper-tts   (o script baixa a voz sozinho, ~60 MB)
# uso: python scripts/voz_local.py roteiro.txt voz.wav [voz]   ex. de vozes: pt_BR-faber-medium, en_US-lessac-medium
import os, sys, urllib.request, wave

txt, out = sys.argv[1], sys.argv[2]
voz = sys.argv[3] if len(sys.argv) > 3 else "pt_BR-faber-medium"
lang, nome, q = voz.split("-")
pasta = os.path.join(os.path.expanduser("~"), ".piper-vozes"); os.makedirs(pasta, exist_ok=True)
base = f"https://huggingface.co/rhasspy/piper-voices/resolve/main/{lang.split('_')[0]}/{lang}/{nome}/{q}/{voz}"
for ext in (".onnx", ".onnx.json"):
    dst = os.path.join(pasta, voz + ext)
    if not os.path.exists(dst):
        print("baixando", voz + ext); urllib.request.urlretrieve(base + ext, dst)
text = open(txt, encoding="utf-8").read().split("---")[0].strip()  # só a fala: as fontes ficam depois do ---
from piper import PiperVoice  # API em Python: evita erro de acento do terminal do Windows
voice = PiperVoice.load(os.path.join(pasta, voz + ".onnx"))
with wave.open(out, "wb") as wf:
    voice.synthesize_wav(text, wf)
print("ok:", out)
