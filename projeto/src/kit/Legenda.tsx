// KIT: legenda palavra por palavra. Mostra blocos de até `max` palavras; a palavra falada fica destacada e dá um "pop".
// Um bloco termina em pontuação forte ou quando passa de `max` palavras.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";
import { Palavra, FPS, pop } from "./tempo";

const { fontFamily } = loadFont("normal", { weights: ["900"], subsets: ["latin"] });

const blocos = (W: Palavra[], max: number) => {
  const out: Palavra[][] = []; let cur: Palavra[] = [];
  W.forEach((w, i) => {
    cur.push(w);
    const prox = W[i + 1], pausa = prox ? prox.s - w.e > 0.35 : true;
    if (cur.length >= max || /[.!?…]$/.test(w.w) || pausa) { out.push(cur); cur = []; }
  });
  if (cur.length) out.push(cur);
  return out;
};

export const Legenda: React.FC<{
  palavras: Palavra[]; max?: number; destaque?: string; cor?: string; tamanho?: number;
  /** distância da base em % da altura (vertical 9:16: 28; horizontal 16:9: 12) */
  base?: number; maiusculas?: boolean;
}> = ({ palavras, max = 3, destaque = "#ffd23f", cor = "#ffffff", tamanho = 78, base = 28, maiusculas = true }) => {
  const t = useCurrentFrame() / FPS;
  const B = React.useMemo(() => blocos(palavras, max), [palavras, max]);
  const b = B.find((x) => t >= x[0].s - 0.05 && t < x[x.length - 1].e + 0.25);
  if (!b) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: `${base}%`, pointerEvents: "none" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 0.28em", maxWidth: "86%", fontFamily, fontWeight: 900, fontSize: tamanho, lineHeight: 1.08, textAlign: "center" }}>
        {b.map((w, i) => {
          const on = t >= w.s - 0.03 && t < w.e + 0.05, s = on ? 0.92 + 0.12 * pop(w.s - 0.03, t, 0.18) : 1;
          return (
            <span key={i} style={{ color: on ? destaque : cor, transform: `scale(${s})`, display: "inline-block",
              WebkitTextStroke: `${tamanho * 0.11}px #000`, paintOrder: "stroke fill", textShadow: `0 ${tamanho * 0.07}px 0 #000` }}>
              {maiusculas ? w.w.toUpperCase() : w.w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
