import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../AppContext";
import { useAuth } from "../AuthContext";

function pct(value) {
  return `${Math.round((value || 0) * 100)}%`;
}

export default function MenuPage() {
  const { t, loc, settings } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/api/topics").then(setTopics).catch(() => setTopics([]));
    api.get("/api/stats").then(setStats).catch(() => setStats(null));
  }, []);

  const selected = settings.selectedTopics || [];
  const activeTopics = selected.length ? topics.filter((topic) => selected.includes(topic.id)) : topics;
  const topicLabel = selected.length === 0
    ? t("settings.topics.all")
    : activeTopics.map((topic) => loc(topic.name)).join(", ");
  const totalSections = topics.reduce((sum, topic) => sum + topic.sectionCount, 0);
  // A section flagged for re-reading has still been read, so it counts here.
  const readSections = topics.reduce((sum, topic) => sum + topic.readCount + topic.rereadCount, 0);
  const overall = stats?.overall;

  return (
    <div className="page">
      <div className="row between header-bar">
        <div>
          <h1>{t("app.title")}</h1>
          <p className="muted">{t("app.subtitle")}</p>
        </div>
        <div className="row">
          <span className="muted">{user?.email}</span>
          <button className="btn" onClick={logout}>{t("auth.logout")}</button>
        </div>
      </div>
      <div className="menu-grid">
        <button className="btn menu-btn" onClick={() => navigate("/quiz")}>
          <strong>{t("menu.start")}</strong>
          <span>{t("menu.start.hint", settings.infiniteMode ? "∞" : settings.questionCount, topicLabel)}</span>
        </button>
        <button className="btn menu-btn" onClick={() => navigate("/materials")}>
          <strong>{t("menu.materials")}</strong>
          <span>{t("menu.materials.hint", readSections, totalSections)}</span>
        </button>
        <button className="btn menu-btn" onClick={() => navigate("/settings")}>
          <strong>{t("menu.settings")}</strong>
          <span>{t("menu.settings.hint")}</span>
        </button>
        <button className="btn menu-btn" onClick={() => navigate("/stats")}>
          <strong>{t("menu.stats")}</strong>
          <span>{t("menu.stats.hint", overall?.totalAnswered || 0, pct(overall?.accuracy))}</span>
        </button>
        {user?.role === "ADMIN" && (
          <button className="btn menu-btn" onClick={() => navigate("/admin")}>
            <strong>{t("menu.admin")}</strong>
            <span>{t("menu.admin.hint")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
