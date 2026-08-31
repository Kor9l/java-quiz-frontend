import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../AppContext";

export default function PracticeTaskListPage() {
  const { t, loc } = useApp();
  const navigate = useNavigate();
  const { track, difficulty } = useParams();
  const [tasks, setTasks] = useState(null);

  useEffect(() => {
    api.get(`/api/practice/tracks/${track}/${difficulty}`)
      .then(setTasks)
      .catch(() => setTasks([]));
  }, [track, difficulty]);

  const solved = tasks?.filter((task) => task.solved).length || 0;

  return (
    <div className="page">
      <div className="row between header-bar">
        <div>
          <h1>{t(`practice.track.${track}`)} · {t(`difficulty.${difficulty}`)}</h1>
          <p className="muted">{t("practice.solvedOf", solved, tasks?.length || 0)}</p>
        </div>
        <button className="btn" onClick={() => navigate(`/practice/${track}`)}>{t("common.back")}</button>
      </div>
      {tasks === null && <p className="muted">{t("common.loading")}</p>}
      {tasks?.length === 0 && <p className="muted">{t("practice.empty")}</p>}
      <div className="col">
        {tasks?.map((task) => (
          <button
            key={task.id}
            className="btn menu-btn"
            onClick={() => navigate(`/practice/${track}/${difficulty}/${task.id}`)}
          >
            <span className="row between">
              <strong>{loc(task.title)}</strong>
              <span className="chip">
                <span className={task.solved ? "dot read" : "dot"} />
                {task.solved ? t("practice.solved") : t("practice.unsolved")}
              </span>
            </span>
            <span>{task.attempts > 0 ? t("practice.attempts", task.attempts) : " "}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
