export type AgoraScene = {
  id: string;
  name: string;
  durationInFrames: number;
  renderer: "remotion-react" | "remotion-three" | "legacy-adapter";
  metadata: { compositionId: string; [key: string]: unknown };
};
export type AgoraProject = {
  schemaVersion: 1; id: string; name: string;
  profile: { width: number; height: number; fps: number };
  scenes: AgoraScene[];
  tracks: Array<{ id: string; type: "scene" | "voice" | "music" | "sfx" | "caption" | "overlay"; name?: string; items?: unknown[] }>;
  assets: Array<{ id: string; type: string; src: string; license?: string; metadata?: Record<string, unknown> }>;
  createdAt?: string; updatedAt?: string; audio?: Record<string, unknown>; export?: Record<string, unknown>;
};
export function validateAgoraProject(value: unknown): asserts value is AgoraProject {
  if (!value || typeof value !== "object") throw new Error("Documento de projeto inválido.");
  const project = value as Partial<AgoraProject>;
  if (project.schemaVersion !== 1) throw new Error("Versão de projeto não suportada.");
  if (!project.id || !project.name) throw new Error("O projeto precisa de identificador e nome.");
  const profile = project.profile;
  if (!profile || !Number.isInteger(profile.width) || profile.width < 1 ||
      !Number.isInteger(profile.height) || profile.height < 1 ||
      !Number.isInteger(profile.fps) || profile.fps < 1 || profile.fps > 120) throw new Error("Perfil de vídeo inválido.");
  if (!Array.isArray(project.scenes) || project.scenes.length === 0) throw new Error("O projeto precisa ter pelo menos uma cena.");
  const ids = new Set<string>();
  for (const scene of project.scenes) {
    if (!scene.id || ids.has(scene.id)) throw new Error("Toda cena precisa de um ID único.");
    ids.add(scene.id);
    if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 1) throw new Error(`Duração inválida na cena "${scene.id}".`);
    if (!scene.metadata?.compositionId) throw new Error(`A cena "${scene.id}" não define metadata.compositionId.`);
  }
  if (!Array.isArray(project.tracks) || !Array.isArray(project.assets)) throw new Error("Trilhas e ativos precisam ser listas.");
}
export const projectDurationInFrames = (project: AgoraProject) => project.scenes.reduce((total, scene) => total + scene.durationInFrames, 0);
