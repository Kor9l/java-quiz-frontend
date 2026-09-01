import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../AppContext";

/** The English module's own menu, mirroring the backend one a level up. */
export default function EnglishPage() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [groups, setGroups] = useState(null);

  useEffect(() => {
    api.get("/api/english/groups").then(setGroups).catch(() => setGroups([]));
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
        <button className="btn" onClick={() => navigate("/")}>{t("common.back")}</button>
      </div>
      {groups === null && <p className="muted">{t("common.loading")}</p>}
      <div className="menu-grid">
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
