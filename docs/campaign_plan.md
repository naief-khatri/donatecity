# Campaign Sync & Ranking Plan

## Overview
To provide players with dynamic, real-world causes to support, we will fetch and sync nonprofits from Every.org into our local Supabase database. This allows us to implement our own internal ranking system (e.g., highlighting urgent global needs, trending nonprofits, or personalized recommendations) without hammering the Every.org API on every page load.

## Database Schema (Proposed)

We will create a new table `campaigns` in Supabase:

```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL, -- The Every.org identifier
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    cause_category TEXT NOT NULL, -- e.g., 'environment', 'health'
    building_type TEXT NOT NULL,  -- Mapped game building (e.g., 'Park', 'Hospital')
    internal_rank INTEGER DEFAULT 0, -- Higher number = higher priority on UI
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Cause to Building Mapping Strategy
We will map Every.org causes to in-game buildings:
- `health` -> 🏥 **Hospital**
- `education` -> 🏫 **School**
- `water` -> 💧 **Well**
- `environment` / `climate` -> 🌲 **Park**
- `animals` -> 🐾 **Animal Shelter**

## Sync Strategy (Cron Job)

Instead of querying Every.org for every user, we will use a **Next.js Route Handler** triggered by a cron job (e.g., Vercel Cron or GitHub Actions) running daily or hourly.

### The Sync API (`/api/cron/sync-campaigns`)
1. **Fetch from Every.org:**
   We will call the Every.org Browse API for specific high-priority causes:
   `GET https://partners.every.org/v0.2/browse/health?apiKey=...`
   `GET https://partners.every.org/v0.2/browse/education?apiKey=...`
   
2. **Transform Data:**
   Map the returned nonprofits to our `campaigns` schema. Assign the correct `building_type` based on the cause.

3. **Upsert to Supabase:**
   Using the Supabase Admin client, we perform an upsert on the `campaigns` table using the `slug` as the conflict target.
   
## Internal Ranking & Curation
- **Algorithm:** The `internal_rank` can be dynamically updated based on:
  - **Global Needs:** We can manually boost the rank of charities responding to current global crises.
  - **Popularity:** We can join the `campaigns` table with the `buildings` table to count how many users have built for a specific charity, boosting the rank of trending charities.
- **UI Fetching:** The `CampaignList` React component will simply query our local Supabase `campaigns` table ordered by `internal_rank DESC` limit 10.

## Feasibility & Next Steps
**Is this possible?** Yes, completely feasible. Every.org's `/v0.2/browse/:cause` endpoint is perfectly suited for this. 

**Steps to Implement:**
1. Run the SQL to create the `campaigns` table.
2. Build the `/api/cron/sync-campaigns` endpoint in Next.js.
3. Update `CampaignList.tsx` to read from the database instead of the hardcoded `MOCK_CAMPAIGNS`.
