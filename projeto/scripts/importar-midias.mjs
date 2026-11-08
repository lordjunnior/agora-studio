import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [manifestArg, projectArg] = process.argv.slice(2);
function fail(message) { console.error("Import aborted: " + message); process.exit(1); }
if (!manifestArg) fail("usage: npm run media:import -- <media-manifest.json> [project.agora.json]");
const manifestPath = path.resolve(manifestArg);
const projectPath = path.resolve(projectArg || path.join(root, "src", "project", "projeto-ativo.agora.json"));
if (!fs.existsSync(manifestPath) || !fs.existsSync(projectPath)) fail("manifest or project file not found.");
const read = (file) => JSON.parse(fs.readFileSync(file, "utf8").trimStart());
let manifest, project;
try { manifest = read(manifestPath); project = read(projectPath); } catch (error) { fail("invalid JSON: " + error.message); }
if (manifest.manifestVersion !== 1 || manifest.product !== "AGORA" || !Array.isArray(manifest.media)) fail("unsupported media manifest.");
if (project.schemaVersion !== 1 || !Number.isInteger(project.profile?.fps) || !Array.isArray(project.scenes) || !Array.isArray(project.assets) || !Array.isArray(project.tracks)) fail("invalid project document.");
const fps = project.profile.fps, totalFrames = project.scenes.reduce((n, scene) => n + scene.durationInFrames, 0);
const ids = new Set(project.assets.map((asset) => asset.id));
const itemIds = new Set(project.tracks.flatMap((track) => (track.items || []).map((item) => item.id)));
const grouped = new Map();
const publicDir = path.join(root, "public", "agora-assets");
fs.mkdirSync(publicDir, { recursive: true });
for (const [index, entry] of manifest.media.entries()) {
  if (!entry.id || !entry.type || !["image", "video", "model"].includes(entry.type) || !entry.src || !Number.isFinite(entry.startSeconds) || entry.startSeconds < 0 || !Number.isFinite(entry.durationSeconds) || entry.durationSeconds <= 0) fail("invalid media entry " + (index + 1));
  if (ids.has(entry.id)) fail("duplicate asset id: " + entry.id);
  const manifestDir = path.dirname(manifestPath);
  const source = path.resolve(manifestDir, entry.src);
  const relativeSource = path.relative(manifestDir, source);
  if (relativeSource.startsWith("..") || path.isAbsolute(relativeSource)) fail("media path must stay inside the manifest directory: " + entry.src);
  if (!fs.existsSync(source)) fail("media file not found: " + source);
  const ext = path.extname(source).toLowerCase();
  if (entry.type === "model" && ext !== ".glb") fail("3D model import currently requires a self-contained .glb file.");
  if (entry.type === "model" && entry.model !== undefined) {
    const m = entry.model;
    for (const key of ["position", "rotation", "cameraPosition"]) if (m[key] !== undefined && (!Array.isArray(m[key]) || m[key].length !== 3 || !m[key].every(Number.isFinite))) fail("invalid model." + key + " for " + entry.id);
    if (m.scale !== undefined && (!Number.isFinite(m.scale) || m.scale <= 0)) fail("invalid model.scale for " + entry.id);
    if (m.cameraFov !== undefined && (!Number.isFinite(m.cameraFov) || m.cameraFov <= 1 || m.cameraFov >= 179)) fail("invalid model.cameraFov for " + entry.id);
    if (m.spinPerSecond !== undefined && !Number.isFinite(m.spinPerSecond)) fail("invalid model.spinPerSecond for " + entry.id);
  }
  if (entry.type === "image" && ![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) fail("unsupported image extension: " + ext);
  if (entry.type === "video" && ![".mp4", ".webm", ".mov"].includes(ext)) fail("unsupported video extension: " + ext);
  const filename = entry.id.replace(/[^a-zA-Z0-9_-]/g, "_") + ext;
  fs.copyFileSync(source, path.join(publicDir, filename));
  project.assets.push({ id: entry.id, type: entry.type, src: "agora-assets/" + filename, ...(entry.license ? { license: entry.license } : {}) });
  ids.add(entry.id);
  const fromInFrames = Math.round(entry.startSeconds * fps);
  const durationInFrames = Math.max(1, Math.round(entry.durationSeconds * fps));
  if (fromInFrames + durationInFrames > totalFrames) fail("media entry exceeds project duration: " + entry.id);
  const trackType = entry.type;
  const trackId = "track-" + trackType + "-imported";
  const itemId = "item-" + entry.id;
  if (itemIds.has(itemId)) fail("duplicate timeline item id: " + itemId);
  if (!grouped.has(trackId)) grouped.set(trackId, { id: trackId, type: trackType, name: trackType === "image" ? "Imagens" : trackType === "video" ? "Vídeos" : "Modelos 3D", items: [] });
  grouped.get(trackId).items.push({ id: itemId, assetId: entry.id, fromInFrames, durationInFrames, ...(entry.volume !== undefined ? { volume: entry.volume } : {}), ...(trackType === "model" ? { model: { ...(entry.model || {}) } } : { media: { fit: entry.fit || "cover", ...(entry.position ? { position: entry.position } : {}), ...(entry.opacity !== undefined ? { opacity: entry.opacity } : {}), ...(entry.scale ? { scale: entry.scale } : {}) } }) });
  itemIds.add(itemId);
}
for (const track of grouped.values()) {
  const existing = project.tracks.find((candidate) => candidate.id === track.id);
  if (existing) existing.items = [...(existing.items || []), ...track.items];
  else project.tracks.push(track);
}
project.updatedAt = new Date().toISOString();
fs.writeFileSync(projectPath, JSON.stringify(project, null, 2) + "\n", "utf8");
console.log("Media import complete: " + manifest.media.length + " asset(s) added to " + projectPath);
