import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { t as translate } from "./i18n";
import { useAuth } from "./AuthContext";

const AppContext = createContext(null);

// Career tracks, weakest first. Cumulative: a track draws on its own level and everything
// below it, which is why the index in this array is the whole comparison.
export const LEVELS = ["JUNIOR", "MIDDLE", "SENIOR"];

// The English ladder. Same three rungs and the same cumulative rule, different words, because
// it grades command of a language rather than a career - "junior English" means nothing. Kept
// as a separate array so an index is never compared across the two.
export const GRAMMAR_LEVELS = ["BASE", "INTERMEDIATE", "PRO"];

export function levelsFor(module) {
  return module === "english" ? GRAMMAR_LEVELS : LEVELS;
}

const defaultSettings = {
  language: "ru",
  level: "MIDDLE",
  selectedTopics: [],
  questionCount: 20,
  infiniteMode: false,
  // The grammar quiz remembers its own setup, the way the word quiz does. One shared slot
  // would have a grammar round overwriting the backend track the learner chose.
  grammarLevel: "BASE",
  selectedGrammarCourses: [],
  grammarQuestionCount: 20,
  grammarInfiniteMode: false,
  shuffleOptions: true,
  smartSelection: true,
  showExplanation: true,
  darkTheme: true,
};

export function AppStateProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    if (!user) {
      setSettings(defaultSettings);
      return;
    }
    api.get("/api/settings")
      .then((data) => setSettings({ ...defaultSettings, ...data }))
      .catch(() => setSettings(defaultSettings));
  }, [user]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.darkTheme ? "dark" : "light";
  }, [settings.darkTheme]);

  const lang = settings.language === "en" ? "en" : "ru";
  const track = LEVELS.includes(settings.level) ? settings.level : "MIDDLE";
  const grammarTrack = GRAMMAR_LEVELS.includes(settings.grammarLevel) ? settings.grammarLevel : "BASE";

  const value = useMemo(() => ({
    settings,
    setSettings,
    lang,
    track,
    // The API reports section levels but never filters them out, so the UI labels what sits
    // above the reader instead of hiding it — hiding would hide their progress on it too.
    aboveTrack: (level) => LEVELS.indexOf(level) > LEVELS.indexOf(track),
    t: (key, ...args) => translate(lang, key, ...args),
    loc: (text) => {
      if (!text) return "";
      if (typeof text === "string") return text;
      return text[lang] || text.ru || text.en || "";
    },
    async saveSettings(next) {
      const saved = await api.put("/api/settings", next);
      setSettings({ ...defaultSettings, ...saved });
      return saved;
    },
  }), [settings, lang, track, grammarTrack]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
