import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../AppContext";
import { useAuth } from "../AuthContext";
import SettingsGear from "../SettingsGear";

// The counts a module reports differ by module, so each one names the two numbers its own
// hint takes. A module the backend grows later still renders — without a hint line.
const HINT_COUNTS = {
  backend: (counts) => [counts.topics, counts.questions],
  english: (counts) => [counts.groups, counts.words],
};

/** The first screen after signing in: which of the two things to study. */
export default function ModulesPage() {
  const { t, loc } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState(null);

  useEffect(() => {
    api.get("/api/modules").then(setModules).catch(() => setModules([]));
  }, []);

  return (
    <div className="page">
      <div className="row between header-bar">
        <div>
          <h1>{t("app.title")}</h1>
          <p className="muted">{t("modules.subtitle")}</p>
        </div>
        <div className="row">
          <span className="muted">{user?.email}</span>
          <SettingsGear />
          <button className="btn" onClick={logout}>{t("auth.logout")}</button>
        </div>
      </div>
      {modules === null && <p className="muted">{t("common.loading")}</p>}
      <div className="menu-grid">
        {modules?.map((module) => {
          const counts = HINT_COUNTS[module.id];
          return (
            <button
              key={module.id}
              className="btn menu-btn module-btn"
              onClick={() => navigate(`/${module.id}`)}
            >
              <strong>{loc(module.name)}</strong>
              {counts && <span>{t(`modules.hint.${module.id}`, ...counts(module.counts))}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
