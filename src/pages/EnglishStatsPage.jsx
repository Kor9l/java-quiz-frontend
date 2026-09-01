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
  if (h > 0) {
    return t("stats.duration.hm", h, m);
  }
  return t("stats.duration.ms", m, s);
}

/** The English module's history, laid out like the backend one but keyed by group and word. */
export default function EnglishStatsPage() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  async function reload() {
    setData(await api.get("/api/english/stats"));
  }

  useEffect(() => {
    reload().catch(() => setData(null));
  }, []);

  if (!data) {
    return <div className="page muted">{t("common.loading")}</div>;
  }

  const o = data.overall;

  return (
    <div className="page">
      <div className="row between header-bar">
        <h1>{t("stats.title")}</h1>
        <button className="btn" onClick={() => navigate("/english")}>{t("common.back")}</button>
      </div>
      {!o.totalAnswered && <p className="muted">{t("englishStats.empty")}</p>}
      <div className="tiles" style={{ marginBottom: 16 }}>
        <div className="card tile"><div className="muted">{t("stats.answered")}</div><div className="value">{o.totalAnswered}</div></div>
        <div className="card tile"><div className="muted">{t("stats.correct")}</div><div className="value">{o.totalCorrect}</div></div>
        <div className="card tile"><div className="muted">{t("stats.accuracy")}</div><div className="value">{pct(o.accuracy)}</div></div>
        <div className="card tile"><div className="muted">{t("stats.bestStreak")}</div><div className="value">{o.bestStreak}</div></div>
        <div className="card tile"><div className="muted">{t("stats.time")}</div><div className="value">{duration(o.totalTimeMillis, t)}</div></div>
        <div className="card tile"><div className="muted">{t("stats.sessions")}</div><div className="value">{o.sessionCount}</div></div>
        <div className="card tile"><div className="muted">{t("englishStats.coverage")}</div><div className="value">{t("englishStats.coverage.value", o.seenWords, o.bankSize)}</div></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>{t("englishStats.byDirection")}</h3>
        <table>
          <thead>
            <tr>
              <th>{t("setup.direction")}</th>
              <th>{t("stats.col.answered")}</th>
              <th>{t("stats.col.correct")}</th>
              <th>{t("stats.col.accuracy")}</th>
            </tr>
          </thead>
          <tbody>
            {data.byDirection.map((row) => (
              <tr key={row.direction}>
                <td>{t(`setup.direction.${row.direction}`)}</td>
                <td>{row.answered}</td>
                <td>{row.correct}</td>
                <td>{pct(row.accuracy)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>{t("englishStats.byGroup")}</h3>
        <table>
          <thead>
            <tr>
              <th>{t("englishStats.col.group")}</th>
              <th>{t("stats.col.answered")}</th>
              <th>{t("stats.col.correct")}</th>
              <th>{t("stats.col.accuracy")}</th>
            </tr>
          </thead>
          <tbody>
            {data.byGroup.map((row) => (
              <tr key={row.groupId}>
                <td>{row.title}</td>
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
          <h3>{t("englishStats.weakest")}</h3>
          <table>
            <thead>
              <tr>
                <th>{t("english.word.text")}</th>
                <th>{t("english.word.translation")}</th>
                <th>{t("stats.col.answered")}</th>
                <th>{t("stats.col.accuracy")}</th>
              </tr>
            </thead>
            <tbody>
              {data.weakest.map((row) => (
                <tr key={row.wordId}>
                  <td>{row.text}</td>
                  <td>{row.translation}</td>
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
            <thead>
              <tr>
                <th>{t("stats.col.date")}</th>
                <th>{t("stats.col.result")}</th>
                <th>{t("stats.col.duration")}</th>
                <th>{t("setup.direction")}</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((row, i) => (
                <tr key={i}>
                  <td>{row.startedAt ? new Date(row.startedAt).toLocaleString() : ""}</td>
                  <td>{row.correct}/{row.answered} ({pct(row.accuracy)})</td>
                  <td>{duration(row.durationMillis, t)}</td>
                  <td>{row.direction ? t(`setup.direction.${row.direction}`) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="row">
        <button
          className="btn danger"
          onClick={async () => {
            if (!window.confirm(t("englishStats.reset.confirm"))) {
              return;
            }
            await api.post("/api/english/stats/reset");
            await reload();
          }}
        >
          {t("stats.reset")}
        </button>
      </div>
    </div>
  );
}
