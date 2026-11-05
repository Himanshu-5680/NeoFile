import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { HighlightStyle, bracketMatching, indentOnInput, syntaxHighlighting, type LanguageSupport } from "@codemirror/language";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { EditorView, drawSelection, highlightActiveLine, keymap, lineNumbers } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { useEffect, useRef } from "react";
import type { LanguageId } from "@neofile/core";


function highlight(mode: "light" | "dark", accent: string): Extension {
  return syntaxHighlighting(
    HighlightStyle.define([
      { tag: tags.keyword, color: accent, fontWeight: "700" },
      { tag: tags.string, color: mode === "dark" ? "#fffdf8" : "#0f6b45" },
      { tag: tags.comment, color: mode === "dark" ? "#9a9488" : "#7a7368", fontStyle: "italic" },
      { tag: tags.number, color: mode === "dark" ? "#f4f0e6" : "#1d4ed8" },
      { tag: [tags.tagName, tags.attributeName, tags.heading], color: accent, fontWeight: "700" },
    ]),
  );
}

function chrome(): Extension {
  return EditorView.theme({
    "&": { backgroundColor: "var(--surface)", color: "var(--ink)", height: "100%", fontSize: "13.5px" },
    ".cm-content": { caretColor: "var(--accent)", padding: "12px 0" },
    ".cm-gutters": { backgroundColor: "var(--bg)", color: "var(--muted)", borderRight: "3px solid var(--line)" },
    ".cm-activeLine": { backgroundColor: "color-mix(in srgb, var(--accent) 14%, transparent)" },
    ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--ink)" },
    "&.cm-focused": { outline: "none" },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor: "color-mix(in srgb, var(--accent) 35%, transparent) !important",
    },
  });
}

async function languageOf(id: LanguageId | null): Promise<LanguageSupport | Extension> {
  switch (id) {
    case "javascript":
    case "jsx":
    case "typescript":
    case "tsx": {
      const { javascript } = await import("@codemirror/lang-javascript");
      return javascript({ jsx: id === "jsx" || id === "tsx", typescript: id === "typescript" || id === "tsx" });
    }
    case "python":
      return (await import("@codemirror/lang-python")).python();
    case "html":
      return (await import("@codemirror/lang-html")).html();
    case "css":
      return (await import("@codemirror/lang-css")).css();
    case "json":
      return (await import("@codemirror/lang-json")).json();
    case "xml":
      return (await import("@codemirror/lang-xml")).xml();
    case "markdown":
      return (await import("@codemirror/lang-markdown")).markdown();
    case "java":
      return (await import("@codemirror/lang-java")).java();
    default:
      return [];
  }
}

export function CodeEditor({
  text,
  highlighter,
  readOnly = false,
  wrap = false,
  mode,
  accent,
  jump,
  onChange,
}: {
  text: string;
  highlighter: LanguageId | null;
  readOnly?: boolean;
  wrap?: boolean;
  mode: "light" | "dark";
  accent: string;
  jump?: { line: number; column: number; nonce: number } | null;
  onChange: (value: string) => void;
}) {
  const parent = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const themeRef = useRef<Compartment | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!parent.current) return;
    const language = new Compartment();
    const theme = new Compartment();
    themeRef.current = theme;
    const view = new EditorView({
      parent: parent.current,
      state: EditorState.create({
        doc: text,
        extensions: [
          lineNumbers(),
          history(),
          drawSelection(),
          highlightActiveLine(),
          bracketMatching(),
          indentOnInput(),
          closeBrackets(),
          highlightSelectionMatches(),
          keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
          language.of([]),
          theme.of([chrome(), highlight(mode, accent), wrap ? EditorView.lineWrapping : []]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !readOnly) onChangeRef.current(update.state.doc.toString());
          }),
        ],
      }),
    });
    viewRef.current = view;
    void languageOf(highlighter).then((support) => {
      if (viewRef.current === view) view.dispatch({ effects: language.reconfigure(support) });
    });
    return () => {
      view.destroy();
      viewRef.current = null;
      themeRef.current = null;
    };
    // Remount only when the parent changes key={id:epoch}.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const theme = themeRef.current;
    if (!viewRef.current || !theme) return;
    viewRef.current.dispatch({
      effects: theme.reconfigure([chrome(), highlight(mode, accent), wrap ? EditorView.lineWrapping : []]),
    });
  }, [mode, accent, wrap]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !jump) return;
    const lineNo = Math.min(Math.max(1, jump.line), view.state.doc.lines);
    const line = view.state.doc.line(lineNo);
    const pos = Math.min(line.to, line.from + Math.max(0, jump.column - 1));
    view.dispatch({ selection: { anchor: pos }, scrollIntoView: true });
    view.focus();
  }, [jump?.nonce]);

  return <div ref={parent} className="editor-fill" data-swipe-ignore="true" />;
}
