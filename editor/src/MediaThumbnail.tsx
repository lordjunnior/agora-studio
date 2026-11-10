import React, { useEffect, useState } from "react";
import type { AgoraAsset } from "../../projeto/src/project/types";

const waveformCache = new Map<string, number[]>();
const WAVEFORM_BARS = 48;
const MAX_WAVEFORM_BYTES = 24 * 1024 * 1024;

async function loadWaveform(src: string): Promise<number[]> {
  const cached = waveformCache.get(src);
  if (cached) return cached;
  const response = await fetch(`/${src}`);
  if (!response.ok) throw new Error("Não foi possível carregar o áudio.");
  const declaredSize = Number(response.headers.get("content-length") || 0);
  if (declaredSize > MAX_WAVEFORM_BYTES) throw new Error("Arquivo grande demais para gerar prévia.");
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_WAVEFORM_BYTES) throw new Error("Arquivo grande demais para gerar prévia.");
  const AudioContextClass = window.AudioContext;
  if (!AudioContextClass) throw new Error("Web Audio indisponível.");
  const context = new AudioContextClass();
  try {
    const decoded = await context.decodeAudioData(buffer.slice(0));
    const channel = decoded.getChannelData(0);
    const peaks = Array.from({ length: WAVEFORM_BARS }, (_, index) => {
      const start = Math.floor(index * channel.length / WAVEFORM_BARS);
      const end = Math.max(start + 1, Math.floor((index + 1) * channel.length / WAVEFORM_BARS));
      let peak = 0;
      for (let sample = start; sample < end; sample += 1) peak = Math.max(peak, Math.abs(channel[sample]));
      return Math.max(0.08, Math.min(1, peak));
    });
    waveformCache.set(src, peaks);
    return peaks;
  } finally {
    await context.close().catch(() => undefined);
  }
}

export const MediaThumbnail: React.FC<{ asset: AgoraAsset }> = ({ asset }) => {
  const [waveform, setWaveform] = useState<number[] | null>(() => waveformCache.get(asset.src) ?? null);
  const [waveformUnavailable, setWaveformUnavailable] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (asset.type !== "audio" || waveform || waveformUnavailable) return;
    let active = true;
    void loadWaveform(asset.src).then((peaks) => {
      if (active) setWaveform(peaks);
    }).catch(() => {
      if (active) setWaveformUnavailable(true);
    });
    return () => { active = false; };
  }, [asset.src, asset.type, waveform, waveformUnavailable]);

  if (asset.type === "image") {
    return <span className="media-thumbnail image-thumbnail"><img src={`/${asset.src}`} alt="" loading="lazy" /></span>;
  }
  if (asset.type === "video") {
    return <span className={`media-thumbnail video-thumbnail${videoReady ? " ready" : ""}`}>
      <video src={`/${asset.src}`} muted playsInline preload="metadata"
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          try { video.currentTime = Math.min(0.25, Math.max(0, video.duration / 20)); } catch { /* aguarda o próximo frame */ }
        }}
        onSeeked={() => setVideoReady(true)}
        onLoadedData={() => setVideoReady(true)}
        onError={() => setVideoReady(false)} />
      {!videoReady && <span className="thumbnail-fallback">▶</span>}
      <span className="thumbnail-play">▶</span>
    </span>;
  }
  if (asset.type === "audio") {
    return <span className="media-thumbnail audio-thumbnail" aria-label="Forma de onda do áudio">
      {waveform
        ? <span className="waveform-bars">{waveform.map((peak, index) => <i key={index} style={{ height: `${Math.round(peak * 100)}%` }} />)}</span>
        : <span className="waveform-placeholder">{Array.from({ length: WAVEFORM_BARS }, (_, index) => <i key={index} style={{ height: `${18 + ((index * 17 + 11) % 42)}%` }} />)}</span>}
      <span className="audio-mark">{waveformUnavailable ? "AU" : waveform ? "WAV" : "…"}</span>
    </span>;
  }
  return <span className={`media-thumbnail generic-thumbnail ${asset.type}`}>{asset.type.slice(0, 2).toUpperCase()}</span>;
};
