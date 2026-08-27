# Java Quiz — frontend

React (Vite) UI for Java Quiz. Talks to the Spring backend at `/api`.

## Dev

Backend must already run on `http://localhost:8080`.

```bash
npm install
npm run dev
```

Open http://localhost:5173 — Vite proxies `/api` to the backend. Set `VITE_PROXY_TARGET` to
point the proxy somewhere other than `:8080`.

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
- Practice → SQL → difficulty → task. The task screen shows the dataset schema, the statement
  and the result being aimed at; you write a query, run it, and the backend compares your rows
  with the reference solution's. Any query producing the same result counts as correct.
  SQL articles and exercises link to each other: a task offers the section it drills, and a
  section offers its exercises alongside its quiz.
- Admin (role `ADMIN` only): user list and role change
