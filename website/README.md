# Sarvar Umarov — Sales Systems & Training

Landing website to collect leads and forward them to Telegram via a secure Node.js backend.

## Quick start

1. Install dependencies

```powershell
npm i
```

2. Configure environment

```powershell
# Copy example and fill your values
Copy-Item .env.example .env
```

Open `.env` and set:

- `BOT_TOKEN` — Telegram Bot token
- `CHAT_ID` — The chat/channel/user ID to receive leads
- `PORT` — (optional) defaults to 3000
- `ORIGIN` — Allowed frontend origin (e.g. http://localhost:3000 or your domain)

3. Run in development (auto-reload)

```powershell
npm run dev
```

4. Open the app

- Local: http://localhost:3000

## API

POST `/api/lead`

Body JSON:

```json
{
  "name": "John Doe",
  "phone": "+998 90 123 45 67",
  "username": "@johndoe",
  "company": "Acme Realty",
  "message": "Looking for team training"
}
```

Response:

```json
{ "ok": true }
```

or on error

```json
{ "ok": false, "errors": ["message..."] }
```

## Notes

- Secrets are never exposed to the browser. Only the backend holds `BOT_TOKEN` and `CHAT_ID`.
- CORS is restricted by `ORIGIN` in `.env`.
- Static files are served from `/public`.
- If you deploy behind a reverse proxy, set the proper `ORIGIN`.

## Deploy

### Option A — Node host (Express)
- Any Node.js host works (Render/Railway/Fly.io). Set environment variables in your hosting provider.
- For production, use `npm start`.

### Option B — 100% static frontend (GitHub Pages) + free Cloudflare Worker API
If you want to host only the static site and still send leads to Telegram without exposing secrets:

1) Create a Cloudflare Worker (free)
  - Cloudflare Dashboard → Workers & Pages → Create Worker
  - Quick edit → paste file `serverless/cloudflare-worker.js` content
  - Deploy
   - Add Secrets: BOT_TOKEN, CHAT_ID
   - Add Variable: ORIGIN = allowed Origins (domain only, no path). Examples:
     - https://<username>.github.io
     - http://127.0.0.1:5500 (for Live Server)
     - http://localhost:3000 (for local dev)
     - You can provide multiple, comma-separated.

2) Point the frontend to the Worker API
  - In `public/index.html`, before `main.js`, add:

```html
<script>
  window.LEAD_API = 'https://<your-worker-subdomain>.workers.dev';
</script>
```

The form will POST to `https://<your-worker-subdomain>.workers.dev/api/lead`.

Important: For GitHub Pages project sites (https://<username>.github.io/<repo>), the browser Origin is `https://<username>.github.io` (no `/repo`). Use the domain only in ORIGIN.

3) Publish static files to GitHub Pages
  - Serve the `public` folder as your site root.
