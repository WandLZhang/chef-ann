# Chef Ann Commodity Planner - Frontend

A Next.js-based web application for school food directors to plan USDA commodity allocations with values-aligned recommendations.

## 🚀 Getting Started

### Development

Run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (hot reload enabled) |
| `npm run build` | Build for development (no static export) |
| `npm run build:prod` | Build for production (static export to `out/`) |
| `npm run deploy` | Build and deploy to Firebase Hosting |
| `npm run deploy:preview` | Deploy to Firebase preview channel |
| `npm run lint` | Run ESLint |

## 📦 Deployment

### Frontend Deployment (Firebase Hosting)

The frontend is deployed to Firebase Hosting. The production URL is:
- **Live Site:** https://chef-ann-commodity-planner.web.app

#### Deploy to Production

```bash
# One-command deploy (builds + deploys)
npm run deploy

# Or step by step:
npm run build:prod
firebase deploy --only hosting
```

#### Deploy Preview (for testing before going live)

```bash
npm run deploy:preview
```

### How it Works

- **Development** (`npm run dev`): Uses Next.js dev server with hot reloading, no static export
- **Production** (`npm run build:prod`): Sets `BUILD_MODE=production` which triggers static export to `out/` directory
- **Deploy**: Firebase Hosting serves files from the `out/` directory

The `next.config.mjs` automatically detects the build mode:
```javascript
output: process.env.BUILD_MODE === 'production' ? 'export' : undefined
```

## 🔧 Backend API

The backend is a Google Cloud Function using Gemini with code execution.

### Backend URL
- **API Base:** https://us-central1-wz-chef-ann.cloudfunctions.net/chef-ann-api

### Deploy Backend

```bash
cd ../functions
./deploy.sh YOUR_GEMINI_API_KEY

# Or manually:
gcloud functions deploy chef-ann-api \
    --gen2 \
    --runtime=python312 \
    --region=us-central1 \
    --source=. \
    --entry-point=main \
    --trigger-http \
    --allow-unauthenticated \
    --set-env-vars GEMINI_API_KEY=YOUR_KEY \
    --memory=2Gi \
    --cpu=2 \
    --timeout=300 \
    --max-instances=100
```

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── page.tsx          # Landing page
│   │   ├── onboarding/       # District setup wizard
│   │   └── planner/          # Commodity planning pages
│   │       ├── [category]/   # Dynamic category pages (beef, poultry, etc.)
│   │       ├── budget/       # Budget analysis
│   │       ├── export/       # Export allocations
│   │       └── menu/         # Menu planning
│   ├── components/           # Reusable React components
│   └── lib/                  # Utilities, API client, theme
├── firebase.json             # Firebase Hosting config
├── .firebaserc               # Firebase project alias
├── next.config.mjs           # Next.js configuration
└── package.json              # Dependencies and scripts
```

## 🔐 Environment Variables

The frontend connects to the production API by default. To use a different backend, update `API_BASE` in `src/lib/api.ts`.

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [Google Cloud Functions](https://cloud.google.com/functions/docs)
- [Gemini API](https://ai.google.dev/gemini-api/docs)
