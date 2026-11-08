import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { handleRenderApi, startRenderQueue } from "./render-queue.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uploadDir = path.join(root, "projeto", "public", "uploads");
const libraryFile = path.join(root, "editor", "media-library.json");
const port = Number(process.env.AGORA_MEDIA_PORT || 5175);
const maxBytes = 2 * 1024 * 1024 * 1024;
const allowed = new Map([
  [".jpg", ["image/jpeg", "image"]], [".jpeg", ["image/jpeg", "image"]],
  [".png", ["image/png", "image"]], [".webp", ["image/webp", "image"]],
  [".gif", ["image/gif", "image"]],
  [".mp4", ["video/mp4", "video"]], [".mov", ["video/quicktime", "video"]],
  [".webm", ["video/webm", "video"]], [".m4v", ["video/mp4", "video"]],
  [".mp3", ["audio/mpeg", "audio"]], [".wav", ["audio/wav", "audio"]],
  [".m4a", ["audio/mp4", "audio"]], [".aac", ["audio/aac", "audio"]],
  [".ogg", ["audio/ogg", "audio"]], [".opus", ["audio/opus", "audio"]],
  [".flac", ["audio/flac", "audio"]],
]);
const json = (res, status, data) => {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
};
const readLibrary = () => {
  try {
    const parsed = JSON.parse(fs.readFileSync(libraryFile, "utf8").replace(/^\uFEFF/, ""));
    return Array.isArray(parsed.assets) ? parsed : { version: 1, assets: [] };
  } catch { return { version: 1, assets: [] }; }
};
const saveLibrary = (library) => {
  const temp = libraryFile + ".tmp";
  fs.writeFileSync(temp, JSON.stringify(library, null, 2));
  fs.renameSync(temp, libraryFile);
};
const safeName = (value) => path.basename(String(value || "arquivo").replace(/[\\/]/g, "_")).replace(/[<>:"|?*\x00-\x1f]/g, "_").slice(0, 180) || "arquivo";

const server = http.createServer(async (req, res) => {
  const host = String(req.headers.host || "").replace(/:\d+$/, "");
  if (!["127.0.0.1", "localhost"].includes(host)) return json(res, 403, { error: "Acesso local permitido apenas." });
  const origin = req.headers.origin;
  if (origin && !/^http:\/\/(127\.0\.0\.1|localhost):5174$/.test(origin)) return json(res, 403, { error: "Origem não permitida." });
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  if (url.pathname.startsWith("/api/render/")) {
    const handled = await handleRenderApi(req, res, url);
    if (handled !== false) return;
  }
  if (req.method === "GET" && url.pathname === "/health") return json(res, 200, { ok: true, service: "agora-media" });
  if (req.method === "GET" && url.pathname === "/api/media") return json(res, 200, readLibrary());
  if (req.method === "POST" && url.pathname === "/api/media/upload") {
    const originalName = safeName(decodeURIComponent(String(req.headers["x-file-name"] || "arquivo")));
    const extension = path.extname(originalName).toLowerCase();
    const definition = allowed.get(extension);
    const mime = String(req.headers["content-type"] || "").split(";")[0].toLowerCase();
    const length = Number(req.headers["content-length"] || 0);
    const durationSeconds = Number(req.headers["x-media-duration"] || 0);
    if (!definition || mime !== definition[0] || (length && length > maxBytes)) {
      return json(res, 415, { error: "Formato não suportado ou arquivo acima do limite de 2 GB." });
    }
    await fs.promises.mkdir(uploadDir, { recursive: true });
    const id = crypto.randomUUID();
    const storedName = `${id}${extension}`;
    const destination = path.join(uploadDir, storedName);
    const temporary = destination + ".part";
    let bytes = 0;
    const counter = new (await import("node:stream")).Transform({
      transform(chunk, encoding, callback) {
        bytes += chunk.length;
        if (bytes > maxBytes) return callback(new Error("Arquivo excede o limite de 2 GB."));
        callback(null, chunk);
      },
    });
    try {
      await pipeline(req, counter, fs.createWriteStream(temporary, { flags: "wx" }));
      if (!bytes) throw new Error("Arquivo vazio.");
      await fs.promises.rename(temporary, destination);
      const asset = {
        id: `asset-${id}`, type: definition[1], src: `uploads/${storedName}`,
        name: originalName, mimeType: mime, size: bytes, ...(Number.isFinite(durationSeconds) && durationSeconds > 0 && durationSeconds < 86400 ? { durationSeconds } : {}), createdAt: new Date().toISOString(),
      };
      const library = readLibrary();
      library.assets.unshift(asset);
      saveLibrary(library);
      return json(res, 201, { asset });
    } catch (error) {
      await fs.promises.rm(temporary, { force: true }).catch(() => {});
      return json(res, 400, { error: error instanceof Error ? error.message : "Falha ao salvar arquivo." });
    }
  }
  return json(res, 404, { error: "Rota não encontrada." });
});
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.log(`Biblioteca de mídia já ativa em http://127.0.0.1:${port}`);
    process.exit(0);
  }
  console.error(error);
  process.exit(1);
});
server.listen(port, "127.0.0.1", () => {
  startRenderQueue();
  console.log(`Biblioteca e fila de renderização da ÁGORA ativas em http://127.0.0.1:${port}`);
});
