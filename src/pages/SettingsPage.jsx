import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { LEVELS, useApp } from "../AppContext";

const PRESETS = [10, 20, 30, 50, 100];

export default function SettingsPage() {
  const { t, loc, settings, saveSettings } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState(settings);
  const [topics, setTopics] = useState([]);
  const [saved, setSaved] = useState(false);
  const [custom, setCustom] = useState(!PRESETS.includes(settings.questionCount));

  useEffect(() => setForm(settings), [settings]);
  // The note confirms one save; leaving it up makes later unsaved edits look saved.
  useEffect(() => {
    if (!saved) {
      return undefined;
    }
    const timer = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(timer);
  }, [saved]);
  useEffect(() => {
    api.get("/api/topics").then(setTopics).catch(() => setTopics([]));
  }, []);

  function toggleTopic(id) {
    const selected = new Set(form.selectedTopics || []);
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    setForm({ ...form, selectedTopics: [...selected] });
  }

  async function onSave() {
    await saveSettings(form);
    setSaved(true);
  }

  return (
    <div className="page">
      <div className="row between header-bar">
        <h1>{t("settings.title")}</h1>
        <button className="btn" onClick={() => navigate("/backend")}>{t("common.back")}</button>
      </div>
      <div className="col">
        <div className="card col">
          <h3>{t("settings.language")}</h3>
          <select className="select" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="card col">
          <h3>{t("settings.level")}</h3>
          <div className="row">
            {LEVELS.map((level) => (
              <button
                key={level}
                className={`btn ${form.level === level ? "primary" : ""}`}
                onClick={() => setForm({ ...form, level })}
              >
                {t(`level.${level}`)}
              </button>
            ))}
          </div>
          <p className="muted">{t("settings.level.hint")}</p>
        </div>
        <div className="card col">
          <h3>{t("settings.topics")}</h3>
          <p className="muted">{t("settings.topics.hint")}</p>
          {topics.map((topic) => {
            const checked = (form.selectedTopics || []).includes(topic.id);
            return (
              <label key={topic.id} className="check">
                <input type="checkbox" checked={checked} onChange={() => toggleTopic(topic.id)} />
                <span>
                  {loc(topic.name)} — {t("settings.topics.questions", topic.questionCount)}, {t("settings.topics.read", topic.readCount + topic.rereadCount, topic.sectionCount)}
                  {topic.rereadCount > 0 ? `, ${t("settings.topics.reread", topic.rereadCount)}` : ""}
                </span>
              </label>
            );
          })}
        </div>
        <div className="card col">
          <h3>{t("settings.count")}</h3>
          <label className="check">
            <input type="checkbox" checked={form.infiniteMode} onChange={(e) => setForm({ ...form, infiniteMode: e.target.checked })} />
            {t("settings.count.infinite")}
          </label>
          {!form.infiniteMode && (
            <>
              <div className="row">
                {PRESETS.map((n) => (
                  <button key={n} className={`btn ${!custom && form.questionCount === n ? "primary" : ""}`} onClick={() => {
                    setCustom(false);
                    setForm({ ...form, questionCount: n });
                  }}>{n}</button>
                ))}
                <button className={`btn ${custom ? "primary" : ""}`} onClick={() => setCustom(true)}>{t("settings.count.custom")}</button>
              </div>
              {custom && (
                <input className="input" type="number" min={1} max={500} value={form.questionCount}
                  onChange={(e) => setForm({ ...form, questionCount: Number(e.target.value) })} />
              )}
            </>
          )}
        </div>
        <div className="card col">
          <h3>{t("settings.quiz")}</h3>
          <label className="check">
            <input type="checkbox" checked={form.shuffleOptions} onChange={(e) => setForm({ ...form, shuffleOptions: e.target.checked })} />
            {t("settings.shuffle")}
          </label>
          <label className="check">
            <input type="checkbox" checked={form.smartSelection} onChange={(e) => setForm({ ...form, smartSelection: e.target.checked })} />
            {t("settings.smart")}
          </label>
          <label className="check">
            <input type="checkbox" checked={form.showExplanation} onChange={(e) => setForm({ ...form, showExplanation: e.target.checked })} />
            {t("settings.explanation")}
          </label>
        </div>
        <div className="card col">
          <h3>{t("settings.appearance")}</h3>
          <label className="check">
            <input type="checkbox" checked={form.darkTheme} onChange={(e) => setForm({ ...form, darkTheme: e.target.checked })} />
            {t("settings.darkTheme")}
          </label>
        </div>
        <div className="row">
          <button className="btn primary" onClick={onSave}>{t("common.save")}</button>
          {saved && <span className="muted">{t("settings.saved")}</span>}
        </div>
      </div>
    </div>
  );
}
