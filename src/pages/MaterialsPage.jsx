import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { api } from "../api";
import { useApp } from "../AppContext";

function Dot({ state }) {
  const cls = state === "READ" ? "dot read" : state === "NEEDS_REREAD" ? "dot reread" : "dot";
  return <span className={cls} />;
}

// A native <option> cannot hold the coloured dot, so the dropdown marks read state with a glyph;
// the legend pairs each glyph with its dot.
const MARK = { UNREAD: "○", READ: "✓", NEEDS_REREAD: "↻" };

function Level({ level, label }) {
  if (!level) {
    return null;
  }
  return <span className={`level ${level.toLowerCase()}`} title={label}>{label}</span>;
}

/**
 * Serves both modules. The tree, the read state and the article are the same shape either way -
 * only which topics to ask for and where "back" leads differ, so those are the props.
 */
export default function MaterialsPage({ module = "backend" }) {
  const english = module === "english";
  const topicsPath = english ? "/api/topics?module=english" : "/api/topics";
  const home = english ? "/english/grammar" : "/backend";
  const materialsHome = english ? "/english/grammar/materials" : "/materials";
  const { t, loc, aboveTrack } = useApp();
  const navigate = useNavigate();
  const params = useParams();
  const [topics, setTopics] = useState([]);
  const [topicId, setTopicId] = useState(params.topicId || "");
  const [sectionId, setSectionId] = useState(params.sectionId || "");
  const [material, setMaterial] = useState(null);

  async function reloadTopics() {
    const data = await api.get(topicsPath);
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

  const currentTopic = topics.find((topic) => topic.id === topicId);

  function pickSection(nextTopicId, nextSectionId) {
    setTopicId(nextTopicId);
    setSectionId(nextSectionId);
    navigate(`${materialsHome}/${nextTopicId}/${nextSectionId}`, { replace: true });
  }

  // A new topic opens on its first section, so the article never shows one topic under another's
  // name.
  function pickTopic(nextTopicId) {
    const first = topics.find((topic) => topic.id === nextTopicId)?.sections?.[0];
    if (first) {
      pickSection(nextTopicId, first.id);
    }
  }

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
        <button className="btn" onClick={() => navigate(home)}>{t("common.back")}</button>
      </div>
      <p className="muted" style={{ marginBottom: 12 }}>
        <Dot state="UNREAD" /> {MARK.UNREAD} {t("materials.state.unread")} &nbsp;
        <Dot state="READ" /> {MARK.READ} {t("materials.state.read")} &nbsp;
        <Dot state="NEEDS_REREAD" /> {MARK.NEEDS_REREAD} {t("materials.state.reread")}
      </p>
      <div className="col">
        <div className="card materials-picker">
          <label>
            <span className="label">{t("materials.topic")}</span>
            <select className="select" value={topicId} onChange={(e) => pickTopic(e.target.value)}>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {loc(topic.name)} ({topic.readCount + topic.rereadCount}/{topic.sectionCount})
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">{t("materials.section")}</span>
            <select className="select" value={sectionId} onChange={(e) => pickSection(topicId, e.target.value)}>
              {(currentTopic?.sections || []).map((section) => (
                <option
                  key={section.id}
                  value={section.id}
                  // Marked rather than hidden: the section is still readable, and the reader may
                  // already have progress on it.
                  title={aboveTrack(section.level, module) ? t("materials.level.above") : undefined}
                >
                  {MARK[section.readState] || MARK.UNREAD} {loc(section.title)}
                  {section.level ? ` · ${t(`level.${section.level}`)}` : ""}
                  {aboveTrack(section.level, module) ? ` (${t("materials.level.above")})` : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="card">
          {!material && <p className="muted">{t("materials.empty")}</p>}
          {material && (
            <div className="col">
              <div className="row">
                <h2>{loc(material.title)}</h2>
                <Level level={material.level} label={t(`level.${material.level}`)} />
              </div>
              <p className="muted">
                {topics.find((topic) => topic.id === material.topicId)
                  ? `${loc(topics.find((topic) => topic.id === material.topicId).name)} · ` : ""}
                {t("materials.estimated", material.estimatedMinutes)} · {t("materials.questionCount", material.questionCount)}
                {aboveTrack(material.level, module) ? ` · ${t("materials.level.above")}` : ""}
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
                  state: {
                    start: {
                      module, topicIds: [topicId], sectionId, targetCount: 10, infinite: false,
                    },
                  },
                })}>{t("materials.practice")}</button>
                {material.practiceTaskCount > 0 && (
                  <button className="btn" onClick={() => navigate(`/practice/${material.practiceTrack}`)}>
                    {t("materials.practiceTasks", material.practiceTaskCount)}
                  </button>
                )}
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
