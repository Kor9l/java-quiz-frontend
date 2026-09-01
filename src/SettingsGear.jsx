import { useNavigate } from "react-router-dom";
import { useApp } from "./AppContext";

/**
 * Language and theme, one click away from wherever you are. Everything else that used to sit
 * on the settings screen belongs to a quiz and is chosen when one starts.
 */
export default function SettingsGear() {
  const { t } = useApp();
  const navigate = useNavigate();
  return (
    <button
      className="btn icon-btn"
      title={t("settings.title")}
      aria-label={t("settings.title")}
      onClick={() => navigate("/settings")}
    >
      ⚙
    </button>
  );
}
