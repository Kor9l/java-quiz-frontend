# Java Quiz — frontend

React (Vite) UI for Java Quiz. Talks to the Spring backend at `/api`.

## Dev

Backend must already run on `http://localhost:8080`.

```bash
npm install
npm run dev
```

Open http://localhost:5173 — Vite proxies `/api` to the backend.

## Docker

Do **not** start this project alone. From `../java-quiz-backend`:

```powershell
.\start.ps1
```

Compose builds this image and serves it on http://localhost (port 80), proxying `/api` to the backend container.

## Screens

- Login / register (email + password) and Google sign-in; the button redirects to the backend's
  `/oauth2/authorization/google` and the token comes back on `/auth/callback`. It is disabled when
  the server reports Google as unconfigured.
- Menu, quiz (think → reveal 5 options → answer → explanation), materials, settings, stats
- Admin (role `ADMIN` only): user list and role change
