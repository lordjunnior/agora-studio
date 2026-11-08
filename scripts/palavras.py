# Word timings for a narration: faster-whisper with word timestamps, prompted with the script so names and numbers
# come out spelled the way the script writes them.
# uso: python scripts/palavras.py voz.wav roteiro.txt words.json [idioma, padrão pt]
# 1ª vez: python -m pip install faster-whisper numpy  (precisa do ffmpeg no PATH)
# Output: [{"w": word, "s": start s, "e": end s}, ...]. Hand-fix anything odd before timing shots to it.
import json, re, subprocess, sys
sys.stdout.reconfigure(encoding="utf-8")
import numpy as np
from faster_whisper import WhisperModel

wav, script, out = sys.argv[1:4]
lang = sys.argv[4] if len(sys.argv) > 4 else "pt"
# decode with ffmpeg (any format the user sends) to 16 kHz mono float: faster-whisper's own PyAV decoder breaks on new PyAV
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", wav, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
audio = np.frombuffer(raw, np.float32)
text = open(script, encoding="utf-8").read().split("---")[0]
lines = text.splitlines()
text = " ".join(l for l in (lines[2:] if lines and lines[0].isupper() else lines) if l.strip())
if lang == "en":
    model = WhisperModel("medium.en", device="cpu", compute_type="int8")
    segs, _ = model.transcribe(audio, word_timestamps=True, vad_filter=True, beam_size=5)
else:
    # other languages: the multilingual medium model, unprompted (prompting "small" with the script made it hallucinate)
    model = WhisperModel("medium", device="cpu", compute_type="int8")
    segs, _ = model.transcribe(audio, word_timestamps=True, language=lang, beam_size=5, condition_on_previous_text=False)
words = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
# grafia igual à do roteiro (a legenda mostra): palavra que não existe no roteiro vira a mais parecida dele
import difflib
vocab = {v.lower(): v for v in re.findall(r"[\w']+", text)}  # hyphenated words split: "no-cloning" -> no, cloning
for w in words:
    core = re.sub(r"[^\w']", "", w["w"].lower())
    if core and core not in vocab and not core.isdigit():
        best = difflib.get_close_matches(core, list(vocab), n=1, cutoff=0.75)
        if best:
            fixed = vocab[best[0]]
            w["w"] = re.sub(r"[\w']+", lambda m: fixed if m.group(0)[0].isupper() == fixed[0].isupper() else fixed.lower(), w["w"], count=1)
json.dump(words, open(out, "w", encoding="utf-8"), indent=0)
print(len(words), "words,", words[-1]["e"] if words else 0, "s")
print(" ".join(re.sub(r"\s+", "", w["w"]) for w in words))
