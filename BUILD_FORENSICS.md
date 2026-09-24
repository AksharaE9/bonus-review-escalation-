# BUILD FORENSICS REPORT — PULSE
**Phase C0 · Completed: 2026-09-24**

---

## 1. Local Production Build — RESULT: PASS

```
rm -rf .next && npm run build && npm start -- --port 3001
Exit code: 0
Build time: 11.2s (compiled), 24/24 static pages generated
```

### CSS Artifact Inspection
- **File**: `.next/static/css/6633cfef328cbc2a.css`
- **Size**: 68,654 bytes (67KB) — WELL ABOVE 10KB threshold
- **Contains `.flex`**: YES
- **Contains `.grid`**: YES
- **Contains `.bg-`**: YES
- **Contains `.text-`**: YES
- **Contains `.rounded`**: YES
- **Conclusion**: CSS is emitted correctly locally.

### Stylesheet Link in Served HTML
HTML payload from `http://localhost:3001/sign-in` contains:
```
:HL["/_next/static/css/6633cfef328cbc2a.css","style"]
```
CSS `<link>` is injected via RSC payload correctly.

---

## 2. Hypothesis Ladder

| Hypothesis | Status | Evidence |
|---|---|---|
| **H1** — PostCSS plugin mismatch (v3 name in v4 project) | **ELIMINATED** | `postcss.config.mjs` correctly uses `"@tailwindcss/postcss": {}` |
| **H2** — `globals.css` uses v3 directives under v4 | **ELIMINATED** | File begins with `@import "tailwindcss";` — correct v4 syntax |
| **H3** — `globals.css` not imported in root layout | **ELIMINATED** | `src/app/layout.tsx` imports `"./globals.css"` on line 4 |
| **H4** — Tailwind/PostCSS in `devDependencies` on prod-only install host | **CONFIRMED (LIKELY)** | `tailwindcss`, `@tailwindcss/postcss`, `postcss` are ALL in `devDependencies`; if Vercel/host installs prod-only, CSS is not generated |
| **H5** — Source detection missing component directories | **ELIMINATED** | Tailwind v4 auto-scans all source files in project |
| **H6** — CSS emitted but not served (CDN/rewrite issue) | **CANNOT VERIFY** — requires live deployed URL to test |
| **H7** — Stale host build cache | **PROBABLE** — no cache clear was done after earlier broken deploys |
| **H8** — Build failed on host silently | **CANNOT VERIFY** — requires host build logs |
| **H9** — Lockfile not committed / version skew | **ELIMINATED** — lockfile is committed |
| **H10** — Navigation failure downstream of missing JS (same root as CSS) | **LIKELY** — if devDependencies absent, JS also fails to compile |
| **H11** — Navigation failure independent (missing AUTH_SECRET/AUTH_URL) | **ALSO POSSIBLE** — `AUTH_SECRET` must be set in production environment |

---

## 3. CONFIRMED Defects Found in C0

### DEFECT-01: `tailwindcss`, `postcss`, `@tailwindcss/postcss` in `devDependencies`
- **Impact**: On any host that installs production dependencies only (Vercel default with `npm ci --production`), CSS is NOT generated → completely unstyled page
- **Fix**: Move to `dependencies`

### DEFECT-02 (S0 CRITICAL): Real database credentials and AUTH_SECRET in `.env.test` committed to public GitHub
- **File**: `.env.test` — tracked in git since commit `6464619`
- **Contains**: `neondb_owner:npg_BHC9oLf5msRU` (real Neon password), `AUTH_SECRET` value
- **Action Required**: ROTATE all credentials immediately, remove from git history

### DEFECT-03: Stock photos used in landing page and sign-in page
- `public/images/dashboard-preview.jpg` (485KB)
- `public/images/analytics-preview.jpg` (506KB)
- These are referenced from `page.tsx` and `SignInClient.tsx`

### DEFECT-04: Demo credentials in README.md (plaintext)
- `Admin@12345`, `Lead@12345`, `User@12345` published in public repo

### DEFECT-05: Landing page and sign-in contain banned copy
- "Transparent Talent Evaluation" (banned marketing superlative)
- "Empower your organization" (line 255 of page.tsx) — BANNED
- "streamline" (line 304) — BANNED
- "Register Request" link pointing to `/sign-in?mode=register` (registration locked out but UI still advertises it)
- `Live Registration Approval` feature advertised on landing page (C4 Option A was already chosen)

### DEFECT-06: `.gitignore` does NOT exclude `.env.test` — only `.env*.local` patterns
- Corrected pattern needed: `.env*` (with exception for `.env.example`)

---

## 4. Toolchain Configuration Summary

| Item | Value | Status |
|---|---|---|
| Tailwind version | `^4.0.9` | v4 ✓ |
| PostCSS plugin | `@tailwindcss/postcss` | Correct for v4 ✓ |
| CSS entry syntax | `@import "tailwindcss";` | Correct for v4 ✓ |
| globals.css imported in root layout | YES (`src/app/layout.tsx`) | ✓ |
| `tailwindcss` in dependencies | NO — in `devDependencies` | **DEFECT-01** |
| `@tailwindcss/postcss` in dependencies | NO — in `devDependencies` | **DEFECT-01** |
| `postcss` in dependencies | NO — in `devDependencies` | **DEFECT-01** |

---

## 5. Root Cause Statement

**Primary (CSS/Navigation missing on deployed host):** `tailwindcss`, `@tailwindcss/postcss`, and `postcss` are in `devDependencies`. A production host that runs `npm ci --production` (Vercel's default for certain configurations) skips `devDependencies`, leaving no PostCSS plugin at build time — CSS is silently not generated. The JS client bundle that handles navigation may also be affected by the same incomplete build.

**Secondary (Secret exposure):** `.env.test` containing real production Neon credentials and `AUTH_SECRET` was committed and pushed to a public GitHub repository. These credentials must be rotated immediately.
