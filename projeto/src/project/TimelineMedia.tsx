import React from "react";
import { AbsoluteFill, Img, Video, staticFile } from "remotion";
import type { AgoraAsset, AgoraTrackItem } from "./types";

type Props = { item: AgoraTrackItem; asset: AgoraAsset };
export const TimelineMedia: React.FC<Props> = ({ item, asset }) => {
  const fit = item.media?.fit ?? "cover";
  const style: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: fit,
    objectPosition: item.media?.position ?? "center",
    opacity: item.media?.opacity ?? 1,
    transform: item.media?.scale ? `scale(${item.media.scale})` : undefined,
  };
  const src = staticFile(asset.src);
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      {asset.type === "image" ? <Img src={src} style={style} /> :
        asset.type === "video" ? <Video src={src} style={style} volume={item.volume ?? 1} /> :
        <div style={{ color: "white", padding: 24 }}>Tipo de mídia não suportado: {asset.type}</div>}
    </AbsoluteFill>
  );
};
