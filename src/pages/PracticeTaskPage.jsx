import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { api } from "../api";
import { useApp } from "../AppContext";
import CodeEditor from "../CodeEditor";

/** Banner colour by outcome: solved, ran but wrong, or did not run at all. */
const BANNER_BY_STATUS = {
  PASSED: "banner success",
  WRONG_RESULT: "banner",
  SYNTAX_ERROR: "banner danger",
  COMPILE_ERROR: "banner danger",
  POLICY_ERROR: "banner danger",
  RUNTIME_ERROR: "banner danger",
  TIMEOUT: "banner danger",
};

/**
 * What the two tracks disagree about. Everything not here — the statement, the hint, the
 * outcome banner, the explanation, the sources — is the same screen either way, which is why
 * there is one page rather than two.
 */
const TRACKS = {
  sql: {
    starter: (task) => task.starterSql,
    last: (task) => task.lastSql,
    body: (text) => ({ sql: text }),
    smartIndent: false,
    editorTitle: "practice.editor",
    checkAction: "practice.check",
    checkPassed: "practice.checkPassed",
    anySolution: "practice.anySolution",
    firstDifference: "practice.firstDifference",
  },
  java: {
    starter: (task) => task.starterCode,
    last: (task) => task.lastCode,
    body: (text) => ({ code: text }),
    smartIndent: true,
    editorTitle: "practice.editorJava",
    checkAction: "practice.checkJava",
    checkPassed: "practice.checkPassedJava",
    anySolution: "practice.anySolutionJava",
    firstDifference: "practice.firstDifferenceCase",
  },
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

/** The dataset a SQL task is posed against: what there is to query. */
function DatasetPanel({ dataset, t, loc }) {
  return (
    <div className="card col">
      <div>
        <h3>{loc(dataset.title)}</h3>
        <p className="muted" style={{ fontSize: 13 }}>{loc(dataset.description)}</p>
      </div>
      <div className="col" style={{ gap: 10 }}>
        <strong style={{ fontSize: 14 }}>{t("practice.schema")}</strong>
        {dataset.tables.map((table) => (
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
  );
}

/**
 * The calls a Java task is graded by. They are the specification rather than a hidden test
 * suite, so they are listed in full: what is run is exactly what is shown here.
 */
function CasesPanel({ task, t }) {
  return (
    <div className="card col">
      <div>
        <h3>{t("practice.classTitle")}</h3>
        <p className="muted" style={{ fontSize: 13 }}>{t("practice.classHint", task.className)}</p>
      </div>
      <div className="col" style={{ gap: 10 }}>
        <strong style={{ fontSize: 14 }}>{t("practice.cases")}</strong>
        <div className="schema-table">
          {task.cases.map((current, index) => (
            <div key={index} className="schema-column">
              <span>{current.label}</span>
            </div>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 13 }}>{t("practice.casesHint")}</p>
      </div>
    </div>
  );
}

/** Compiler messages. The ones about the learner's own source carry a place to look at. */
function Diagnostics({ diagnostics, t }) {
  if (!diagnostics?.length) {
    return null;
  }
  return (
    <div className="col" style={{ gap: 4 }}>
      <strong style={{ fontSize: 14 }}>{t("practice.diagnostics")}</strong>
      {diagnostics.map((diagnostic, index) => (
        <div key={index} className="diagnostic">
          {diagnostic.inSubmission && (
            <span className="diagnostic-where">{t("practice.atLine", diagnostic.line, diagnostic.column)}</span>
          )}
          <span className="diagnostic-message">{diagnostic.message}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * A Java run, case by case. Two tables side by side would leave the reader lining up rows by
 * eye; what they want to know is which call disagreed, so the value and the expectation sit
 * next to each other and anything the case printed hangs underneath it.
 */
function CaseResults({ result, expected, output, t }) {
  const rows = result?.rows || expected?.rows || [];
  if (!rows.length) {
    return null;
  }
  // Both tables are built from the same list of cases, in that order, so the two line up by
  // index — which also survives two cases that happen to be labelled the same.
  const expectedRows = expected?.rows || [];
  const comparing = Boolean(result && expected);
  return (
    <div className="col" style={{ gap: 6 }}>
      {rows.map((row, index) => {
        const [label, value] = row;
        const target = expectedRows[index]?.[1];
        const matched = !comparing || String(value) === String(target);
        return (
          <div key={index} className={matched ? "case-row" : "case-row differs"}>
            <div className="case-label">{label}</div>
            <div className="case-values">
              <span className="case-value"><Cell value={value} t={t} /></span>
              {comparing && !matched && (
                <span className="case-expected">
                  {t("practice.expectedValue")} <Cell value={target} t={t} />
                </span>
              )}
            </div>
            {output?.[index]?.trim() && <pre className="case-output">{output[index].trimEnd()}</pre>}
          </div>
        );
      })}
    </div>
  );
}

export default function PracticeTaskPage() {
  const { t, loc } = useApp();
  const navigate = useNavigate();
  const { track, difficulty, taskId } = useParams();
  const [task, setTask] = useState(null);
  const [source, setSource] = useState("");
  const [outcome, setOutcome] = useState(null);
  const [busy, setBusy] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);

  const flavour = TRACKS[track] || TRACKS.sql;
  const isJava = track === "java";

  useEffect(() => {
    let cancelled = false;
    api.get(`/api/practice/tasks/${taskId}`)
      .then((data) => {
        if (cancelled) return;
        setTask(data);
        setSource(flavour.last(data) || flavour.starter(data) || "");
      })
      .catch(() => setTask(false));
    return () => { cancelled = true; };
    // The flavour follows from the route, so it changes only when the task does.
  }, [taskId]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = useCallback(async (endpoint) => {
    if (busy || !source.trim()) {
      return;
    }
    setBusy(true);
    try {
      const result = await api.post(`/api/practice/tasks/${taskId}/${endpoint}`, flavour.body(source));
      setOutcome({ ...result, endpoint });
      if (endpoint === "run") {
        // Solving a task unlocks its explanation and bumps the attempt counter.
        const refreshed = await api.get(`/api/practice/tasks/${taskId}`);
        setTask(refreshed);
      }
    } catch (error) {
      setOutcome({ status: "RUNTIME_ERROR", passed: false, detail: error.message, endpoint });
    } finally {
      setBusy(false);
    }
  }, [busy, source, taskId, flavour]);

  const run = useCallback(() => submit("run"), [submit]);

  /** Lines the compiler complained about, so the gutter can point at them. */
  const errorLines = useMemo(
    () => (outcome?.diagnostics || [])
      .filter((diagnostic) => diagnostic.inSubmission && diagnostic.line > 0)
      .map((diagnostic) => diagnostic.line),
    [outcome]);

  if (task === false) {
    return <div className="page"><p className="muted">{t("practice.empty")}</p></div>;
  }
  if (!task) {
    return <div className="page muted">{t("common.loading")}</div>;
  }

  const statusText = outcome && (
    outcome.endpoint === "check" && outcome.passed
      ? t(flavour.checkPassed)
      : t(`practice.status.${outcome.status}`)
  );

  return (
    <div className="page">
      <div className="row between header-bar">
        <div>
          <h1>{loc(task.title)}</h1>
          <p className="muted">
            {t(`difficulty.${difficulty}`)} ·{" "}
            {isJava
              ? t("practice.casesCount", task.cases.length)
              : task.orderMatters ? t("practice.orderMatters") : t("practice.orderFree")}
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
        {isJava ? <CasesPanel task={task} t={t} /> : <DatasetPanel dataset={task.dataset} t={t} loc={loc} />}

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
              <h3 style={{ margin: 0 }}>{t(flavour.editorTitle)}</h3>
              <span className="muted" style={{ fontSize: 13 }}>Ctrl+Enter</span>
            </div>
            <CodeEditor
              value={source}
              onChange={setSource}
              onSubmit={run}
              smartIndent={flavour.smartIndent}
              errorLines={errorLines}
            />
            <div className="row">
              <button className="btn primary" disabled={busy || !source.trim()} onClick={run}>
                {busy ? t("practice.running") : t("practice.run")}
              </button>
              <button className="btn" disabled={busy || !source.trim()} onClick={() => submit("check")}>
                {t(flavour.checkAction)}
              </button>
              <button
                className="btn"
                disabled={busy}
                onClick={() => { setSource(flavour.starter(task) || ""); setOutcome(null); }}
              >
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
                  offending keyword, which reads better as an aside than as a code block. The
                  Java compiler's own wording is already in the diagnostics below it. */}
              {outcome.detail && outcome.status !== "COMPILE_ERROR" && (outcome.status === "POLICY_ERROR"
                ? <p className="muted" style={{ fontSize: 13 }}>{outcome.detail}</p>
                : <div className="code">{outcome.detail}</div>)}
              <Diagnostics diagnostics={outcome.diagnostics} t={t} />
              {outcome.comparison?.firstDifference !== null && outcome.comparison?.firstDifference !== undefined && (
                <p className="muted">{t(flavour.firstDifference, outcome.comparison.firstDifference + 1)}</p>
              )}
              {!isJava && <RowList title={t("practice.missingRows")} rows={outcome.comparison?.missingRows} t={t} />}
              {!isJava && <RowList title={t("practice.unexpectedRows")} rows={outcome.comparison?.unexpectedRows} t={t} />}
              {outcome.result && (
                <div className="col" style={{ gap: 6 }}>
                  <strong style={{ fontSize: 14 }}>{t("practice.yourResult")}</strong>
                  {isJava
                    ? <CaseResults
                        result={outcome.result}
                        expected={outcome.expected}
                        output={outcome.output}
                        t={t}
                      />
                    : <ResultGrid table={outcome.result} t={t} />}
                </div>
              )}
            </div>
          )}

          <div className="card col">
            <div>
              <h3>{t("practice.expected")}</h3>
              <p className="muted" style={{ fontSize: 13 }}>{t(flavour.anySolution)}</p>
            </div>
            {isJava
              ? <CaseResults expected={task.expected} t={t} />
              : <ResultGrid table={task.expected} t={t} />}
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
                {task.sources.map((reference) => (
                  <li key={reference.url}>
                    <a href={reference.url} target="_blank" rel="noreferrer">{reference.title}</a>
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
