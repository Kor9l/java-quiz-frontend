import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { api } from "../api";
import { useApp } from "../AppContext";

/** Banner colour by outcome, the same three shades the code tracks use. */
const BANNER_BY_STATUS = {
  PASSED: "banner success",
  WRONG_RESULT: "banner",
  SYNTAX_ERROR: "banner danger",
  POLICY_ERROR: "banner danger",
  RUNTIME_ERROR: "banner danger",
};

/** Splits a GAP_FILL text into plain text and gap numbers, line by line. */
function parseGaps(sentence) {
  return (sentence || "").split("\n").map((line) => {
    const parts = [];
    const marker = /\{\{(\d+)}}/g;
    let last = 0;
    let match;
    while ((match = marker.exec(line)) !== null) {
      if (match.index > last) parts.push(line.slice(last, match.index));
      parts.push(Number(match[1]));
      last = match.index + match[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return parts;
  });
}

/**
 * A text with an input in place of every {{n}}. Answers are kept as an array indexed by gap
 * number minus one, and travel to the server as one line per gap.
 */
function GapFill({ task, answers, setAnswers, verdicts, onSubmit }) {
  const lines = parseGaps(task.sentence);
  const update = (index, value) => {
    const next = [...answers];
    next[index] = value;
    setAnswers(next);
  };
  return (
    <div className="gap-text">
      {lines.map((parts, lineIndex) => (
        <p key={lineIndex} className="gap-line">
          {parts.map((part, partIndex) => {
            if (typeof part === "string") {
              return <span key={partIndex}>{part}</span>;
            }
            const index = part - 1;
            const verdict = verdicts[part];
            const className = verdict === undefined ? "gap-input" : verdict ? "gap-input ok" : "gap-input bad";
            return (
              <span key={partIndex} className="gap-slot">
                <sup className="muted">{part}</sup>
                <input
                  className={className}
                  value={answers[index] || ""}
                  size={Math.max(8, (answers[index] || "").length + 1)}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  onChange={(event) => update(index, event.target.value.replace(/\n/g, " "))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) onSubmit();
                  }}
                />
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
}

/** The shuffled chunks, and one line to write the assembled sentence in. */
function WordOrder({ task, answer, setAnswer, verdict, onSubmit, t }) {
  return (
    <div className="col">
      <div className="chunk-row">
        {task.chunks.map((chunk, index) => <span key={index} className="chunk">{chunk}</span>)}
      </div>
      <input
        className={verdict === undefined ? "gap-input wide" : verdict ? "gap-input wide ok" : "gap-input wide bad"}
        value={answer}
        placeholder={t("grammar.practice.placeholder")}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={(event) => setAnswer(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onSubmit();
        }}
      />
    </div>
  );
}

export default function GrammarTaskPage() {
  const { t, loc } = useApp();
  const navigate = useNavigate();
  const { track, difficulty, taskId } = useParams();
  const [task, setTask] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [answer, setAnswer] = useState("");
  const [outcome, setOutcome] = useState(null);
  const [busy, setBusy] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);

  const isGapFill = task?.kind === "GAP_FILL";

  const restore = useCallback((data) => {
    if (data.kind === "GAP_FILL") {
      const saved = data.lastAnswer ? data.lastAnswer.split("\n") : [];
      setAnswers(Array.from({ length: data.gapCount }, (_, index) => saved[index] || ""));
    } else {
      setAnswer(data.lastAnswer || "");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.get(`/api/practice/tasks/${taskId}`)
      .then((data) => {
        if (cancelled) return;
        setTask(data);
        restore(data);
      })
      .catch(() => setTask(false));
    return () => { cancelled = true; };
  }, [taskId, restore]);

  const submission = isGapFill ? answers.map((value) => value.trim()).join("\n") : answer;
  const empty = isGapFill ? answers.every((value) => !value.trim()) : !answer.trim();

  const submit = useCallback(async (endpoint) => {
    if (busy || empty) return;
    setBusy(true);
    try {
      const result = await api.post(`/api/practice/tasks/${taskId}/${endpoint}`, { code: submission });
      setOutcome({ ...result, endpoint });
      if (endpoint === "run") {
        setTask(await api.get(`/api/practice/tasks/${taskId}`));
      }
    } catch (error) {
      setOutcome({ status: "RUNTIME_ERROR", passed: false, detail: error.message, endpoint });
    } finally {
      setBusy(false);
    }
  }, [busy, empty, submission, taskId]);

  const run = useCallback(() => submit("run"), [submit]);

  if (task === false) {
    return <div className="page"><p className="muted">{t("practice.empty")}</p></div>;
  }
  if (!task) {
    return <div className="page muted">{t("common.loading")}</div>;
  }

  // Verdicts by gap number, only from a graded run: a check says nothing about correctness.
  const verdicts = {};
  if (outcome?.endpoint === "run") {
    (outcome.blanks || []).forEach((blank) => { verdicts[blank.index] = blank.correct; });
  }
  const wrongGaps = Object.entries(verdicts).filter(([, correct]) => !correct).map(([index]) => index);

  const statusText = outcome && (
    outcome.endpoint === "check" && outcome.passed
      ? t(isGapFill ? "grammar.practice.checkPassedGaps" : "grammar.practice.checkPassedWords")
      : t(`grammar.practice.status.${outcome.status}`)
  );
  // The shared empty-answer message talks about queries; this screen has none.
  const messageKey = outcome?.messageKey === "practice.error.empty" ? "grammar.practice.emptyAnswer"
    : outcome?.messageKey === "practice.error.tooLong" ? "grammar.practice.tooLong"
      : outcome?.messageKey;

  return (
    <div className="page">
      <div className="row between header-bar">
        <div>
          <h1>{loc(task.title)}</h1>
          <p className="muted">
            {t(`difficulty.${difficulty}`)}
            {isGapFill ? ` · ${t("grammar.practice.gapCount", task.gapCount)}` : ""}
            {task.solved ? ` · ${t("practice.solved")}` : ""}
          </p>
        </div>
        <div className="row">
          {task.material && (
            <button
              className="btn"
              onClick={() => navigate(`/english/grammar/materials/${task.material.topicId}/${task.material.sectionId}`)}
            >
              {t("practice.readMaterial")}
            </button>
          )}
          <button className="btn" onClick={() => navigate(`/practice/${track}/${difficulty}`)}>
            {t("common.back")}
          </button>
        </div>
      </div>

      <div className="col" style={{ maxWidth: 820 }}>
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
            <h3 style={{ margin: 0 }}>{t("grammar.practice.answer")}</h3>
            <span className="muted" style={{ fontSize: 13 }}>{isGapFill ? "Ctrl+Enter" : "Enter"}</span>
          </div>
          {isGapFill
            ? <GapFill task={task} answers={answers} setAnswers={setAnswers} verdicts={verdicts} onSubmit={run} />
            : <WordOrder task={task} answer={answer} setAnswer={setAnswer} verdict={verdicts[1]} onSubmit={run} t={t} />}
          <div className="row">
            <button className="btn primary" disabled={busy || empty} onClick={run}>
              {busy ? t("practice.running") : t("grammar.practice.submit")}
            </button>
            <button className="btn" disabled={busy || empty} onClick={() => submit("check")}>
              {t(isGapFill ? "grammar.practice.checkGaps" : "grammar.practice.checkWords")}
            </button>
            <button
              className="btn"
              disabled={busy}
              onClick={() => {
                setAnswers(Array.from({ length: task.gapCount || 0 }, () => ""));
                setAnswer("");
                setOutcome(null);
              }}
            >
              {t("practice.reset")}
            </button>
          </div>
        </div>

        {outcome && (
          <div className="card col">
            <div className={BANNER_BY_STATUS[outcome.status] || "banner"}>{statusText}</div>
            {messageKey && !outcome.passed && <p>{t(messageKey)}</p>}
            {isGapFill && wrongGaps.length > 0 && (
              <p className="muted">{t("grammar.practice.wrongGaps", wrongGaps.join(", "))}</p>
            )}
            {outcome.detail && outcome.status === "RUNTIME_ERROR" && <div className="code">{outcome.detail}</div>}
          </div>
        )}

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
  );
}
