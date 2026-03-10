# Deployment (Cloud Run)

One-time setup and how to deploy WazWuz to Google Cloud Run.

## One-time Google Cloud setup

1. **Google Cloud project**
   - Create a project (or use existing) and note the project ID.
   - Enable APIs: Cloud Run, Container Registry (or Artifact Registry), Firestore, Cloud Storage, Secret Manager (optional, for secrets).

2. **OAuth credentials (Auth.js)**
   - Go to [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
   - Create **OAuth 2.0 Client ID** (Web application).
   - Add authorized redirect URIs: `https://your-domain.com/api/auth/callback/google` (and `http://localhost:3000/api/auth/callback/google` for local).
   - Add authorized JavaScript origins.
   - Copy Client ID and Client Secret into env (see below).

3. **Firestore**
   - Create a Firestore database (Native mode) in the same project.
   - Deploy indexes from [docs/firestore-indexes.md](firestore-indexes.md) if you use composite queries (Firestore Console → Indexes).

4. **Cloud Storage (GCS)**
   - Create a bucket for uploads and generated assets.
   - Set CORS if the app will upload from the browser directly to GCS (or keep uploads via app API).
   - Note the bucket name for env.

5. **Cloud Run**
   - No need to create the service manually; the first deploy will create it.
   - Set **Authentication** to “Allow unauthenticated invocations” if the app is public, or use IAM + Load Balancer for custom domain + auth.

6. **Environment variables (Secret Manager or Cloud Run env)**
   - `AUTH_SECRET` – random string (e.g. `openssl rand -base64 32`).
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` – from step 2.
   - `GCP_PROJECT_ID` – your project ID.
   - `GCS_BUCKET_NAME` – bucket from step 4.
   - `GEMINI_API_KEY` – for AI features (Gemini API enabled in the same project or with API key).
   - `NEXT_PUBLIC_APP_URL` – full app URL (e.g. `https://wazwuz-xxx.run.app`) for Auth.js redirects and sitemap.
   - Optional: `RESEND_API_KEY`, `EMAIL_FROM` for magic-link email.

## Build and deploy

### Option A: Cloud Build (recommended)

```bash
# Substitute your project and region
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_APP_URL=https://YOUR_SERVICE_URL.run.app
```

Set env vars for the Cloud Run service (e.g. via Console or `gcloud run services update` with `--set-env-vars`).

### Option B: Local Docker + push + deploy

```bash
# Build
docker build --build-arg NEXT_PUBLIC_APP_URL=https://YOUR_SERVICE_URL.run.app -t gcr.io/YOUR_PROJECT_ID/wazwuz:latest .

# Push
docker push gcr.io/YOUR_PROJECT_ID/wazwuz:latest

# Deploy
gcloud run deploy wazwuz \
  --image gcr.io/YOUR_PROJECT_ID/wazwuz:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated
```

### Option C: Deploy from source (no Dockerfile in repo)

```bash
gcloud run deploy wazwuz --source . --region us-central1 --allow-unauthenticated
```

Cloud Build will infer a build; set env vars in the Cloud Run service after first deploy.

## After first deploy

1. Set all required env vars on the Cloud Run service.
2. Update OAuth redirect URIs to use the real Cloud Run URL.
3. Run smoke test: `NEXT_PUBLIC_APP_URL=https://YOUR_URL node scripts/smoke-test.mjs`.
