import { resolveTheme } from "@neofile/core";
import type { SearchHit } from "@neofile/core";
import { useStore } from "@/state/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, MenuItem } from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/tooltip";
import { windowAction } from "@/platform/bridge";

export function TitleBar() {
  const store = useStore();
  const theme = resolveTheme(store.prefs);
  return (
    <header className="titlebar">
      <div className="brand" data-tauri-drag-region>
        <img className="mark" src={`${import.meta.env.BASE_URL}logo.svg`} alt="" width="40" height="40" />
        <div className="word" data-tauri-drag-region>
          NEOFILE
          <small>{store.shell === "android" ? "On this phone" : store.shell === "desktop" ? "On this computer" : "In this browser"}</small>
        </div>
      </div>
      <div className={store.searchOpen ? "title-search force" : "title-search"}>
        <Input
          value={store.search}
          placeholder="Search open files and recent copies"
          aria-label="Search open files and recent copies"
          onChange={(event) => store.setSearch(event.target.value)}
          onFocus={() => store.search.trim() && store.setSearch(store.search)}
        />
        {store.searchOpen ? <SearchResults /> : null}
      </div>
      <div className="title-actions">
        <Button className="desktop-only" size="sm" onClick={() => void store.openFiles()}>Open</Button>
        <Button className="desktop-only" size="sm" onClick={() => store.toggleSplit()}>{store.split ? "Close split" : "Split"}</Button>
        <Button size="sm" tone="accent" onClick={() => store.toggleTheme()}>{theme.mode === "dark" ? "Light mode" : "Dark mode"}</Button>
        <Menu
          trigger={<Button size="sm">Accent</Button>}
        >
          <div style={{ padding: 8 }} onKeyDown={(event) => event.stopPropagation()}>
            <label className="tiny" htmlFor="accent">Custom accent</label>
            <input id="accent" type="color" value={theme.accent} onChange={(event) => store.setAccent(event.target.value)} style={{ width: "100%", height: 36, border: "3px solid var(--line)", background: "transparent" }} />
            <Button size="sm" onClick={() => store.resetAccent()} style={{ marginTop: 8 }}>Use the built-in accent</Button>
          </div>
          <MenuItem onSelect={() => store.setAbout(true)}>What NeoFile edits</MenuItem>
          <MenuItem onSelect={() => store.setPrivacy(true)}>Privacy</MenuItem>
          <MenuItem onSelect={() => store.setShortcuts(true)}>Shortcuts</MenuItem>
        </Menu>
        <Button className="desktop-only" size="sm" onClick={() => store.setSidebar(!store.sidebar)}>{store.sidebar ? "Hide files" : "Files"}</Button>
      </div>
      <div className="window-controls">
        <Tooltip label="Minimize">
          <Button size="sm" aria-label="Minimize" onClick={() => void windowAction("minimize")}>–</Button>
        </Tooltip>
        <Tooltip label="Maximize">
          <Button size="sm" aria-label="Maximize" onClick={() => void windowAction("toggle")}>□</Button>
        </Tooltip>
        <Tooltip label="Hide to tray">
          <Button size="sm" aria-label="Hide to tray" onClick={() => void windowAction("hide")}>×</Button>
        </Tooltip>
      </div>
    </header>
  );
}

function SearchResults() {
  const store = useStore();
  return (
    <div className="search-pop" role="listbox">
      {store.searchHits.length === 0 ? <p className="tiny" style={{ padding: 10 }}>No matches in open files or recent copies.</p> : null}
      {store.searchHits.map((hit, index) => (
        <button key={`${hit.docId}-${hit.line}-${index}`} className="hit" onClick={() => void store.jumpToHit(hit)}>
          <strong>{hit.name}</strong>
          <div className="tiny">{hit.where === "open" ? "Open" : "Recent"} · line {hit.line}</div>
          <Snippet hit={hit} />
        </button>
      ))}
    </div>
  );
}

function Snippet({ hit }: { hit: SearchHit }) {
  const start = Math.max(0, Math.min(hit.matchStart, hit.snippet.length));
  const end = Math.max(start, Math.min(hit.matchEnd, hit.snippet.length));
  return (
    <span>
      {hit.snippet.slice(0, start)}
      <mark>{hit.snippet.slice(start, end)}</mark>
      {hit.snippet.slice(end)}
    </span>
  );
}
