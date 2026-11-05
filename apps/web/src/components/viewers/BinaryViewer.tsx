import { FILE_LIMITS } from "@neofile/core";
import { registry } from "@/state/registry";
import { VirtualList } from "@/components/VirtualList";

export function BinaryViewer({ docId }: { docId: string }) {
  const bytes = registry.getBytes(docId);
  const shown = bytes.subarray(0, FILE_LIMITS.hexPreviewBytes);
  const rows = Math.ceil(shown.length / 16) || 1;
  return (
    <div className="editor-fill" style={{ display: "flex", flexDirection: "column" }}>
      <div className="pane-bar">
        <span className="tiny">
          Showing the first {shown.length.toLocaleString()} of {bytes.length.toLocaleString()} bytes
        </span>
      </div>
      <VirtualList count={rows} rowHeight={28} className="hex-scroll">
        {(index) => {
          const offset = index * 16;
          const slice = shown.subarray(offset, offset + 16);
          const hex = [...slice].map((value) => value.toString(16).padStart(2, "0")).join(" ");
          const ascii = [...slice].map((value) => (value >= 32 && value < 127 ? String.fromCharCode(value) : ".")).join("");
          return (
            <div className="hex-row" style={{ display: "grid", gridTemplateColumns: "88px 1fr 160px", gap: 12 }}>
              <span>{offset.toString(16).padStart(6, "0")}</span>
              <span>{hex}</span>
              <span>{ascii}</span>
            </div>
          );
        }}
      </VirtualList>
    </div>
  );
}
