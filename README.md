# Wazwuz

Live AI creative partner for image workflows: camera-aware guidance, voice interaction, non-destructive editing, and export to Google Drive.

## Stack

- **Next.js 16** (App Router), TypeScript, Tailwind CSS
- **Auth:** Auth.js (next-auth) with Google OAuth
- **Data:** Firestore, Google Cloud Storage
- **AI:** Gemini (GenAI SDK); Live API for voice/video
- **Deploy:** Google Cloud Run–ready (Dockerfile, standalone build)

## Local setup

1. **Clone and install**

   ```bash
   pnpm install
   ```

2. **Environment**

   Copy `.env.example` to `.env.local` and set:

   - `AUTH_SECRET` – required for Auth.js (e.g. `npx auth secret`)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` – for Google sign-in
   - Optional: `GCP_PROJECT_ID`, `GCS_BUCKET_NAME`, `FIRESTORE_DATABASE_ID` for persistence  
   - Optional: `GEMINI_API_KEY` for AI features

3. **Run**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign in (Google), then use Library to create a project from uploads or Camera to capture and save.

## Scripts

- `pnpm dev` – dev server (Turbopack)
- `pnpm build` – production build
- `pnpm start` – run production server
- `pnpm lint` – ESLint
- `pnpm typecheck` – TypeScript check
- `pnpm test` – unit/integration tests (Vitest)
- `pnpm test:e2e` – e2e smoke test (`E2E_BASE_URL`; set `E2E_REQUIRED=true` to fail when missing)
- `pnpm smoke` – script-based smoke checks

## Reproducible testing (for judges)

Use these exact steps from a clean checkout:

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create env file and set minimum required vars:

   ```bash
   cp .env.example .env.local
   ```

   Required for app boot/auth:
   - `AUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

3. Run quality gates (same order as CI):

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```

4. Run locally:

   ```bash
   pnpm dev
   ```

   Open `http://localhost:3000`.

5. Optional e2e smoke against a running app:

   ```bash
   E2E_BASE_URL=http://localhost:3000 pnpm test:e2e
   ```

   To force failure when the URL is missing in CI/judging:

   ```bash
   E2E_REQUIRED=true E2E_BASE_URL=http://localhost:3000 pnpm test:e2e
   ```

### Manual judge flow (2-5 minutes)

1. Sign in at `/signin` (Google or magic-link).
2. Go to `/app/library/new`, upload an image, and open the created project.
3. In project studio, trigger one action (e.g. **Make variants** or **Relight**).
4. Open **Versions** or **Compare** to verify new version connectivity.
5. Open **Export** and verify download works (Drive export requires Google auth token).

## API surface

Core routes:

- Live:
  - `POST /api/live/session`
  - `POST /api/live/tools`
  - `POST /api/live/tools/[tool]` (deprecated alias; use `/api/live/tools`)
- Uploads:
  - `POST /api/uploads`
  - `POST /api/uploads/[action]` (deprecated aliases: `file`, `ingest`)
  - `POST /api/uploads/file` (deprecated alias)
- Projects:
  - `GET|POST /api/projects`
  - `GET /api/projects/[projectId]/full`
  - `POST /api/projects/[projectId]/variants`
  - `POST /api/projects/[projectId]/trend/resolve`
  - `POST /api/projects/[projectId]/trend/apply`
  - `POST /api/projects/[projectId]/batch/[jobId]/run` (enqueue run)
  - `POST /api/projects/[projectId]/batch/[jobId]/process` (worker-style execution endpoint)
- Export/Drive:
  - `GET /api/projects/[projectId]/export`
  - `POST /api/export` (`shareScope`: `restricted` or `anyone`)
  - `GET /api/drive/status`
  - `GET|POST /api/drive/folders`
  - `GET|POST /api/drive/[action]` (deprecated alias)

### Public vs protected boundaries

- Public pages: `/`, `/signin`, `/signin/verify`, `/privacy`, `/terms`
- Protected pages: all `/app/*`
- Public APIs: `/api/auth/[...nextauth]`, `/api/auth/magic-link`
- Protected APIs: all other `/api/*` routes (middleware + handler auth checks)

### Routing inventory (filesystem)

- Public website pages:
  - `app/page.tsx`
  - `app/signin/page.tsx`
  - `app/signin/verify/page.tsx`
  - `app/privacy/page.tsx`
  - `app/terms/page.tsx`
- Protected app shell/layout:
  - `app/app/layout.tsx`
  - `components/wazwuz/app-shell.tsx`
- Protected app pages:
  - `app/app/page.tsx`
  - `app/app/library/page.tsx`
  - `app/app/library/new/page.tsx`
  - `app/app/camera/page.tsx`
  - `app/app/studio/page.tsx`
  - `app/app/recipes/page.tsx`
  - `app/app/settings/page.tsx`
  - `app/app/help/page.tsx`
  - `app/app/project/[projectId]/page.tsx`
  - `app/app/project/[projectId]/versions/page.tsx`
  - `app/app/project/[projectId]/compare/page.tsx`
  - `app/app/project/[projectId]/references/page.tsx`
  - `app/app/project/[projectId]/trend/page.tsx`
  - `app/app/project/[projectId]/compose/page.tsx`
  - `app/app/project/[projectId]/export/page.tsx`

## Deploy (Google Cloud Run)

1. Build the image (e.g. with Cloud Build):

   ```bash
   docker build -t gcr.io/YOUR_PROJECT_ID/wazwuz:latest .
   ```

2. Set secrets in Cloud Run (AUTH_SECRET, GOOGLE_*, GCP_*, GCS_*, GEMINI_* etc.).

3. Run with `PORT=8080` and `HOSTNAME=0.0.0.0` (default in Dockerfile).

One-time: enable Firestore, Cloud Storage, and create OAuth credentials in Google Cloud Console. See `.env.example` for all variables.

### Auth + Drive token notes

- User identity is normalized to email across auth providers.
- Drive access tokens are read server-side from JWT and refreshed automatically for Google OAuth sessions.
- Drive status endpoint validates token freshness before reporting connected state.

### Optional trend grounding

Set `TREND_GROUNDING_ENABLED=true` to enrich style-term resolution with lightweight web snippets (DuckDuckGo instant results). This is optional and safe to keep disabled.

## Design

- Submission-ready architecture PNG: `docs/wazwuz-architecture.png`
- System architecture diagram: `docs/architecture-diagram.md`
- Design audit and route mapping: `docs/design-audit.md`
- Implementation plan and phases: `docs/implementation-plan.md`

## License

Private.
