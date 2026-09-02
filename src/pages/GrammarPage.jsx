import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../AppContext";
import SettingsGear from "../SettingsGear";

/**
 * The grammar half of the English module, mirroring the backend menu a level up. Courses come
 * from the same endpoint the backend topics come from, scoped by module.
 */
export default function GrammarPage() {
  const { t, loc, settings, grammarTrack } = useApp();
  const navigate = useNavigate();
  const [courses, setCourses] = useState(null);

  useEffect(() => {
    api.get("/api/topics?module=english").then(setCourses).catch(() => setCourses([]));
  }, []);

  const list = courses || [];
  const sections = list.reduce((sum, course) => sum + course.sectionCount, 0);
  // A section flagged for re-reading has still been read, so it counts here.
  const read = list.reduce((sum, course) => sum + course.readCount + course.rereadCount, 0);
  const questions = list.reduce((sum, course) => sum + course.questionCount, 0);

  const selected = settings.selectedGrammarCourses || [];
  const active = selected.length ? list.filter((course) => selected.includes(course.id)) : list;
  const courseLabel = selected.length === 0
    ? t("settings.topics.all")
    : active.map((course) => loc(course.name)).join(", ");

  return (
    <div className="page">
      <div className="row between header-bar">
        <div>
          <h1>{t("grammar.title")}</h1>
          <p className="muted">{t("grammar.subtitle")}</p>
        </div>
        <div className="row">
          <SettingsGear />
          <button className="btn" onClick={() => navigate("/english")}>{t("common.back")}</button>
        </div>
      </div>
      {courses === null && <p className="muted">{t("common.loading")}</p>}
      {courses !== null && questions === 0 && (
        <div className="banner">{t("grammar.empty")}</div>
      )}
      <div className="menu-grid">
        <button
          className="btn menu-btn"
          onClick={() => navigate("/english/grammar/quiz/setup")}
          disabled={questions === 0}
        >
          <strong>
            {t("menu.start")}
            <span className={`level ${grammarTrack.toLowerCase()}`}>{t(`level.${grammarTrack}`)}</span>
          </strong>
          <span>
            {t("menu.start.hint",
              settings.grammarInfiniteMode ? "∞" : settings.grammarQuestionCount,
              courseLabel || "—")}
          </span>
        </button>
        <button
          className="btn menu-btn"
          onClick={() => navigate("/english/grammar/materials")}
          disabled={sections === 0}
        >
          <strong>{t("menu.materials")}</strong>
          <span>{t("menu.materials.hint", read, sections)}</span>
        </button>
      </div>
      {list.length > 0 && (
        <div className="card col" style={{ marginTop: 12 }}>
          <h3>{t("grammar.courses")}</h3>
          {list.map((course) => (
            <button
              key={course.id}
              className="tree-item"
              onClick={() => navigate(`/english/grammar/materials/${course.id}/${course.sections[0]?.id}`)}
            >
              {loc(course.name)}
              <span className={`level ${course.sections[0]?.level?.toLowerCase() || ""}`}>
                {course.sections[0]?.level ? t(`level.${course.sections[0].level}`) : ""}
              </span>
              <span className="muted">
                {" "}
                {t("grammar.course.hint", course.sectionCount, course.questionCount)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
