import React from "react";
import ReactDOM from "react-dom/client";
import { AgoraEditor } from "./AgoraEditor";
import "./editor.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><AgoraEditor /></React.StrictMode>,
);