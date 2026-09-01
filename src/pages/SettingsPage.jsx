import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../AppContext";

/**
 * What is genuinely global: the language everything is read in, and the theme it is read on.
 *
 * Topics, word groups, question count and the quiz behaviour toggles used to live here too.
 * They are all answers to "what am I about to be asked", which is a question you have only just
 * asked yourself when you press start — so they moved to the step between pressing it and the
 * first question, where they are chosen and remembered.
 */
export default function SettingsPage() {
  const { t, settings, saveSettings } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ language: settings.language, darkTheme: settings.darkTheme });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm({ language: settings.language, darkTheme: settings.darkTheme });
  }, [settings.language, settings.darkTheme]);

  // The note confirms one save; leaving it up makes later unsaved edits look saved.
  useEffect(() => {
    if (!saved) {
      return undefined;
    }
    const timer = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(timer);
  }, [saved]);

  async function onSave() {
    // Only the two fields, so a save from here can never disturb either quiz's setup.
    await saveSettings(form);
    setSaved(true);
  }

  return (
    <div className="page">
      <div className="row between header-bar">
        <h1>{t("settings.title")}</h1>
        <button className="btn" onClick={() => navigate(-1)}>{t("common.back")}</button>
      </div>
      <div className="col">
        <div className="card col">
          <h3>{t("settings.language")}</h3>
          <select
            className="select"
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="card col">
          <h3>{t("settings.appearance")}</h3>
          <label className="check">
            <input
              type="checkbox"
              checked={form.darkTheme}
              onChange={(e) => setForm({ ...form, darkTheme: e.target.checked })}
            />
            {t("settings.darkTheme")}
          </label>
        </div>
        <p className="muted">{t("settings.quizMoved")}</p>
        <div className="row">
          <button className="btn primary" onClick={onSave}>{t("common.save")}</button>
          {saved && <span className="muted">{t("settings.saved")}</span>}
        </div>
      </div>
    </div>
  );
}
