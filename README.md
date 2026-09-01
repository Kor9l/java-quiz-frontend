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
- Practice → track → difficulty → task, on two tracks that share one screen. **SQL** shows the
  dataset schema, the statement and the result being aimed at; you write a query, run it, and the
  backend compares your rows with the reference solution's. **Java** shows the class you have to
  write and the calls it will be graded by — the calls are the specification, so they are listed
  rather than hidden — and you write a class that is compiled and run. Either way, anything
  producing the same result counts as correct.

  Only four things differ between the tracks, and they live in one `TRACKS` table at the top of
  `PracticeTaskPage`: which field the starter comes from, which field the submission is posted
  in, whether the editor indents after a brace, and a handful of labels. Everything else — the
  statement, the hint, the outcome banner, the explanation, the sources — is the same screen.

  Java answers carry two things SQL ones do not. **Compiler diagnostics** come back with a line
  and a column and are shown against the learner's own source, with the offending line numbers
  marked in the editor's gutter; a diagnostic the backend flags as *not* in the submission means
  the class does not have the shape the calls need, and is shown without a position, because it
  points at generated code the learner cannot see. And a run is reported **call by call** rather
  than as a table: what each call returned, what it should have returned, and anything it
  printed, so the one that disagreed is the one that stands out.

  Articles and exercises link to each other on both tracks: a task offers the section it drills,
  and a section offers its exercises alongside its quiz.

  The editor is a textarea with a line-number gutter, `Tab` for indent and `Enter` keeping the
  indentation it was on — not a real code editor. CodeMirror is a heavier dependency than this
  whole bundle, and the gutter only exists because a Java diagnostic arrives as a line number and
  has to be findable.
- English (`/english`): the vocabulary. `/english/words` lists every word the learner can reach,
  grouped, with a search box, a favourites filter and a star per word. `/english/groups` lists the
  groups and creates new ones; opening one edits its words in place. `/english/add` bulk-adds,
  either from a pasted list or from typed rows, into an existing group or a new one.

  What a learner may change is the backend's call, not this UI's: a group arrives with an
  `editable` flag, and a read-only group renders as a plain list with no controls on it. Shared
  groups are read-only for everyone but admins; your own are always yours.

  A line a bulk import could not read comes back as a line number and a code
  (`MISSING_SEPARATOR`, `EMPTY_SIDE`, `MISSING_FIELDS`), never as a sentence — the wording lives
  in `english.add.error.*` here, because only this side knows the reader's language. A code this
  build has no wording for still renders, as the line number and the bare code.
- Admin (role `ADMIN` only): user list and role change
