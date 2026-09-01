const TOKEN_KEY = "java-quiz-token";

// In production the static build and the API sit on different origins, so requests need an
// absolute base. Left empty in dev, where Vite proxies /api to the local backend.
const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

const PUBLIC_PATHS = ["/api/auth/login", "/api/auth/register", "/api/auth/providers"];

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  // An expired or revoked token would otherwise leave every screen showing an error
  // banner; drop it and let the router show the login page instead.
  if (response.status === 401 && token && !PUBLIC_PATHS.includes(path)) {
    setToken(null);
    if (window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
  }
  if (response.status === 204) {
    return null;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.body = data;
    throw error;
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  del: (path) => request(path, { method: "DELETE" }),
};
