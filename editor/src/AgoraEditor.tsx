import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Player } from "@remotion/player";
import type { AgoraProject, AgoraTrack, AgoraTrackItem } from "../../projeto/src/project/types";
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
  const duration = projectDurationInFrames(project);
  const fps = project.profile.fps;
  const seconds = duration / fps;
  const timelineWidth = Math.max(100, seconds * 54 * zoom);
  const selectedTrack = project.tracks.find((track) => track.id === selected.trackId) ?? project.tracks[0];
  const selectedItem = selectedTrack?.items?.find((item) => item.id === selected.itemId);
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
        <button className="button primary" onClick={saveProject}>Salvar projeto</button>
      </div>
    </header>

    <section className="workspace">
      <aside className="sidebar left-panel">
        <div className="panel-heading"><span>PROJETO</span><span className="muted">{project.assets.length} ativos</span></div>
        <div className="asset-list">
          {project.assets.map((asset) => <button className="asset-row" key={asset.id} onClick={() => {
            const track = project.tracks.find((entry) => entry.items?.some((item) => item.assetId === asset.id));
            const item = track?.items?.find((entry) => entry.assetId === asset.id);
            if (track) setSelected({ trackId: track.id, itemId: item?.id });
          }}>
            <span className={`asset-icon ${asset.type}`}>{asset.type === "model" ? "3D" : asset.type.slice(0, 2).toUpperCase()}</span>
            <span><strong>{asset.id}</strong><small>{asset.src}</small></span>
          </button>)}
          {project.assets.length === 0 && <p className="empty">Nenhum ativo neste projeto.</p>}
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
              {track.items?.map((item) => <div key={item.id} draggable className={`clip ${selected.itemId === item.id ? "selected" : ""}`} style={{ left: `${(item.fromInFrames / duration) * 100}%`, width: `${(item.durationInFrames / duration) * 100}%`, background: trackColors[track.type] }}
                onClick={(event) => { event.stopPropagation(); setSelected({ trackId: track.id, itemId: item.id }); }}
                onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
                title={`${itemLabel(track, item)} · ${item.fromInFrames}–${item.fromInFrames + item.durationInFrames} frames`}>
                <span>{itemLabel(track, item)}</span>
              </div>)}
            </div>
          </div>)}
          <div className="playhead" style={{ left: `${150 + (currentFrame / duration) * (timelineWidth - 150)}px` }}><i /></div>
        </div>
      </div>
    </section>
    <footer className="statusbar"><span>{notice}</span><span>ÁGORA · EDITOR VISUAL</span></footer>
  </main>;
};