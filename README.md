<img width="1774" height="887" alt="donate city" src="https://github.com/user-attachments/assets/8f4fa8c8-4d9c-48ba-95d6-ee16b133d0d3" />

# Donate City

**Donate City** is a gamified, interactive donation platform where every real-world charitable contribution physically builds and expands a personal, isometric 2D city. 

By integrating with the **Every.org API**, users can discover trending global crises or search for any registered charity, donate directly, and instantly see their impact visualized as custom buildings, roads, and bustling city grids.

You can check the demo [here](https://youtu.be/HsY17rV_0yA)



---

## ✨ Key Features

* 🎮 **Isometric City Engine:** Powered by Phaser.js, the game dynamically generates terrain, roads, and plots. As you donate, your city physically expands.
* 📈 **Dynamic Building Upgrades:** Donate to a new cause to place a new building. Donate again to the same cause, and that building levels up, becoming larger and more impressive.
* 🌍 **Real World Impact:** Fully integrated with Every.org. Users donate real money to 1M+ verified non-profits.
* 🎁 **Gift a Donation:** Donate on behalf of a friend! Use their username to instantly upgrade their city, or use an email to send an invite. When they sign up, their gifted buildings are automatically placed in their new city via secure database triggers.
* 🏆 **Competitive Leaderboards:** Fight for the #1 spot on the Daily (24h) and All-Time leaderboards. See how much you need to outgive the top player.
* 🚁 **City Visiting:** Click on any player in the leaderboard to fly over to their city, inspect their buildings, and view their donation history.
* 🤖 **AI Trending Crises:** A secure, automated background job uses Google Gemini AI to scan live global news feeds, surfacing urgent humanitarian crises (wildfires, earthquakes, etc.) directly in the app.
* 🧪 **Test Mode:** A robust developer test mode that bypasses actual payments, instantly simulating Every.org webhooks to let you build test cities rapidly.

---

## 🛠 Tech Stack

* **Framework:** Next.js 16 (App Router, Turbopack)
* **Language:** TypeScript
* **Styling:** Tailwind CSS v4
* **Game Engine:** Phaser 3 (WebGL/Canvas)
* **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Triggers)
* **Donation API:** Every.org
* **AI Integration:** Google Gemini (`@google/genai`)

---

## 🚀 Getting Started (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy the example environment file and fill in your keys:
```bash
cp .env.example .env.local
```

### 3. Database Setup (Supabase)
Ensure you have the Supabase CLI installed, link your project, and push the database migrations. The migrations automatically set up the schema, triggers, and Row Level Security (RLS) policies.
```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

### 4. Run the Development Server
```bash
npm run dev
```
Visit `http://localhost:3000` to start building!

---

## 🔑 Environment Variables Guide

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key for Supabase client-side requests. |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret admin key for backend webhooks and secure API routes. |
| `EVERY_ORG_API_KEY` | Your API key from Every.org to search and fetch nonprofits. |
| `EVERY_ORG_WEBHOOK_SECRET` | Used to verify incoming webhook payloads from Every.org. |
| `TEST_MODE` / `NEXT_PUBLIC_TEST_MODE` | Set to `true` to simulate donations natively without hitting the Stripe/Every.org checkout. |
| `NEXT_PUBLIC_SITE_URL` | Your domain (e.g., `http://localhost:3000` or `https://donatecity.com`). Used for checkout redirects. |
| `CRON_SECRET` | A secure, random string (e.g., `openssl rand -hex 32`) used to protect your automated cron routes. |
| `NANO_BANANA_API_KEY` | Your Google Gemini API Key, used for AI parsing of global crisis news. |

---

## 🌐 Deployment Guide (Vercel)

1. Push your code to a GitHub repository.
2. Import the project into **Vercel**.
3. In the Vercel dashboard, navigate to **Settings > Environment Variables** and paste all the variables from your `.env.local`. 
4. Ensure `TEST_MODE` is set to `false` for production.
5. Deploy the project!

### Configuring the Cron Job
Vercel will automatically detect the `vercel.json` (if present) for cron jobs. To secure your cron jobs:
1. Generate a random string.
2. Add it as `CRON_SECRET` in your Vercel Environment Variables.
3. Vercel automatically sends this secret as a Bearer token when it triggers `/api/cron/trending-events`.

---

## 🔗 Every.org Webhook Setup (Crucial)

For live donations to successfully update user cities, you must configure a webhook in your Every.org partner dashboard.

### How it works:
When a user clicks "Donate", our backend (`/api/donate/intent`) generates an Every.org checkout URL. We attach a `partner_metadata` payload containing the user's `cityId`, `userId`, and `campaignSlug`. When the user pays, Every.org fires a webhook back to us containing that exact metadata.

### Configuration Steps:
1. Log into your **Every.org Partner Dashboard**.
2. Navigate to **Webhooks** or **Developer Settings**.
3. Add a new Webhook Endpoint:
   * **URL:** `https://your-production-domain.com/api/webhooks/every`
   * **Events to listen for:** `charge.succeeded`
4. Copy the **Webhook Secret** provided by Every.org.
5. Add this secret to your Vercel Environment Variables as `EVERY_ORG_WEBHOOK_SECRET`.
6. Redeploy your app.

---

## 💾 Database Architecture 

* **`profiles`**: Tied to Supabase Auth. Stores usernames, display names, bios, and social links.
* **`cities`**: Every user gets one city automatically created via a PostgreSQL trigger upon signup. Tracks total stats (`total_donated`, `campaigns_supported`).
* **`donations`**: The ultimate source of truth. Every successful webhook creates a row here. The Phaser engine reads this table to deterministically generate the city map on the fly.
* **`gifted_donations`**: A holding table for donations sent to unregistered emails. When a user signs up with a matching email, a database trigger automatically ports these records into the main `donations` table, seamlessly rewarding them for their gifts.
