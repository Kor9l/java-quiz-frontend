import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../AppContext";

export default function PracticePage() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState(null);

  useEffect(() => {
    api.get("/api/practice").then(setTracks).catch(() => setTracks([]));
  }, []);

  return (
    <div className="page">
      <div className="row between header-bar">
        <div>
          <h1>{t("practice.title")}</h1>
          <p className="muted">{t("practice.subtitle")}</p>
        </div>
        <button className="btn" onClick={() => navigate("/backend")}>{t("common.back")}</button>
      </div>
      {tracks === null && <p className="muted">{t("common.loading")}</p>}
      {tracks?.length === 0 && <p className="muted">{t("practice.empty")}</p>}
      <div className="menu-grid">
        {tracks?.map((track) => (
          <button
            key={track.track}
            className="btn menu-btn"
            onClick={() => navigate(`/practice/${track.track}`)}
          >
            <strong>{t(`practice.track.${track.track}`)}</strong>
            <span>{t(`practice.track.${track.track}.hint`)}</span>
            <span>{t("practice.solvedOf", track.solvedCount, track.taskCount)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
