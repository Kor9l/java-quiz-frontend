import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../AppContext";

export default function PracticeTrackPage() {
  const { t } = useApp();
  const navigate = useNavigate();
  const { track } = useParams();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get(`/api/practice/tracks/${track}`).then(setSummary).catch(() => setSummary(false));
  }, [track]);

  return (
    <div className="page">
      <div className="row between header-bar">
        <div>
          <h1>{t(`practice.track.${track}`)}</h1>
          <p className="muted">{t("practice.difficulty.title")}</p>
        </div>
        <button className="btn" onClick={() => navigate("/practice")}>{t("common.back")}</button>
      </div>
      {summary === null && <p className="muted">{t("common.loading")}</p>}
      {summary === false && <p className="muted">{t("practice.empty")}</p>}
      <div className="menu-grid">
        {summary?.difficulties?.map((level) => {
          const key = level.difficulty.toLowerCase();
          return (
            <button
              key={key}
              className="btn menu-btn"
              onClick={() => navigate(`/practice/${track}/${key}`)}
            >
              <strong>{t(`difficulty.${key}`)}</strong>
              <span>{t("practice.tasks", level.taskCount)}</span>
              <span>{t("practice.solvedOf", level.solvedCount, level.taskCount)}</span>
              <div className="progress-bar" style={{ marginTop: 8 }}>
                <div style={{ width: `${Math.round((level.solvedCount / level.taskCount) * 100)}%` }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
