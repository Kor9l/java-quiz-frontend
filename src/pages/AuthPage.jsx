import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const [google, setGoogle] = useState(null);
  const [busy, setBusy] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    api.get("/api/auth/providers")
      .then((data) => setGoogle(data.google || { enabled: false }))
      .catch(() => setGoogle({ enabled: false }));
  }, []);

  useEffect(() => {
    const failed = searchParams.get("googleError");
    if (failed) {
      setGoogleMsg(failed);
    }
  }, [searchParams]);

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

  function onGoogle() {
    setGoogleMsg("");
    if (!google?.enabled || !google.authorizationUrl) {
      setGoogleMsg(google?.message || t("auth.googleStub"));
      return;
    }
    // Full page navigation: the OAuth2 redirect flow cannot run inside fetch().
    window.location.assign(google.authorizationUrl);
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
        <button className="btn google" type="button" onClick={onGoogle} disabled={google !== null && !google.enabled}>
          {t("auth.google")}
        </button>
        {googleMsg && <div className="banner">{googleMsg}</div>}
        {google !== null && !google.enabled && <p className="muted">{t("auth.googleStub")}</p>}
        <button className="btn" type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}
        </button>
      </div>
    </div>
  );
}
