import React from "react";
import type { AgoraProject } from "./types";
import projectJson from "./projeto-ativo.agora.json";
import { ProjetoComposition } from "./ProjectComposition";

const project = projectJson as AgoraProject;
export const PROJETO_EXEMPLO = project;
export const PROJETO_EXEMPLO_FRAMES = project.scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0);
export const ProjetoExemplo: React.FC = () => <ProjetoComposition project={project} />;
