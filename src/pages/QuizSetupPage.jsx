import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { levelsFor, useApp } from "../AppContext";

const PRESETS = [10, 20, 30, 50, 100];

/**
 * The step between pressing start and the first question: what to be asked about, how much of
 * it, and how. Opens on whatever was chosen last time — the round that follows saves it.
 */
export default function QuizSetupPage({ module = "backend" }) {
  const english = module === "english";
  const levels = levelsFor(module);
  const topicsPath = english ? "/api/topics?module=english" : "/api/topics";
  const setupPath = english ? "/api/quiz/setup?module=english" : "/api/quiz/setup";
  const home = english ? "/english/grammar" : "/backend";
  const { t, loc } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [topics, setTopics] = useState([]);
  const [custom, setCustom] = useState(false);

  useEffect(() => {
    api.get(topicsPath).then(setTopics).catch(() => setTopics([]));
    api.get(setupPath)
      .then((saved) => {
        setForm(saved);
        setCustom(!PRESETS.includes(saved.questionCount));
      })
      .catch(() => setForm({
        topicIds: [], questionCount: 20, infinite: false, level: levels[0],
        shuffleOptions: true, smartSelection: true, showExplanation: true,
      }));
  }, []);

  if (!form) {
    return <div className="page muted">{t("common.loading")}</div>;
  }

  const set = (patch) => setForm({ ...form, ...patch });

  function toggleTopic(id) {
    const selected = new Set(form.topicIds || []);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    set({ topicIds: [...selected] });
  }

  // Nothing ticked means every topic, including ones added later — so it is sent as an empty
  // list rather than expanded here.
  const chosen = form.topicIds || [];
  const questionsAvailable = topics
    .filter((topic) => chosen.length === 0 || chosen.includes(topic.id))
    .reduce((sum, topic) => sum + topic.questionCount, 0);

  function start() {
    navigate("/quiz", {
      state: {
        start: {
          module,
          topicIds: chosen,
          targetCount: form.questionCount,
          infinite: form.infinite,
          level: form.level,
          shuffleOptions: form.shuffleOptions,
          smartSelection: form.smartSelection,
          showExplanation: form.showExplanation,
        },
      },
    });
  }

  return (
    <div className="page">
      <div className="row between header-bar">
        <div>
          <h1>{t("setup.title")}</h1>
          <p className="muted">{t("setup.subtitle")}</p>
        </div>
        <button className="btn" onClick={() => navigate(home)}>{t("common.back")}</button>
      </div>

      <div className="col">
        <div className="card col">
          <h3>{t("settings.level")}</h3>
          <div className="row">
            {levels.map((level) => (
              <button
                key={level}
                className={`btn ${form.level === level ? "primary" : ""}`}
                onClick={() => set({ level })}
              >
                {t(`level.${level}`)}
              </button>
            ))}
          </div>
          <p className="muted">{t(english ? "settings.level.hint.english" : "settings.level.hint")}</p>
        </div>

        <div className="card col">
          <h3>{t("settings.topics")}</h3>
          <p className="muted">{t("settings.topics.hint")}</p>
          {topics.map((topic) => (
            <label key={topic.id} className="check">
              <input
                type="checkbox"
                checked={chosen.includes(topic.id)}
                onChange={() => toggleTopic(topic.id)}
              />
              <span>
                {loc(topic.name)} — {t("settings.topics.questions", topic.questionCount)}
              </span>
            </label>
          ))}
        </div>

        <div className="card col">
          <h3>{t("settings.count")}</h3>
          <label className="check">
            <input
              type="checkbox"
              checked={form.infinite}
              onChange={(e) => set({ infinite: e.target.checked })}
            />
            {t("settings.count.infinite")}
          </label>
          {!form.infinite && (
            <>
              <div className="row">
                {PRESETS.map((n) => (
                  <button
                    key={n}
                    className={`btn ${!custom && form.questionCount === n ? "primary" : ""}`}
                    onClick={() => {
                      setCustom(false);
                      set({ questionCount: n });
                    }}
                  >
                    {n}
                  </button>
                ))}
                <button className={`btn ${custom ? "primary" : ""}`} onClick={() => setCustom(true)}>
                  {t("settings.count.custom")}
                </button>
              </div>
              {custom && (
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={500}
                  value={form.questionCount}
                  onChange={(e) => set({ questionCount: Number(e.target.value) })}
                />
              )}
            </>
          )}
        </div>

        <div className="card col">
          <h3>{t("settings.quiz")}</h3>
          <label className="check">
            <input
              type="checkbox"
              checked={form.shuffleOptions}
              onChange={(e) => set({ shuffleOptions: e.target.checked })}
            />
            {t("settings.shuffle")}
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={form.smartSelection}
              onChange={(e) => set({ smartSelection: e.target.checked })}
            />
            {t("settings.smart")}
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={form.showExplanation}
              onChange={(e) => set({ showExplanation: e.target.checked })}
            />
            {t("settings.explanation")}
          </label>
        </div>

        <div className="row">
          <button className="btn primary" onClick={start} disabled={questionsAvailable === 0}>
            {t("setup.start")}
          </button>
          <span className="muted">
            {chosen.length === 0
              ? t("setup.pool.all", questionsAvailable)
              : t("setup.pool.some", questionsAvailable, chosen.length)}
          </span>
        </div>
      </div>
    </div>
  );
}
