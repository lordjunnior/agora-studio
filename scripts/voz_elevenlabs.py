# Narração com ElevenLabs (pago). A chave vem da variável de ambiente ELEVENLABS_API_KEY, NUNCA de um arquivo do projeto.
# uso: python scripts/voz_elevenlabs.py roteiro.txt voz.mp3 [voice_id]
#   PowerShell: $env:ELEVENLABS_API_KEY = "sua_chave"   (só nesta janela)
# Gere cada texto UMA vez (créditos). Voz clonada de pessoa real = marcar "conteúdo alterado ou sintético" no YouTube.
import json, os, sys, urllib.request

txt, out = sys.argv[1], sys.argv[2]
voice = sys.argv[3] if len(sys.argv) > 3 else os.environ.get("ELEVENLABS_VOICE_ID", "")
key = os.environ.get("ELEVENLABS_API_KEY")
if not key or not voice:
    sys.exit("Defina ELEVENLABS_API_KEY e passe o voice_id (ou ELEVENLABS_VOICE_ID).")
text = open(txt, encoding="utf-8").read().split("---")[0].strip()  # só a fala: as fontes ficam depois do ---
body = json.dumps({"text": text, "model_id": os.environ.get("ELEVENLABS_MODEL", "eleven_multilingual_v2"),
                   "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}}).encode()
req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{voice}", data=body, method="POST",
                             headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"})
with urllib.request.urlopen(req) as r, open(out, "wb") as f:
    f.write(r.read())
print("ok:", out)
