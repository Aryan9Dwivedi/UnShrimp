import { BRAND_IMAGES } from "../utils/brandAssets";
import { ShrimpLogo } from "../components/ShrimpArt";

const MONITOR_PAGE_PATH = "src/monitor/monitor.html";

export function PopupPage() {
  const openMonitor = () => {
    if (typeof chrome !== "undefined" && chrome.runtime?.getURL && chrome.tabs?.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL(MONITOR_PAGE_PATH) });
      return;
    }

    window.open(`/${MONITOR_PAGE_PATH}`, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="popup-shell">
      <section className="popup-card">
        <div className="popup-brand">
          <ShrimpLogo className="popup-logo-image" />
          <div>
            <p className="eyebrow">UnShrimp</p>
            <h1>Posture monitor</h1>
          </div>
        </div>
        <p className="popup-copy">Open the monitor page to start camera-based posture tracking.</p>
        <button className="button button-primary full-width" type="button" onClick={openMonitor}>
          Open Monitor
        </button>
        <p className="fine-print">Runs locally in your browser</p>
      </section>
    </main>
  );
}
