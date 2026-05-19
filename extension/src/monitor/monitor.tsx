import React from "react";
import ReactDOM from "react-dom/client";
import { MonitorPage } from "./MonitorPage";
import "../styles/global.css";

ReactDOM.createRoot(document.getElementById("monitor-root") as HTMLElement).render(
  <React.StrictMode>
    <MonitorPage />
  </React.StrictMode>
);