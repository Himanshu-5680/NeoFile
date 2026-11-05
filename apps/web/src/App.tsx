import { useRef } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useStore } from "@/state/store";
import { TitleBar } from "@/components/TitleBar";
import { Sidebar } from "@/components/Sidebar";
import { Launcher } from "@/components/Launcher";
import { EditorHost } from "@/components/EditorHost";
import { Dialogs } from "@/components/Dialogs";
import { Button } from "@/components/ui/button";

export function App() {
  const store = useStore();
  const depth = useRef(0);
  if (store.boot === "loading") {
    return (
      <div className="boot">
        <div>
          <h1>NEOFILE</h1>
          <p>Opening the local desk…</p>
        </div>
      </div>
    );
  }
  if (store.boot === "error") {
    return (
      <div className="boot">
        <div>
          <h1>NEOFILE</h1>
          <p>{store.bootError ?? "The local desk could not open."}</p>
          <Button onClick={() => store.retryBoot()}>Try again</Button>
        </div>
      </div>
    );
  }
  const primary = store.docs.find((doc) => doc.id === store.activeId) ?? null;
  const secondary = store.docs.find((doc) => doc.id === store.secondaryId) ?? null;
  const swipe = store.shell === "android" || window.matchMedia("(pointer: coarse)").matches;
  return (
    <TooltipProvider>
      <div
        className="app-shell"
        onDragEnter={(event) => {
          event.preventDefault();
          depth.current += 1;
          store.setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => {
          depth.current -= 1;
          if (depth.current <= 0) {
            depth.current = 0;
            store.setDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          depth.current = 0;
          void store.onDropTransfer(event.dataTransfer);
        }}
        onPointerDown={(event) => {
          if (!swipe || event.pointerType === "mouse") return;
          if ((event.target as HTMLElement).closest("[data-swipe-ignore], input, textarea, .cm-editor, .sheet-scroll, .pdf-page")) return;
          swipeStart.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={(event) => {
          const start = swipeStart.current;
          swipeStart.current = null;
          if (!start) return;
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (Math.abs(dx) < 72 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
          void store.sibling(dx < 0 ? 1 : -1);
        }}
      >
        <TitleBar />
        <div className="workspace">
          <Sidebar />
          <main className="main-pane">
            {store.tabs.length === 0 ? (
              <Launcher />
            ) : (
              <>
                <div className="tabstrip" role="tablist">
                  {store.tabs.map((id) => {
                    const doc = store.docs.find((item) => item.id === id);
                    if (!doc) return null;
                    const active = id === store.activeId;
                    return (
                      <div key={id} className={active ? "tab active" : "tab"} role="tab" aria-selected={active}>
                        <button type="button" onClick={() => store.activate(id)} style={{ border: 0, background: "transparent", color: "inherit", fontWeight: 700 }}>
                          <span>{doc.dirty ? "• " : ""}{doc.name}</span>
                        </button>
                        <button className="x" type="button" aria-label={`Close ${doc.name}`} onClick={() => store.closeTab(id)}>×</button>
                      </div>
                    );
                  })}
                </div>
                <div className={store.split ? "split-grid on" : "split-grid"}>
                  <EditorHost doc={primary} pane="primary" />
                  {store.split ? <EditorHost doc={secondary} pane="secondary" /> : null}
                </div>
              </>
            )}
          </main>
        </div>
        <footer className="statusbar">
          <span>{primary ? `${primary.displayLanguage} · ${primary.mode === "view" ? "view" : primary.mode === "values" ? "values" : "edit"}` : "No file"}</span>
          <span>{primary?.saveDetail || (store.shell === "desktop" ? "Close hides to the tray" : "Local only")}</span>
          <span>
            {store.canSibling(-1) ? <button type="button" onClick={() => void store.sibling(-1)}>Prev file</button> : null}
            {" "}
            {store.canSibling(1) ? <button type="button" onClick={() => void store.sibling(1)}>Next file</button> : null}
          </span>
        </footer>
        <nav className="mobile-nav">
          <button type="button" onClick={() => store.setSidebar(!store.sidebar)}>Files</button>
          <button type="button" onClick={() => store.openSearch()}>Search</button>
          <button type="button" onClick={() => primary && void store.showHistory(primary.id)}>History</button>
          <button type="button" onClick={() => void store.sibling(-1)}>Prev</button>
          <button type="button" onClick={() => void store.sibling(1)}>Next</button>
        </nav>
        <div className="toasts" aria-live="polite">
          {store.toasts.map((toast) => (
            <button key={toast.id} className="toast" onClick={() => store.dismissToast(toast.id)}>{toast.message}</button>
          ))}
        </div>
        {store.dragging ? <div className="drop-overlay">Drop to open locally</div> : null}
        <Dialogs />
      </div>
    </TooltipProvider>
  );
}

const swipeStart: { current: { x: number; y: number } | null } = { current: null };
