import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../AppContext";

const LETTERS = ["A", "B", "C", "D", "E"];

function formatTime(ms) {
  const total = Math.max(0, Math.floor((ms || 0) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * The vocabulary round, staged like the backend quiz: the word on its own first, then the five
 * options, then the verdict. Trying to recall the translation before the options appear is most
 * of the exercise.
 */
export default function EnglishQuizPage() {
  const { t } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const started = useRef(false);
  // The round's clock, chosen on the setup screen. The API has no notion of one — it is this
  // page that stops asking — so the deadline is a moment in the browser and lives as long as
  // the page does. A reload starts a fresh round anyway, clock included.
  const limitMs = Math.max(0, (location.state?.minutes || 0) * 60000);
  const deadline = useRef(0);
  const [remaining, setRemaining] = useState(limitMs);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;
    api.post("/api/english/quiz/start", location.state?.start || {})
      .then((round) => {
        // Counted from the first word rather than from the click, so a slow start is not
        // charged to the fifteen minutes the learner asked for.
        deadline.current = Date.now() + limitMs;
        setSession(round);
      })
      .catch((err) => setError(err.message));
  }, [location.state]);

  // Read off a wall clock rather than counted down, so a tab that slept for ten minutes comes
  // back with ten minutes gone — which is what "fifteen minutes of practice" means.
  useEffect(() => {
    if (!limitMs || !session || session.stage === "FINISHED") {
      return undefined;
    }
    const tick = () => setRemaining(Math.max(0, deadline.current - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [limitMs, session]);

  const timeUp = limitMs > 0 && remaining <= 0;

  async function call(path, body) {
    if (!session || busy) {
      return null;
    }
    setBusy(true);
    try {
      const next = await api.post(path, body);
      setSession(next);
      return next;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  // Only leave once the round is actually closed server-side, so a failed quit surfaces its
  // error instead of silently dropping the run.
  async function quit() {
    const closed = await call(`/api/english/quiz/${session.id}/quit`);
    if (closed) {
      navigate("/english/vocabulary");
    }
  }

  function onStageClick() {
    if (!session || busy) {
      return;
    }
    if (session.stage === "QUESTION_ONLY") {
      call(`/api/english/quiz/${session.id}/reveal`);
    } else if (session.stage === "ANSWERED") {
      // The word in hand is always finished, however late the clock ran out: taking a question
      // away mid-thought would be the timer grading the learner rather than timing them. So the
      // round closes one word after the time — and onto the summary rather than back to the
      // menu, because a round that ran its course has a result to show.
      call(timeUp
        ? `/api/english/quiz/${session.id}/quit`
        : `/api/english/quiz/${session.id}/advance`);
    }
  }

  useEffect(() => {
    function onKey(event) {
      if (!session) {
        return;
      }
      if (event.key === "Escape") {
        if (session.answeredCount > 0 && session.stage !== "FINISHED"
            && !window.confirm(t("quiz.quit.confirm"))) {
          return;
        }
        quit();
        return;
      }
      if (event.code === "Space" || event.key === "Enter") {
        event.preventDefault();
        onStageClick();
      }
      if (session.stage === "OPTIONS_REVEALED") {
        const index = ["1", "2", "3", "4", "5"].indexOf(event.key);
        if (index >= 0) {
          call(`/api/english/quiz/${session.id}/answer`, { optionIndex: index });
        }
      }
    }
    // The hint says "click anywhere", so the click is caught on the window rather than on the
    // stage card — aiming at the card was the one thing the wording did not ask for. A control
    // that means something of its own — quit, an option, a link — keeps its click.
    function onPageClick(event) {
      if (event.target?.closest?.("button, a, input, select, textarea, label")) {
        return;
      }
      onStageClick();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onPageClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onPageClick);
    };
  });

  if (error) {
    return (
      <div className="page">
        <div className="error">{error}</div>
        <button className="btn" onClick={() => navigate("/english/vocabulary")}>{t("common.back")}</button>
      </div>
    );
  }
  if (!session) {
    return <div className="page muted">{t("common.loading")}</div>;
  }
  if (session.empty) {
    return (
      <div className="page">
        <h1>{t("englishQuiz.empty.title")}</h1>
        <p>{t("englishQuiz.empty.body")}</p>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn primary" onClick={() => navigate("/english/quiz/setup")}>
            {t("englishQuiz.empty.setup")}
          </button>
          <button className="btn" onClick={() => navigate("/english/vocabulary")}>{t("common.back")}</button>
        </div>
      </div>
    );
  }

  if (session.stage === "FINISHED") {
    return (
      <div className="page">
        <h1>{t("quiz.result.title")}</h1>
        <div className="tiles" style={{ margin: "16px 0" }}>
          <div className="card tile"><div className="muted">{t("quiz.result.answered")}</div><div className="value">{session.answeredCount}</div></div>
          <div className="card tile"><div className="muted">{t("quiz.result.correct")}</div><div className="value">{session.correctCount}</div></div>
          <div className="card tile"><div className="muted">{t("quiz.result.accuracy")}</div><div className="value">{Math.round((session.accuracy || 0) * 100)}%</div></div>
          <div className="card tile"><div className="muted">{t("quiz.result.time")}</div><div className="value">{formatTime(session.elapsedMillis)}</div></div>
          <div className="card tile"><div className="muted">{t("quiz.result.streak")}</div><div className="value">{session.bestStreak}</div></div>
        </div>
        {session.missedWords?.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <h3>{t("englishQuiz.missed")}</h3>
            <div className="col word-list">
              {session.missedWords.map((word) => (
                <div className="word-row" key={word.id}>
                  <div className="grow">
                    <div>
                      <strong>{word.text}</strong>
                      <span className="muted"> — {word.translation}</span>
                    </div>
                    {word.example && <div className="muted word-example">{word.example}</div>}
                  </div>
                  {word.groupTitle && <span className="chip">{word.groupTitle}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="row">
          <button className="btn primary" onClick={() => navigate("/english/quiz/setup")}>
            {t("quiz.result.again")}
          </button>
          <button className="btn" onClick={() => navigate("/english/words")}>
            {t("englishQuiz.result.toWords")}
          </button>
          <button className="btn" onClick={() => navigate("/english/vocabulary")}>{t("quiz.result.toMenu")}</button>
        </div>
      </div>
    );
  }

  const q = session.question;
  const target = session.infinite ? 0 : session.targetCount;
  const progress = target ? Math.min(100, (session.askedCount / target) * 100) : 0;

  return (
    <div className="page">
      <div className="row between header-bar">
        <h1>{t("english.title")}</h1>
        <button
          className="btn"
          onClick={() => {
            if (session.answeredCount > 0 && !window.confirm(t("quiz.quit.confirm"))) {
              return;
            }
            quit();
          }}
        >
          {t("quiz.quit")}
        </button>
      </div>
      <div className="row" style={{ marginBottom: 10 }}>
        <span className="muted">
          {session.infinite
            ? t("quiz.progress.infinite", session.askedCount)
            : t("quiz.progress", session.askedCount, target)}
        </span>
        <span>{t("quiz.score", session.correctCount, session.answeredCount)}</span>
        <span>{t("quiz.streak", session.streak)}</span>
        <span className="chip">{t(`setup.direction.${session.direction}`)}</span>
        {limitMs > 0 && (
          <span className={`chip ${timeUp ? "alarm" : remaining < 60000 ? "soon" : ""}`}>
            {timeUp ? t("englishQuiz.time.up") : t("englishQuiz.time.left", formatTime(remaining))}
          </span>
        )}
      </div>
      <div className="progress-bar" style={{ marginBottom: 16 }}>
        <div style={{ width: session.infinite ? "100%" : `${progress}%`, opacity: session.infinite ? 0.35 : 1 }} />
      </div>
      {timeUp && session.stage !== "ANSWERED" && (
        <p className="muted" style={{ marginBottom: 10 }}>{t("englishQuiz.time.lastWord")}</p>
      )}
      <div className="card quiz-stage col">
        {q && (
          <>
            <h2 className="word-prompt">{q.prompt}</h2>
            {session.stage === "QUESTION_ONLY" && <p className="muted">{t("englishQuiz.hint.reveal")}</p>}
            {session.stage === "OPTIONS_REVEALED" && (
              <div className="col">
                <p className="muted">{t("quiz.hint.choose")}</p>
                {q.options.map((option, index) => (
                  <button
                    key={index}
                    className="option"
                    onClick={() => call(`/api/english/quiz/${session.id}/answer`, { optionIndex: index })}
                  >
                    <span className="letter">{LETTERS[index]}</span>
                    <span>{option}</span>
                  </button>
                ))}
              </div>
            )}
            {session.stage === "ANSWERED" && (
              <div className="col">
                {q.options.map((option, index) => {
                  const cls = index === q.correctIndex
                    ? "option correct"
                    : index === q.selectedIndex ? "option wrong" : "option";
                  return (
                    <div key={index} className={cls}>
                      <span className="letter">{LETTERS[index]}</span>
                      <span>{option}</span>
                    </div>
                  );
                })}
                {q.example && (
                  <div className="card-alt" style={{ padding: 12, borderRadius: 10 }}>
                    <strong>{t("english.word.example")}</strong>
                    <p>{q.example}</p>
                  </div>
                )}
                <p className="muted">{timeUp ? t("englishQuiz.time.finish") : t("quiz.hint.next")}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
