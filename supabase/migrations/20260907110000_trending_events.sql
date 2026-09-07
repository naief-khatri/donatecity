CREATE TABLE trending_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    research_summary TEXT NOT NULL,
    cause_category TEXT NOT NULL,
    campaign_slug TEXT NOT NULL,
    campaign_name TEXT NOT NULL,
    campaign_description TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE trending_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON trending_events FOR SELECT USING (true);
