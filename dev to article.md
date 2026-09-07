*This is a submission for [Weekend Challenge: Generosity Edition](https://dev.to/challenges/weekend-2026-09-03)*

## What I Built
I built a gamified donation platform where every donation helps you build and grow your own virtual city. Donations to different causes unlock or upgrade buildings, giving donors a visual sense of their impact.

The platform also includes leaderboards and challenges, turning donations into a fun, social experience. You can even donate on behalf of someone else, helping build their city and encouraging them to join and donate themselves.

The goal is simple: **make giving more engaging, visible, and motivating, while encouraging people to donate more.**


## How I Built It
I built the core platform using **Next.js (App Router)** and **Supabase (PostgreSQL & Auth)**. Here are the most important technical highlights:

* **Deterministic Isometric City Engine:** I integrated **Phaser 3** directly into the React tree. The city's grid, roads, and buildings are generated entirely on the fly based on a user's chronological donation history fetched from Supabase.
* **Seamless Webhook Integration:** The app uses the **Every.org API**. When a user clicks donate, I generate a checkout URL attaching specific `partner_metadata`. A secure server-side webhook receives the payment confirmation and instantly levels up the user's city.
* **Database Triggers for Gifting:** To handle gifting donations to unregistered friends, I used Supabase PostgreSQL triggers. Gifts are staged in a hidden table, and the moment a friend signs up with that email, a trigger fires to automatically insert the buildings into their new city.
* **AI-Powered Live Crises:** I built an automated background cron job using **Google Gemini AI**. It constantly scrapes global news feeds and uses an LLM to categorize and surface urgent humanitarian emergencies directly into the app's donation modal in real-time.
* **On-the-Fly Asset Generation:** To ensure the game can scale to millions of charities, I used the **Nano Banana API** to dynamically generate isometric building assets on the fly. Whenever a user donates to a completely new cause, or a building levels up, the API instantly generates the new 2D isometric sprite. This completely eliminates the need to manually draw assets for every possible charity or building upgrade level.

Beyond the core stack, I rounded out the gamified experience with several smaller mechanics: the ability to **"fly" and visit** other players' cities to view their donation history, **dynamic building levels** that visually upgrade as causes hit funding thresholds, and an **Outbid system** on the daily leaderboards to encourage friendly competition.

## Prize Categories
**Best Use of Google AI:** I integrated Google AI in two powerful ways. First, I used **Google Gemini** to power the core discovery mechanic, parsing live unstructured global news feeds into actionable charity categories to surface real-world crises. Second, I used the **Nano Banana API** to dynamically generate custom isometric 2D assets on the fly whenever a user unlocks a new cause or building level, allowing the visual city to scale infinitely without manual asset creation.
<!-- Thanks for participating! -->