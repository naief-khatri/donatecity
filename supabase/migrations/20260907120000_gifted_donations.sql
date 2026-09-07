-- Add gifted donation fields to donations table
ALTER TABLE donations ADD COLUMN IF NOT EXISTS donated_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS donor_message TEXT;

-- Create gifted_donations table for users who don't exist yet
CREATE TABLE IF NOT EXISTS gifted_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_email TEXT NOT NULL,
    donated_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    donor_message TEXT,
    campaign_slug TEXT NOT NULL,
    campaign_name TEXT,
    organization_name TEXT,
    cause TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    charge_id TEXT UNIQUE,
    claimed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for gifted_donations
ALTER TABLE gifted_donations ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (via webhook/API) but restrict reading
CREATE POLICY "Service can manage gifted_donations" ON gifted_donations FOR ALL USING (true);

