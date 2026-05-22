# Dark Feminine Sage Dashboard
### Deployment Guide for Bri

---

## What You're Deploying

A personal life + brand dashboard that lives at a real URL, with:
- **Week View** — tasks, 8-habit tracker, weekly intention + goals, movement log
- **Brand HQ** — content pipeline (kanban-style) + launch milestones with Jupiter Leo countdown
- **Quarter View** — goals by category, financial trackers, wins log
- **Astrology** — AI-generated monthly transit readings + your own notes + power dates
- **Settings** — birth data, briefing setup, Google Calendar connection

Plus a **6:00 AM morning briefing** sent to your iPhone via iMessage through Cowork.

---

## Step 1 — Neon Database (free)

1. Go to **neon.tech** and create a free account
2. Create a new project → name it `dark-feminine-sage`
3. Copy the **Connection String** (starts with `postgres://...`)
4. Save it — this is your `DATABASE_URL`

---

## Step 2 — Anthropic API Key

1. Go to **console.anthropic.com**
2. API Keys → Create Key
3. Copy and save as `ANTHROPIC_API_KEY`

---

## Step 3 — Deploy to Vercel

1. Push this folder to a **GitHub repo** (github.com → New repo → upload or push)
2. Go to **vercel.com** → New Project → Import your GitHub repo
3. Framework preset: **Next.js** (auto-detected)
4. Before deploying, add Environment Variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Neon connection string |
| `ANTHROPIC_API_KEY` | Your Anthropic key |
| `CRON_SECRET` | Any long random string (e.g. `dfs_morning_2026_bri`) |
| `NEXT_PUBLIC_APP_URL` | Leave blank for now, add after deploy |

5. Click **Deploy**
6. Once live, copy your URL (e.g. `https://dark-feminine-sage.vercel.app`)
7. Go back to Vercel → Settings → Environment Variables → add:
   - `NEXT_PUBLIC_APP_URL` = your Vercel URL
8. **Redeploy** (Deployments → click the three dots → Redeploy)

Your dashboard is now live! 🖤

---

## Step 4 — Morning Briefing via Cowork

1. Download **Cowork** from coworkapp.ai (free tier works)
2. Open Cowork → Automations → **+New**
3. **Trigger:** Schedule → Daily → 6:00 AM
4. **Action 1:** HTTP Request
   - Method: GET
   - URL: `https://YOUR-URL.vercel.app/api/briefing`
   - Headers: `x-cron-secret: your_CRON_SECRET_value`
5. **Action 2:** Send iMessage
   - To: your phone number
   - Body: `{{response.message}}` (or however Cowork references the previous step output)
6. Enable the automation

**To check off tasks by reply:**
Create a second automation:
- Trigger: Incoming iMessage starting with "done"
- Action: HTTP Request POST to `/api/briefing` with body `{"reply": "{{message}}"}`

---

## Step 5 — Google Calendar (optional)

If you want today's calendar events in your briefing:

1. Go to **console.cloud.google.com**
2. New Project → Enable **Google Calendar API**
3. Credentials → Create Credentials → OAuth 2.0 Client ID
   - Type: Web application
   - Authorized redirect URIs: `https://YOUR-URL.vercel.app/api/auth/google/callback`
4. Copy Client ID and Client Secret
5. Add to Vercel env vars:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` = `https://YOUR-URL.vercel.app/api/auth/google/callback`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = same as Client ID
6. Redeploy
7. In your dashboard → Settings → Connect Google Calendar
8. Authorize → copy the token JSON shown → paste as `GOOGLE_TOKENS` in Vercel env vars → redeploy once more

---

## Your Cron Schedule

`vercel.json` is already set up to call `/api/briefing` at 11:00 AM UTC = **6:00 AM CT**.

If you're on Daylight Saving Time (CST = UTC-6), update to `0 12 * * *`.

---

## Customizing Habits

Default habits are defined in `src/types/index.ts` in the `DEFAULT_HABITS` array. You can add, remove, or change any of the 8 habits. Sections: `wellness`, `brand`, `spiritual`, `learning`.

---

## Tech Stack

- **Next.js 14** (App Router)
- **Neon** (serverless Postgres)
- **Anthropic Claude** (AI astrology readings)
- **Google Calendar API** (optional, for briefing)
- **Vercel** (hosting + cron jobs)
- **Cowork** (Mac automation → iMessage)
- **Fonts:** Cormorant Garamond + DM Sans

---

*Built for Bri. Dark Feminine Sage ✦*
