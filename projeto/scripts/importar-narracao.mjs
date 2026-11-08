import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [manifestArg, projectArg, outputArg] = process.argv.slice(2);
function fail(message) { console.error("Import aborted: " + message); process.exit(1); }
if (!manifestArg || !projectArg) fail("usage: npm run narration:import -- <manifest.json> <project.agora.json> [output.agora.json]");
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8").trimStart());
const manifestPath = path.resolve(manifestArg), projectPath = path.resolve(projectArg), outputPath = path.resolve(outputArg || projectArg);
if (!fs.existsSync(manifestPath) || !fs.existsSync(projectPath)) fail("manifest or project file not found.");
let manifest, project;
try { manifest = readJson(manifestPath); project = readJson(projectPath); } catch (error) { fail("invalid JSON: " + error.message); }
if (manifest.manifestVersion !== 1 || manifest.product !== "AGORA") fail("unsupported manifest version or product identifier.");
if (!Number.isInteger(manifest.fps) || manifest.fps < 1 || manifest.fps > 120 || !Number.isFinite(manifest.durationSeconds) || manifest.durationSeconds <= 0) fail("invalid fps or duration.");
if (!Array.isArray(manifest.phrases) || !Array.isArray(manifest.audioSegments)) fail("missing phrases or audio segments.");
if (project.schemaVersion !== 1 || project.profile?.fps !== manifest.fps || !Array.isArray(project.scenes) || !Array.isArray(project.tracks) || !Array.isArray(project.assets)) fail("invalid project structure or fps mismatch.");
const totalFrames = project.scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0);
if (Math.ceil(manifest.durationSeconds * manifest.fps) > totalFrames) fail("narration exceeds project duration.");
const publicDir = path.join(root, "public", "agora-assets");
const sourceDir = path.dirname(manifestPath);
const newAssets = [], voiceItems = [];
const assetIds = new Set(project.assets.map((asset) => asset.id));
const itemIds = new Set(project.tracks.flatMap((track) => (track.items || []).map((item) => item.id)));
for (const [i, segment] of manifest.audioSegments.entries()) {
  if (!segment.id || !segment.assetId || !segment.src || !Number.isFinite(segment.startSeconds) || segment.startSeconds < 0 || !Number.isFinite(segment.durationSeconds) || segment.durationSeconds <= 0) fail("invalid audio segment " + (i + 1));
  if (assetIds.has(segment.assetId)) fail("duplicate asset id: " + segment.assetId);
  const source = path.resolve(sourceDir, segment.src);
  if (!fs.existsSync(source)) fail("audio file not found: " + source);
  const ext = path.extname(source) || ".wav";
  const filename = segment.assetId.replace(/[^a-zA-Z0-9_-]/g, "_") + ext;
  fs.mkdirSync(publicDir, { recursive: true });
  fs.copyFileSync(source, path.join(publicDir, filename));
  const fromInFrames = Math.round(segment.startSeconds * manifest.fps);
  const durationInFrames = Math.max(1, Math.round(segment.durationSeconds * manifest.fps));
  if (fromInFrames + durationInFrames > totalFrames) fail("audio segment exceeds project duration: " + segment.id);
  newAssets.push({ id: segment.assetId, type: "audio", src: "agora-assets/" + filename });
  const id = "voice-" + segment.id;
  if (itemIds.has(id)) fail("duplicate timeline item id: " + id);
  voiceItems.push({ id, assetId: segment.assetId, fromInFrames, durationInFrames, volume: segment.volume ?? 1 });
  assetIds.add(segment.assetId); itemIds.add(id);
}
const captionItems = manifest.phrases.map((phrase, i) => {
  if (typeof phrase.texto !== "string" || !Number.isFinite(phrase.inicio) || !Number.isFinite(phrase.fim) || phrase.inicio < 0 || phrase.fim <= phrase.inicio) fail("invalid phrase " + (i + 1));
  const fromInFrames = Math.round(phrase.inicio * manifest.fps), end = Math.round(phrase.fim * manifest.fps);
  const durationInFrames = end - fromInFrames;
  if (durationInFrames < 1 || end > totalFrames) fail("phrase exceeds project duration: " + (i + 1));
  const words = (phrase.palavras || []).map((word) => {
    if (typeof word.texto !== "string" || !Number.isFinite(word.inicio) || !Number.isFinite(word.fim) || word.fim <= word.inicio) fail("invalid word timing in phrase " + (i + 1));
    const startInFrames = Math.max(0, Math.round(word.inicio * manifest.fps) - fromInFrames);
    const endInFrames = Math.min(durationInFrames, Math.round(word.fim * manifest.fps) - fromInFrames);
    if (endInFrames <= startInFrames) fail("word has no usable frame range in phrase " + (i + 1));
    return { text: word.texto, startInFrames, endInFrames };
  });
  return { id: "caption-narration-" + String(i + 1).padStart(3, "0"), fromInFrames, durationInFrames, text: phrase.texto, ...(words.length ? { words } : {}) };
});
project.assets.push(...newAssets);
project.tracks = project.tracks.filter((track) => !["voice", "caption"].includes(track.type));
project.tracks.push({ id: "track-voice-imported", type: "voice", name: "Narration", items: voiceItems }, { id: "track-captions-imported", type: "caption", name: "Timed captions", items: captionItems });
project.updatedAt = new Date().toISOString();
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(project, null, 2) + "\n", "utf8");
console.log("Import complete: " + outputPath);
console.log("Audio assets: " + newAssets.length + " | Caption phrases: " + captionItems.length + " | Duration: " + manifest.durationSeconds.toFixed(2) + "s");
