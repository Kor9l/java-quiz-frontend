import { useCallback, useMemo, useRef } from "react";

/** Two spaces, because that is what every starter and solution the backend ships is written in. */
const INDENT = "  ";

/**
 * A plain textarea with a line-number gutter and the two editing habits a code field cannot do
 * without: Tab indents instead of leaving the field, and Enter keeps the indentation it was on.
 *
 * <p>Not a real editor, and deliberately so — CodeMirror is a heavier dependency than the whole
 * of this app, and the gutter is only here because a Java diagnostic arrives as a line number
 * and has to be findable. Auto-indenting after a brace is asked for by track rather than
 * assumed: it is right in Java and wrong in SQL.
 */
export default function CodeEditor({ value, onChange, onSubmit, smartIndent = false, errorLines = [] }) {
  const textarea = useRef(null);
  const gutter = useRef(null);

  const lineCount = useMemo(() => value.split("\n").length, [value]);
  const flagged = useMemo(() => new Set(errorLines), [errorLines]);

  /** The gutter is a separate element, so it has to be told when the text scrolls. */
  const syncScroll = useCallback(() => {
    if (gutter.current && textarea.current) {
      gutter.current.scrollTop = textarea.current.scrollTop;
    }
  }, []);

  const replaceSelection = useCallback((text) => {
    const field = textarea.current;
    const { selectionStart, selectionEnd } = field;
    const next = value.slice(0, selectionStart) + text + value.slice(selectionEnd);
    onChange(next);
    // React re-renders from `value`, which would put the caret at the end; putting it back has
    // to wait for that render rather than race it.
    requestAnimationFrame(() => {
      field.selectionStart = selectionStart + text.length;
      field.selectionEnd = field.selectionStart;
    });
  }, [onChange, value]);

  function onKeyDown(event) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      onSubmit();
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      replaceSelection(INDENT);
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      const upToCaret = value.slice(0, event.target.selectionStart);
      const line = upToCaret.slice(upToCaret.lastIndexOf("\n") + 1);
      const indent = line.match(/^[ \t]*/)[0];
      const deeper = smartIndent && line.trimEnd().endsWith("{") ? INDENT : "";
      if (indent || deeper) {
        event.preventDefault();
        replaceSelection("\n" + indent + deeper);
      }
    }
  }

  return (
    <div className="code-editor">
      <div className="code-editor-gutter" ref={gutter} aria-hidden="true">
        {Array.from({ length: lineCount }, (unused, index) => (
          <div key={index} className={flagged.has(index + 1) ? "gutter-line flagged" : "gutter-line"}>
            {index + 1}
          </div>
        ))}
      </div>
      <textarea
        ref={textarea}
        className="code-editor-text"
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        onScroll={syncScroll}
      />
    </div>
  );
}
