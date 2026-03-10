# WazWuz Implementation Plan

## Objective
Build WazWuz as a real, launch-ready, hackathon-quality full-stack web app with a polished marketing experience, authenticated product experience, real backend workflows, live assistant capabilities, and Google Cloud-ready deployment.

This plan is the execution source of truth.

## Product Pillars
- Live creative operating system (not generic chat UI).
- Camera-aware creative guidance with live interaction.
- Non-destructive editing with version graph and compare flows.
- Reference board + trend-aware style intelligence.
- Batch/studio retouching for multi-asset output.
- Export and delivery to Google Drive with share links.

## Technical Constraints
- Single TypeScript monorepo.
- Next.js 16 (App Router), strict TypeScript, pnpm.
- Tailwind + custom design system, shadcn primitives only where useful.
- Firestore + Cloud Storage + Google Drive API.
- Gemini via `@google/genai`, Gemini Live API for low-latency live sessions.
- Auth.js with Google OAuth + email sign-in.
- Cloud Run deployment readiness.

## Architecture Overview
- **Frontend**: Next.js App Router, feature routes under `/app`, shared components and feature modules.
- **Backend**: Next route handlers, server actions (where suitable), server-only services and repositories.
- **Data**: Firestore collections with typed schemas and validation.
- **Files**: Cloud Storage for originals/references/versions/exports.
- **AI**: Centralized server-only model config + typed AI orchestration layer.
- **Auth/Security**: Session-guarded tools, user-scoped access, secure token handling, no hardcoded secrets.

---

## Global Task Index
- `T01` Design/logo asset audit and documentation
- `T02` Monorepo scaffold + strict tooling baseline
- `T03` Design system and brand tokens implementation
- `T04` Marketing site implementation
- `T05` Auth.js integration (Google + email)
- `T06` Protected app shell + route guards
- `T07` Firestore models/repositories/services
- `T08` Cloud Storage upload pipeline
- `T09` Project creation and library flows
- `T10` Live session backend and tool gateway
- `T11` Camera mode and capture-to-project flow
- `T12` Core studio layout and interaction shell
- `T13` Edit tools and variant generation workflow
- `T14` Version graph and compare mode
- `T15` Reference boards and analysis
- `T16` Trend brain and style resolver
- `T17` Multi-image composition workflow
- `T18` Batch/studio processing flow
- `T19` Export system (download + Drive)
- `T20` Settings, help, and system state surfaces
- `T21` Error/loading/empty hardening
- `T22` Testing baseline (unit/smoke/e2e)
- `T23` Deployment artifacts and Cloud Run readiness
- `T24` Final documentation and handoff

---

## Phase Plan

## Phase 1 — Audit + Scaffold
### Goals
- Inspect local Stitch and logo assets.
- Define reuse/correction strategy.
- Scaffold production-ready app foundation.

### Tasks
- `T01.1` Recursively inspect `stitch_marketing_landing_page`.
- `T01.2` Recursively inspect `wazwuz-logo`.
- `T01.3` Catalog image assets, html/css exports, screenshots, token hints.
- `T01.4` Write `docs/design-audit.md`:
  - reusable sections/components
  - broken content/UX areas
  - missing screens
  - logo usage recommendations
  - extracted tokens
  - route mapping to final app.
- `T02.1` Initialize Next.js 16 + TypeScript strict + pnpm workspace setup.
- `T02.2` Add ESLint + Prettier + scripts (`lint`, `typecheck`, `test`).
- `T02.3` Add Tailwind setup and baseline app shell.
- `T03.1` Set typography system (Space Grotesk, Inter, IBM Plex Mono).
- `T03.2` Define warm-dark design tokens (colors, spacing, radius, motion).
- `T03.3` Import/optimize logos and wire favicon/social placeholders.

### Deliverables
- `docs/design-audit.md`
- Running app scaffold with strict TS and tooling.
- Initial reusable design primitives and theme tokens.

### Exit Criteria
- App boots locally.
- Theme, fonts, and base layout are visible and coherent.
- Audit doc is complete and actionable.

---

## Phase 2 — Marketing + Auth
### Goals
- Build public-facing polished site and real authentication.

### Tasks
- `T04.1` Implement `/` landing page with premium hero and narrative flow.
- `T04.2` Implement responsive nav/footer and CTA wiring.
- `T04.3` Add feature sections, social proof, FAQ, polished copy.
- `T04.4` Add SEO metadata, OG tags, sitemap basics.
- `T05.1` Configure Auth.js core.
- `T05.2` Implement Google OAuth sign-in.
- `T05.3` Implement email sign-in (magic link or OTP).
- `T05.4` Persist sessions securely.
- `T06.1` Build protected layout for `/app/*`.
- `T06.2` Route guards + redirect logic.
- `T06.3` Onboarding gate for first project setup.

### Deliverables
- Public routes: `/`, `/signin`, `/privacy`, `/terms`, `/auth/*`.
- Working sign-in flows and protected app entry.

### Exit Criteria
- User can sign in and reach protected routes.
- Public site is responsive and production presentable.

---

## Phase 3 — Core Data + Uploads + Project Lifecycle
### Goals
- Implement real data/storage layers and project bootstrapping.

### Tasks
- `T07.1` Define Zod-backed typed schemas for all core entities.
- `T07.2` Implement Firestore repositories for:
  - users
  - projects
  - assets
  - versionNodes
  - referenceBoards
  - referenceItems
  - recipes
  - batchJobs
  - exports
  - transcriptTurns.
- `T07.3` Implement service layer for orchestration/business rules.
- `T07.4` Define required Firestore indexes and index doc.
- `T08.1` Build upload validation (MIME, size, extension safety).
- `T08.2` Implement safe filename generation + storage path policy.
- `T08.3` Extract image metadata (dimensions, mime, checksum if useful).
- `T08.4` Implement signed access strategy and cleanup utilities.
- `T09.1` Build upload UI with drag/drop, progress, previews.
- `T09.2` Build project creation flow from upload set.
- `T09.3` Add smart project title fallback and auto-analysis kickoff.
- `T09.4` Build `/app`, `/app/library`, project listing/opening.

### Deliverables
- Real persistence and storage handling.
- Working upload-to-project pipeline.

### Exit Criteria
- User can create a project from uploads and reopen later.

---

## Phase 4 — Live + Camera
### Goals
- Deliver working live session foundations and camera capture mode.

### Tasks
- `T10.1` Implement `/api/live/session` with secure ephemeral/session auth pattern.
- `T10.2` Build server-side live tool gateway `/api/live/tools/*`.
- `T10.3` Enforce authenticated user-scoped tool execution.
- `T10.4` Implement live state/event handling contracts.
- `T11.1` Build `/app/camera` with browser camera access.
- `T11.2` Add front/back switching and graceful fallback.
- `T11.3` Implement overlays, output target chips, quick direction toggles.
- `T11.4` Implement capture and save to project assets.
- `T11.5` Implement smooth transition from camera to studio.

### Deliverables
- Working live session bootstrap path.
- Real camera mode and capture ingestion.

### Exit Criteria
- User can open camera, capture frame, and continue editing in project.

---

## Phase 5 — Edit Studio + Version Graph + Compare
### Goals
- Build the core non-destructive editing experience.

### Tasks
- `T12.1` Implement studio layout:
  - left asset/version rail
  - center canvas
  - right transcript/suggestions/trend/reference strip
  - bottom dock + quick chips + precision strip.
- `T12.2` Implement responsive collapse behaviors.
- `T13.1` Implement edit actions: variants, branch, reset, relight, match ref, etc.
- `T13.2` Wire Gemini image workflows:
  - fast: `gemini-3.1-flash-image-preview`
  - high fidelity: `gemini-3-pro-image-preview`
  - reasoning: `gemini-3.1-pro-preview`
  - avoid forbidden model usage.
- `T13.3` Persist version nodes and asset links per operation.
- `T14.1` Build `/app/project/[projectId]/versions` graph UI.
- `T14.2` Implement restore, branch-from-node, compare-from-node, reset-root.
- `T14.3` Build `/app/project/[projectId]/compare` with slider and selection actions.

### Deliverables
- Real studio operations with non-destructive versioning.
- Functional compare and version graph views.

### Exit Criteria
- User can edit, branch, restore, and compare with real persisted outcomes.

---

## Phase 6 — References + Trend Brain
### Goals
- Build reference intelligence and trend-aware style resolution.

### Tasks
- `T15.1` Build reference board CRUD and item ingest paths.
- `T15.2` Support item types: upload, screenshot, pasted URL, project frame.
- `T15.3` Add notes/tags/pinning and board save to project.
- `T15.4` Implement board analysis and extracted trait storage.
- `T16.1` Build `/trend` UI for style term exploration.
- `T16.2` Implement style resolver service with grounding/search where useful.
- `T16.3` Return structured traits, confidence, freshness, interpretation options.
- `T16.4` Implement scoped apply modes (lighting/color/composition/full vibe).

### Deliverables
- Real reference board workflows.
- Functional trend analysis and style application path.

### Exit Criteria
- User can analyze references/trends and apply results to edits.

---

## Phase 7 — Batch / Studio Processing
### Goals
- Deliver practical real batch flow for moderate set sizes.

### Tasks
- `T18.1` Build batch setup UI: master version + settings.
- `T18.2` Implement sample preview generation (3–6 previews).
- `T18.3` Implement confirm-and-run full batch job.
- `T18.4` Add progress updates and output listing.
- `T18.5` Persist batch job metadata and outputs.
- `T18.6` Keep architecture queue-ready for future scaling.

### Deliverables
- Real batch workflow from setup to outputs.

### Exit Criteria
- User can run batch, monitor status, and view generated outputs.

---

## Phase 8 — Export + Drive Delivery
### Goals
- Implement production-meaningful export and Google Drive delivery.

### Tasks
- `T19.1` Build export presets and file options UI.
- `T19.2` Implement local download export flow.
- `T19.3` Implement Drive connect/disconnect state and scope checks.
- `T19.4` Implement create/select Drive folder.
- `T19.5` Implement file upload to Drive and share link creation.
- `T19.6` Persist export records with statuses and errors.
- `T19.7` Add clear recovery UX for auth/token expiration.

### Deliverables
- Download + Drive export flows with record persistence.

### Exit Criteria
- User can export outputs, push to Drive, and obtain share links.

---

## Phase 9 — Hardening + QA + Deploy
### Goals
- Stabilize quality, add tests/docs, and prepare Cloud Run deployment.

### Tasks
- `T20.1` Build settings and help routes (`/app/settings`, `/app/help`).
- `T20.2` Add profile, voice prefs, assistant tone, default export settings.
- `T20.3` Surface Drive status and privacy/upload controls.
- `T21.1` Add robust loading, error, and empty states across key screens.
- `T21.2` Add route-level error boundaries and recoverable UI states.
- `T22.1` Add lint, typecheck, and test scripts.
- `T22.2` Add unit tests for services/validators.
- `T22.3` Add smoke tests for core routes/flows.
- `T22.4` Add 1–2 e2e happy paths (signin + upload + export path).
- `T23.1` Add `Dockerfile`, `.dockerignore`, deploy config/script.
- `T23.2` Add Cloud Run notes and one-time GCP setup checklist.
- `T24.1` Create `.env.example` with typed env validation docs.
- `T24.2` Finalize README with run/test/deploy instructions.
- `T24.3` Final acceptance walkthrough checklist.

### Deliverables
- Production-ready docs and deploy artifacts.
- Reliable quality baseline and test coverage for critical paths.

### Exit Criteria
- App is runnable, testable, and deployable to Cloud Run.

---

## Canonical Route Checklist

### Public
- `/`
- `/signin`
- `/auth/*`
- `/privacy`
- `/terms`

### App
- `/app`
- `/app/project/[projectId]`
- `/app/project/[projectId]/compare`
- `/app/project/[projectId]/versions`
- `/app/project/[projectId]/references`
- `/app/project/[projectId]/trend`
- `/app/project/[projectId]/compose`
- `/app/project/[projectId]/export`
- `/app/camera`
- `/app/library`
- `/app/recipes`
- `/app/studio`
- `/app/settings`
- `/app/help`

### API
- `/api/live/session`
- `/api/live/tools/*`
- `/api/projects/*`
- `/api/uploads/*`
- `/api/references/*`
- `/api/trend/*`
- `/api/edits/*`
- `/api/versions/*`
- `/api/batch/*`
- `/api/export/*`
- `/api/drive/*`
- `/api/webhooks/*` (optional)

---

## Data Model Checklist
- `users`
- `projects`
- `assets`
- `versionNodes`
- `referenceBoards`
- `referenceItems`
- `recipes`
- `batchJobs`
- `exports`
- `transcriptTurns`

All collections must be:
- user-scoped where applicable
- validated with shared Zod schemas
- surfaced through typed repositories/services
- indexed for primary read/query paths

---

## AI Model Configuration Rules
- Centralize all model IDs in one server-only config module.
- Make model IDs env-driven and easy to swap.
- Default strategy:
  - Live voice/video: official Gemini Live model (env-configured)
  - Fast edit/variants: `gemini-3.1-flash-image-preview`
  - Final high fidelity: `gemini-3-pro-image-preview`
  - Heavy reasoning: `gemini-3.1-pro-preview`
  - Do not use: `gemini-3-pro-preview`

---

## Security + Access Rules
- No hardcoded secrets.
- All tool and file actions require authenticated session.
- All reads/writes are user-scoped and access-controlled.
- Upload validation and safe storage paths enforced.
- Drive actions explicit and user-authorized with proper scopes.

---

## Required Project Files
- `docs/design-audit.md`
- `docs/implementation-plan.md` (this file)
- `.env.example`
- `README.md`
- `Dockerfile`
- `.dockerignore`
- `cloudbuild.yaml` or deploy script
- Typed env validation module
- Centralized server-only AI model config module

---

## Progress Tracking Template

Use this section for execution updates.

### Status Legend
- `NOT_STARTED`
- `IN_PROGRESS`
- `BLOCKED`
- `DONE`

### Tracker
| Task | Owner | Status | Notes |
|---|---|---|---|
| T01 | Agent | DONE | design-audit.md created |
| T02 | Agent | DONE | Next.js 16 scaffold and tooling baseline complete; typecheck now passes |
| T03 | Agent | DONE | Tokens, fonts, logo in public, design system |
| T04 | Agent | DONE | Landing, nav, footer, SEO basics |
| T05 | Agent | DONE | Auth.js Google OAuth, signin page |
| T06 | Agent | DONE | Protected /app layout, guards, app shell |
| T07 | Agent | DONE | Firestore repos; recipes + transcriptTurns in types/db; recipes index doc |
| T08 | Agent | DONE | GCS upload path; upload API with validation |
| T09 | Agent | DONE | Library, library/new upload, project creation |
| T10 | Agent | DONE | /api/live/session and live tools wired with strict schemas across both routes and typed Live SDK compatibility fixes |
| T11 | Agent | DONE | Camera page, capture, save to project; option to save to existing project |
| T12 | Agent | DONE | Project studio layout, rails, dock; precision strip persisted per project; studio shortcuts (relight, background replace, match reference, trendier, cleaner, upscale) |
| T13 | Agent | DONE | Variants/edits API; applyEdit, generateVariants via live-tools and studio |
| T14 | Agent | DONE | Version graph UI (nodes/edges, restore, branch, compare, reset); compare page |
| T15 | Agent | DONE | Reference boards CRUD, analyze, traits; match reference from studio |
| T16 | Agent | DONE | Trend resolve/apply and recipe save implemented; optional grounding behind `TREND_GROUNDING_ENABLED` with persisted snapshot |
| T17 | Agent | DONE | Compose page and API |
| T18 | Agent | DONE | Batch preview/run implemented with queue+process endpoints, idempotent preview, and failure accounting |
| T19 | Agent | DONE | Export presets (resize/crop by aspect); download + Drive with share links |
| T20 | Agent | DONE | Settings, help pages |
| T21 | Agent | DONE | Error/empty states in place |
| T22 | Agent | DONE | Added unit/integration/e2e smoke tests plus live-tool schema tests and CI quality gates |
| T23 | Agent | DONE | Dockerfile, .dockerignore, README deploy |
| T24 | Agent | DONE | .env and README updated with grouped API aliases, auth/drive notes, and e2e requirement behavior |

---

## Final Acceptance Checklist
- [x] Project runs locally from clean setup.
- [x] User can sign in and access protected app.
- [x] Upload to project works with validation and metadata capture.
- [x] Camera mode captures and saves frames to project (new or existing project).
- [x] Live assistant: ephemeral token + UI states are present, with Live SDK typing/runtime hardening applied.
- [x] Variants/edits create real persisted version nodes (studio + Live tools).
- [x] Version graph UI: nodes/edges, restore, branch, compare, reset to root.
- [x] Compare mode: before/after slider, Keep this, Branch this.
- [x] Precision controls persisted per project and included in edit/variant requests.
- [x] References: boards CRUD, items, analyze → traits; Match reference from studio when board is set.
- [x] Trend Brain: resolve style term, apply (lighting/color/composition/full); save as recipe; recipes list and apply to project.
- [x] Batch: create job, preview, queue run, progress and output assets.
- [x] Export: presets (1:1, 4:5, 9:16, marketplace, web-hero) with server-side resize/crop; download and Google Drive with share links.
- [x] Studio shortcuts: Relight, Background replace, Match reference, Trendier, Cleaner, Upscale (applyEdit with predefined prompts).
- [x] AI model config: env-driven defaults (gemini-3.1-flash-image-preview, gemini-3-pro-image-preview, gemini-3.1-pro-preview); do not use gemini-3-pro-preview (documented in .env.example).
- [x] Responsive premium UI; design system and tokens in use (marketing testimonials added, camera layout refined).
- [x] Cloud Run deployment artifacts (Dockerfile, cloudbuild.yaml) and docs (README, deploy, firestore-indexes).
- **Known limitations (optional/future):** Grounding currently uses lightweight DuckDuckGo snippets (not Google Search grounding); `/api/webhooks/*` not implemented; upscale is prompt-based (no dedicated upscale API); build warns that Next.js `middleware` should migrate to `proxy` in a future pass.
