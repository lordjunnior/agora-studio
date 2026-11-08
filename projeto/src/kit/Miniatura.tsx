// KIT: molde de miniatura (Still). Regras que funcionam:
// - 1 imagem forte (um quadro do próprio vídeo, no momento mais absurdo);
// - no máximo 3 a 4 palavras grandes, que NÃO repetem o título;
// - 1 selo de contraste (cor oposta ao fundo);
// - legível no celular: teste reduzindo para 160 px de largura.
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";

const { fontFamily } = loadFont("normal", { weights: ["900"], subsets: ["latin"] });

export type MiniaturaProps = {
  /** arquivo em public/ (ex.: "meuvideo/quadro.jpg") */
  imagem: string;
  /** 1 ou 2 linhas curtas, em maiúsculas */
  texto: string[];
  /** selo pequeno de destaque (ex.: "E SE?") */
  selo?: string;
  corTexto?: string; corSelo?: string; corFundo?: string;
};

export const Miniatura: React.FC<MiniaturaProps> = ({ imagem, texto, selo, corTexto = "#ffd23f", corSelo = "#ff2d3d", corFundo = "#120a2a" }) => (
  <AbsoluteFill style={{ background: corFundo, overflow: "hidden", fontFamily }}>
    <Img src={staticFile(imagem)} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
    <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 45%)" }} />
    <AbsoluteFill style={{ justifyContent: "flex-end", padding: "4% 5%" }}>
      {texto.map((l, i) => (
        <div key={i} style={{ fontWeight: 900, fontSize: "11.5vmax", lineHeight: 0.98, color: i === 0 ? corTexto : "#ffffff",
          WebkitTextStroke: "0.9vmax #000", paintOrder: "stroke fill", textShadow: "0 0.8vmax 0 #000" }}>{l}</div>
      ))}
    </AbsoluteFill>
    {selo && (
      <div style={{ position: "absolute", right: "4%", top: "6%", transform: "rotate(6deg)", background: corSelo, color: "#fff", fontWeight: 900,
        fontSize: "5vmax", padding: "0.6vmax 2vmax", borderRadius: "1.2vmax", border: "0.5vmax solid #000", boxShadow: "0 1vmax 2vmax rgba(0,0,0,.5)" }}>{selo}</div>
    )}
  </AbsoluteFill>
);
