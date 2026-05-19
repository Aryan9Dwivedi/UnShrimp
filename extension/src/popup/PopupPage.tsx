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
        <p className="eyebrow">Posture monitor ready</p>
        <h1>UnShrimp</h1>
        <p className="popup-copy">
          Open the monitor page to start camera-based posture tracking.
        </p>
        <button className="button primary full-width" type="button" onClick={openMonitor}>
          Open Monitor
        </button>
        <p className="fine-print">Runs locally in your browser</p>
      </section>
    </main>
  );
}