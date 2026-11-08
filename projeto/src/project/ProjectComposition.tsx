import React, { useMemo } from "react";
import { AbsoluteFill, Sequence } from "remotion";
import type { AgoraProject } from "./types";
import { validateAgoraProject } from "./types";
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

  let cursor = 0;
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
    </AbsoluteFill>
  );
};
