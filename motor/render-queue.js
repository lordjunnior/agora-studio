import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectDir = path.join(root, "projeto");
const publicDir = path.join(projectDir, "public");
const editorDir = path.join(root, "editor");
const propsDir = path.join(editorDir, "render-jobs");
const queueFile = path.join(editorDir, "render-queue.json");
const outputDir = path.join(projectDir, "out");
const cliPath = path.join(projectDir, "node_modules", "@remotion", "cli", "remotion-cli.js");
const entryPoint = path.join(projectDir, "src", "index.ts");
const jobs = new Map();
const processes = new Map();
const waiting = [];
let activeId = null;

const reply = (res, status, value) => {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(value));
};
const publicJob = (job) => ({
  id: job.id, projectName: job.projectName, status: job.status, progress: job.progress,
  outputFile: job.outputFile, createdAt: job.createdAt, updatedAt: job.updatedAt,
  error: job.error || null, logs: (job.logs || []).slice(-12),
});
const persist = () => {
  try {
    fs.mkdirSync(editorDir, { recursive: true });
    const temp = queueFile + ".tmp";
    fs.writeFileSync(temp, JSON.stringify({ version: 1, jobs: [...jobs.values()].map(publicJob) }, null, 2));
    fs.renameSync(temp, queueFile);
  } catch (error) {
    console.error("Não foi possível salvar o histórico da fila:", error);
  }
};
const readBody = async (req, limit = 24 * 1024 * 1024) => {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error("O projeto excede o limite de 24 MB.");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};
const safeSlug = (value) => String(value || "projeto").normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-")
  .replace(/^-+|-+$/g, "").slice(0, 48) || "projeto";

function validateProject(project) {
  if (!project || project.schemaVersion !== 1 || typeof project.id !== "string" || typeof project.name !== "string") {
    throw new Error("Documento de projeto inválido ou versão não suportada.");
  }
  const profile = project.profile;
  if (!profile || !Number.isInteger(profile.width) || !Number.isInteger(profile.height) ||
      !Number.isInteger(profile.fps) || profile.width < 16 || profile.height < 16 ||
      profile.width > 4096 || profile.height > 4096 || profile.fps < 1 || profile.fps > 120) {
    throw new Error("Perfil de vídeo inválido. Use dimensões entre 16 e 4096 e até 120 FPS.");
  }
  if (!Array.isArray(project.scenes) || !project.scenes.length || !Array.isArray(project.tracks) || !Array.isArray(project.assets)) {
    throw new Error("O projeto precisa ter cenas, trilhas e ativos em listas válidas.");
  }
  const totalFrames = project.scenes.reduce((sum, scene) => {
    if (!scene || !scene.id || !scene.name || !Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 1) {
      throw new Error("Uma das cenas tem nome, ID ou duração inválida.");
    }
    if (!["cidade", "espaco"].includes(scene.metadata?.compositionId)) {
      throw new Error(`A composição "${scene.metadata?.compositionId || "sem nome"}" ainda não está registrada no renderizador.`);
    }
    return sum + scene.durationInFrames;
  }, 0);
  if (totalFrames > 180000) throw new Error("O projeto ultrapassa o limite atual de 180.000 frames.");
  const assetIds = new Set();
  for (const asset of project.assets) {
    if (!asset?.id || assetIds.has(asset.id) || typeof asset.src !== "string" || !asset.src) throw new Error("Há um ativo sem ID único ou caminho.");
    assetIds.add(asset.id);
    const relative = asset.src.replace(/\\/g, "/");
    if (relative.startsWith("/") || relative.split("/").some((part) => part === "..")) throw new Error("O projeto contém um caminho de mídia inválido.");
    const resolved = path.resolve(publicDir, ...relative.split("/"));
    if (!resolved.startsWith(publicDir + path.sep) || !fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
      throw new Error(`Não encontrei o arquivo de mídia "${asset.name || asset.src}" na pasta pública do projeto.`);
    }
  }
  const trackIds = new Set();
  const itemIds = new Set();
  for (const track of project.tracks) {
    if (!track?.id || trackIds.has(track.id) || !Array.isArray(track.items ?? [])) throw new Error("Há uma trilha inválida ou com ID repetido.");
    trackIds.add(track.id);
    for (const item of track.items ?? []) {
      if (!item?.id || itemIds.has(item.id) || !Number.isInteger(item.fromInFrames) || !Number.isInteger(item.durationInFrames) ||
          item.fromInFrames < 0 || item.durationInFrames < 1 || item.fromInFrames + item.durationInFrames > totalFrames) {
        throw new Error("Há um clipe com ID ou intervalo de frames inválido.");
      }
      itemIds.add(item.id);
      if (["voice", "music", "sfx", "image", "video", "model"].includes(track.type) && !assetIds.has(item.assetId)) {
        throw new Error(`O clipe "${item.id}" aponta para um ativo inexistente.`);
      }
    }
  }
  return totalFrames;
}

function addLog(job, value) {
  const lines = String(value).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const rawLine of lines) {
    const line = rawLine.replace(/\x1b\[[0-9;]*m/g, "");
    job.logs.push(line.slice(0, 500));
    const bundling = line.match(/Bundling\s+(\d{1,3})%/i);
    const rendered = line.match(/Rendered\s+(\d+)\s*\/\s*(\d+)/i);
    const encoded = line.match(/Encoded\s+(\d+)\s*\/\s*(\d+)/i);
    if (bundling) job.progress = Math.max(job.progress, Math.round(Number(bundling[1]) * 0.1));
    else if (rendered) job.progress = Math.max(job.progress, 10 + Math.round((Number(rendered[1]) / Math.max(1, Number(rendered[2]))) * 85));
    else if (encoded) job.progress = Math.max(job.progress, 95 + Math.round((Number(encoded[1]) / Math.max(1, Number(encoded[2]))) * 4));
    job.progress = Math.min(99, job.progress);
  }
  job.logs = job.logs.slice(-80);
  job.updatedAt = new Date().toISOString();
  persist();
}

function pumpQueue() {
  if (activeId) return;
  const id = waiting.shift();
  if (!id) return;
  const job = jobs.get(id);
  if (!job || job.status !== "queued") return pumpQueue();
  if (!fs.existsSync(cliPath) || !fs.existsSync(entryPoint)) {
    job.status = "failed";
    job.error = "A instalação do Remotion está incompleta. Verifique a pasta projeto/node_modules.";
    job.updatedAt = new Date().toISOString();
    persist();
    return pumpQueue();
  }
  activeId = id;
  job.status = "rendering";
  job.progress = Math.max(1, job.progress);
  job.updatedAt = new Date().toISOString();
  persist();
  const propsPath = path.join(propsDir, `${id}.json`);
  const outputPath = path.join(outputDir, job.outputFile);
  const args = [
    cliPath, "render", entryPoint, "ProjetoExemplo", outputPath,
    "--props", propsPath, "--codec", "h264", "--concurrency", "2", "--log", "info",
  ];
  const child = spawn(process.execPath, args, { cwd: projectDir, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  processes.set(id, child);
  let outBuffer = "";
  const consume = (chunk) => {
    outBuffer += chunk.toString("utf8");
    const lines = outBuffer.split(/\r?\n/);
    outBuffer = lines.pop() || "";
    if (lines.length) addLog(job, lines.join("\n"));
  };
  child.stdout.on("data", consume);
  child.stderr.on("data", consume);
  child.on("error", (error) => {
    job.status = job.cancelRequested ? "cancelled" : "failed";
    job.error = error.message;
    job.updatedAt = new Date().toISOString();
    processes.delete(id);
    activeId = null;
    persist();
    pumpQueue();
  });
  child.on("close", (code, signal) => {
    if (outBuffer) addLog(job, outBuffer);
    processes.delete(id);
    if (job.cancelRequested) {
      job.status = "cancelled";
      job.error = "Renderização cancelada.";
    } else if (code === 0 && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
      job.status = "completed";
      job.progress = 100;
      job.error = null;
    } else {
      job.status = "failed";
      job.error = `Remotion encerrou com código ${code ?? "indefinido"}${signal ? ` (sinal ${signal})` : ""}. Consulte os logs da fila.`;
    }
    job.updatedAt = new Date().toISOString();
    activeId = null;
    persist();
    pumpQueue();
  });
}

function loadQueue() {
  try {
    const saved = JSON.parse(fs.readFileSync(queueFile, "utf8").replace(/^\uFEFF/, ""));
    for (const old of saved.jobs ?? []) {
      if (!old?.id) continue;
      const job = { ...old, logs: old.logs ?? [] };
      if (job.status === "rendering") {
        job.status = "failed";
        job.error = "O serviço foi reiniciado durante esta renderização.";
      }
      jobs.set(job.id, job);
      if (job.status === "queued") waiting.push(job.id);
    }
  } catch { /* primeira execução */ }
}
loadQueue();

export function startRenderQueue() {
  fs.mkdirSync(propsDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });
  setTimeout(pumpQueue, 250);
}

export async function handleRenderApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/render/jobs") {
    const list = [...jobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(publicJob);
    return reply(res, 200, { jobs: list });
  }
  if (req.method === "POST" && url.pathname === "/api/render/jobs") {
    try {
      const body = await readBody(req);
      const project = body.project;
      validateProject(project);
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const slug = safeSlug(project.name);
      const outputFile = `${slug}-${Date.now()}-${id.slice(0, 8)}.mp4`;
      const propsPath = path.join(propsDir, `${id}.json`);
      fs.mkdirSync(propsDir, { recursive: true });
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(propsPath, JSON.stringify({ project }, null, 2));
      const job = {
        id, projectName: project.name, status: "queued", progress: 0, outputFile,
        createdAt, updatedAt: createdAt, error: null, logs: [], cancelRequested: false,
      };
      jobs.set(id, job);
      waiting.push(id);
      persist();
      pumpQueue();
      return reply(res, 202, { job: publicJob(job) });
    } catch (error) {
      return reply(res, 400, { error: error instanceof Error ? error.message : "Não foi possível adicionar o projeto à fila." });
    }
  }
  const match = url.pathname.match(/^\/api\/render\/jobs\/([0-9a-f-]{36})(?:\/(cancel|download))?$/i);
  if (!match) return false;
  const [, id, action] = match;
  const job = jobs.get(id);
  if (!job) return reply(res, 404, { error: "Renderização não encontrada." });
  if (req.method === "GET" && !action) return reply(res, 200, { job: publicJob(job) });
  if (req.method === "POST" && action === "cancel") {
    if (job.status === "queued") {
      job.status = "cancelled";
      job.error = "Renderização cancelada antes de iniciar.";
      const index = waiting.indexOf(id);
      if (index >= 0) waiting.splice(index, 1);
      job.updatedAt = new Date().toISOString();
      persist();
      return reply(res, 200, { job: publicJob(job) });
    }
    if (job.status === "rendering") {
      job.cancelRequested = true;
      const child = processes.get(id);
      if (child?.pid && process.platform === "win32") spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { windowsHide: true });
      else child?.kill("SIGTERM");
      return reply(res, 202, { job: publicJob(job) });
    }
    return reply(res, 409, { error: "Esta renderização já terminou." });
  }
  if (req.method === "GET" && action === "download") {
    if (job.status !== "completed") return reply(res, 409, { error: "O vídeo ainda não está pronto." });
    const file = path.join(outputDir, job.outputFile);
    if (!fs.existsSync(file)) return reply(res, 404, { error: "Arquivo final não encontrado." });
    res.writeHead(200, {
      "Content-Type": "video/mp4",
      "Content-Length": fs.statSync(file).size,
      "Content-Disposition": `attachment; filename="${job.outputFile}"`,
      "Cache-Control": "no-store",
    });
    fs.createReadStream(file).pipe(res);
    return true;
  }
  return reply(res, 405, { error: "Método não permitido." });
}
