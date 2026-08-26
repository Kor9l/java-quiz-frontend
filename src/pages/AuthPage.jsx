import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../AppContext";
import { useAuth } from "../AuthContext";

export default function AuthPage() {
  const { t } = useApp();
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [googleMsg, setGoogleMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, displayName);
      }
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || t("auth.error"));
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setGoogleMsg("");
    try {
      await api.post("/api/auth/google", { idToken: "" });
    } catch (err) {
      setGoogleMsg(err.message || t("auth.googleStub"));
    }
  }

  return (
    <div className="page" style={{ maxWidth: 440 }}>
      <h1>{t("app.title")}</h1>
      <p className="subtitle">{t("app.subtitle")}</p>
      <div className="card col">
        <h2>{mode === "login" ? t("auth.login") : t("auth.register")}</h2>
        <form className="col" onSubmit={onSubmit}>
          {mode === "register" && (
            <div>
              <label className="label">{t("auth.displayName")}</label>
              <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
          )}
          <div>
            <label className="label">{t("auth.email")}</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">{t("auth.password")}</label>
            <input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <div className="error">{error}</div>}
          <button className="btn primary" type="submit" disabled={busy}>
            {mode === "login" ? t("auth.submitLogin") : t("auth.submitRegister")}
          </button>
        </form>
        <button className="btn google" type="button" onClick={onGoogle}>
          {t("auth.google")}
        </button>
        {googleMsg && <div className="banner">{googleMsg}</div>}
        <p className="muted">{t("auth.googleStub")}</p>
        <button className="btn" type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}
        </button>
      </div>
    </div>
  );
}
