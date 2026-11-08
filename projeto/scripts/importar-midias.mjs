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
  if (!entry.id || !entry.type || !["image", "video"].includes(entry.type) || !entry.src || !Number.isFinite(entry.startSeconds) || entry.startSeconds < 0 || !Number.isFinite(entry.durationSeconds) || entry.durationSeconds <= 0) fail("invalid media entry " + (index + 1));
  if (ids.has(entry.id)) fail("duplicate asset id: " + entry.id);
  const source = path.resolve(path.dirname(manifestPath), entry.src);
  if (!fs.existsSync(source)) fail("media file not found: " + source);
  const ext = path.extname(source);
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
  if (!grouped.has(trackId)) grouped.set(trackId, { id: trackId, type: trackType, name: trackType === "image" ? "Imagens" : "Vídeos", items: [] });
  grouped.get(trackId).items.push({ id: itemId, assetId: entry.id, fromInFrames, durationInFrames, ...(entry.volume !== undefined ? { volume: entry.volume } : {}), media: { fit: entry.fit || "cover", ...(entry.position ? { position: entry.position } : {}), ...(entry.opacity !== undefined ? { opacity: entry.opacity } : {}), ...(entry.scale ? { scale: entry.scale } : {}) } });
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
