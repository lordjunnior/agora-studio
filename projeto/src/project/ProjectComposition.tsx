import React, { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import type { AgoraProject } from "./types";
import { projectDurationInFrames, validateAgoraProject } from "./types";
import { Cidade, Espaco } from "../exemplo/Exemplo";

const sceneRegistry: Record<string, React.ComponentType> = {
  cidade: Cidade,
  espaco: Espaco,
};

type Props = { project: AgoraProject };

export const ProjetoComposition: React.FC<Props> = ({ project }) => {
  const validatedProject = useMemo(() => {
    validateAgoraProject(project);
    for (const scene of project.scenes) {
      if (!sceneRegistry[scene.metadata.compositionId]) {
        throw new Error(`Composição não registrada no ÁGORA: ${scene.metadata.compositionId}`);
      }
    }
    return project;
  }, [project]);

  const assets = new Map(validatedProject.assets.map((asset) => [asset.id, asset]));
  let cursor = 0;
  const totalFrames = projectDurationInFrames(validatedProject);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {validatedProject.scenes.map((scene) => {
        const from = cursor;
        cursor += scene.durationInFrames;
        const Scene = sceneRegistry[scene.metadata.compositionId];
        return (
          <Sequence key={scene.id} from={from} durationInFrames={scene.durationInFrames} name={scene.name}>
            <Scene />
          </Sequence>
        );
      })}
      {validatedProject.tracks
        .filter((track) => ["voice", "music", "sfx"].includes(track.type))
        .flatMap((track) => (track.items ?? []).map((item) => {
          const asset = assets.get(item.assetId);
          if (!asset) throw new Error(`Ativo não encontrado: ${item.assetId}`);
          return (
            <Sequence key={item.id} from={item.fromInFrames} durationInFrames={Math.min(item.durationInFrames, totalFrames - item.fromInFrames)} name={track.name ?? track.type}>
              <Audio src={staticFile(asset.src)} volume={item.volume ?? 1} />
            </Sequence>
          );
        }))}
    </AbsoluteFill>
  );
};
