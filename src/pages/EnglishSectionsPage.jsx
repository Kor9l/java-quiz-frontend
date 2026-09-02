import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../AppContext";
import SettingsGear from "../SettingsGear";

// Each section reports its own pair of numbers, so each one names the two its hint takes. A
// section the backend grows later still renders - without a hint line.
const HINT_COUNTS = {
  words: (counts) => [counts.groups, counts.words],
  grammar: (counts) => [counts.courses, counts.questions],
};

const ROUTES = {
  words: "/english/vocabulary",
  grammar: "/english/grammar",
};

/** The choice inside the English module: the vocabulary trainer, or the grammar courses. */
export default function EnglishSectionsPage() {
  const { t, loc } = useApp();
  const navigate = useNavigate();
  const [sections, setSections] = useState(null);

  useEffect(() => {
    api.get("/api/modules")
      .then((modules) => {
        const english = modules.find((module) => module.id === "english");
        setSections(english?.sections || []);
      })
      .catch(() => setSections([]));
  }, []);

  return (
    <div className="page">
      <div className="row between header-bar">
        <div>
          <h1>{t("english.title")}</h1>
          <p className="muted">{t("englishSections.subtitle")}</p>
        </div>
        <div className="row">
          <SettingsGear />
          <button className="btn" onClick={() => navigate("/")}>{t("common.back")}</button>
        </div>
      </div>
      {sections === null && <p className="muted">{t("common.loading")}</p>}
      <div className="menu-grid">
        {sections?.filter((section) => ROUTES[section.id]).map((section) => {
          const counts = HINT_COUNTS[section.id];
          return (
            <button
              key={section.id}
              className="btn menu-btn module-btn"
              onClick={() => navigate(ROUTES[section.id])}
            >
              <strong>{loc(section.name)}</strong>
              {counts && (
                <span>{t(`englishSections.hint.${section.id}`, ...counts(section.counts))}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
