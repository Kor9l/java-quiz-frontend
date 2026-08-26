import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../AppContext";

function pct(value) {
  return `${Math.round((value || 0) * 100)}%`;
}

function duration(ms, t) {
  const total = Math.max(0, Math.floor((ms || 0) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return t("stats.duration.hm", h, m);
  return t("stats.duration.ms", m, s);
}

export default function StatsPage() {
  const { t, loc } = useApp();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  async function reload() {
    setData(await api.get("/api/stats"));
  }

  useEffect(() => {
    reload().catch(() => setData(null));
  }, []);

  if (!data) {
    return <div className="page muted">{t("common.loading")}</div>;
  }

  const o = data.overall;
  const empty = !o.totalAnswered;

  return (
    <div className="page">
      <div className="row between header-bar">
        <h1>{t("stats.title")}</h1>
        <button className="btn" onClick={() => navigate("/")}>{t("common.back")}</button>
      </div>
      {empty && <p className="muted">{t("stats.empty")}</p>}
      <div className="tiles" style={{ marginBottom: 16 }}>
        <div className="card tile"><div className="muted">{t("stats.answered")}</div><div className="value">{o.totalAnswered}</div></div>
        <div className="card tile"><div className="muted">{t("stats.correct")}</div><div className="value">{o.totalCorrect}</div></div>
        <div className="card tile"><div className="muted">{t("stats.accuracy")}</div><div className="value">{pct(o.accuracy)}</div></div>
        <div className="card tile"><div className="muted">{t("stats.bestStreak")}</div><div className="value">{o.bestStreak}</div></div>
        <div className="card tile"><div className="muted">{t("stats.time")}</div><div className="value">{duration(o.totalTimeMillis, t)}</div></div>
        <div className="card tile"><div className="muted">{t("stats.coverage")}</div><div className="value">{t("stats.coverage.value", o.seenQuestions, o.bankSize)}</div></div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>{t("stats.byTopic")}</h3>
        <table>
          <thead><tr><th>{t("stats.col.topic")}</th><th>{t("stats.col.answered")}</th><th>{t("stats.col.correct")}</th><th>{t("stats.col.accuracy")}</th></tr></thead>
          <tbody>
            {data.byTopic.map((row) => (
              <tr key={row.topicId}>
                <td>{loc(row.name)}</td>
                <td>{row.answered}</td>
                <td>{row.correct}</td>
                <td>{pct(row.accuracy)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.weakest.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>{t("stats.weakest")}</h3>
          <table>
            <thead><tr><th>{t("stats.col.topic")}</th><th>{t("stats.col.section")}</th><th>{t("stats.col.answered")}</th><th>{t("stats.col.accuracy")}</th></tr></thead>
            <tbody>
              {data.weakest.map((row) => (
                <tr key={row.key}>
                  <td>{loc(row.topicName)}</td>
                  <td>
                    <button className="btn" onClick={() => navigate(`/materials/${row.topicId}/${row.sectionId}`)}>
                      {loc(row.sectionTitle)}
                    </button>
                  </td>
                  <td>{row.answered}</td>
                  <td>{pct(row.accuracy)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data.recent.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>{t("stats.recent")}</h3>
          <table>
            <thead><tr><th>{t("stats.col.date")}</th><th>{t("stats.col.result")}</th><th>{t("stats.col.duration")}</th><th>{t("stats.col.mode")}</th></tr></thead>
            <tbody>
              {data.recent.map((row, i) => (
                <tr key={i}>
                  <td>{row.finishedAt ? new Date(row.finishedAt).toLocaleString() : ""}</td>
                  <td>{row.correct}/{row.answered} ({pct(row.accuracy)})</td>
                  <td>{duration(row.durationMillis, t)}</td>
                  <td>{row.infinite ? t("stats.mode.infinite") : t("stats.mode.finite", row.targetCount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="row">
        <button className="btn danger" onClick={async () => {
          if (!window.confirm(t("stats.reset.confirm"))) return;
          await api.post("/api/stats/reset");
          await reload();
        }}>{t("stats.reset")}</button>
        <button className="btn danger" onClick={async () => {
          if (!window.confirm(t("stats.resetProgress.confirm"))) return;
          await api.post("/api/progress/reset");
          await reload();
        }}>{t("stats.resetProgress")}</button>
      </div>
    </div>
  );
}
