# Urdu Voice Studio

> Type your script, get a natural-sounding Urdu voice-over in seconds.

A browser-based Urdu text-to-speech studio built with **Next.js 14 App Router**, **Supabase**, and the **Google Cloud TTS Chirp3-HD API**.

---

## Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Frontend    | Next.js 14 (App Router), TypeScript     |
| Styling     | Tailwind CSS (custom dark design system)|
| Auth        | Supabase Auth (email + Google OAuth)    |
| Database    | Supabase Postgres                       |
| Storage     | Supabase Storage (`voiceovers` bucket)  |
| TTS         | Google Cloud TTS Chirp3-HD REST API     |
| Payments    | Lemon Squeezy (subscriptions + webhooks)|

---

## Quick Start

### 1. Clone & install
```bash
cd urdu-voice-studio
npm install
```

### 2. Environment variables
Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

| Variable                          | Description                                  |
|-----------------------------------|----------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`        | Your Supabase project URL                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Supabase anon key (safe for client)          |
| `SUPABASE_SERVICE_ROLE_KEY`       | Supabase service role (server-side only)     |
| `GOOGLE_TTS_API_KEY`              | Restricted Google Cloud TTS API key          |
| `LEMON_SQUEEZY_WEBHOOK_SECRET`    | Lemon Squeezy signing secret                 |
| `NEXT_PUBLIC_LEMON_CHECKOUT_*`    | Lemon Squeezy checkout URLs                  |

### 3. Supabase setup
Run the schema in `supabase/schema.sql` via the Supabase SQL editor.

Enable **Google OAuth** in Supabase Auth → Providers.

### 4. Run dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Pages

| Route         | Description                        | Protected |
|---------------|------------------------------------|-----------|
| `/`           | Landing page, pricing, FAQ         | No        |
| `/auth/login` | Sign in (email + Google)           | No        |
| `/auth/register` | Create account                  | No        |
| `/studio`     | TTS editor — core feature          | ✅        |
| `/projects`   | Saved voice-over projects          | ✅        |
| `/account`    | Plan, quota, upgrade               | ✅        |

---

## API Routes

| Route                    | Method | Description                                |
|--------------------------|--------|--------------------------------------------|
| `/api/voices`            | GET    | Fetch Urdu + English voices from Google TTS (cached 24h) |
| `/api/tts/generate`      | POST   | Auth + quota check, synthesize, upload, save project |
| `/api/lemon/webhook`     | POST   | Lemon Squeezy subscription lifecycle handler |
| `/auth/callback`         | GET    | OAuth redirect handler                     |

---

## Voices

Urdu voices are fetched **live** from the Google TTS API. As of launch (2026-10-08):

| Voice Name                    | Gender |
|-------------------------------|--------|
| `ur-IN-Chirp3-HD-Achernar`    | Female |
| `ur-IN-Chirp3-HD-Achird`      | Male   |

Any future Urdu voices released by Google will appear automatically.

---

## Quota System

| Plan    | Characters/month | Price   |
|---------|-----------------|---------|
| Free    | 5,000           | $0      |
| Starter | 100,000         | $9/mo   |
| Pro     | 500,000         | $29/mo  |

Quota is enforced **server-side** on every `/api/tts/generate` call. Returns `402` with `{error:"quota_exceeded"}` when over limit.

---

## Security

- Google TTS API key is **never** sent to the browser — all synthesis goes through `/api/tts/generate`
- Supabase RLS ensures users can only access their own profiles and projects
- Lemon Squeezy webhook verifies HMAC-SHA256 signature before processing

---

## License

MIT
