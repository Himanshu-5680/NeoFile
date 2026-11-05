export interface MatrixRow {
  id: string;
  formats: string;
  mode: "edit" | "values" | "view";
  save: string;
  notes: string;
}

/** What NeoFile actually does. The README and the in-app About panel both read this table. */
export const FEATURE_MATRIX: MatrixRow[] = [
  {
    id: "text",
    formats: "txt, md, html, css, js, jsx, ts, tsx, py, java, json, xml, yaml, sql, and other code/text",
    mode: "edit",
    save: "Overwrite when the system gave NeoFile a writable file. Otherwise download a copy. Auto-save keeps local snapshots.",
    notes: "Syntax colors for JavaScript, TypeScript, JSX, Python, HTML, CSS, JSON, XML, Java, and Markdown. Other code is still editable as plain text. Markdown has a basic preview.",
  },
  {
    id: "csv",
    formats: "csv, tsv, semicolon-separated",
    mode: "edit",
    save: "Writes the grid back to CSV or TSV, including quoted commas and line breaks.",
    notes: "Full cell editing, paste, and undo. This is the spreadsheet path with the fewest surprises.",
  },
  {
    id: "xlsx",
    formats: "xlsx, xlsm, xls",
    mode: "values",
    save: "Saves a new workbook that contains cell values.",
    notes: "SheetJS community edition. Formulas are not recalculated. Charts, pivot tables, macros, images, comments, data validation, and most formatting are dropped on save.",
  },
  {
    id: "pdf",
    formats: "pdf",
    mode: "view",
    save: "Save original downloads the file you opened. Text can be selected and searched.",
    notes: "No annotation editing, form filling, or page rearrangement. Scanned pages without a text layer can be viewed but not searched.",
  },
  {
    id: "docx",
    formats: "docx",
    mode: "view",
    save: "Save original keeps the .docx bytes. Export HTML writes the preview, not a Word file.",
    notes: "Mammoth builds an HTML preview and plain text. It is not Word. Headers, text boxes, comments, tracked changes, and complex layout can be missing or simplified.",
  },
  {
    id: "pptx",
    formats: "pptx, pptm",
    mode: "view",
    save: "Save original exports the file unchanged.",
    notes: "Each slide shows extracted text and embedded pictures. Slide layout, animations, charts, and SmartArt are not rendered and cannot be edited.",
  },
  {
    id: "image",
    formats: "png, jpg, gif, webp, bmp, avif, svg",
    mode: "view",
    save: "Save original only.",
    notes: "No crop, draw, or filter tools. SVG markup can be viewed read-only.",
  },
  {
    id: "audio",
    formats: "mp3, wav, ogg, m4a, flac, aac",
    mode: "view",
    save: "Save original only.",
    notes: "Playback only. No trim or effects. A file plays only if this device's media stack supports the codec.",
  },
  {
    id: "video",
    formats: "mp4, webm, ogv, mov",
    mode: "view",
    save: "Save original only.",
    notes: "Playback only. No trim or transcode. Codec support depends on the device.",
  },
  {
    id: "binary",
    formats: "everything else",
    mode: "view",
    save: "Save original exports the bytes unchanged.",
    notes: "A hex preview of the beginning of the file. NeoFile does not claim to understand unknown formats.",
  },
];

export const FILE_LIMITS = {
  perDocumentSnapshots: 20,
  autoSnapshotBytes: 2_000_000,
  manualSnapshotBytes: 8_000_000,
  recentPayloadBytes: 1_500_000,
  recentCount: 16,
  maxSheetRows: 20_000,
  maxSheetCols: 100,
  openBatch: 24,
  hexPreviewBytes: 4096,
} as const;
