import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../AppContext";
import SettingsGear from "../SettingsGear";

function pct(value) {
  return `${Math.round((value || 0) * 100)}%`;
}

/** The words half of the English module: the vocabulary trainer and its word management. */
export default function EnglishPage() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [groups, setGroups] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/api/english/groups").then(setGroups).catch(() => setGroups([]));
    api.get("/api/english/stats").then(setStats).catch(() => setStats(null));
  }, []);

  const list = groups || [];
  const words = list.reduce((sum, group) => sum + group.wordCount, 0);
  const mine = list.filter((group) => group.owned).length;

  return (
    <div className="page">
      <div className="row between header-bar">
        <div>
          <h1>{t("english.title")}</h1>
          <p className="muted">{t("english.subtitle")}</p>
        </div>
        <div className="row">
          <SettingsGear />
          <button className="btn" onClick={() => navigate("/english")}>{t("common.back")}</button>
        </div>
      </div>
      {groups === null && <p className="muted">{t("common.loading")}</p>}
      <div className="menu-grid">
        <button className="btn menu-btn" onClick={() => navigate("/english/quiz/setup")}>
          <strong>{t("englishQuiz.menu")}</strong>
          <span>{t("englishQuiz.menu.hint", stats?.overall?.totalAnswered || 0, pct(stats?.overall?.accuracy))}</span>
        </button>
        <button className="btn menu-btn" onClick={() => navigate("/english/stats")}>
          <strong>{t("menu.stats")}</strong>
          <span>{t("englishStats.menu.hint", stats?.overall?.seenWords || 0, words)}</span>
        </button>
        <button className="btn menu-btn" onClick={() => navigate("/english/words")}>
          <strong>{t("english.menu.words")}</strong>
          <span>{t("english.menu.words.hint", words, list.length)}</span>
        </button>
        <button className="btn menu-btn" onClick={() => navigate("/english/groups")}>
          <strong>{t("english.menu.groups")}</strong>
          <span>{t("english.menu.groups.hint", list.length - mine, mine)}</span>
        </button>
        <button className="btn menu-btn" onClick={() => navigate("/english/add")}>
          <strong>{t("english.menu.add")}</strong>
          <span>{t("english.menu.add.hint")}</span>
        </button>
      </div>
    </div>
  );
}
