import { useStore } from "@/state/store";
import { Button } from "@/components/ui/button";
import { SAMPLES } from "@/samples";

export function Launcher() {
  const store = useStore();
  return (
    <div className="launcher">
      <div className="launcher-hero">
        <h1>NEOFILE</h1>
        <p>A local file desk. Text and CSV stay editable. Word, PowerPoint, PDF, and media stay honest previews. Nothing is uploaded.</p>
        <div className="seg">
          <Button tone="accent" onClick={() => void store.openFiles()}>Open files</Button>
          <Button onClick={() => void store.openFolder()}>Open folder</Button>
        </div>
      </div>
      <div className="dropzone">
        <strong>Drop files here.</strong>
        <p className="muted">They open in this tab. A dropped folder also fills the sidebar. NeoFile does not send them anywhere.</p>
      </div>
      <div className="section-label">Recent on this device</div>
      {store.recents.length === 0 ? <p className="section-label" style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>No recent files yet. Open a sample below.</p> : null}
      <div className="card-grid">
        {store.recents.map((item) => (
          <button key={item.id} className="recent-card" onClick={() => void store.openRecent(item.id)}>
            <strong>{item.name}</strong>
            <small>{item.displayLanguage}</small>
          </button>
        ))}
      </div>
      <div className="section-label">Samples</div>
      <div className="sample-grid">
        {SAMPLES.map((sample) => (
          <button key={sample.name} className="sample-card" onClick={() => void store.openSample(sample.name)}>
            <strong>{sample.name}</strong>
            <small>{sample.blurb}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
