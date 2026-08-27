import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { api } from "../api";
import { useApp } from "../AppContext";

/** Banner colour by outcome: solved, ran but wrong, or did not run at all. */
const BANNER_BY_STATUS = {
  PASSED: "banner success",
  WRONG_RESULT: "banner",
  SYNTAX_ERROR: "banner danger",
  POLICY_ERROR: "banner danger",
  RUNTIME_ERROR: "banner danger",
  TIMEOUT: "banner danger",
};

function Cell({ value, t }) {
  if (value === null || value === undefined) {
    return <span className="muted">{t("practice.null")}</span>;
  }
  if (typeof value === "boolean") {
    return <>{value ? "true" : "false"}</>;
  }
  return <>{String(value)}</>;
}

function ResultGrid({ table, t }) {
  if (!table) {
    return null;
  }
  return (
    <div className="col" style={{ gap: 6 }}>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>{table.columns.map((column, index) => <th key={index}>{column}</th>)}</tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((value, cellIndex) => (
                  <td key={cellIndex}><Cell value={value} t={t} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ fontSize: 13 }}>
        {t("practice.rows", table.rows.length)}
        {table.truncated ? ` · ${t("practice.truncated")}` : ""}
      </p>
    </div>
  );
}

function RowList({ title, rows, t }) {
  if (!rows?.length) {
    return null;
  }
  return (
    <div className="col" style={{ gap: 4 }}>
      <strong style={{ fontSize: 14 }}>{title}</strong>
      {rows.map((row, index) => (
        <div key={index} className="code" style={{ padding: "6px 10px", fontSize: 13 }}>
          {row.map((value, cellIndex) => (
            <span key={cellIndex}>
              {cellIndex > 0 ? " · " : ""}
              <Cell value={value} t={t} />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function PracticeTaskPage() {
  const { t, loc } = useApp();
  const navigate = useNavigate();
  const { track, difficulty, taskId } = useParams();
  const [task, setTask] = useState(null);
  const [sql, setSql] = useState("");
  const [outcome, setOutcome] = useState(null);
  const [busy, setBusy] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get(`/api/practice/tasks/${taskId}`)
      .then((data) => {
        if (cancelled) return;
        setTask(data);
        setSql(data.lastSql || data.starterSql || "");
      })
      .catch(() => setTask(false));
    return () => { cancelled = true; };
  }, [taskId]);

  const submit = useCallback(async (endpoint) => {
    if (busy || !sql.trim()) {
      return;
    }
    setBusy(true);
    try {
      const result = await api.post(`/api/practice/tasks/${taskId}/${endpoint}`, { sql });
      setOutcome({ ...result, endpoint });
      if (endpoint === "run") {
        // Solving a task unlocks its explanation and bumps the attempt counter.
        const refreshed = await api.get(`/api/practice/tasks/${taskId}`);
        setTask((current) => ({ ...refreshed, lastSql: current?.lastSql }));
      }
    } catch (error) {
      setOutcome({ status: "RUNTIME_ERROR", passed: false, detail: error.message, endpoint });
    } finally {
      setBusy(false);
    }
  }, [busy, sql, taskId]);

  function onEditorKeyDown(event) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      submit("run");
    }
  }

  if (task === false) {
    return <div className="page"><p className="muted">{t("practice.empty")}</p></div>;
  }
  if (!task) {
    return <div className="page muted">{t("common.loading")}</div>;
  }

  const statusText = outcome && (
    outcome.endpoint === "check" && outcome.passed
      ? t("practice.checkPassed")
      : t(`practice.status.${outcome.status}`)
  );

  return (
    <div className="page">
      <div className="row between header-bar">
        <div>
          <h1>{loc(task.title)}</h1>
          <p className="muted">
            {t(`difficulty.${difficulty}`)} ·{" "}
            {task.orderMatters ? t("practice.orderMatters") : t("practice.orderFree")}
            {task.solved ? ` · ${t("practice.solved")}` : ""}
          </p>
        </div>
        <div className="row">
          {task.material && (
            <button
              className="btn"
              onClick={() => navigate(`/materials/${task.material.topicId}/${task.material.sectionId}`)}
            >
              {t("practice.readMaterial")}
            </button>
          )}
          <button className="btn" onClick={() => navigate(`/practice/${track}/${difficulty}`)}>
            {t("common.back")}
          </button>
        </div>
      </div>

      <div className="layout-split">
        <div className="card col">
          <div>
            <h3>{loc(task.dataset.title)}</h3>
            <p className="muted" style={{ fontSize: 13 }}>{loc(task.dataset.description)}</p>
          </div>
          <div className="col" style={{ gap: 10 }}>
            <strong style={{ fontSize: 14 }}>{t("practice.schema")}</strong>
            {task.dataset.tables.map((table) => (
              <div key={table.name} className="schema-table">
                <div className="schema-table-name">{table.name}</div>
                {table.columns.map((column) => (
                  <div key={column.name} className="schema-column">
                    <span>{column.name}</span>
                    <span className="muted">{column.type}{column.nullable ? "?" : ""}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="col">
          <div className="card col">
            <h3>{t("practice.statement")}</h3>
            <div className="markdown"><ReactMarkdown>{loc(task.statement)}</ReactMarkdown></div>
            {loc(task.hint) && (
              <div>
                <button className="btn" onClick={() => setHintOpen(!hintOpen)}>
                  {hintOpen ? t("practice.hideHint") : t("practice.showHint")}
                </button>
                {hintOpen && (
                  <div className="markdown" style={{ marginTop: 8 }}>
                    <ReactMarkdown>{loc(task.hint)}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card col">
            <div className="row between">
              <h3 style={{ margin: 0 }}>{t("practice.editor")}</h3>
              <span className="muted" style={{ fontSize: 13 }}>Ctrl+Enter</span>
            </div>
            <textarea
              className="sql-editor"
              spellCheck={false}
              value={sql}
              onChange={(event) => setSql(event.target.value)}
              onKeyDown={onEditorKeyDown}
              rows={10}
            />
            <div className="row">
              <button className="btn primary" disabled={busy || !sql.trim()} onClick={() => submit("run")}>
                {busy ? t("practice.running") : t("practice.run")}
              </button>
              <button className="btn" disabled={busy || !sql.trim()} onClick={() => submit("check")}>
                {t("practice.check")}
              </button>
              <button className="btn" disabled={busy} onClick={() => { setSql(task.starterSql || ""); setOutcome(null); }}>
                {t("practice.reset")}
              </button>
            </div>
          </div>

          {outcome && (
            <div className="card col">
              <div className={BANNER_BY_STATUS[outcome.status] || "banner"}>
                {statusText}
                {outcome.durationMs !== undefined ? ` · ${t("practice.duration", outcome.durationMs)}` : ""}
              </div>
              {outcome.messageKey && !outcome.passed && (
                <p>{t(outcome.messageKey)}</p>
              )}
              {/* Engine messages are worth showing verbatim; a policy detail is just the
                  offending keyword, which reads better as an aside than as a code block. */}
              {outcome.detail && (outcome.status === "POLICY_ERROR"
                ? <p className="muted" style={{ fontSize: 13 }}>{outcome.detail}</p>
                : <div className="code">{outcome.detail}</div>)}
              {outcome.comparison?.firstDifference !== null && outcome.comparison?.firstDifference !== undefined && (
                <p className="muted">{t("practice.firstDifference", outcome.comparison.firstDifference + 1)}</p>
              )}
              <RowList title={t("practice.missingRows")} rows={outcome.comparison?.missingRows} t={t} />
              <RowList title={t("practice.unexpectedRows")} rows={outcome.comparison?.unexpectedRows} t={t} />
              {outcome.result && (
                <div className="col" style={{ gap: 6 }}>
                  <strong style={{ fontSize: 14 }}>{t("practice.yourResult")}</strong>
                  <ResultGrid table={outcome.result} t={t} />
                </div>
              )}
            </div>
          )}

          <div className="card col">
            <div>
              <h3>{t("practice.expected")}</h3>
              <p className="muted" style={{ fontSize: 13 }}>{t("practice.anySolution")}</p>
            </div>
            <ResultGrid table={task.expected} t={t} />
          </div>

          {task.explanation && (
            <div className="card col">
              <h3>{t("practice.explanation")}</h3>
              <div className="markdown"><ReactMarkdown>{loc(task.explanation)}</ReactMarkdown></div>
            </div>
          )}

          {task.sources?.length > 0 && (
            <div className="card col">
              <h3>{t("practice.sources")}</h3>
              <ul style={{ margin: 0 }}>
                {task.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
