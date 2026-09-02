# Hussaini Automations — Landing Page + Project Manager

Three things live here:

- **`public/index.html`** — the public landing page.
- **`public/projects.json`** — the data behind the "Selected Work" section. The page fetches this file at load time.
- **`/project-manager`** (password-protected) — a simple form for adding, editing, and reordering projects. Anyone with the password can use it to generate an updated `projects.json`.

Auth, `api/`, and `lib/` power the password gate — you shouldn't need to touch those day-to-day.

---

## 1. Deploy it

**Push to GitHub**

```
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin <your-empty-github-repo-url>
git push -u origin main
```

**Import into Vercel**

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo.
2. Vercel will detect it as a plain static + serverless project — no build command needed, leave those fields as-is.
3. Before your first deploy (or right after), set environment variables: **Project → Settings → Environment Variables**:

   | Name | Value |
   |---|---|
   | `ADMIN_PASSWORD` | the password your employee(s) will use to sign in |
   | `SESSION_SECRET` | a long random string — generate one with `openssl rand -hex 32` |

   Add both to **Production**, **Preview**, and **Development** environments.
4. Deploy. Once it's live, your site is at `https://your-project.vercel.app`, and the project manager is at `https://your-project.vercel.app/project-manager`.

You can later attach your own domain in **Project → Settings → Domains** — that's what your business card QR code should point to.

---

## 2. Share the project manager with your employee

Give them:
- The URL: `https://your-domain.com/project-manager`
- The password (the `ADMIN_PASSWORD` value — share it out of band, e.g. WhatsApp/in person, not over email if you can help it)

They don't need GitHub, Vercel, or any code knowledge for day-to-day use.

## 3. How updating a project actually works

1. They open `/project-manager` and sign in.
2. They fill in the form for a new (or edited) project — name, client, description, tags, testimonial, screenshot — and click **Add to List** (or **Save Changes** if editing).
3. Once the list looks right, they click **Download projects.json**.
4. That file needs to replace `public/projects.json` in the GitHub repo. Two ways to do this, easiest first:
   - **No git needed:** on GitHub.com, open the repo → `public/projects.json` → the pencil (edit) icon → delete the contents → paste in the new file's contents → commit directly to `main`. Vercel redeploys automatically within about a minute.
   - **With git:** replace the local file and `git add . && git commit -m "Update projects" && git push`.

Either way, no code changes, no redesign — the page just re-renders with whatever is in `projects.json`.

---

## 4. Security notes

- The password is never stored in the repo — it lives only in Vercel's environment variables.
- Signing in sets a signed, `HttpOnly` session cookie valid for 7 days; there's a **Log out** button in the top bar of the project manager.
- If your employee ever leaves or you want to rotate the password, just change `ADMIN_PASSWORD` in Vercel and redeploy (or trigger a redeploy from the dashboard) — it takes effect immediately and any existing sessions signed with the old `SESSION_SECRET` stay valid only if you don't also change that; change both together for a hard reset.
- There's no rate limiting on login attempts. For a small internal tool this is a reasonable tradeoff, but if you want to harden it further later, that's a natural next addition.

---

## 5. Local development (optional)

```
npm i -g vercel
vercel dev
```

Copy `.env.example` to `.env.local` and fill in real values first, since `vercel dev` reads env vars from there.
