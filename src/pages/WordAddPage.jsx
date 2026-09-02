import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../AppContext";

const EMPTY_ROW = { text: "", translation: "", example: "" };

/**
 * A rejected line arrives as a line number and a code, never as a sentence — the wording is this
 * side's job. A code this build has no wording for still shows the line and the code itself,
 * which beats an empty bullet when the backend is a version ahead.
 */
function rejectedLine(t, error) {
  const key = `english.add.error.${error.code}`;
  const reason = t(key);
  return t("english.add.error.line", error.line, reason === key ? error.code : reason);
}

/** Bulk add: a pasted vocabulary list, or rows typed into a grid. */
export default function WordAddPage() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [groups, setGroups] = useState(null);
  const [mode, setMode] = useState("TEXT");
  const [target, setTarget] = useState("existing");
  const [groupId, setGroupId] = useState("");
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [text, setText] = useState("");
  const [rows, setRows] = useState([{ ...EMPTY_ROW }, { ...EMPTY_ROW }, { ...EMPTY_ROW }]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/api/english/groups")
      .then((loaded) => {
        const writable = loaded.filter((group) => group.editable);
        setGroups(writable);
        // The newest group is the one a paste most often belongs to, and groups come back
        // oldest first, so the last is the better default than the first.
        setGroupId(writable.length ? writable[writable.length - 1].id : "");
        if (!writable.length) {
          setTarget("new");
        }
      })
      .catch(() => setGroups([]));
  }, []);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    const body = { mode };
    if (target === "new") {
      body.newGroupTitle = newGroupTitle;
    } else {
      body.groupId = groupId;
    }
    if (mode === "TEXT") {
      body.text = text;
    } else {
      body.rows = rows;
    }
    try {
      const imported = await api.post("/api/english/words/import", body);
      setResult(imported);
      if (mode === "TEXT") {
        setText("");
      } else {
        setRows([{ ...EMPTY_ROW }, { ...EMPTY_ROW }, { ...EMPTY_ROW }]);
      }
      // A new group only exists once the import lands, so offer it as a target from here on.
      if (target === "new") {
        const reloaded = (await api.get("/api/english/groups")).filter((group) => group.editable);
        setGroups(reloaded);
        setGroupId(imported.groupId);
        setTarget("existing");
        setNewGroupTitle("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const setRow = (index, patch) => setRows(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const targetReady = target === "new" ? newGroupTitle.trim().length > 0 : Boolean(groupId);
  const payloadReady = mode === "TEXT"
    ? text.trim().length > 0
    : rows.some((row) => row.text.trim() || row.translation.trim());

  return (
    <div className="page">
      <div className="row between header-bar">
        <h1>{t("english.add.title")}</h1>
        <button className="btn" onClick={() => navigate("/english/vocabulary")}>{t("common.back")}</button>
      </div>

      {/* Only when something actually landed: a green "0 words added" above a list of rejected
          lines says the opposite of what happened. */}
      {result?.imported > 0 && (
        <div className="banner success" style={{ marginBottom: 16 }}>
          <div>{t("english.add.result", result.imported, result.groupTitle)}</div>
          <button
            className="btn"
            style={{ marginTop: 8 }}
            onClick={() => navigate(`/english/groups/${result.groupId}`)}
          >
            {t("english.add.openGroup")}
          </button>
        </div>
      )}
      {result?.errors?.length > 0 && (
        <div className="banner" style={{ marginBottom: 16 }}>
          <strong>{t("english.add.rejected")}</strong>
          <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
            {result.errors.map((error) => (
              <li key={error.line}>{rejectedLine(t, error)}</li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className="banner danger" style={{ marginBottom: 16 }}>{error}</p>}

      <form className="col" onSubmit={submit}>
        <div className="card">
          <label className="label">{t("english.add.target")}</label>
          <div className="row">
            <label className="check">
              <input
                type="radio"
                checked={target === "existing"}
                disabled={groups?.length === 0}
                onChange={() => setTarget("existing")}
              />
              {t("english.add.target.existing")}
            </label>
            <label className="check">
              <input type="radio" checked={target === "new"} onChange={() => setTarget("new")} />
              {t("english.add.target.new")}
            </label>
          </div>
          <div style={{ marginTop: 10 }}>
            {target === "existing" ? (
              groups?.length === 0
                ? <p className="muted">{t("english.add.noWritableGroup")}</p>
                : (
                  <select className="select" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                    {groups?.map((group) => (
                      <option key={group.id} value={group.id}>{group.title}</option>
                    ))}
                  </select>
                )
            ) : (
              <input
                className="input"
                placeholder={t("english.add.newGroupTitle")}
                value={newGroupTitle}
                onChange={(e) => setNewGroupTitle(e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="card">
          <label className="label">{t("english.add.mode")}</label>
          <div className="row">
            {["TEXT", "TABLE"].map((option) => (
              <label className="check" key={option}>
                <input type="radio" checked={mode === option} onChange={() => setMode(option)} />
                {t(`english.add.mode.${option}`)}
              </label>
            ))}
          </div>

          {mode === "TEXT" ? (
            <div style={{ marginTop: 12 }}>
              <label className="label">{t("english.add.text.label")}</label>
              <textarea
                className="sql-editor"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={"1 definitive — окончательный\n5 * to fade away — угасать\nongoing — текущий"}
              />
              <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>{t("english.add.text.hint")}</p>
            </div>
          ) : (
            <div className="col" style={{ marginTop: 12 }}>
              {rows.map((row, index) => (
                <div className="row" key={index}>
                  <input
                    className="input grow"
                    style={{ minWidth: 160 }}
                    placeholder={t("english.word.text")}
                    value={row.text}
                    onChange={(e) => setRow(index, { text: e.target.value })}
                  />
                  <input
                    className="input grow"
                    style={{ minWidth: 160 }}
                    placeholder={t("english.word.translation")}
                    value={row.translation}
                    onChange={(e) => setRow(index, { translation: e.target.value })}
                  />
                  <input
                    className="input grow"
                    style={{ minWidth: 160 }}
                    placeholder={t("english.word.example")}
                    value={row.example}
                    onChange={(e) => setRow(index, { example: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <button
                  className="btn"
                  type="button"
                  onClick={() => setRows([...rows, { ...EMPTY_ROW }])}
                >
                  {t("english.add.table.addRow")}
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <button className="btn primary" type="submit" disabled={busy || !targetReady || !payloadReady}>
            {busy ? t("english.add.importing") : t("english.add.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
