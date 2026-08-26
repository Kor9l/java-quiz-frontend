import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { t as translate } from "./i18n";
import { useAuth } from "./AuthContext";

const AppContext = createContext(null);

const defaultSettings = {
  language: "ru",
  selectedTopics: [],
  questionCount: 20,
  infiniteMode: false,
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

  const value = useMemo(() => ({
    settings,
    setSettings,
    lang,
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
  }), [settings, lang]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
