import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../AppContext";

/** The whole vocabulary, grouped the way the backend already groups it. */
export default function WordsPage() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [groups, setGroups] = useState(null);
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  useEffect(() => {
    api.get("/api/english/words").then(setGroups).catch(() => setGroups([]));
  }, []);

  async function toggleFavorite(wordId) {
    const { favorite } = await api.post(`/api/english/words/${wordId}/favorite`);
    // Patch the one word in place: refetching the whole vocabulary to flip a star would
    // throw away the scroll position along with it.
    setGroups((current) => current.map((group) => ({
      ...group,
      words: group.words.map((word) => (word.id === wordId ? { ...word, favorite } : word)),
    })));
  }

  const filtered = useMemo(() => {
    if (!groups) {
      return null;
    }
    const needle = query.trim().toLowerCase();
    return groups
      .map((group) => ({
        ...group,
        words: group.words.filter((word) => {
          if (favoritesOnly && !word.favorite) {
            return false;
          }
          if (!needle) {
            return true;
          }
          return word.text.toLowerCase().includes(needle)
            || word.translation.toLowerCase().includes(needle);
        }),
      }))
      .filter((group) => group.words.length > 0);
  }, [groups, query, favoritesOnly]);

  const total = groups?.reduce((sum, group) => sum + group.words.length, 0) || 0;
  const shown = filtered?.reduce((sum, group) => sum + group.words.length, 0) || 0;

  return (
    <div className="page">
      <div className="row between header-bar">
        <div>
          <h1>{t("english.words.title")}</h1>
          <p className="muted">{t("english.words.counted", shown, total)}</p>
        </div>
        <button className="btn" onClick={() => navigate("/english/vocabulary")}>{t("common.back")}</button>
      </div>

      <div className="row" style={{ marginBottom: 16 }}>
        <input
          className="input grow"
          style={{ minWidth: 220 }}
          placeholder={t("english.words.search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="check">
          <input
            type="checkbox"
            checked={favoritesOnly}
            onChange={(e) => setFavoritesOnly(e.target.checked)}
          />
          {t("english.words.favoritesOnly")}
        </label>
      </div>

      {groups === null && <p className="muted">{t("common.loading")}</p>}
      {groups?.length === 0 && <p className="muted">{t("english.words.empty")}</p>}
      {groups?.length > 0 && filtered?.length === 0 && (
        <p className="muted">{t("english.words.nothingFound")}</p>
      )}

      <div className="col">
        {filtered?.map((group) => (
          <div className="card" key={group.id}>
            <div className="row between" style={{ marginBottom: 10 }}>
              <h2 style={{ margin: 0 }}>{group.title}</h2>
              <span className="chip">
                {group.owned ? t("english.groups.mine") : t("english.groups.shared")}
              </span>
            </div>
            <div className="col word-list">
              {group.words.map((word) => (
                <div className="word-row" key={word.id}>
                  <button
                    type="button"
                    className={`star${word.favorite ? " on" : ""}`}
                    title={word.favorite ? t("english.words.unstar") : t("english.words.star")}
                    aria-label={word.favorite ? t("english.words.unstar") : t("english.words.star")}
                    onClick={() => toggleFavorite(word.id)}
                  >
                    {word.favorite ? "★" : "☆"}
                  </button>
                  <div className="grow">
                    <div>
                      <strong>{word.text}</strong>
                      <span className="muted"> — {word.translation}</span>
                      {word.isNew && <span className="level junior">{t("english.words.isNew")}</span>}
                    </div>
                    {word.example && <div className="muted word-example">{word.example}</div>}
                  </div>
                  {(word.correctCount > 0 || word.incorrectCount > 0) && (
                    <span className="muted word-score">
                      {t("english.words.score", word.correctCount, word.incorrectCount)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
