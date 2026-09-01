import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../AppContext";

const PRESETS = [10, 20, 30, 50, 100];
const DIRECTIONS = ["EN_RU", "RU_EN"];

/**
 * The English module's setup step. Same shape as the backend one, plus the choice that only
 * makes sense here: which way round to translate. Recognising a word and recalling it are two
 * different exercises, so it is picked per round rather than fixed.
 */
export default function EnglishQuizSetupPage() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [groups, setGroups] = useState([]);
  const [custom, setCustom] = useState(false);

  useEffect(() => {
    api.get("/api/english/groups").then(setGroups).catch(() => setGroups([]));
    api.get("/api/english/quiz/setup")
      .then((saved) => {
        setForm(saved);
        setCustom(!PRESETS.includes(saved.targetCount));
      })
      .catch(() => setForm({
        groupIds: [], targetCount: 10, infinite: false, direction: "EN_RU", favoritesOnly: false,
      }));
  }, []);

  if (!form) {
    return <div className="page muted">{t("common.loading")}</div>;
  }

  const set = (patch) => setForm({ ...form, ...patch });

  function toggleGroup(id) {
    const selected = new Set(form.groupIds || []);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    set({ groupIds: [...selected] });
  }

  const chosen = form.groupIds || [];
  const wordsAvailable = groups
    .filter((group) => chosen.length === 0 || chosen.includes(group.id))
    .reduce((sum, group) => sum + group.wordCount, 0);

  function start() {
    navigate("/english/quiz", {
      state: {
        start: {
          groupIds: chosen,
          targetCount: form.targetCount,
          infinite: form.infinite,
          direction: form.direction,
          favoritesOnly: form.favoritesOnly,
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
        <button className="btn" onClick={() => navigate("/english")}>{t("common.back")}</button>
      </div>

      <div className="col">
        <div className="card col">
          <h3>{t("setup.direction")}</h3>
          <div className="row">
            {DIRECTIONS.map((direction) => (
              <button
                key={direction}
                className={`btn ${form.direction === direction ? "primary" : ""}`}
                onClick={() => set({ direction })}
              >
                {t(`setup.direction.${direction}`)}
              </button>
            ))}
          </div>
          <p className="muted">{t(`setup.direction.${form.direction}.hint`)}</p>
        </div>

        <div className="card col">
          <h3>{t("setup.groups")}</h3>
          <p className="muted">{t("setup.groups.hint")}</p>
          {groups.map((group) => (
            <label key={group.id} className="check">
              <input
                type="checkbox"
                checked={chosen.includes(group.id)}
                onChange={() => toggleGroup(group.id)}
              />
              <span>
                {group.title} — {t("english.groups.words", group.wordCount)}
              </span>
            </label>
          ))}
          <label className="check">
            <input
              type="checkbox"
              checked={form.favoritesOnly}
              onChange={(e) => set({ favoritesOnly: e.target.checked })}
            />
            {t("setup.favoritesOnly")}
          </label>
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
                    className={`btn ${!custom && form.targetCount === n ? "primary" : ""}`}
                    onClick={() => {
                      setCustom(false);
                      set({ targetCount: n });
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
                  value={form.targetCount}
                  onChange={(e) => set({ targetCount: Number(e.target.value) })}
                />
              )}
            </>
          )}
        </div>

        <div className="row">
          <button className="btn primary" onClick={start} disabled={wordsAvailable === 0}>
            {t("setup.start")}
          </button>
          <span className="muted">
            {form.favoritesOnly
              ? t("setup.pool.favorites")
              : chosen.length === 0
                ? t("setup.pool.allWords", wordsAvailable)
                : t("setup.pool.someWords", wordsAvailable, chosen.length)}
          </span>
        </div>
      </div>
    </div>
  );
}
