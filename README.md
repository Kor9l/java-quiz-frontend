# Java Quiz — frontend

React (Vite) UI for Java Quiz. Talks to the Spring backend at `/api`, on the origin given by
`VITE_API_BASE` — empty in dev and under Docker, where a proxy sits in front of the API.

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

## Deploy (Render)

Unlike the Docker setup there is no proxy in production: the bundle calls the backend
directly, cross-origin, so this site's origin must also be listed in the backend's
`CORS_ORIGINS`, and in its `APP_FRONTEND_URL` for the Google redirect to land here.

1. **Render** — *New → Blueprint*, pointed at this repo. [`render.yaml`](render.yaml) declares a
   free static site; nothing has to be entered in the dashboard, because `VITE_API_BASE` lives in
   the blueprint rather than behind `sync: false`. Render prints the assigned URL —
   `https://java-quiz-frontend.onrender.com` unless the name was taken and it appended a suffix.
   Whatever it prints is what goes into the backend's `CORS_ORIGINS` and `APP_FRONTEND_URL`.
2. **GitHub** — *Settings → Secrets and variables → Actions*, add the secret
   `RENDER_DEPLOY_HOOK` (Render → site → *Settings → Deploy Hook*).

Every push to `master` then runs [the workflow](.github/workflows/deploy.yml): `npm run build`
first as a gate, and the deploy hook only on success. Render's own auto-deploy is off in
`render.yaml`, so a red build never reaches production. Pull requests build without deploying.

The build that ships is Render's, not the workflow's — the workflow only proves the commit
compiles. `VITE_API_BASE` is baked into the bundle at build time, so pointing the UI at a
different backend means editing `render.yaml` and redeploying, not flipping a runtime setting.

SPA routing is the one thing that did not carry over from Cloudflare: `public/_redirects` was a
Pages file. Render reads the same rule from the `routes` block in `render.yaml`.

## Screens

Signing in lands on a choice of two modules — **Бэкэнд** and **Английский** — read from
`/api/modules`. The backend menu that used to be the home page now sits at `/backend`, and every
screen under it comes back there rather than to `/`.

- Login / register (email + password) and Google sign-in; the button redirects to the backend's
  `/oauth2/authorization/google` and the token comes back on `/auth/callback`. It is disabled when
  the server reports Google as unconfigured.
- Module chooser (`/`), then the backend menu (`/backend`): quiz (think → reveal 5 options →
  answer → explanation), materials, settings, stats
- Practice → SQL → difficulty → task. The task screen shows the dataset schema, the statement
  and the result being aimed at; you write a query, run it, and the backend compares your rows
  with the reference solution's. Any query producing the same result counts as correct.
  SQL articles and exercises link to each other: a task offers the section it drills, and a
  section offers its exercises alongside its quiz.
- English (`/english`): the vocabulary. `/english/words` lists every word the learner can reach,
  grouped, with a search box, a favourites filter and a star per word. `/english/groups` lists the
  groups and creates new ones; opening one edits its words in place. `/english/add` bulk-adds,
  either from a pasted list or from typed rows, into an existing group or a new one.

  What a learner may change is the backend's call, not this UI's: a group arrives with an
  `editable` flag, and a read-only group renders as a plain list with no controls on it. Shared
  groups are read-only for everyone but admins; your own are always yours.
- Admin (role `ADMIN` only): user list and role change
