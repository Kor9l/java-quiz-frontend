# Java Quiz — frontend

React (Vite) UI for Java Quiz. Talks to the Spring backend at `/api`, on the origin given by
`VITE_API_BASE` — empty in dev and under Docker, where a proxy sits in front of the API.

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

## Deploy (Cloudflare Pages)

Unlike the Docker setup there is no proxy in production: the bundle calls the Render backend
directly, cross-origin, so that origin must also be listed in the backend's `CORS_ORIGINS`.

1. Create the Pages project once, from a machine with `wrangler` logged in:

   ```bash
   npx wrangler pages project create java-quiz --production-branch=master
   ```

2. In *Settings → Secrets and variables → Actions* of this repo add

   - variable `VITE_API_BASE` — `https://<service>.onrender.com` (see [`.env.example`](.env.example))
   - secret `CLOUDFLARE_API_TOKEN` — token with the *Cloudflare Pages: Edit* permission
   - secret `CLOUDFLARE_ACCOUNT_ID`

Every push to `master` then builds and publishes through
[the workflow](.github/workflows/deploy.yml); pull requests build without publishing.

`VITE_API_BASE` is baked into the bundle at build time, so pointing the UI at a different backend
means re-running the workflow, not flipping a runtime setting.

## Screens

- Login / register (email + password) and Google sign-in; the button redirects to the backend's
  `/oauth2/authorization/google` and the token comes back on `/auth/callback`. It is disabled when
  the server reports Google as unconfigured.
- Menu, quiz (think → reveal 5 options → answer → explanation), materials, settings, stats
- Admin (role `ADMIN` only): user list and role change
