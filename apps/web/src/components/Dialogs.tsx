import { FEATURE_MATRIX } from "@neofile/core";
import { useStore } from "@/state/store";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const SHORTCUTS = [
  ["Ctrl O", "Open files"],
  ["Ctrl Shift O", "Open folder"],
  ["Ctrl S", "Save or export"],
  ["Ctrl Shift S", "Save as"],
  ["Ctrl W", "Close tab"],
  ["Ctrl Tab", "Next tab"],
  ["Ctrl B", "Show or hide the file list"],
  ["Ctrl \\", "Split the desk"],
  ["Ctrl F", "Find in the open editor, or search the desk"],
  ["Ctrl Shift F", "Search open files and recent copies"],
  ["Ctrl H", "Local snapshots"],
  ["Ctrl Shift L", "Toggle light and dark"],
  ["Ctrl /", "This list"],
  ["Alt Left / Right", "Switch tabs"],
];

export function Dialogs() {
  const store = useStore();
  const historyDoc = store.docs.find((doc) => doc.id === store.historyFor) ?? null;
  return (
    <>
      <Dialog open={Boolean(store.confirmClose)} onOpenChange={(open) => !open && store.cancelClose()} title="Close without writing the file?" description="A local snapshot may already exist. The file on disk changes only when you save.">
        <div className="seg" style={{ marginTop: 12 }}>
          <Button tone="accent" onClick={() => void store.saveAndClose()}>Save and close</Button>
          <Button onClick={() => store.discardClose()}>Close anyway</Button>
          <Button onClick={() => store.cancelClose()}>Keep editing</Button>
        </div>
      </Dialog>
      <Dialog open={Boolean(historyDoc)} onOpenChange={(open) => !open && store.closeHistory()} title="Snapshots" description={historyDoc ? `Stored on this device for ${historyDoc.name}. Restoring does not write the file until you save.` : undefined}>
        <div className="dialog-grid">
          <Button onClick={() => historyDoc && void store.takeSnapshot(historyDoc.id)}>Keep a snapshot now</Button>
          {store.snapshots.length === 0 ? <p className="tiny">No snapshots yet. Edits autosave after a short pause.</p> : null}
          {store.snapshots.map((snap) => (
            <div key={snap.id} className="matrix-row">
              <b>{snap.kind === "auto" ? "Auto-save" : snap.label}</b>
              <div className="tiny">{new Date(snap.createdAt).toLocaleString()} · {snap.bytes.toLocaleString()} bytes</div>
              <Button size="sm" style={{ marginTop: 8 }} onClick={() => void store.restoreSnapshot(snap.id)}>Restore</Button>
            </div>
          ))}
        </div>
      </Dialog>
      <Dialog open={store.about} onOpenChange={store.setAbout} title="What NeoFile actually does" description="View is not edit. Value editing is not a full spreadsheet.">
        <div className="dialog-grid">
          {FEATURE_MATRIX.map((row) => (
            <article key={row.id} className="matrix-row">
              <b>{row.mode} · {row.formats}</b>
              <p>{row.notes}</p>
              <p className="tiny">{row.save}</p>
            </article>
          ))}
        </div>
      </Dialog>
      <Dialog open={store.privacy} onOpenChange={store.setPrivacy} title="Privacy" description="NeoFile is local. There is no account and no analytics.">
        <div className="dialog-grid">
          <p>Files stay in memory, in this browser's storage, or in the place you choose with Save. Snapshots and recent copies live in IndexedDB on this device.</p>
          <p>The production build blocks outbound network requests. Android is packaged without a network permission. Fonts are bundled, not loaded from a CDN.</p>
          <p>Erasing the desk deletes those local copies. It does not delete the original files in your folders.</p>
          <Button tone="accent" onClick={() => void store.eraseDesk()}>Erase local snapshots and recents</Button>
        </div>
      </Dialog>
      <Dialog open={store.shortcuts} onOpenChange={store.setShortcuts} title="Keyboard shortcuts" description="On Windows these use Ctrl. On a phone, use the bottom bar.">
        <div className="dialog-grid">
          {SHORTCUTS.map(([keys, label]) => (
            <div key={keys} className="matrix-row">
              <b>{keys}</b>
              <div>{label}</div>
            </div>
          ))}
        </div>
      </Dialog>
    </>
  );
}
