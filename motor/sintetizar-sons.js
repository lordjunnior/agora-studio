// Gera os sons sintetizados da biblioteca (sons/*.wav) com Web Audio no Chromium, sem nada externo.
// Rodar uma vez e ouvir antes de usar; o render só lê os arquivos prontos.
//
//   node sintetizar-sons.js            gera todos
//   node sintetizar-sons.js agua pingo só esses

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SONS = path.join(__dirname, 'sons');

// Roda dentro da página. Cada receita monta o grafo num OfflineAudioContext e devolve o WAV em base64.
function receitas() {
  const SR = 48000;
  let semente = 1;
  const rnd = () => { semente = (semente * 16807) % 2147483647; return semente / 2147483647; };

  const ruido = (ctx, dur, cor = 'branco') => {
    const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const d = b.getChannelData(0);
    let ult = 0;
    for (let i = 0; i < d.length; i++) {
      const w = rnd() * 2 - 1;
      if (cor === 'marrom') { ult = (ult + 0.02 * w) / 1.02; d[i] = ult * 3.5; } else d[i] = w;
    }
    const s = ctx.createBufferSource();
    s.buffer = b;
    return s;
  };
  const filtro = (ctx, tipo, freq, Q = 1) => { const f = ctx.createBiquadFilter(); f.type = tipo; f.frequency.value = freq; f.Q.value = Q; return f; };
  const ganho = (ctx, v = 1) => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const osc = (ctx, tipo, freq) => { const o = ctx.createOscillator(); o.type = tipo; o.frequency.value = freq; return o; };
  const env = (g, t0, ataque, pico, queda) => {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(pico, t0 + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + ataque + queda);
  };
  const liga = (...nos) => { for (let i = 0; i + 1 < nos.length; i++) nos[i].connect(nos[i + 1]); return nos[nos.length - 1]; };

  // Fita rebobinando/avançando: serra com o tom subindo e chiado
  const fita = (ctx, dur, de, ate, vel) => {
    const o = osc(ctx, 'sawtooth', de);
    o.frequency.setValueAtTime(de, 0);
    o.frequency.exponentialRampToValueAtTime(ate, dur * 0.9);
    const lfo = osc(ctx, 'square', vel), prof = ganho(ctx, de * 0.35);
    liga(lfo, prof, o.frequency);
    const g = ganho(ctx, 0);
    g.gain.setValueAtTime(0, 0);
    g.gain.linearRampToValueAtTime(0.28, 0.05);
    g.gain.setValueAtTime(0.28, dur - 0.12);
    g.gain.linearRampToValueAtTime(0, dur);
    liga(o, filtro(ctx, 'bandpass', 1400, 0.8), g, ctx.destination);
    const n = ruido(ctx, dur), gn = ganho(ctx, 0.07);
    liga(n, filtro(ctx, 'highpass', 4500), gn, ctx.destination);
    [o, lfo, n].forEach((x) => { x.start(0); x.stop(dur); });
    // Clique de fita no fim
    const c = osc(ctx, 'sine', 140), gc = ganho(ctx, 0);
    env(gc, dur - 0.08, 0.004, 0.5, 0.07);
    liga(c, gc, ctx.destination);
    c.start(dur - 0.08); c.stop(dur);
  };

  const R = {
    rebobina: { dur: 0.85, f(ctx) { fita(ctx, 0.85, 350, 2200, 26); } },
    avanca: { dur: 1.0, f(ctx) { fita(ctx, 1.0, 600, 1500, 34); } },
    congela: {
      dur: 0.7, f(ctx) {
        const o = osc(ctx, 'sine', 1400), g = ganho(ctx, 0);
        o.frequency.setValueAtTime(1400, 0);
        o.frequency.exponentialRampToValueAtTime(110, 0.4);
        env(g, 0, 0.004, 0.45, 0.5);
        liga(o, g, ctx.destination);
        const n = ruido(ctx, 0.3), gn = ganho(ctx, 0);
        env(gn, 0, 0.002, 0.5, 0.18);
        liga(n, filtro(ctx, 'bandpass', 3200, 0.7), gn, ctx.destination);
        const b = osc(ctx, 'sine', 70), gb = ganho(ctx, 0);
        b.frequency.exponentialRampToValueAtTime(40, 0.3);
        env(gb, 0, 0.005, 0.8, 0.35);
        liga(b, gb, ctx.destination);
        [o, n, b].forEach((x) => { x.start(0); x.stop(0.7); });
      }
    },
    agua: {
      dur: 8, f(ctx) {
        const n = ruido(ctx, 8, 'marrom'), g = ganho(ctx, 0.35);
        const bp = filtro(ctx, 'bandpass', 900, 0.5);
        liga(n, bp, filtro(ctx, 'lowpass', 3500), g, ctx.destination);
        [0.7, 1.3, 2.9].forEach((fr, i) => { const l = osc(ctx, 'sine', fr), p = ganho(ctx, 0.07 + i * 0.02); liga(l, p, g.gain); l.start(0); l.stop(8); });
        const n2 = ruido(ctx, 8), g2 = ganho(ctx, 0.05);
        liga(n2, filtro(ctx, 'bandpass', 2600, 1.5), g2, ctx.destination);
        n.start(0); n2.start(0);
        for (let i = 0; i < 70; i++) {
          const t = rnd() * 7.8, f0 = 350 + rnd() * 900;
          const o = osc(ctx, 'sine', f0), go = ganho(ctx, 0);
          o.frequency.setValueAtTime(f0, t);
          o.frequency.exponentialRampToValueAtTime(f0 * 1.8, t + 0.04);
          env(go, t, 0.003, 0.05 + rnd() * 0.06, 0.05);
          liga(o, go, ctx.destination);
          o.start(t); o.stop(t + 0.1);
        }
      }
    },
    pingo: {
      dur: 0.3, f(ctx) {
        const o = osc(ctx, 'sine', 520), g = ganho(ctx, 0);
        o.frequency.setValueAtTime(520, 0);
        o.frequency.exponentialRampToValueAtTime(1500, 0.05);
        env(g, 0, 0.003, 0.6, 0.13);
        liga(o, g, ctx.destination);
        o.start(0); o.stop(0.3);
      }
    },
    respingo: {
      dur: 0.8, f(ctx) {
        const n = ruido(ctx, 0.8), g = ganho(ctx, 0);
        env(g, 0, 0.004, 0.7, 0.5);
        liga(n, filtro(ctx, 'highpass', 700), filtro(ctx, 'lowpass', 6000), g, ctx.destination);
        n.start(0);
        for (let i = 0; i < 9; i++) {
          const t = 0.03 + rnd() * 0.3, f0 = 600 + rnd() * 900;
          const o = osc(ctx, 'sine', f0), go = ganho(ctx, 0);
          o.frequency.exponentialRampToValueAtTime(f0 * 1.6, t + 0.04);
          env(go, t, 0.003, 0.12, 0.06);
          liga(o, go, ctx.destination);
          o.start(t); o.stop(t + 0.12);
        }
      }
    },
    esguicho: {
      dur: 6, f(ctx) {
        const n = ruido(ctx, 6), g = ganho(ctx, 0.3);
        liga(n, filtro(ctx, 'highpass', 2200), filtro(ctx, 'peaking', 5000, 1), g, ctx.destination);
        const l = osc(ctx, 'sine', 9), p = ganho(ctx, 0.05);
        liga(l, p, g.gain);
        const n2 = ruido(ctx, 6, 'marrom'), g2 = ganho(ctx, 0.25);
        liga(n2, filtro(ctx, 'bandpass', 700, 0.7), g2, ctx.destination);
        [n, l, n2].forEach((x) => { x.start(0); x.stop(6); });
      }
    },
    mosquito: {
      dur: 4, f(ctx) {
        const o = osc(ctx, 'sawtooth', 560), g = ganho(ctx, 0.12);
        const v = osc(ctx, 'sine', 6), pv = ganho(ctx, 30);
        liga(v, pv, o.frequency);
        const tr = osc(ctx, 'sine', 0.9), ptr = ganho(ctx, 0.06);
        liga(tr, ptr, g.gain);
        liga(o, filtro(ctx, 'bandpass', 1100, 2.5), g, ctx.destination);
        [o, v, tr].forEach((x) => { x.start(0); x.stop(4); });
      }
    },
    whoosh: {
      dur: 0.7, f(ctx) {
        const n = ruido(ctx, 0.7), bp = filtro(ctx, 'bandpass', 300, 1.4), g = ganho(ctx, 0);
        bp.frequency.setValueAtTime(300, 0);
        bp.frequency.exponentialRampToValueAtTime(2600, 0.55);
        g.gain.setValueAtTime(0, 0);
        g.gain.linearRampToValueAtTime(0.6, 0.45);
        g.gain.linearRampToValueAtTime(0, 0.7);
        liga(n, bp, g, ctx.destination);
        n.start(0);
      }
    },
    bomba: {
      dur: 6, f(ctx) {
        const g = ganho(ctx, 0);
        g.gain.setValueAtTime(0, 0);
        g.gain.linearRampToValueAtTime(0.32, 0.4);
        const o1 = osc(ctx, 'sawtooth', 30), o2 = osc(ctx, 'square', 60);
        o1.frequency.exponentialRampToValueAtTime(55, 0.5);
        o2.frequency.exponentialRampToValueAtTime(110, 0.5);
        const lp = filtro(ctx, 'lowpass', 420, 2);
        o1.connect(lp); o2.connect(lp);
        liga(lp, g, ctx.destination);
        const n = ruido(ctx, 6), gn = ganho(ctx, 0.05), am = osc(ctx, 'square', 27), pam = ganho(ctx, 0.04);
        liga(am, pam, gn.gain);
        liga(n, filtro(ctx, 'bandpass', 1800, 2), gn, g);
        [o1, o2, n, am].forEach((x) => { x.start(0); x.stop(6); });
      }
    },
    estalo: {
      dur: 0.9, f(ctx) {
        [0, 0.07, 0.11, 0.24, 0.31].forEach((t, i) => {
          const n = ruido(ctx, 0.05), g = ganho(ctx, 0);
          env(g, t, 0.001, 0.9 - i * 0.12, 0.035);
          liga(n, filtro(ctx, 'bandpass', 2500 - i * 300, 1.2), g, ctx.destination);
          n.start(t);
        });
        const o = osc(ctx, 'sawtooth', 85), g = ganho(ctx, 0);
        const j = osc(ctx, 'square', 13), pj = ganho(ctx, 25);
        liga(j, pj, o.frequency);
        g.gain.setValueAtTime(0, 0);
        g.gain.linearRampToValueAtTime(0.25, 0.1);
        g.gain.linearRampToValueAtTime(0, 0.85);
        liga(o, filtro(ctx, 'bandpass', 600, 3), g, ctx.destination);
        o.start(0); o.stop(0.9); j.start(0); j.stop(0.9);
      }
    },
    // Dados correndo: blips quadrados curtos em alturas sorteadas
    bip: {
      dur: 0.7, f(ctx) {
        for (let i = 0; i < 7; i++) {
          const t = i * 0.085, f0 = [880, 1320, 1760, 1175, 2093][Math.floor(rnd() * 5)];
          const o = osc(ctx, 'square', f0), g = ganho(ctx, 0);
          env(g, t, 0.002, 0.18, 0.045);
          liga(o, filtro(ctx, 'lowpass', 5000), g, ctx.destination);
          o.start(t); o.stop(t + 0.07);
        }
      }
    },
    // Mensagem chegou: duas notas de sino
    ding: {
      dur: 1.0, f(ctx) {
        [[0, 1318.5], [0.11, 1975.5]].forEach(([t, fr]) => {
          [1, 2.76].forEach((h, i) => {
            const o = osc(ctx, 'sine', fr * h), g = ganho(ctx, 0);
            env(g, t, 0.003, i ? 0.08 : 0.4, i ? 0.15 : 0.75);
            liga(o, g, ctx.destination);
            o.start(t); o.stop(t + 0.9);
          });
        });
      }
    },
    // Mar: ruído grave subindo e descendo devagar, em loop
    ondas: {
      dur: 10, canais: 2, f(ctx) {
        [-0.5, 0.5].forEach((pan, k) => {
          const n = ruido(ctx, 10, 'marrom'), g = ganho(ctx, 0.25), p = ctx.createStereoPanner();
          p.pan.value = pan;
          const lp = filtro(ctx, 'lowpass', 700, 0.4);
          const l = osc(ctx, 'sine', 0.2 + k * 0.07), pl = ganho(ctx, 0.2);
          liga(l, pl, g.gain);
          const lf = osc(ctx, 'sine', 0.2 + k * 0.07), pf = ganho(ctx, 400);
          liga(lf, pf, lp.frequency);
          liga(n, lp, g, p, ctx.destination);
          [n, l, lf].forEach((x) => { x.start(0); x.stop(10); });
        });
        const n2 = ruido(ctx, 10), g2 = ganho(ctx, 0.04);
        liga(n2, filtro(ctx, 'highpass', 3000), g2, ctx.destination);
        n2.start(0);
      }
    },
    // Bolhas subindo debaixo d'água
    bolhas: {
      dur: 2.5, f(ctx) {
        for (let i = 0; i < 26; i++) {
          const t = rnd() * 2.2, f0 = 250 + rnd() * 600;
          const o = osc(ctx, 'sine', f0), g = ganho(ctx, 0);
          o.frequency.setValueAtTime(f0, t);
          o.frequency.exponentialRampToValueAtTime(f0 * 2.4, t + 0.06);
          env(g, t, 0.004, 0.12 + rnd() * 0.15, 0.06);
          liga(o, g, ctx.destination);
          o.start(t); o.stop(t + 0.12);
        }
        const n = ruido(ctx, 2.5, 'marrom'), gn = ganho(ctx, 0.15);
        liga(n, filtro(ctx, 'lowpass', 400), gn, ctx.destination);
        n.start(0);
      }
    },
    // Buzina grave de navio
    buzina: {
      dur: 2.2, f(ctx) {
        const g = ganho(ctx, 0);
        g.gain.setValueAtTime(0, 0);
        g.gain.linearRampToValueAtTime(0.4, 0.12);
        g.gain.setValueAtTime(0.4, 1.5);
        g.gain.linearRampToValueAtTime(0, 2.1);
        const lp = filtro(ctx, 'lowpass', 650, 1.5);
        [110, 165.5, 220.4].forEach((fr, i) => { const o = osc(ctx, 'sawtooth', fr); const go = ganho(ctx, 1 / (i + 1)); liga(o, go, lp); o.start(0); o.stop(2.2); });
        const v = osc(ctx, 'sine', 5), pv = ganho(ctx, 25);
        liga(v, pv, lp.frequency);
        v.start(0); v.stop(2.2);
        liga(lp, g, ctx.destination);
      }
    },
    // Zumbido de sala de servidores: rede elétrica + ventoinhas, em loop
    zumbido: {
      dur: 8, f(ctx) {
        [60, 120, 180].forEach((fr, i) => { const o = osc(ctx, 'sine', fr), g = ganho(ctx, 0.12 / (i + 1)); liga(o, g, ctx.destination); o.start(0); o.stop(8); });
        const n = ruido(ctx, 8), g = ganho(ctx, 0.18);
        liga(n, filtro(ctx, 'bandpass', 500, 0.6), g, ctx.destination);
        const n2 = ruido(ctx, 8), g2 = ganho(ctx, 0.03);
        liga(n2, filtro(ctx, 'bandpass', 3200, 3), g2, ctx.destination);
        n.start(0); n2.start(0);
      }
    },
    // Faísca elétrica
    zap: {
      dur: 0.5, f(ctx) {
        [0, 0.05, 0.09, 0.17].forEach((t, i) => {
          const n = ruido(ctx, 0.06), g = ganho(ctx, 0);
          env(g, t, 0.001, 0.8 - i * 0.15, 0.04);
          liga(n, filtro(ctx, 'highpass', 2500), g, ctx.destination);
          n.start(t);
        });
        const o = osc(ctx, 'square', 1800), g = ganho(ctx, 0), m = osc(ctx, 'square', 70), pm = ganho(ctx, 900);
        liga(m, pm, o.frequency);
        env(g, 0, 0.002, 0.15, 0.3);
        liga(o, filtro(ctx, 'bandpass', 2400, 2), g, ctx.destination);
        [o, m].forEach((x) => { x.start(0); x.stop(0.5); });
      }
    },
    // Aparelho desligando
    desliga: {
      dur: 0.9, f(ctx) {
        const o = osc(ctx, 'sine', 900), g = ganho(ctx, 0);
        o.frequency.setValueAtTime(900, 0);
        o.frequency.exponentialRampToValueAtTime(55, 0.7);
        g.gain.setValueAtTime(0.5, 0);
        g.gain.exponentialRampToValueAtTime(0.0001, 0.85);
        liga(o, g, ctx.destination);
        o.start(0); o.stop(0.9);
      }
    },
    // Aparelho ligando
    liga: {
      dur: 0.6, f(ctx) {
        const o = osc(ctx, 'triangle', 300), g = ganho(ctx, 0);
        o.frequency.setValueAtTime(300, 0);
        o.frequency.exponentialRampToValueAtTime(1500, 0.3);
        env(g, 0, 0.01, 0.4, 0.45);
        liga(o, g, ctx.destination);
        o.start(0); o.stop(0.6);
      }
    },
    // Brilho de luz: arpejo agudo rápido
    brilho: {
      dur: 1.1, f(ctx) {
        [84, 88, 91, 96, 100].forEach((m, i) => {
          const t = i * 0.06, fr = 440 * Math.pow(2, (m - 69) / 12);
          const o = osc(ctx, 'sine', fr), g = ganho(ctx, 0);
          env(g, t, 0.003, 0.22, 0.5);
          liga(o, g, ctx.destination);
          o.start(t); o.stop(t + 0.6);
        });
      }
    },
    // Fogo crepitando: chiado grave + estalinhos sorteados, em loop
    fogo: {
      dur: 6, f(ctx) {
        const n = ruido(ctx, 6, 'marrom'), g = ganho(ctx, 0.4);
        const l = osc(ctx, 'sine', 0.8), pl = ganho(ctx, 0.12);
        liga(l, pl, g.gain);
        liga(n, filtro(ctx, 'lowpass', 900, 0.5), g, ctx.destination);
        [n, l].forEach((x) => { x.start(0); x.stop(6); });
        for (let i = 0; i < 70; i++) {
          const t = rnd() * 5.9, c = ruido(ctx, 0.03), gc = ganho(ctx, 0);
          env(gc, t, 0.001, 0.15 + rnd() * 0.5, 0.012 + rnd() * 0.02);
          liga(c, filtro(ctx, 'bandpass', 1500 + rnd() * 3000, 1.5), gc, ctx.destination);
          c.start(t);
        }
      }
    },
    // Vapor saindo: chiado agudo que abre e fecha
    vapor: {
      dur: 2.5, f(ctx) {
        const n = ruido(ctx, 2.5), g = ganho(ctx, 0);
        g.gain.setValueAtTime(0, 0);
        g.gain.linearRampToValueAtTime(0.5, 0.15);
        g.gain.setValueAtTime(0.5, 1.9);
        g.gain.linearRampToValueAtTime(0, 2.5);
        const bp = filtro(ctx, 'bandpass', 5200, 0.9);
        const l = osc(ctx, 'sine', 3), pl = ganho(ctx, 900);
        liga(l, pl, bp.frequency);
        liga(n, filtro(ctx, 'highpass', 2500), bp, g, ctx.destination);
        [n, l].forEach((x) => { x.start(0); x.stop(2.5); });
      }
    },
    // Turbina acelerando: tom subindo com ronco por baixo
    turbina: {
      dur: 3, f(ctx) {
        const o = osc(ctx, 'sawtooth', 90), g = ganho(ctx, 0);
        o.frequency.setValueAtTime(90, 0);
        o.frequency.exponentialRampToValueAtTime(620, 2.2);
        g.gain.setValueAtTime(0, 0);
        g.gain.linearRampToValueAtTime(0.22, 0.6);
        g.gain.setValueAtTime(0.22, 2.4);
        g.gain.linearRampToValueAtTime(0, 3);
        liga(o, filtro(ctx, 'bandpass', 900, 1.2), g, ctx.destination);
        const n = ruido(ctx, 3, 'marrom'), gn = ganho(ctx, 0);
        gn.gain.setValueAtTime(0, 0);
        gn.gain.linearRampToValueAtTime(0.4, 1.2);
        gn.gain.linearRampToValueAtTime(0, 3);
        liga(n, filtro(ctx, 'lowpass', 500), gn, ctx.destination);
        o.start(0); o.stop(3); n.start(0);
      }
    },
    // Átomo partindo: estalo seco + zunido que sobe
    fissao: {
      dur: 0.8, f(ctx) {
        const n = ruido(ctx, 0.08), gn = ganho(ctx, 0);
        env(gn, 0, 0.001, 0.9, 0.07);
        liga(n, filtro(ctx, 'bandpass', 1800, 0.8), gn, ctx.destination);
        n.start(0);
        const o = osc(ctx, 'sine', 300), g = ganho(ctx, 0);
        o.frequency.setValueAtTime(300, 0);
        o.frequency.exponentialRampToValueAtTime(2400, 0.25);
        env(g, 0.01, 0.01, 0.35, 0.6);
        liga(o, g, ctx.destination);
        o.start(0); o.stop(0.8);
        const b = osc(ctx, 'sine', 110), gb = ganho(ctx, 0);
        b.frequency.exponentialRampToValueAtTime(45, 0.3);
        env(gb, 0, 0.005, 0.6, 0.35);
        liga(b, gb, ctx.destination);
        b.start(0); b.stop(0.5);
      }
    },
    // Estrondo grave (explosão de mentira, onda batendo)
    estrondo: {
      dur: 3, f(ctx) {
        const n = ruido(ctx, 3, 'marrom'), g = ganho(ctx, 0);
        g.gain.setValueAtTime(0.0001, 0);
        g.gain.exponentialRampToValueAtTime(1, 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, 2.9);
        const lp = filtro(ctx, 'lowpass', 1200, 0.7);
        lp.frequency.setValueAtTime(1200, 0);
        lp.frequency.exponentialRampToValueAtTime(150, 2);
        liga(n, lp, g, ctx.destination);
        n.start(0);
        const b = osc(ctx, 'sine', 70), gb = ganho(ctx, 0);
        b.frequency.exponentialRampToValueAtTime(28, 1.5);
        env(gb, 0, 0.01, 0.8, 1.6);
        liga(b, gb, ctx.destination);
        b.start(0); b.stop(2);
      }
    },
    // Apito de panela de pressão: chiado com tom, tremendo
    apito: {
      dur: 1.6, f(ctx) {
        const o = osc(ctx, 'sine', 2100), g = ganho(ctx, 0);
        const v = osc(ctx, 'sine', 11), pv = ganho(ctx, 60);
        liga(v, pv, o.frequency);
        g.gain.setValueAtTime(0, 0);
        g.gain.linearRampToValueAtTime(0.18, 0.12);
        g.gain.setValueAtTime(0.18, 1.2);
        g.gain.linearRampToValueAtTime(0, 1.6);
        liga(o, g, ctx.destination);
        const n = ruido(ctx, 1.6), gn = ganho(ctx, 0);
        gn.gain.setValueAtTime(0, 0);
        gn.gain.linearRampToValueAtTime(0.35, 0.1);
        gn.gain.setValueAtTime(0.35, 1.2);
        gn.gain.linearRampToValueAtTime(0, 1.6);
        liga(n, filtro(ctx, 'bandpass', 4200, 1.5), gn, ctx.destination);
        [o, v, n].forEach((x) => { x.start(0); x.stop(1.6); });
      }
    },
    // Ronco de foguete: estrondo grave contínuo com estalos, pra cortar no tamanho (dur) que a cena pedir
    foguete: {
      dur: 8, f(ctx) {
        const n = ruido(ctx, 8, 'marrom'), g = ganho(ctx, 0);
        g.gain.setValueAtTime(0.0001, 0);
        g.gain.exponentialRampToValueAtTime(1, 0.35);
        g.gain.setValueAtTime(1, 7.2);
        g.gain.linearRampToValueAtTime(0, 8);
        const lp = filtro(ctx, 'lowpass', 520, 0.6);
        const l = osc(ctx, 'sine', 5.5), pl = ganho(ctx, 120);
        liga(l, pl, lp.frequency);
        liga(n, lp, g, ctx.destination);
        const c = ruido(ctx, 8), gc = ganho(ctx, 0);
        gc.gain.setValueAtTime(0, 0);
        gc.gain.linearRampToValueAtTime(0.22, 0.4);
        gc.gain.setValueAtTime(0.22, 7.2);
        gc.gain.linearRampToValueAtTime(0, 8);
        const lc = osc(ctx, 'square', 23), pc = ganho(ctx, 0.12);
        liga(lc, pc, gc.gain);
        liga(c, filtro(ctx, 'bandpass', 1100, 0.7), gc, ctx.destination);
        const b = osc(ctx, 'sine', 42), gb = ganho(ctx, 0);
        gb.gain.setValueAtTime(0, 0);
        gb.gain.linearRampToValueAtTime(0.5, 0.3);
        gb.gain.setValueAtTime(0.5, 7.2);
        gb.gain.linearRampToValueAtTime(0, 8);
        liga(b, gb, ctx.destination);
        [n, l, c, lc, b].forEach((x) => { x.start(0); x.stop(8); });
      }
    },
    // Paraquedas abrindo: estalo de pano + tremulada
    paraquedas: {
      dur: 0.9, f(ctx) {
        const n = ruido(ctx, 0.9), g = ganho(ctx, 0);
        env(g, 0, 0.004, 0.9, 0.18);
        liga(n, filtro(ctx, 'bandpass', 700, 0.8), g, ctx.destination);
        n.start(0);
        const b = osc(ctx, 'sine', 95), gb = ganho(ctx, 0);
        b.frequency.exponentialRampToValueAtTime(50, 0.2);
        env(gb, 0, 0.004, 0.7, 0.25);
        liga(b, gb, ctx.destination);
        b.start(0); b.stop(0.4);
        const t = ruido(ctx, 0.9), gt = ganho(ctx, 0);
        gt.gain.setValueAtTime(0, 0.08);
        gt.gain.linearRampToValueAtTime(0.3, 0.15);
        gt.gain.linearRampToValueAtTime(0, 0.85);
        const lt = osc(ctx, 'square', 28), pt = ganho(ctx, 0.25);
        liga(lt, pt, gt.gain);
        liga(t, filtro(ctx, 'bandpass', 1800, 1), gt, ctx.destination);
        [t, lt].forEach((x) => { x.start(0.08); x.stop(0.9); });
      }
    },
    // Marca sonora da desconstrução: sopro subindo, baque macio e um arpejo dourado de sino
    desconstrucao: {
      dur: 2.4, canais: 2, f(ctx) {
        const n = ruido(ctx, 0.8), gn = ganho(ctx, 0);
        gn.gain.setValueAtTime(0.0001, 0);
        gn.gain.exponentialRampToValueAtTime(0.5, 0.5);
        gn.gain.exponentialRampToValueAtTime(0.0001, 0.75);
        const bp = filtro(ctx, 'bandpass', 400, 1.2);
        bp.frequency.setValueAtTime(400, 0);
        bp.frequency.exponentialRampToValueAtTime(4200, 0.6);
        liga(n, bp, gn, ctx.destination);
        n.start(0);
        const b = osc(ctx, 'sine', 90), gb = ganho(ctx, 0);
        b.frequency.setValueAtTime(90, 0.55);
        b.frequency.exponentialRampToValueAtTime(45, 0.95);
        env(gb, 0.55, 0.006, 0.7, 0.5);
        liga(b, gb, ctx.destination);
        b.start(0.55); b.stop(1.2);
        // Sino: parciais de 1, 2,76 e 5,4, em Dó-Mi-Sol-Dó-Mi, abrindo no estéreo
        [84, 88, 91, 96, 100].forEach((m, i) => {
          const t = 0.58 + i * 0.075, fr = 440 * Math.pow(2, (m - 69) / 12);
          const p = ctx.createStereoPanner();
          p.pan.value = (i - 2) * 0.35;
          p.connect(ctx.destination);
          [[1, 0.22, 1.1], [2.76, 0.07, 0.5], [5.4, 0.03, 0.25]].forEach(([h, v, d]) => {
            const o = osc(ctx, 'sine', fr * h), g = ganho(ctx, 0);
            env(g, t, 0.003, v, d);
            liga(o, g, p);
            o.start(t); o.stop(t + d + 0.1);
          });
        });
        // Brilho final
        const s = ruido(ctx, 1.4), gs = ganho(ctx, 0);
        gs.gain.setValueAtTime(0, 0.6);
        gs.gain.linearRampToValueAtTime(0.08, 0.7);
        gs.gain.exponentialRampToValueAtTime(0.0001, 2.3);
        liga(s, filtro(ctx, 'highpass', 7000), gs, ctx.destination);
        s.start(0.6);
      }
    },
    // Trilha curiosa e leve: 120 bpm, 16 compassos (32 s), em loop
    trilha: {
      dur: 32, canais: 2, f(ctx) {
        const BAT = 0.5, COMP = 2;
        const mestre = ganho(ctx, 0.5);
        const comp = ctx.createDynamicsCompressor();
        liga(mestre, comp, ctx.destination);
        const nota = (m) => 440 * Math.pow(2, (m - 69) / 12);
        const acordes = [[48, 60, 64, 67, 71], [45, 57, 60, 64, 67], [41, 57, 60, 64, 69], [43, 55, 59, 62, 67]]; // Cmaj7 Am7 Fmaj7 G
        const pluck = (t, m, vol, pan, dec = 0.35, tipo = 'triangle') => {
          const o = osc(ctx, tipo, nota(m)), g = ganho(ctx, 0), p = ctx.createStereoPanner();
          p.pan.value = pan;
          env(g, t, 0.006, vol, dec);
          liga(o, filtro(ctx, 'lowpass', 2400), g, p, mestre);
          o.start(t); o.stop(t + dec + 0.05);
        };
        const marimba = (t, m, vol) => {
          [1, 4].forEach((h, i) => {
            const o = osc(ctx, 'sine', nota(m) * h), g = ganho(ctx, 0);
            env(g, t, 0.003, vol * (i ? 0.25 : 1), i ? 0.06 : 0.4);
            liga(o, g, mestre);
            o.start(t); o.stop(t + 0.5);
          });
        };
        const penta = [72, 74, 76, 79, 81, 84];
        for (let c = 0; c < 16; c++) {
          const t0 = c * COMP, ac = acordes[c % 4];
          // Baixo
          [0, 2].forEach((b) => pluck(t0 + b * BAT, ac[0] - 12 + 12, 0.32, 0, 0.42, 'sine'));
          // Acorde saltitante nos tempos 1 e 2.5
          [0, 1.5, 2.5].forEach((b) => ac.slice(1).forEach((m, i) => pluck(t0 + b * BAT, m, 0.07, (i - 1.5) * 0.35, 0.3)));
          // Chimbal suave no contratempo
          for (let b = 0; b < 4; b++) {
            const n = ruido(ctx, 0.05), g = ganho(ctx, 0);
            env(g, t0 + b * BAT + BAT / 2, 0.002, 0.05, 0.035);
            liga(n, filtro(ctx, 'highpass', 7500), g, mestre);
            n.start(t0 + b * BAT + BAT / 2);
          }
          // Bumbo leve
          [0, 2].forEach((b) => {
            const t = t0 + b * BAT, o = osc(ctx, 'sine', 120), g = ganho(ctx, 0);
            o.frequency.setValueAtTime(120, t);
            o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
            env(g, t, 0.003, 0.35, 0.16);
            liga(o, g, mestre);
            o.start(t); o.stop(t + 0.2);
          });
          // Melodia de marimba a partir do 5º compasso, com respiro no fim do loop
          if (c >= 4 && c < 15) {
            for (let k = 0; k < 8; k++) {
              if (rnd() < 0.45) continue;
              marimba(t0 + k * BAT / 2, penta[Math.floor(rnd() * penta.length)], 0.12);
            }
          }
        }
      }
    }
  };

  window.SINTESE = async function (nome) {
    const r = R[nome];
    semente = [...nome].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 2147483646 + 1;
    const canais = r.canais || 1;
    const ctx = new OfflineAudioContext(canais, Math.ceil(SR * r.dur), SR);
    r.f(ctx);
    const buf = await ctx.startRendering();
    // Normaliza o pico em -1 dB e codifica WAV 16 bits
    let pico = 0;
    for (let c = 0; c < canais; c++) for (const v of buf.getChannelData(c)) pico = Math.max(pico, Math.abs(v));
    const k = pico > 0 ? 0.89 / pico : 1;
    const n = buf.length, dados = new DataView(new ArrayBuffer(44 + n * canais * 2));
    const str = (o, s) => [...s].forEach((ch, i) => dados.setUint8(o + i, ch.charCodeAt(0)));
    str(0, 'RIFF'); dados.setUint32(4, 36 + n * canais * 2, true); str(8, 'WAVEfmt ');
    dados.setUint32(16, 16, true); dados.setUint16(20, 1, true); dados.setUint16(22, canais, true);
    dados.setUint32(24, SR, true); dados.setUint32(28, SR * canais * 2, true); dados.setUint16(32, canais * 2, true);
    dados.setUint16(34, 16, true); str(36, 'data'); dados.setUint32(40, n * canais * 2, true);
    const ch = [...Array(canais)].map((_, c) => buf.getChannelData(c));
    let o = 44;
    for (let i = 0; i < n; i++) for (let c = 0; c < canais; c++) { dados.setInt16(o, Math.max(-1, Math.min(1, ch[c][i] * k)) * 32767, true); o += 2; }
    let bin = '';
    const bytes = new Uint8Array(dados.buffer);
    for (let i = 0; i < bytes.length; i += 32768) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
    return btoa(bin);
  };
  return Object.keys(R);
}

(async () => {
  fs.mkdirSync(SONS, { recursive: true });
  const browser = await chromium.launch({ channel: 'chromium' });
  const page = await browser.newPage();
  const todos = await page.evaluate(receitas);
  const pedidos = process.argv.slice(2).length ? process.argv.slice(2) : todos;
  for (const nome of pedidos) {
    const b64 = await page.evaluate((n) => window.SINTESE(n), nome);
    fs.writeFileSync(path.join(SONS, nome + '.wav'), Buffer.from(b64, 'base64'));
    console.log('ok', nome);
  }
  await browser.close();
})();
