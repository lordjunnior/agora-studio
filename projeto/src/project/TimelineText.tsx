import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { AgoraTrackItem } from "./types";

export const TimelineText: React.FC<{ item: AgoraTrackItem; kind: "caption" | "overlay" }> = ({ item, kind }) => {
  const frame = useCurrentFrame();
  const style = item.style ?? {};
  const activeWord = item.words?.find((word) => frame >= word.startInFrames && frame < word.endInFrames);
  const caption = kind === "caption";
  const baseStyle: React.CSSProperties = {
    color: style.color ?? "#fff",
    fontSize: style.fontSize ?? (caption ? 66 : 54),
    fontWeight: 900,
    lineHeight: 1.12,
    textAlign: style.align ?? "center",
    textTransform: style.uppercase === false ? "none" : "uppercase",
    background: style.background ?? "transparent",
    padding: style.background ? "0.18em 0.3em" : 0,
    WebkitTextStroke: caption ? "2px #000" : "0",
    paintOrder: "stroke fill",
    textShadow: caption ? "0 4px 0 #000" : "0 2px 12px rgba(0,0,0,.3)",
    maxWidth: "88%",
    whiteSpace: "pre-wrap",
  };
  return (
    <AbsoluteFill style={{ justifyContent: caption ? "flex-end" : "center", alignItems: "center", paddingBottom: caption ? `${style.bottom ?? 12}%` : 0, pointerEvents: "none" }}>
      <div style={baseStyle}>
        {item.words?.length ? item.words.map((word, index) => {
          const isActive = activeWord === word;
          return <React.Fragment key={index}><span style={{ color: isActive ? style.highlightColor ?? "#ffd23f" : style.color ?? "#fff" }}>{style.uppercase === false ? word.text : word.text.toUpperCase()}</span>{index < item.words!.length - 1 ? " " : ""}</React.Fragment>;
        }) : item.text}
      </div>
    </AbsoluteFill>
  );
};
