import type { AgoraAsset, AgoraTrack, AgoraTrackItem, AgoraWord } from "./types";

export type LegacyTimedWord = {
  texto: string;
  inicio: number;
  fim: number;
  chave?: boolean;
};

export type LegacyTimedPhrase = {
  texto: string;
  inicio: number;
  fim: number;
  palavras?: LegacyTimedWord[];
};

export type NarrationAudioSegment = {
  id: string;
  assetId: string;
  src: string;
  startSeconds: number;
  durationSeconds: number;
  volume?: number;
};

export type NarrationTimelineInput = {
  fps: number;
  totalFrames: number;
  phrases: LegacyTimedPhrase[];
  audioSegments: NarrationAudioSegment[];
  captionStyle?: AgoraTrackItem["style"];
};

export type NarrationManifestV1 = {
  manifestVersion: 1;
  product: "ÁGORA";
  fps: number;
  durationSeconds: number;
  phrases: LegacyTimedPhrase[];
  audioSegments: Array<{
    id: string;
    assetId: string;
    src: string;
    startSeconds: number;
    durationSeconds: number;
    volume?: number;
  }>;
};

export type NarrationTracksResult = {
  assets: AgoraAsset[];
  tracks: AgoraTrack[];
};

const secondsToFrame = (seconds: number, fps: number) => Math.round(seconds * fps);

function assertFiniteNonNegative(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Valor inválido em ${label}: esperado número finito não negativo.`);
  }
}

/** Converte a timeline alinhada por palavra em trilhas de voz e legenda do ÁGORA. */
export function buildNarrationTracks(input: NarrationTimelineInput): NarrationTracksResult {
  if (!Number.isInteger(input.fps) || input.fps < 1 || input.fps > 120) {
    throw new Error("FPS inválido para conversão da narração.");
  }
  if (!Number.isInteger(input.totalFrames) || input.totalFrames < 1) {
    throw new Error("Duração total inválida para conversão da narração.");
  }

  const assets: AgoraAsset[] = [];
  const voiceItems: AgoraTrackItem[] = [];

  for (const segment of input.audioSegments) {
    assertFiniteNonNegative(segment.startSeconds, `áudio ${segment.id}.startSeconds`);
    if (!Number.isFinite(segment.durationSeconds) || segment.durationSeconds <= 0) {
      throw new Error(`Duração inválida no segmento de áudio "${segment.id}".`);
    }
    if (!segment.id || !segment.assetId || !segment.src) {
      throw new Error("Cada segmento de narração precisa de id, assetId e src.");
    }
    const fromInFrames = secondsToFrame(segment.startSeconds, input.fps);
    const durationInFrames = Math.max(1, secondsToFrame(segment.durationSeconds, input.fps));
    if (fromInFrames + durationInFrames > input.totalFrames) {
      throw new Error(`O áudio "${segment.id}" ultrapassa a duração do projeto.`);
    }
    assets.push({ id: segment.assetId, type: "audio", src: segment.src });
    voiceItems.push({
      id: `voice-${segment.id}`,
      assetId: segment.assetId,
      fromInFrames,
      durationInFrames,
      volume: segment.volume ?? 1,
    });
  }

  const captionItems: AgoraTrackItem[] = input.phrases.flatMap((phrase, index) => {
    assertFiniteNonNegative(phrase.inicio, `frase ${index + 1}.inicio`);
    if (!Number.isFinite(phrase.fim) || phrase.fim <= phrase.inicio) {
      throw new Error(`Intervalo inválido na frase ${index + 1}.`);
    }
    const fromInFrames = secondsToFrame(phrase.inicio, input.fps);
    const endInFrames = secondsToFrame(phrase.fim, input.fps);
    const durationInFrames = endInFrames - fromInFrames;
    if (durationInFrames < 1 || endInFrames > input.totalFrames) {
      throw new Error(`A frase ${index + 1} ultrapassa a duração do projeto.`);
    }

    const words: AgoraWord[] = (phrase.palavras ?? []).map((word, wordIndex) => {
      assertFiniteNonNegative(word.inicio, `frase ${index + 1}, palavra ${wordIndex + 1}.inicio`);
      if (!Number.isFinite(word.fim) || word.fim <= word.inicio) {
        throw new Error(`Tempo inválido na palavra ${wordIndex + 1} da frase ${index + 1}.`);
      }
      const startInFrames = Math.max(0, secondsToFrame(word.inicio, input.fps) - fromInFrames);
      const endInFrames = Math.min(durationInFrames, secondsToFrame(word.fim, input.fps) - fromInFrames);
      if (endInFrames <= startInFrames) {
        throw new Error(`A palavra "${word.texto}" não possui duração válida em frames.`);
      }
      return { text: word.texto, startInFrames, endInFrames };
    });

    return [{
      id: `caption-phrase-${index + 1}`,
      fromInFrames,
      durationInFrames,
      text: phrase.texto,
      ...(words.length ? { words } : {}),
      ...(input.captionStyle ? { style: input.captionStyle } : {}),
    }];
  });

  return {
    assets,
    tracks: [
      { id: "track-voice", type: "voice", name: "Narração", items: voiceItems },
      { id: "track-captions", type: "caption", name: "Legendas sincronizadas", items: captionItems },
    ],
  };
}

/** Converte diretamente o narration-manifest.json exportado pelo render em trilhas ÁGORA. */
export function buildNarrationTracksFromManifest(
  manifest: NarrationManifestV1,
  captionStyle?: AgoraTrackItem["style"],
): NarrationTracksResult {
  if (manifest.manifestVersion !== 1 || manifest.product !== "ÁGORA") {
    throw new Error("Manifesto de narração incompatível com o ÁGORA.");
  }
  if (!Number.isFinite(manifest.durationSeconds) || manifest.durationSeconds <= 0) {
    throw new Error("Duração inválida no manifesto de narração.");
  }
  return buildNarrationTracks({
    fps: manifest.fps,
    totalFrames: Math.ceil(manifest.durationSeconds * manifest.fps),
    phrases: manifest.phrases,
    audioSegments: manifest.audioSegments,
    captionStyle,
  });
}
