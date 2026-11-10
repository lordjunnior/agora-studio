import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Player } from "@remotion/player";
import { AudioWaveform, MediaThumbnail } from "./MediaThumbnail";
import type { AgoraAsset, AgoraProject, AgoraTrack, AgoraTrackItem } from "../../projeto/src/project/types";
import { projectDurationInFrames, validateAgoraProject } from "../../projeto/src/project/types";
import { ProjetoComposition } from "../../projeto/src/project/ProjectComposition";
import initialProject from "../../projeto/src/project/projeto-ativo.agora.json";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const formatTime = (frame: number, fps: number) => {
  const total = Math.max(0, Math.floor(frame / fps));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};
const trackNames: Record<AgoraTrack["type"], string> = {
  scene: "Cenas", voice: "Narração", music: "Música", sfx: "Efeitos",
  caption: "Legendas", overlay: "Elementos", image: "Imagens", video: "Vídeos", model: "Modelos 3D",
};
const trackColors: Record<AgoraTrack["type"], string> = {
  scene: "#8c8b83", voice: "#d6a65c", music: "#6d9f8c", sfx: "#b77d69",
  caption: "#8c91c7", overlay: "#ad8cc7", image: "#729cba", video: "#5e91a0", model: "#b2a06d",
};
const itemLabel = (track: AgoraTrack, item: AgoraTrackItem) =>
  item.text || item.assetId || (trackNames[track.type] ?? track.type);
const mimeForFile = (name: string) => {
  const extension = name.toLowerCase().split(".").pop();
  const types: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif",
    mp4: "video/mp4", m4v: "video/mp4", mov: "video/quicktime", webm: "video/webm",
    mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/mp4", aac: "audio/aac",
    ogg: "audio/ogg", opus: "audio/opus", flac: "audio/flac",
  };
  return types[extension ?? ""] ?? "application/octet-stream";
};
const probeDuration = (file: File, type: string) => new Promise<number>((resolve) => {
  if (type === "image") return resolve(5);
  const url = URL.createObjectURL(file);
  const media = document.createElement(type === "video" ? "video" : "audio");
  media.preload = "metadata";
  media.onloadedmetadata = () => {
    const duration = Number.isFinite(media.duration) ? media.duration : 5;
    URL.revokeObjectURL(url);
    resolve(Math.max(1, duration));
  };
  media.onerror = () => { URL.revokeObjectURL(url); resolve(5); };
  media.src = url;
});
type RenderJob = {
  id: string; projectName: string; status: "queued" | "rendering" | "completed" | "failed" | "cancelled";
  progress: number; outputFile: string; createdAt: string; updatedAt: string; error?: string | null; logs?: string[];
};

export const AgoraEditor: React.FC = () => {
  const [project, setProject] = useState<AgoraProject>(() => {
    try {
      const saved = localStorage.getItem("agora.editor.project.v1");
      if (saved) {
        const parsed = JSON.parse(saved) as AgoraProject;
        validateAgoraProject(parsed);
        return parsed;
      }
    } catch { /* inicia com o projeto-base quando não há cópia local válida */ }
    return clone(initialProject as AgoraProject);
  });
  const [past, setPast] = useState<AgoraProject[]>([]);
  const [future, setFuture] = useState<AgoraProject[]>([]);
  const projectRef = useRef(project);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [selected, setSelected] = useState<{ trackId: string; itemId?: string }>({ trackId: "track-scenes" });
  const [zoom, setZoom] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [notice, setNotice] = useState("Projeto carregado");
  const playerRef = useRef<any>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const mediaImportRef = useRef<HTMLInputElement>(null);
  const [libraryAssets, setLibraryAssets] = useState<AgoraAsset[]>([]);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryFilter, setLibraryFilter] = useState<"all" | "image" | "video" | "audio">("all");
  const [audioTrackType, setAudioTrackType] = useState<"voice" | "music" | "sfx">("voice");
  const [uploading, setUploading] = useState(false);
  const [renderJobs, setRenderJobs] = useState<RenderJob[]>([]);
  const [renderSubmitting, setRenderSubmitting] = useState(false);
  const [renderPanelOpen, setRenderPanelOpen] = useState(false);
  const duration = projectDurationInFrames(project);
  const fps = project.profile.fps;
  const seconds = duration / fps;
  const timelineWidth = Math.max(100, seconds * 54 * zoom);
  const selectedTrack = project.tracks.find((track) => track.id === selected.trackId) ?? project.tracks[0];
  const selectedItem = selectedTrack?.items?.find((item) => item.id === selected.itemId);
  const filteredLibraryAssets = libraryAssets.filter((asset) => {
    const matchesType = libraryFilter === "all" || asset.type === libraryFilter;
    const matchesName = (asset.name ?? asset.id).toLocaleLowerCase().includes(librarySearch.trim().toLocaleLowerCase());
    return matchesType && matchesName;
  });
  const ticks = useMemo(() => {
    const step = Math.max(30, Math.round((fps * 5) / 30) * 30);
    return Array.from({ length: Math.ceil(duration / step) + 1 }, (_, index) => index * step).filter((frame) => frame <= duration);
  }, [duration, fps]);

  const updateProject = useCallback((mutator: (draft: AgoraProject) => void) => {
    const current = projectRef.current;
    const draft = clone(current);
    mutator(draft);
    draft.updatedAt = new Date().toISOString();
    try { validateAgoraProject(draft); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Projeto inválido"); return; }
    setPast((history) => [...history.slice(-49), current]);
    setFuture([]);
    projectRef.current = draft;
    setProject(draft);
    setNotice("Alterações aplicadas");
  }, []);
  const undo = useCallback(() => {
    if (!past.length) return;
    const previous = past[past.length - 1];
    setPast(past.slice(0, -1));
    setFuture([project, ...future].slice(0, 50));
    projectRef.current = previous;
    setProject(previous);
    setNotice("Alteração desfeita");
  }, [past, future, project]);

  const redo = useCallback(() => {
    if (!future.length) return;
    const next = future[0];
    setFuture(future.slice(1));
    setPast([...past, project].slice(-50));
    projectRef.current = next;
    setProject(next);
    setNotice("Alteração refeita");
  }, [past, future, project]);

  useEffect(() => {
    try { localStorage.setItem("agora.editor.project.v1", JSON.stringify(project)); }
    catch { setNotice("Não foi possível salvar automaticamente neste navegador"); }
  }, [project]);

  useEffect(() => {
    fetch("/api/media").then(async (response) => {
      if (!response.ok) throw new Error("Biblioteca indisponível");
      const data = await response.json() as { assets?: AgoraAsset[] };
      setLibraryAssets(data.assets ?? []);
    }).catch(() => setNotice("Biblioteca local indisponível. Inicie pelo ABRIR-PAINEL.bat."));
  }, []);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/render/jobs");
        if (!response.ok) return;
        const data = await response.json() as { jobs?: RenderJob[] };
        if (active) setRenderJobs(data.jobs ?? []);
      } catch { /* a fila pode estar iniciando junto com o editor */ }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 1500);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editingText = target?.matches("input, textarea, select, [contenteditable=true]");
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === "s") { event.preventDefault(); saveProject(); }
      else if (key === "z" && !editingText) { event.preventDefault(); if (event.shiftKey) redo(); else undo(); }
      else if (key === "y" && !editingText) { event.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
  const updateItem = (patch: Partial<AgoraTrackItem>) => {
    if (!selectedItem) return;
    updateProject((draft) => {
      const track = draft.tracks.find((entry) => entry.id === selected.trackId);
      const item = track?.items?.find((entry) => entry.id === selected.itemId);
      if (item) Object.assign(item, patch);
    });
  };

  const saveProject = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${project.id}.agora.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Projeto exportado em JSON");
  };

  const importProject = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as AgoraProject;
      validateAgoraProject(parsed);
      projectRef.current = parsed;
      setProject(parsed);
      setPast([]);
      setFuture([]);
      setCurrentFrame(0);
      setSelected({ trackId: parsed.tracks[0]?.id ?? "" });
      setNotice("Projeto importado com sucesso");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível importar o projeto");
    }
  };

  const addTrack = (type: AgoraTrack["type"]) => {
    const id = `track-${type}-${Date.now()}`;
    updateProject((draft) => draft.tracks.push({ id, type, name: trackNames[type], items: [] }));
    setSelected({ trackId: id });
  };

  const insertAssetIntoTimeline = (asset: AgoraAsset, durationSeconds = 5, requestedFrame = currentFrame) => {
    const type: AgoraTrack["type"] = asset.type === "audio" ? audioTrackType : asset.type as "image" | "video";
    const existing = projectRef.current.assets.some((entry) => entry.id === asset.id);
    const existingItemTrack = projectRef.current.tracks.find((track) => track.items?.some((item) => item.assetId === asset.id));
    if (existingItemTrack) {
      const item = existingItemTrack.items?.find((entry) => entry.assetId === asset.id);
      setSelected({ trackId: existingItemTrack.id, itemId: item?.id });
      setNotice("Ativo já está na timeline");
      return;
    }
    const track = projectRef.current.tracks.find((entry) => entry.type === type);
    const trackId = track?.id ?? `track-${type}-${Date.now()}`;
    const fromInFrames = requestedFrame >= duration ? 0 : Math.max(0, requestedFrame);
    const durationInFrames = Math.max(1, Math.min(Math.round(durationSeconds * fps), duration - fromInFrames));
    updateProject((draft) => {
      if (!existing) draft.assets.push(asset);
      let target = draft.tracks.find((entry) => entry.id === trackId);
      if (!target) {
        target = { id: trackId, type, name: trackNames[type], items: [] };
        draft.tracks.push(target);
      }
      target.items ??= [];
      target.items.push({ id: `item-${crypto.randomUUID()}`, assetId: asset.id, fromInFrames, durationInFrames, volume: type === "voice" ? 1 : 0.8 });
    });
    const insertedTrack = projectRef.current.tracks.find((entry) => entry.id === trackId);
    const insertedItem = insertedTrack?.items?.find((entry) => entry.assetId === asset.id);
    setSelected({ trackId, itemId: insertedItem?.id });
  };

  const uploadFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (!files.length) return;
    setUploading(true);
    let cursor = currentFrame;
    let completed = 0;
    try {
      for (const file of files) {
        const mime = file.type || mimeForFile(file.name);
        const mediaType = mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : "audio";
        const seconds = await probeDuration(file, mediaType);
        const response = await fetch("/api/media/upload", {
          method: "POST",
          headers: { "Content-Type": mime, "X-File-Name": encodeURIComponent(file.name), "X-Media-Duration": String(seconds) },
          body: file,
        });
        const result = await response.json() as { asset?: AgoraAsset; error?: string };
        if (!response.ok || !result.asset) throw new Error(result.error || `Falha ao importar ${file.name}`);
        const asset = result.asset;
        setLibraryAssets((items) => [asset, ...items.filter((entry) => entry.id !== asset.id)]);
        insertAssetIntoTimeline(asset, seconds, cursor);
        cursor += Math.max(1, Math.round(seconds * fps));
        completed += 1;
      }
      setNotice(`${completed} arquivo(s) salvo(s) na biblioteca e inserido(s) na timeline`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha no envio de mídia");
    } finally {
      setUploading(false);
      if (mediaImportRef.current) mediaImportRef.current.value = "";
    }
  };

  const addLibraryAsset = async (asset: AgoraAsset) => {
    if (projectRef.current.assets.some((entry) => entry.id === asset.id)) {
      insertAssetIntoTimeline(asset, asset.durationSeconds ?? 5);
      return;
    }
    let seconds = asset.durationSeconds ?? 5;
    if (!asset.durationSeconds && (asset.type === "audio" || asset.type === "video")) {
      seconds = await new Promise<number>((resolve) => {
        const media = document.createElement(asset.type === "video" ? "video" : "audio");
        media.preload = "metadata";
        media.onloadedmetadata = () => resolve(Number.isFinite(media.duration) ? media.duration : 5);
        media.onerror = () => resolve(5);
        media.src = `/${asset.src}`;
      });
    }
    insertAssetIntoTimeline(asset, seconds);
  };

  const removeLibraryAsset = async (asset: AgoraAsset) => {
    const name = asset.name ?? asset.id;
    if (!window.confirm(`Remover "${name}" da biblioteca? O arquivo físico será preservado e projetos existentes continuarão funcionando.`)) return;
    try {
      const response = await fetch(`/api/media/${encodeURIComponent(asset.id)}`, { method: "DELETE" });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Não foi possível remover o ativo.");
      setLibraryAssets((items) => items.filter((entry) => entry.id !== asset.id));
      setNotice("Ativo removido da biblioteca. Arquivo físico preservado.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha ao remover ativo da biblioteca.");
    }
  };

  const startRender = async () => {
    setRenderSubmitting(true);
    setRenderPanelOpen(true);
    try {
      const response = await fetch("/api/render/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project }),
      });
      const result = await response.json() as { job?: RenderJob; error?: string };
      if (!response.ok || !result.job) throw new Error(result.error || "Não foi possível iniciar a renderização.");
      setRenderJobs((items) => [result.job!, ...items.filter((item) => item.id !== result.job!.id)]);
      setNotice("Projeto enviado para a fila do Remotion");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha ao iniciar a renderização");
    } finally {
      setRenderSubmitting(false);
    }
  };

  const cancelRender = async (id: string) => {
    try {
      const response = await fetch(`/api/render/jobs/${id}/cancel`, { method: "POST" });
      const result = await response.json() as { job?: RenderJob; error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível cancelar.");
      if (result.job) setRenderJobs((items) => items.map((item) => item.id === id ? result.job! : item));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha ao cancelar a renderização");
    }
  };

  const seek = (frame: number) => {
    const next = Math.max(0, Math.min(duration - 1, Math.round(frame)));
    setCurrentFrame(next);
    playerRef.current?.seekTo(next);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, track: AgoraTrack) => {
    event.preventDefault();
    const itemId = event.dataTransfer.getData("text/plain");
    if (!itemId || !track.items?.some((item) => item.id === itemId)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const item = track.items.find((entry) => entry.id === itemId);
    if (!item) return;
    const next = Math.round(ratio * duration);
    updateProject((draft) => {
      const target = draft.tracks.find((entry) => entry.id === track.id);
      const moving = target?.items?.find((entry) => entry.id === itemId);
      if (moving) moving.fromInFrames = Math.max(0, Math.min(duration - moving.durationInFrames, next));
    });
  };

  return <main className="studio">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">A</span><div><strong>ÁGORA</strong><small>STUDIO / EDITOR</small></div></div>
      <div className="project-title"><span className="status-dot" />{project.name}<small>{project.profile.width} × {project.profile.height} · {fps} FPS</small></div>
      <div className="top-actions">
        <button className="button quiet" onClick={undo} disabled={!past.length} title="Desfazer (Ctrl+Z)">Desfazer</button>
        <button className="button quiet" onClick={redo} disabled={!future.length} title="Refazer (Ctrl+Y)">Refazer</button>
        <button className="button quiet" onClick={() => importRef.current?.click()}>Abrir projeto</button>
        <input ref={importRef} type="file" accept=".json,.agora.json,application/json" hidden onChange={(event) => void importProject(event.target.files?.[0])} />
        <button className="button quiet" onClick={() => setRenderPanelOpen((open) => !open)}>Fila ({renderJobs.length})</button>
        <button className="button quiet" onClick={saveProject}>Salvar projeto</button>
        <button className="button primary" onClick={() => void startRender()} disabled={renderSubmitting}>{renderSubmitting ? "Enviando…" : "Renderizar MP4"}</button>
      </div>
    </header>

    <section className="workspace">
      <aside className="sidebar left-panel">
        <div className="panel-heading"><span>PROJETO</span><button className="library-add" onClick={() => mediaImportRef.current?.click()} disabled={uploading}>{uploading ? "Enviando…" : "+ Importar"}</button></div>
        <input ref={mediaImportRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm,audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/ogg,audio/opus,audio/flac" multiple hidden onChange={(event) => void uploadFiles(event.target.files ?? [])} />
        <div className="asset-list">
          {project.assets.map((asset) => <button className="asset-row" key={asset.id} onClick={() => {
            const track = project.tracks.find((entry) => entry.items?.some((item) => item.assetId === asset.id));
            const item = track?.items?.find((entry) => entry.assetId === asset.id);
            if (track) setSelected({ trackId: track.id, itemId: item?.id });
          }}>
            <span className={`asset-icon ${asset.type}`}>{asset.type === "model" ? "3D" : asset.type.slice(0, 2).toUpperCase()}</span>
            <span><strong>{asset.name ?? asset.id}</strong><small>{asset.src}</small></span>
          </button>)}
          {project.assets.length === 0 && <p className="empty">Nenhum ativo neste projeto.</p>}
        </div>
        <div className="panel-heading library-heading"><span>BIBLIOTECA LOCAL</span><span className="muted">{libraryAssets.length} arquivos</span></div>
        <div className="library-audio-target"><label>Destino dos áudios<select value={audioTrackType} onChange={(event) => setAudioTrackType(event.target.value as "voice" | "music" | "sfx")}><option value="voice">Narração</option><option value="music">Música</option><option value="sfx">Efeitos</option></select></label></div>
        <div className="library-controls">
          <input aria-label="Buscar na biblioteca" value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} placeholder="Buscar mídia..." />
          <select aria-label="Filtrar tipo de mídia" value={libraryFilter} onChange={(event) => setLibraryFilter(event.target.value as "all" | "image" | "video" | "audio")}>
            <option value="all">Todos</option><option value="image">Imagens</option><option value="video">Vídeos</option><option value="audio">Áudios</option>
          </select>
        </div>
        <div className="asset-list library-list">
          {filteredLibraryAssets.map((asset) => <div className="library-asset-row" key={asset.id}>
            <button className="asset-row" onClick={() => void addLibraryAsset(asset)} title="Inserir na timeline">
              <MediaThumbnail asset={asset} />
              <span><strong>{asset.name ?? asset.id}</strong><small>{asset.size ? `${(asset.size / 1048576).toFixed(1)} MB · ` : ""}{asset.durationSeconds ? `${asset.durationSeconds.toFixed(1)} s · ` : ""}{asset.type.toUpperCase()} · inserir na timeline</small></span>
            </button>
            <button className="library-remove" onClick={() => void removeLibraryAsset(asset)} title="Remover da biblioteca" aria-label={`Remover ${asset.name ?? asset.id} da biblioteca`}>×</button>
          </div>)}
          {libraryAssets.length === 0 && <p className="empty">Importe imagens, vídeos ou áudios para criar sua biblioteca permanente.</p>}
          {libraryAssets.length > 0 && filteredLibraryAssets.length === 0 && <p className="empty">Nenhum arquivo corresponde à busca ou ao filtro.</p>}
        </div>
        <div className="panel-heading tools-heading">ADICIONAR TRILHA</div>
        <div className="track-tools">
          {(["image", "video", "model", "voice", "music", "sfx", "caption", "overlay"] as AgoraTrack["type"][]).map((type) =>
            <button key={type} onClick={() => addTrack(type)}><span style={{ background: trackColors[type] }} />{trackNames[type]}</button>
          )}
        </div>
      </aside>

      <section className="center-panel">
        <div className="preview-heading"><span>MONITOR DE PRÉ-VISUALIZAÇÃO</span><span>{formatTime(currentFrame, fps)} / {formatTime(duration, fps)}</span></div>
        <div className="preview-stage">
          <Player ref={playerRef} component={ProjetoComposition} inputProps={{ project }} durationInFrames={duration}
            compositionWidth={project.profile.width} compositionHeight={project.profile.height} fps={fps}
            style={{ height: "100%", width: "auto", maxWidth: "100%", aspectRatio: `${project.profile.width}/${project.profile.height}` }}
            controls={false} clickToPlay={false} spaceKeyToPlayOrPause={false}
            onFrameUpdate={(frame: number) => setCurrentFrame(frame)}
            onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
        </div>
        <div className="transport">
          <button className="transport-button" onClick={() => seek(0)} title="Ir para o início">|◀</button>
          <button className="play-button" onClick={() => playing ? playerRef.current?.pause() : playerRef.current?.play()}>{playing ? "Ⅱ" : "▶"}</button>
          <button className="transport-button" onClick={() => seek(currentFrame + 1)} title="Avançar um frame">▶|</button>
          <span className="timecode">{formatTime(currentFrame, fps)} <small>F{String(currentFrame % fps).padStart(2, "0")}</small></span>
          <span className="transport-spacer" />
          <span className="muted">PRÉVIA</span>
        </div>
      </section>

      <aside className="sidebar inspector">
        <div className="panel-heading"><span>INSPETOR</span><span className="muted">{selectedItem ? "ITEM" : "TRILHA"}</span></div>
        {selectedItem && selectedTrack ? <>
          <div className="inspector-title"><span className="type-dot" style={{ background: trackColors[selectedTrack.type] }} /><strong>{itemLabel(selectedTrack, selectedItem)}</strong></div>
          <label>Início (frames)<input type="number" min="0" max={duration - 1} value={selectedItem.fromInFrames} onChange={(e) => updateItem({ fromInFrames: Math.max(0, Math.min(duration - selectedItem.durationInFrames, Number(e.target.value))) })} /></label>
          <label>Duração (frames)<input type="number" min="1" max={duration - selectedItem.fromInFrames} value={selectedItem.durationInFrames} onChange={(e) => updateItem({ durationInFrames: Math.max(1, Math.min(duration - selectedItem.fromInFrames, Number(e.target.value))) })} /></label>
          {["voice", "music", "sfx", "video"].includes(selectedTrack.type) && <label>Volume<input type="range" min="0" max="1" step="0.01" value={selectedItem.volume ?? 1} onChange={(e) => updateItem({ volume: Number(e.target.value) })} /><small>{Math.round((selectedItem.volume ?? 1) * 100)}%</small></label>}
          {["image", "video"].includes(selectedTrack.type) && <><label>Enquadramento<select value={selectedItem.media?.fit ?? "cover"} onChange={(e) => updateItem({ media: { ...selectedItem.media, fit: e.target.value as "cover" | "contain" | "fill" } })}><option value="cover">Preencher</option><option value="contain">Conter</option><option value="fill">Esticar</option></select></label><label>Escala<input type="number" min="0.1" max="5" step="0.05" value={selectedItem.media?.scale ?? 1} onChange={(e) => updateItem({ media: { ...selectedItem.media, scale: Number(e.target.value) } })} /></label><label>Opacidade<input type="range" min="0" max="1" step="0.01" value={selectedItem.media?.opacity ?? 1} onChange={(e) => updateItem({ media: { ...selectedItem.media, opacity: Number(e.target.value) } })} /></label></>}
          {selectedTrack.type === "model" && <><label>Escala 3D<input type="number" min="0.01" step="0.05" value={selectedItem.model?.scale ?? 1} onChange={(e) => updateItem({ model: { ...selectedItem.model, scale: Number(e.target.value) } })} /></label><label>Rotação contínua<input type="number" step="0.1" value={selectedItem.model?.spinPerSecond ?? 0} onChange={(e) => updateItem({ model: { ...selectedItem.model, spinPerSecond: Number(e.target.value) } })} /></label></>}
          {["caption", "overlay"].includes(selectedTrack.type) && <label>Texto<textarea rows={4} value={selectedItem.text ?? ""} onChange={(e) => updateItem({ text: e.target.value })} /></label>}
          <button className="danger-button" onClick={() => {
            updateProject((draft) => {
              const track = draft.tracks.find((entry) => entry.id === selected.trackId);
              if (track) track.items = (track.items ?? []).filter((item) => item.id !== selected.itemId);
            });
            setSelected({ trackId: selected.trackId });
          }}>Remover item da timeline</button>
        </> : selectedTrack ? <div className="track-inspector"><strong>{selectedTrack.name ?? trackNames[selectedTrack.type]}</strong><p>{trackNames[selectedTrack.type]} · {selectedTrack.items?.length ?? 0} itens</p><p className="muted">Selecione um clipe na timeline para editar suas propriedades.</p></div> : <p className="empty">Selecione uma trilha ou item.</p>}
      </aside>
    </section>

    <section className="timeline-panel">
      <div className="timeline-toolbar"><strong>TIMELINE</strong><span>{formatTime(duration, fps)} · {duration} frames</span><span className="toolbar-spacer" /><button onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}>−</button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom((value) => Math.min(3, value + 0.25))}>+</button></div>
      <div className="timeline-scroll">
        <div className="timeline-inner" style={{ width: `${timelineWidth}px` }}>
          <div className="ruler-row"><div className="track-label">TEMPO</div><div className="ruler" onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); seek(((event.clientX - rect.left) / rect.width) * duration); }}>
            {ticks.map((frame) => <span key={frame} style={{ left: `${(frame / duration) * 100}%` }}>{formatTime(frame, fps)}</span>)}
          </div></div>
          {project.tracks.map((track) => <div className={`track-row ${selected.trackId === track.id ? "active" : ""}`} key={track.id}>
            <button className="track-label" onClick={() => setSelected({ trackId: track.id })}><i style={{ background: trackColors[track.type] }} />{track.name ?? trackNames[track.type]}</button>
            <div className="track-content" onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, track)} onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); seek(((event.clientX - rect.left) / rect.width) * duration); }}>
              {track.items?.map((item) => {
                const asset = project.assets.find((entry) => entry.id === item.assetId);
                const audioClip = ["voice", "music", "sfx"].includes(track.type) && asset?.type === "audio";
                return <div key={item.id} draggable className={`clip ${audioClip ? "clip-audio" : ""} ${selected.itemId === item.id ? "selected" : ""}`} style={{ left: `${(item.fromInFrames / duration) * 100}%`, width: `${(item.durationInFrames / duration) * 100}%`, background: trackColors[track.type] }}
                  onClick={(event) => { event.stopPropagation(); setSelected({ trackId: track.id, itemId: item.id }); }}
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
                  title={`${itemLabel(track, item)} · ${item.fromInFrames}–${item.fromInFrames + item.durationInFrames} frames`}>
                  {audioClip && asset ? <AudioWaveform asset={asset} /> : null}
                  <span>{itemLabel(track, item)}</span>
                </div>;
              })}
            </div>
          </div>)}
          <div className="playhead" style={{ left: `${150 + (currentFrame / duration) * (timelineWidth - 150)}px` }}><i /></div>
        </div>
      </div>
    </section>
    {renderPanelOpen && <aside className="render-queue-panel">
      <div className="render-queue-head">
        <div><strong>FILA DE RENDERIZAÇÃO</strong><small>Remotion · MP4 · armazenamento local</small></div>
        <button onClick={() => setRenderPanelOpen(false)}>Fechar</button>
      </div>
      <div className="render-queue-list">
        {renderJobs.length === 0 && <p className="empty">Nenhuma renderização ainda. Use Renderizar MP4 para criar o primeiro vídeo.</p>}
        {renderJobs.map((job) => <article className="render-job" key={job.id}>
          <div className="render-job-title"><strong>{job.projectName}</strong><span className={`render-status ${job.status}`}>{({ queued: "Na fila", rendering: "Renderizando", completed: "Concluído", failed: "Falhou", cancelled: "Cancelado" })[job.status]}</span></div>
          <div className="render-progress"><i style={{ width: `${Math.max(0, Math.min(100, job.progress))}%` }} /></div>
          <div className="render-job-meta"><span>{job.progress}%</span><span>{new Date(job.createdAt).toLocaleString("pt-BR")}</span></div>
          {job.error && <p className="render-error">{job.error}</p>}
          {job.logs?.length ? <details className="render-logs"><summary>Logs do Remotion</summary><pre>{job.logs.join("\n")}</pre></details> : null}
          <div className="render-job-actions">
            {job.status === "completed" && <a href={`/api/render/jobs/${job.id}/download`} download>Baixar MP4</a>}
            {(job.status === "queued" || job.status === "rendering") && <button onClick={() => void cancelRender(job.id)}>Cancelar</button>}
          </div>
        </article>)}
      </div>
    </aside>}
    <footer className="statusbar"><span>{notice}</span><span>ÁGORA · EDITOR VISUAL</span></footer>
  </main>;
};