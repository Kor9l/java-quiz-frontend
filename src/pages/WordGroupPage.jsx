import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../AppContext";

const EMPTY_WORD = { text: "", translation: "", example: "", isNew: false };

/**
 * One group, with its words. Read-only for a shared group unless the caller is an admin —
 * the backend decides that and reports it as `editable`, so this page only has to obey it.
 */
export default function WordGroupPage() {
  const { t } = useApp();
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [title, setTitle] = useState("");
  const [draft, setDraft] = useState(EMPTY_WORD);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(EMPTY_WORD);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);

  async function reload() {
    const loaded = await api.get(`/api/english/groups/${groupId}`);
    setGroup(loaded);
    setTitle(loaded.title);
    return loaded;
  }

  useEffect(() => {
    reload().catch(() => setGroup(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  async function run(action, message) {
    setError(null);
    try {
      await action();
      await reload();
      setNotice(message || null);
    } catch (err) {
      setError(err.message);
    }
  }

  function rename(event) {
    event.preventDefault();
    run(() => api.patch(`/api/english/groups/${groupId}`, { title }), t("english.group.saved"));
  }

  function addWord(event) {
    event.preventDefault();
    if (!draft.text.trim() || !draft.translation.trim()) {
      setError(t("english.word.required"));
      return;
    }
    run(async () => {
      await api.post(`/api/english/groups/${groupId}/words`, draft);
      setDraft(EMPTY_WORD);
    });
  }

  function saveEdit(event) {
    event.preventDefault();
    if (!editDraft.text.trim() || !editDraft.translation.trim()) {
      setError(t("english.word.required"));
      return;
    }
    run(async () => {
      await api.put(`/api/english/words/${editingId}`, editDraft);
      setEditingId(null);
    });
  }

  function removeWord(word) {
    if (!window.confirm(t("english.word.delete.confirm", word.text))) {
      return;
    }
    run(() => api.del(`/api/english/words/${word.id}`));
  }

  function removeGroup() {
    if (!window.confirm(t("english.group.delete.confirm", group.title, group.words.length))) {
      return;
    }
    api.del(`/api/english/groups/${groupId}`)
      .then(() => navigate("/english/groups"))
      .catch((err) => setError(err.message));
  }

  if (group === false) {
    return (
      <div className="page">
        <div className="row between header-bar">
          <h1>{t("english.groups.title")}</h1>
          <button className="btn" onClick={() => navigate("/english/groups")}>{t("common.back")}</button>
        </div>
        <p className="muted">{t("english.groups.empty")}</p>
      </div>
    );
  }
  if (group === null) {
    return <div className="page muted">{t("common.loading")}</div>;
  }

  return (
    <div className="page">
      <div className="row between header-bar">
        <div>
          <h1>{group.title}</h1>
          <p className="muted">{t("english.groups.words", group.words.length)}</p>
        </div>
        <button className="btn" onClick={() => navigate("/english/groups")}>{t("common.back")}</button>
      </div>

      {notice && <p className="banner success" style={{ marginBottom: 16 }}>{notice}</p>}
      {error && <p className="banner danger" style={{ marginBottom: 16 }}>{error}</p>}

      {group.editable && (
        <form className="card" onSubmit={rename} style={{ marginBottom: 16 }}>
          <label className="label" htmlFor="group-title">{t("english.group.rename")}</label>
          <div className="row">
            <input
              id="group-title"
              className="input grow"
              style={{ minWidth: 200 }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button className="btn primary" type="submit" disabled={!title.trim()}>
              {t("common.save")}
            </button>
            <button className="btn danger" type="button" onClick={removeGroup}>
              {t("english.group.delete")}
            </button>
          </div>
        </form>
      )}

      {group.editable && (
        <form className="card" onSubmit={addWord} style={{ marginBottom: 16 }}>
          <h2>{t("english.group.addWord")}</h2>
          <WordFields value={draft} onChange={setDraft} t={t} />
          <button className="btn primary" type="submit" style={{ marginTop: 12 }}>
            {t("english.word.add")}
          </button>
        </form>
      )}

      {group.words.length === 0 && <p className="muted">{t("english.group.empty")}</p>}

      <div className="col">
        {group.words.map((word) => (
          <div className="card" key={word.id}>
            {editingId === word.id ? (
              <form onSubmit={saveEdit}>
                <WordFields value={editDraft} onChange={setEditDraft} t={t} />
                <div className="row" style={{ marginTop: 12 }}>
                  <button className="btn primary" type="submit">{t("common.save")}</button>
                  <button className="btn" type="button" onClick={() => setEditingId(null)}>
                    {t("common.cancel")}
                  </button>
                </div>
              </form>
            ) : (
              <div className="row between">
                <div className="grow">
                  <div>
                    <strong>{word.text}</strong>
                    <span className="muted"> — {word.translation}</span>
                    {word.isNew && <span className="level junior">{t("english.words.isNew")}</span>}
                  </div>
                  {word.example && <div className="muted word-example">{word.example}</div>}
                </div>
                {group.editable && (
                  <div className="row">
                    <button
                      className="btn"
                      onClick={() => {
                        setEditingId(word.id);
                        setEditDraft({
                          text: word.text,
                          translation: word.translation,
                          example: word.example || "",
                          isNew: word.isNew,
                        });
                      }}
                    >
                      {t("english.word.edit")}
                    </button>
                    <button className="btn danger" onClick={() => removeWord(word)}>
                      {t("english.word.delete")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function WordFields({ value, onChange, t }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <div className="col">
      <div className="row">
        <div className="grow" style={{ minWidth: 200 }}>
          <label className="label">{t("english.word.text")}</label>
          <input className="input" value={value.text} onChange={(e) => set({ text: e.target.value })} />
        </div>
        <div className="grow" style={{ minWidth: 200 }}>
          <label className="label">{t("english.word.translation")}</label>
          <input
            className="input"
            value={value.translation}
            onChange={(e) => set({ translation: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="label">{t("english.word.example")}</label>
        <input className="input" value={value.example} onChange={(e) => set({ example: e.target.value })} />
      </div>
      <label className="check">
        <input type="checkbox" checked={value.isNew} onChange={(e) => set({ isNew: e.target.checked })} />
        {t("english.word.isNew")}
      </label>
    </div>
  );
}
