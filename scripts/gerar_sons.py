# Sons do kit, 100% sintetizados aqui (sem amostra de terceiros = sem Content ID). Gera os .wav em sons/.
# uso: python scripts/gerar_sons.py [pasta_saida]
# Mix padrão: trilha -14 dB abaixo da voz, efeitos -6 dB. Coloque o efeito no quadro exato do corte/impacto.
import os, sys, wave
import numpy as np

SR = 44100
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "sons")
os.makedirs(out, exist_ok=True)
rng = np.random.default_rng(7)
t_ = lambda d: np.arange(int(SR * d)) / SR

def save(name, x, peak=0.9):
    x = np.asarray(x, np.float64); x = x / (np.max(np.abs(x)) + 1e-9) * peak
    if x.ndim == 1: x = np.stack([x, x], 1)
    with wave.open(os.path.join(out, name + ".wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype("<i2").tobytes())
    print("ok", name)

def lp(x, a):  # passa-baixa de 1 polo, a = 0..1 (maior = mais agudo)
    y = np.zeros_like(x); acc = 0.0
    for i, v in enumerate(x): acc += a * (v - acc); y[i] = acc
    return y

def env(n, at, rel):
    e = np.ones(n); a = int(at * SR); r = int(rel * SR)
    if a: e[:a] = np.linspace(0, 1, a)
    if r: e[-r:] *= np.linspace(1, 0, r) ** 2
    return e

# whoosh: ruído com filtro varrendo
d = 0.55; n = int(SR * d); x = rng.standard_normal(n); y = np.zeros(n); acc = 0.0
for i in range(n): a = 0.02 + 0.35 * np.sin(np.pi * i / n) ** 2; acc += a * (x[i] - acc); y[i] = acc
save("whoosh", y * np.sin(np.pi * t_(d) / d) ** 1.5)
# pop: seno caindo de tom
t = t_(0.12); save("pop", np.sin(2 * np.pi * (900 * t - 2500 * t * t)) * np.exp(-t * 38))
# ding: sino (parciais inarmônicos)
t = t_(1.4); save("ding", sum(a * np.sin(2 * np.pi * 1320 * k * t) * np.exp(-t * dcy) for a, k, dcy in [(1, 1, 3), (.5, 2.76, 5), (.3, 5.4, 8)]), 0.7)
# impacto: grave + estalo
t = t_(0.9); save("impacto", 1.0 * np.sin(2 * np.pi * (60 * t + 40 * np.exp(-t * 8) / 8)) * np.exp(-t * 4) + 0.6 * lp(rng.standard_normal(len(t)), 0.3) * np.exp(-t * 25))
# clique (UI)
t = t_(0.04); save("clique", rng.standard_normal(len(t)) * np.exp(-t * 180), 0.6)
# subida (riser) de 2 s
t = t_(2.0); f = 200 + 900 * (t / 2) ** 2; save("subida", (0.6 * np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * lp(rng.standard_normal(len(t)), 0.2)) * (t / 2) ** 1.5 * env(len(t), 0, 0.05), 0.7)
# surpresa: "plim" duplo subindo
t = t_(0.5); save("surpresa", np.where(t < .12, np.sin(2 * np.pi * 988 * t), np.sin(2 * np.pi * 1319 * t)) * np.exp(-((t % .12 if True else t)) * 9) * env(len(t), 0.003, 0.2), 0.6)
# trilha: 32 s em loop, curiosa e leve (pizzicato em Dó maior, 104 bpm), entra embaixo da voz
bpm = 104; beat = 60 / bpm; T = 32.0; N = int(SR * T); mix = np.zeros(N)
prog = [[60, 64, 67], [57, 60, 64], [65, 69, 72], [67, 71, 74]]  # C Am F G
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def pluck(m, dur=0.35, amp=0.5):
    tt = t_(dur); return amp * (np.sin(2 * np.pi * hz(m) * tt) + 0.3 * np.sin(4 * np.pi * hz(m) * tt)) * np.exp(-tt * 9)
step = beat / 2; k = 0; tpos = 0.0
while tpos < T - 0.4:
    ch = prog[int(tpos / (beat * 4)) % 4]; m = ch[[0, 1, 2, 1][k % 4]] + (12 if k % 8 >= 4 else 0)
    s = pluck(m); i = int(tpos * SR); mix[i:i + len(s)] += s[: N - i]
    if k % 4 == 0:
        b = pluck(ch[0] - 24, 0.6, 0.6); mix[i:i + len(b)] += b[: N - i]
    k += 1; tpos += step
fade = int(0.05 * SR); mix[:fade] *= np.linspace(0, 1, fade); mix[-fade:] *= np.linspace(1, 0, fade)
save("trilha_curiosa", lp(mix, 0.5), 0.6)
