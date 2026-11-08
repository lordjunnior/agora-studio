// KIT: tempo. Tudo no vídeo é sincronizado com as palavras da narração (words.json = [{w, s, e}] em segundos).
// Regra: a reação visual cai 0 a 3 quadros ANTES da palavra (LEAD).
export const FPS = 30;
export const LEAD = 2 / FPS;

export type Palavra = { w: string; s: number; e: number };

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
/** suave (smoothstep) de 0 a 1 entre os tempos a e b */
export const ss = (a: number, b: number, t: number) => { const u = clamp((t - a) / (b - a)); return u * u * (3 - 2 * u); };
/** mais suave ainda (smootherstep), bom para câmera */
export const sss = (a: number, b: number, t: number) => { const u = clamp((t - a) / (b - a)); return u * u * u * (u * (u * 6 - 15) + 10); };
/** "pop" com leve passada do ponto (escala de 0 a ~1.1 e volta a 1) */
export const pop = (t0: number, t: number, d = 0.35) => {
  const u = clamp((t - t0) / d); if (u <= 0) return 0; if (u >= 1) return 1;
  const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2);
};
/** tremido de impacto: 7 quadros, troca de sinal a cada quadro, decai */
export const kick = (t0: number, t: number, amp = 1) => {
  const f = Math.round((t - t0) * FPS); if (f < 0 || f > 6) return 0;
  return amp * (f % 2 ? -1 : 1) * (1 - f / 7);
};

/** normaliza uma palavra: minúscula, sem acento, sem pontuação */
export const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

/** cria o ajudante cue(): acha o início (s) da 1ª palavra que bate com a regex depois do tempo `after`.
 *  Ex.: const cue = criarCue(WORDS); const tLua = cue(/^lua/, 0, 3);  // 3 = valor se não achar */
export const criarCue = (W: Palavra[]) => (re: RegExp, after = 0, fallback = 0) => {
  const w = W.find((x) => x.s >= after - 0.01 && re.test(norm(x.w)));
  return w ? w.s - LEAD : fallback;
};

/** duração em quadros: fim da última palavra + cauda */
export const quadros = (W: Palavra[], cauda = 1.6) => Math.round(((W.length ? W[W.length - 1].e : 5) + cauda) * FPS);
