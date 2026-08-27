import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../AppContext";
import { useAuth } from "../AuthContext";

/**
 * Landing spot for the Google redirect. The backend puts the JWT in the URL fragment,
 * so it never reaches a server log; we consume it and clean the address bar.
 */
export default function OAuthCallbackPage() {
  const { t } = useApp();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const consumed = useRef(false);

  useEffect(() => {
    if (consumed.current) {
      return;
    }
    consumed.current = true;

    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = params.get("token");
    window.history.replaceState(null, "", window.location.pathname);

    if (!token) {
      setError(t("auth.error"));
      return;
    }
    loginWithToken(token)
      .then(() => navigate("/", { replace: true }))
      .catch((err) => setError(err.message || t("auth.error")));
  }, [loginWithToken, navigate, t]);

  if (error) {
    return (
      <div className="page" style={{ maxWidth: 440 }}>
        <div className="card col">
          <div className="error">{error}</div>
          <button className="btn" type="button" onClick={() => navigate("/login", { replace: true })}>
            {t("auth.login")}
          </button>
        </div>
      </div>
    );
  }
  return <div className="page muted">…</div>;
}
