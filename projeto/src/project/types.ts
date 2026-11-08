export type AgoraScene = {
  id: string;
  name: string;
  durationInFrames: number;
  renderer: "remotion-react" | "remotion-three" | "legacy-adapter";
  metadata: { compositionId: string; [key: string]: unknown };
};
export type AgoraAsset = {
  id: string;
  type: string;
  src: string;
  license?: string;
  metadata?: Record<string, unknown>;
};
export type AgoraTrackItem = {
  id: string;
  assetId: string;
  fromInFrames: number;
  durationInFrames: number;
  volume?: number;
};
export type AgoraTrack = {
  id: string;
  type: "scene" | "voice" | "music" | "sfx" | "caption" | "overlay";
  name?: string;
  items?: AgoraTrackItem[];
};
export type AgoraProject = {
  schemaVersion: 1;
  id: string;
  name: string;
  profile: { width: number; height: number; fps: number };
  scenes: AgoraScene[];
  tracks: AgoraTrack[];
  assets: AgoraAsset[];
  createdAt?: string;
  updatedAt?: string;
  audio?: Record<string, unknown>;
  export?: Record<string, unknown>;
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
  const sceneIds = new Set<string>();
  for (const scene of project.scenes) {
    if (!scene.id || sceneIds.has(scene.id)) throw new Error("Toda cena precisa de um ID único.");
    sceneIds.add(scene.id);
    if (!scene.name || !Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 1) {
      throw new Error(`Nome ou duração inválida na cena "${scene.id}".`);
    }
    if (!["remotion-react", "remotion-three", "legacy-adapter"].includes(scene.renderer)) {
      throw new Error(`Renderer inválido na cena "${scene.id}".`);
    }
    if (!scene.metadata?.compositionId) throw new Error(`A cena "${scene.id}" não define metadata.compositionId.`);
  }
  if (!Array.isArray(project.tracks) || !Array.isArray(project.assets)) throw new Error("Trilhas e ativos precisam ser listas.");
  const assetIds = new Set<string>();
  for (const asset of project.assets) {
    if (!asset.id || assetIds.has(asset.id) || !asset.src) throw new Error("Todo ativo precisa de ID único e caminho.");
    assetIds.add(asset.id);
  }
  const totalFrames = project.scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0);
  for (const track of project.tracks) {
    if (!track.id || !Array.isArray(track.items ?? [])) throw new Error("Trilha inválida.");
    if (["voice", "music", "sfx"].includes(track.type)) {
      for (const item of track.items ?? []) {
        if (!assetIds.has(item.assetId)) throw new Error(`Ativo "${item.assetId}" não encontrado na trilha "${track.id}".`);
        if (!Number.isInteger(item.fromInFrames) || item.fromInFrames < 0 ||
            !Number.isInteger(item.durationInFrames) || item.durationInFrames < 1) {
          throw new Error(`Intervalo inválido no item "${item.id}".`);
        }
        if (item.fromInFrames + item.durationInFrames > totalFrames) {
          throw new Error(`O item "${item.id}" ultrapassa a duração do projeto.`);
        }
        if (item.volume !== undefined && (item.volume < 0 || item.volume > 1)) {
          throw new Error(`Volume inválido no item "${item.id}".`);
        }
      }
    }
  }
}
export const projectDurationInFrames = (project: AgoraProject) => project.scenes.reduce((total, scene) => total + scene.durationInFrames, 0);
