# WazWuz Design Audit

## 1. Summary of Local Assets

### 1.1 Stitch marketing/landing page (`stitch_marketing_landing_page/`)

**Format:** 31 screen folders. Each folder includes `code.html` plus `screen.png` preview (63 files total including `.DS_Store`).

**Technology in Stitch output:** Tailwind via CDN, inline config, Google Fonts (Space Grotesk, Inter, IBM Plex Mono, Material Symbols Outlined). No React/Next; static HTML only.

**Asset inventory:**
- HTML files: 31
- PNG screenshots: 31
- Standalone CSS files: 0 (styles are inline in each HTML)
- Common screenshot sizing: mostly `1600x1280` with a few tall variants

**Screens present:**

| Folder | Purpose | Use as reference for |
|--------|---------|------------------------|
| `marketing_landing_page` | Public landing | `/`, hero, narrative, nav, footer |
| `sign_in_access_screen` | Auth | `/signin`, Google + email |
| `new_user_empty_home` | Empty dashboard | `/app` when no projects |
| `image_upload_intake` | Upload flow | Upload UI, project creation |
| `live_first_session` | First live session | Live onboarding |
| `live_camera_mode` | Camera UI | `/app/camera` |
| `camera_review_post_capture` | Post-capture | Camera → project transition |
| `camera_to_edit_transition` | Transition | Camera → studio flow |
| `live_edit_studio` | Main studio | `/app/project/[projectId]` |
| `action_modals_overlays` | Modals | Overlays, dialogs |
| `precision_controls` | Control strip | Precision controls in studio |
| `version_history_graph` | Version graph | `/app/project/[projectId]/versions` |
| `compare_mode` | Compare | `/app/project/[projectId]/compare` |
| `reference_board_moodboard` | Board view | References layout |
| `reference_moodboard_board` | Alt board | Same, alternate layout |
| `add_references_modal` | Add refs | Add reference UI |
| `add_references_modal_overlay` | Add refs overlay | Modal variant |
| `trend_brain_style_resolver_1` | Trend Brain | `/app/project/[projectId]/trend` |
| `trend_brain_style_resolver_2` | Trend Brain alt | Same route, variant |
| `multi_image_merge_studio_1` | Compose | `/app/project/[projectId]/compose` |
| `multi_image_merge_studio_2` | Compose alt | Same |
| `batch_studio_retouching` | Batch setup | `/app/studio` batch flow |
| `refined_batch_retouching_studio` | Batch refined | Same |
| `batch_job_review` | Batch review | Batch results |
| `export_studio` | Export | `/app/project/[projectId]/export` |
| `delivery_handoff` | Delivery | Export → Drive handoff |
| `style_recipe_library` | Recipes | `/app/recipes` |
| `style_recipe_library_shelf` | Recipes shelf | Same |
| `settings_help_system` | Settings/help | `/app/settings`, `/app/help` |
| `camera_flow_system_states` | Camera states | Camera state machine UI |

### 1.2 Logo assets (`wazwuz-logo/`)

**Contents:**

- `1.png` – logo asset (exact usage TBD after inspection)
- `2.png` – logo asset (variant or icon)

**Usage:** Use for favicon, app icon, nav brand, marketing hero, and OG/social images. Prefer one as primary mark and one as alternate (e.g. light/dark or full/symbol). Convert/optimize as needed (e.g. WebP, SVG if we add one later).

---

## 2. Reusable Layouts and Patterns

- **Landing:** Hero with two-column grid, pill badge, two CTAs (“Drop an image”, “Go live”), gradient card with “LIVE INFERENCE” strip. Timeline “Creative Loop” section (Upload → Talk → Live Guidance → Edit → Branch → Export). Reuse structure and section order; fix copy and links.
- **App shell:** Sticky header with logo, nav (Project / Edit / Render / Library), sync status, Export Session, avatar. Use for `/app` layout.
- **Studio layout (live_edit_studio):** Left rail (Library: Assets, Uploads, Captures, Versions; Recent Media grid; “New Stack”). Center canvas with overlay badges and floating canvas controls. Bottom dock: mic + waveform, undo/redo/compare/reset, Interrupt (coral). Right rail: Assistant header + LIVE badge, thinking state, transcript, reference strip, suggested actions, precision controls, voice input footer. **Reuse this structure faithfully;** fix any placeholder copy and wire to real state.
- **Sign-in:** Centered card, Google button, divider, email “Identifier” field, “Go live” primary button. Reuse layout and styling; wire to Auth.js.
- **Upload intake:** “New Campaign” heading, drag-and-drop zone, “Browse Files”, preview grid. Reuse for project-from-upload flow.
- **Version history:** Sidebar with project name/version, list/graph toggle, node list with timestamps and summaries. Reuse for versions page.
- **Compare mode:** Header with project name, side-by-side with slider (before/after), compare-overlay pattern. Reuse for compare route.
- **Trend Brain:** Large “Trend Brain” title, search input, result cards. Reuse for trend route.
- **Reference board:** Board name, grid of reference cards. Reuse for references route.
- **Batch studio:** Master selection, settings, sample previews, run flow. Reuse for batch flow.
- **Export/delivery:** Presets, destination (download/Drive), share link. Reuse for export route.

---

## 3. Screens to Recreate or Correct

- **All Stitch screens:** Rebuild in React/Next with real components and state. Do not copy-paste HTML.
- **Inconsistencies to normalize:**
  - **Background dark:** Multiple values across files (`#0c0d0a`, `#0E0D0B`, `#171512`, `#12140a`, `#1d230f`, `#0a0b06`). Pick one canonical “warm dark” and one “surface” (e.g. `#0c0d0a` / `#161810` or similar) and use everywhere.
  - **Inter:** Some screens load Inter, some don’t. Use Inter for body/UI consistently.
  - **Mono:** Some use `font-mono`, some use `.mono` class. Standardize on Tailwind `font-mono` (IBM Plex Mono).
  - **Placeholder copy:** e.g. “V2.0 Early Access”, “v4.0.2-alpha // SECURE_ACCESS_REQUIRED”, “Editorial_V3.RAW”, “ISO 200 • f2.8 • 1/250” – replace with real or sensible defaults.
- **Missing or weak:**
  - **Library/dashboard:** `new_user_empty_home` and `project_home_creative_dashboard` give a start; add project cards and “Open project” flow.
  - **Compose:** Multi-image merge screens exist but flow (subject/background/mood + priority) must be implemented clearly.
  - **Help:** Settings/help system screen is a single reference; expand into real help content and possibly a small help center.
  - **Responsive:** Stitch layouts are often desktop-first; ensure collapse behavior for left/right rails and bottom dock on smaller viewports.

---

## 4. Logo Assets and Recommended Usage

- **wazwuz-logo/1.png** – Use as primary logo (nav, marketing header, footer). Prefer dark-background contexts; if it’s light, use on dark surfaces only.
- **wazwuz-logo/2.png** – Use as alternate (e.g. favicon, compact header, or second style). Inspect dimensions; use for favicon/app icon (resize/optimize as needed).
- **Favicon / app icon:** Generate from `2.png` or `1.png` (e.g. 32×32, 180×180 for apple-touch-icon) and place in `app/` or `public/`.
- **OG/social:** Use logo + product name on a warm-dark card for OG image.

---

## 5. Extracted Design Tokens

Use these as the single source of truth; Stitch files diverge.

### 5.1 Colors

| Token | Hex | Usage |
|-------|-----|--------|
| `primary` (chartreuse) | `#c7ff38` | Live state, selected, primary CTAs, accents |
| `background-dark` | `#0c0d0a` (canonical) | Page/shell background |
| `surface` | `#161810` | Cards, rails, panels |
| `border-muted` | `#353a27` | Borders, dividers |
| `accent-coral` | `#FF5F52` | Interrupt, urgent CTA, emphasis |
| `accent-apricot` | (define e.g. `#e8a87c`) | Warm highlights |
| `accent-pistachio` | (define e.g. `#b5d99a`) | Success, completion |
| `background-light` | `#f8f8f5` | Optional light mode / marketing contrast |

### 5.2 Typography

- **Display / headlines:** Space Grotesk (300, 400, 500, 600, 700).
- **Body / UI:** Inter (400, 500, 600).
- **Metadata / labels / mono:** IBM Plex Mono (400, 500).

Load via `next/font` and apply via CSS variables or Tailwind theme.

### 5.3 Spacing and radius

- **Border radius:** `DEFAULT` 0.25rem, `lg` 0.5rem, `xl` 0.75rem, `full` 9999px. Use larger radii (e.g. 1rem, 1.5rem) for cards and dock as in Stitch.
- **Spacing:** Prefer generous padding (e.g. p-6, p-8) for premium feel; keep internal component spacing consistent.

### 5.4 Motion

- Use Framer Motion for: dock visibility, panel collapse, waveform, “thinking” state, page transitions.
- Keep duration short (200–400ms) for controls; slightly longer for panel open/close.

### 5.5 Other

- **Noise texture:** Stitch uses a `bg-noise` URL; optional for hero or background. Prefer local asset or remove if not needed.
- **Custom scrollbar:** `.custom-scrollbar` (thin, muted thumb) – implement in global CSS for rails and lists.

---

## 6. Route Mapping (Design Reference → Product Route)

| Product route | Primary Stitch reference(s) | Notes |
|---------------|-----------------------------|--------|
| `/` | `marketing_landing_page` | Hero, loop, features, FAQ, footer |
| `/signin` | `sign_in_access_screen` | Google + email |
| `/app` | `new_user_empty_home`, `project_home_creative_dashboard` | Dashboard, project list |
| `/app/project/[projectId]` | `live_edit_studio` | Full studio layout |
| `/app/project/[projectId]/versions` | `version_history_graph` | Graph + list |
| `/app/project/[projectId]/compare` | `compare_mode` | Slider, labels |
| `/app/project/[projectId]/references` | `reference_board_moodboard`, `reference_moodboard_board` | Board + items |
| `/app/project/[projectId]/trend` | `trend_brain_style_resolver_1`, `trend_brain_style_resolver_2` | Search + traits |
| `/app/project/[projectId]/compose` | `multi_image_merge_studio_1`, `multi_image_merge_studio_2` | Subject/background/mood |
| `/app/project/[projectId]/export` | `export_studio`, `delivery_handoff` | Presets, Drive, share |
| `/app/camera` | `live_camera_mode`, `camera_flow_system_states` | Preview, states, capture |
| `/app/library` | (reuse app + project list) | Can merge with `/app` or separate |
| `/app/recipes` | `style_recipe_library`, `style_recipe_library_shelf` | Recipe cards |
| `/app/studio` | `batch_studio_retouching`, `refined_batch_retouching_studio`, `batch_job_review` | Batch flow |
| `/app/settings` | `settings_help_system` | Profile, Drive, preferences |
| `/app/help` | `settings_help_system` | Help content |
| Modals / overlays | `add_references_modal`, `add_references_modal_overlay`, `action_modals_overlays` | Shared modal patterns |

---

## 7. Implementation Notes

- **Do not** ship Stitch HTML as-is; rebuild everything in React with Tailwind and the design system above.
- **Do** reuse: layout structure (rails, dock, header), color roles (primary, coral, surface), typography roles, and component concepts (transcript, reference strip, suggestion chips, compare slider).
- **Do** fix: inconsistent backgrounds, missing Inter, placeholder copy, fake metadata (e.g. ISO/f-stop), and non-responsive behavior.
- **Do** add: real state (session, project, version, live state), real API wiring, and accessibility (focus, labels, ARIA where needed).
