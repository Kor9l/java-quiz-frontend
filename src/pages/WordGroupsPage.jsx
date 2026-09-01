import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../AppContext";

export default function WordGroupsPage() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [groups, setGroups] = useState(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function reload() {
    setGroups(await api.get("/api/english/groups"));
  }

  useEffect(() => {
    reload().catch(() => setGroups([]));
  }, []);

  async function create(event) {
    event.preventDefault();
    if (!title.trim()) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await api.post("/api/english/groups", { title: title.trim() });
      setTitle("");
      navigate(`/english/groups/${created.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="row between header-bar">
        <h1>{t("english.groups.title")}</h1>
        <button className="btn" onClick={() => navigate("/english")}>{t("common.back")}</button>
      </div>

      <form className="card row" onSubmit={create} style={{ marginBottom: 16 }}>
        <input
          className="input grow"
          style={{ minWidth: 200 }}
          placeholder={t("english.groups.create.placeholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="btn primary" type="submit" disabled={saving || !title.trim()}>
          {t("english.groups.create")}
        </button>
      </form>
      {error && <p className="banner danger" style={{ marginBottom: 16 }}>{error}</p>}

      {groups === null && <p className="muted">{t("common.loading")}</p>}
      {groups?.length === 0 && <p className="muted">{t("english.groups.empty")}</p>}

      <div className="col">
        {groups?.map((group) => (
          <button
            key={group.id}
            className="btn menu-btn"
            onClick={() => navigate(`/english/groups/${group.id}`)}
          >
            <strong>
              {group.title}
              <span className={`level ${group.owned ? "junior" : "middle"}`}>
                {group.owned ? t("english.groups.mine") : t("english.groups.shared")}
              </span>
              {!group.editable && <span className="level senior">{t("english.groups.readonly")}</span>}
            </strong>
            <span>{t("english.groups.words", group.wordCount)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
