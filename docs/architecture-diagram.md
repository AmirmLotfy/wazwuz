# WazWuz System Architecture

This file is the runtime-accurate architecture source for WazWuz.

- Canonical submission image: `docs/wazwuz-architecture.png`
- Diagram reflects current routing/auth model, canonical APIs, and batch queue/process execution.

```mermaid
flowchart LR
  subgraph client [Client Layer]
    browser[User Browser]
    publicPages["Public Pages / /signin /privacy /terms"]
    protectedPages["Protected App /app/*"]
  end

  subgraph frontend [Frontend Layer]
    nextFrontend["Next.js App Router Frontend"]
    reactQuery[React Query Cache]
    appShell["App Shell + Project Pages"]
  end

  subgraph boundary [Access Boundary]
    middleware["Middleware decideAccess()"]
    authjs["Auth.js JWT/OAuth"]
  end

  subgraph backend [Backend Layer (Canonical APIs)]
    apiRoutes["Next.js Route Handlers"]
    liveCanonical["POST /api/live/tools"]
    uploadCanonical["POST /api/uploads"]
    driveCanonical["GET /api/drive/status + GET|POST /api/drive/folders"]
    projectApis["Projects/Versions/References/Trend APIs"]
    exportApis["Export API /api/export"]
    batchQueue["Batch queue endpoint /run"]
    batchProcess["Batch process endpoint /process"]
  end

  subgraph aliases [Deprecated Aliases]
    liveAlias["/api/live/tools/[tool]"]
    uploadAlias["/api/uploads/[action], /api/uploads/file"]
    driveAlias["/api/drive/[action]"]
  end

  subgraph ai [AI Services]
    geminiLive[Gemini Live API]
    geminiGenAi[Gemini GenAI]
  end

  subgraph data [Data Services]
    firestore[(Firestore)]
    gcs[(Cloud Storage GCS)]
    driveApi[Google Drive API]
  end

  subgraph deploy [Deployment]
    ci["CI gates lint -> typecheck -> test -> build"]
    cloudRun[Docker + Cloud Run]
  end

  browser --> publicPages
  browser --> protectedPages
  browser --> nextFrontend

  nextFrontend --> reactQuery
  nextFrontend --> appShell
  nextFrontend --> apiRoutes

  middleware --> protectedPages
  middleware --> apiRoutes
  authjs --> middleware
  authjs --> apiRoutes

  apiRoutes --> liveCanonical
  apiRoutes --> uploadCanonical
  apiRoutes --> driveCanonical
  apiRoutes --> projectApis
  apiRoutes --> exportApis
  apiRoutes --> batchQueue

  batchQueue -. "async job trigger" .-> batchProcess

  liveCanonical --> geminiLive
  liveCanonical --> geminiGenAi
  projectApis --> geminiGenAi

  projectApis --> firestore
  projectApis --> gcs
  exportApis --> gcs
  exportApis --> driveApi
  batchProcess --> firestore
  batchProcess --> gcs

  liveAlias -. "deprecated alias headers" .-> liveCanonical
  uploadAlias -. "deprecated alias headers" .-> uploadCanonical
  driveAlias -. "deprecated alias headers" .-> driveCanonical

  ci --> cloudRun
  cloudRun --> nextFrontend
```

## Export PNG

If Mermaid CLI is installed:

```bash
mmdc -i docs/architecture-diagram.md -o docs/wazwuz-architecture.png -w 1920 -H 1080 -b transparent
```

If Mermaid CLI is not installed:

```bash
pnpm dlx @mermaid-js/mermaid-cli -i docs/architecture-diagram.md -o docs/wazwuz-architecture.png -w 1920 -H 1080 -b transparent
```
