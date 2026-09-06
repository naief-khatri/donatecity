-- Donations table: source of truth for all donation events
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    campaign_slug TEXT NOT NULL,
    campaign_name TEXT,
    organization_name TEXT,
    cause TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    charge_id TEXT UNIQUE,
    sequence INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- City buildings table: derived/cached city layout (one row per unique campaign building)
CREATE TABLE city_buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    campaign_slug TEXT NOT NULL,
    campaign_name TEXT,
    cause TEXT NOT NULL,
    asset_id TEXT NOT NULL DEFAULT 'climate',
    level INTEGER NOT NULL DEFAULT 1,
    total_donated NUMERIC NOT NULL DEFAULT 0,
    donation_count INTEGER NOT NULL DEFAULT 1,
    grid_x INTEGER NOT NULL,
    grid_y INTEGER NOT NULL,
    plot_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(city_id, campaign_slug),
    UNIQUE(city_id, plot_index)
);

-- Add city-level stats columns
ALTER TABLE cities ADD COLUMN IF NOT EXISTS layout_version INTEGER DEFAULT 1;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS city_level INTEGER DEFAULT 1;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS total_donated NUMERIC DEFAULT 0;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS campaigns_supported INTEGER DEFAULT 0;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS causes_supported INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_buildings ENABLE ROW LEVEL SECURITY;

-- Donations RLS: users can view their own donations
CREATE POLICY "Users can view own donations" ON donations FOR SELECT USING (auth.uid() = user_id);
-- Service role can insert/update donations (via webhooks)

-- City buildings RLS: public viewing (for visit feature)
CREATE POLICY "Public city buildings are viewable by everyone" ON city_buildings FOR SELECT USING (true);
-- Service role can insert/update city_buildings (via webhooks)

-- Donations are also publicly viewable in limited form (for visited cities)
-- We create a separate policy that allows viewing donation counts/causes for public city visits
CREATE POLICY "Public can view donations for public cities" ON donations FOR SELECT USING (true);
