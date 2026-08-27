import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { api } from "../api";
import { useApp } from "../AppContext";

function Dot({ state }) {
  const cls = state === "READ" ? "dot read" : state === "NEEDS_REREAD" ? "dot reread" : "dot";
  return <span className={cls} />;
}

export default function MaterialsPage() {
  const { t, loc } = useApp();
  const navigate = useNavigate();
  const params = useParams();
  const [topics, setTopics] = useState([]);
  const [topicId, setTopicId] = useState(params.topicId || "");
  const [sectionId, setSectionId] = useState(params.sectionId || "");
  const [material, setMaterial] = useState(null);

  async function reloadTopics() {
    const data = await api.get("/api/topics");
    setTopics(data);
    if (!topicId && data[0]?.sections?.[0]) {
      setTopicId(data[0].id);
      setSectionId(data[0].sections[0].id);
    }
  }

  useEffect(() => {
    reloadTopics().catch(() => setTopics([]));
  }, []);

  useEffect(() => {
    if (params.topicId) setTopicId(params.topicId);
    if (params.sectionId) setSectionId(params.sectionId);
  }, [params.topicId, params.sectionId]);

  useEffect(() => {
    if (!topicId || !sectionId) {
      setMaterial(null);
      return;
    }
    api.get(`/api/materials/${topicId}/${sectionId}`)
      .then(setMaterial)
      .catch(() => setMaterial(null));
  }, [topicId, sectionId]);

  const total = topics.reduce((sum, topic) => sum + topic.sectionCount, 0);
  // Sections flagged for re-reading are read too — the desktop counts them the same way.
  const read = topics.reduce((sum, topic) => sum + topic.readCount + topic.rereadCount, 0);

  async function mark(readFlag) {
    const path = readFlag ? "read" : "unread";
    await api.post(`/api/progress/${topicId}/${sectionId}/${path}`);
    const updated = await api.get(`/api/materials/${topicId}/${sectionId}`);
    setMaterial(updated);
    await reloadTopics();
  }

  return (
    <div className="page">
      <div className="row between header-bar">
        <div>
          <h1>{t("materials.title")}</h1>
          <p className="muted">{t("materials.progress", read, total)}</p>
        </div>
        <button className="btn" onClick={() => navigate("/")}>{t("common.back")}</button>
      </div>
      <p className="muted" style={{ marginBottom: 12 }}>
        <Dot state="UNREAD" /> {t("materials.state.unread")} &nbsp;
        <Dot state="READ" /> {t("materials.state.read")} &nbsp;
        <Dot state="NEEDS_REREAD" /> {t("materials.state.reread")}
      </p>
      <div className="layout-split">
        <div className="card">
          <h3>{t("materials.tree")}</h3>
          {topics.map((topic) => (
            <div key={topic.id} style={{ marginBottom: 10 }}>
              <strong>{loc(topic.name)}</strong>
              {topic.sections.map((section) => (
                <button
                  key={section.id}
                  className={`tree-item ${topic.id === topicId && section.id === sectionId ? "active" : ""}`}
                  onClick={() => {
                    setTopicId(topic.id);
                    setSectionId(section.id);
                    navigate(`/materials/${topic.id}/${section.id}`, { replace: true });
                  }}
                >
                  <Dot state={section.readState} /> {loc(section.title)}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="card">
          {!material && <p className="muted">{t("materials.empty")}</p>}
          {material && (
            <div className="col">
              <h2>{loc(material.title)}</h2>
              <p className="muted">
                {topics.find((topic) => topic.id === material.topicId)
                  ? `${loc(topics.find((topic) => topic.id === material.topicId).name)} · ` : ""}
                {t("materials.estimated", material.estimatedMinutes)} · {t("materials.questionCount", material.questionCount)}
              </p>
              {material.readState === "NEEDS_REREAD" && (
                <div className="banner">
                  {t("materials.rereadHint")}
                  {material.wrongSinceRead > 0 ? ` (${t("materials.wrongSince", material.wrongSinceRead)})` : ""}
                </div>
              )}
              <div className="row">
                {material.readState === "UNREAD"
                  ? <button className="btn primary" onClick={() => mark(true)}>{t("materials.markRead")}</button>
                  : <button className="btn" onClick={() => mark(false)}>{t("materials.markUnread")}</button>}
                {material.readState === "NEEDS_REREAD" && (
                  <button className="btn" onClick={() => mark(true)}>{t("materials.markRead")}</button>
                )}
                <button className="btn" onClick={() => navigate("/quiz", {
                  state: { start: { topicIds: [topicId], sectionId, targetCount: 10, infinite: false } },
                })}>{t("materials.practice")}</button>
              </div>
              <div className="markdown">
                <ReactMarkdown>{loc(material.body)}</ReactMarkdown>
              </div>
              {material.sources?.length > 0 && (
                <div>
                  <h3>{t("materials.sources")}</h3>
                  <ul>
                    {material.sources.map((source) => (
                      <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
