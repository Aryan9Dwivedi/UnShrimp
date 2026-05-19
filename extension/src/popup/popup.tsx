import React from "react";
import ReactDOM from "react-dom/client";
import { PopupPage } from "./PopupPage";
import "../styles/global.css";

ReactDOM.createRoot(document.getElementById("popup-root") as HTMLElement).render(
  <React.StrictMode>
    <PopupPage />
  </React.StrictMode>
);