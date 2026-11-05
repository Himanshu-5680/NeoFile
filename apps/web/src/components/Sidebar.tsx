import type { TreeNode } from "@/state/types";
import { useStore } from "@/state/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { VirtualList } from "@/components/VirtualList";
import { SAMPLES } from "@/samples";

export function Sidebar() {
  const store = useStore();
  const rows = flatten(store.tree, store.expanded);
  return (
    <>
      {store.sidebar ? <button className="scrim" aria-label="Close files" onClick={() => store.setSidebar(false)} /> : null}
      <aside className={store.sidebar ? "sidebar open" : "sidebar"}>
        <ScrollArea className="side-scroll">
          <section className="side-block">
            <h2>Folder</h2>
            {store.tree ? (
              <>
                <div className="folder-head">
                  <strong>{store.tree.name}</strong>
                  <div className="tiny">{rows.filter((row) => row.node.kind === "file").length} visible files</div>
                </div>
                {store.selected.filter((id) => rows.some((row) => row.node.id === id && row.node.kind === "file")).length > 1 ? (
                  <Button size="sm" tone="accent" onClick={() => void store.openSelection()} style={{ marginTop: 8 }}>
                    Open selected
                  </Button>
                ) : null}
                <div className="tree-list" style={{ marginTop: 8, height: rows.length > 80 ? 360 : undefined }}>
                  {rows.length > 80 ? (
                    <VirtualList count={rows.length} rowHeight={36}>
                      {(index) => <TreeRow row={rows[index]} />}
                    </VirtualList>
                  ) : (
                    rows.map((row) => <TreeRow key={row.node.id} row={row} />)
                  )}
                  {rows.length === 0 ? <p className="tiny">Empty folder.</p> : null}
                </div>
              </>
            ) : (
              <p className="tiny">Open a folder to browse it. Ctrl or Shift click selects more than one file.</p>
            )}
            <Button size="sm" onClick={() => void store.openFolder()} style={{ marginTop: 8 }}>Open folder</Button>
          </section>
          <section className="side-block">
            <h2>Inbox</h2>
            {store.inbox.length === 0 ? <p className="tiny">Shared files saved offline show up here.</p> : null}
            {store.inbox.map((item) => (
              <article key={item.id} className="inbox-card" style={{ marginBottom: 6 }}>
                <strong>{item.name}</strong>
                <small>{item.size.toLocaleString()} bytes · saved on this device</small>
                <div className="seg" style={{ marginTop: 6 }}>
                  <Button size="sm" onClick={() => void store.openInboxItem(item.id)}>Open</Button>
                  <Button size="sm" onClick={() => void store.dismissInboxItem(item.id)}>Dismiss</Button>
                </div>
              </article>
            ))}
          </section>
          <section className="side-block">
            <h2>Recent</h2>
            {store.recents.length === 0 ? <p className="tiny">Nothing opened on this device yet.</p> : null}
            {store.recents.map((item) => (
              <button key={item.id} className="recent-card" style={{ marginBottom: 6 }} onClick={() => void store.openRecent(item.id)}>
                <strong>{item.name}</strong>
                <small>{item.displayLanguage} · {item.size.toLocaleString()} bytes</small>
              </button>
            ))}
          </section>
          <section className="side-block">
            <h2>Samples</h2>
            {SAMPLES.map((sample) => (
              <button key={sample.name} className="sample-card" style={{ marginBottom: 6 }} onClick={() => void store.openSample(sample.name)}>
                <strong>{sample.name}</strong>
                <small>{sample.blurb}</small>
              </button>
            ))}
          </section>
        </ScrollArea>
      </aside>
    </>
  );
}

function TreeRow({ row }: { row: { node: TreeNode; depth: number } }) {
  const store = useStore();
  const selected = store.selected.includes(row.node.id);
  return (
    <button
      className={selected ? "row-button selected" : "row-button"}
      style={{ paddingLeft: 8 + row.depth * 14 }}
      onClick={(event) => {
        store.selectNode(row.node.id, { shiftKey: event.shiftKey, metaKey: event.metaKey, ctrlKey: event.ctrlKey });
        if (event.shiftKey || event.metaKey || event.ctrlKey) return;
        if (row.node.kind === "dir") void store.toggleExpand(row.node.id);
        else void store.openNode(row.node.id);
      }}
    >
      <span>{row.node.kind === "dir" ? (store.expanded.includes(row.node.id) ? "▾" : "▸") : "·"}</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.node.name}</span>
    </button>
  );
}

function flatten(root: TreeNode | null, expanded: string[]) {
  if (!root?.children) return [];
  const open = new Set(expanded);
  const rows: { node: TreeNode; depth: number }[] = [];
  const walk = (nodes: TreeNode[], depth: number) => {
    for (const node of nodes) {
      rows.push({ node, depth });
      if (node.kind === "dir" && node.children && open.has(node.id)) walk(node.children, depth + 1);
    }
  };
  walk(root.children, 0);
  return rows;
}
