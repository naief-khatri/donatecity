const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EVERY_ORG_API_KEY = process.env.EVERY_ORG_API_KEY;

const CAUSES = [
  { id: 'climate', name: 'Climate', emoji: '🌍', building: 'Park' },
  { id: 'wildfires', name: 'Wildfires', emoji: '🔥', building: 'Fire Station' },
  { id: 'refugees', name: 'Refugees', emoji: '🏠', building: 'Shelter' },
  { id: 'food', name: 'Food security', emoji: '🍚', building: 'Farm' },
  { id: 'health', name: 'Health', emoji: '🏥', building: 'Hospital' },
  { id: 'mental-health', name: 'Mental health', emoji: '🧠', building: 'Clinic' },
  { id: 'water', name: 'Water', emoji: '💧', building: 'Well' },
];

async function seed() {
  console.log('Clearing old campaigns...');
  await supabase.from('campaigns').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  for (const cause of CAUSES) {
    console.log(`Fetching nonprofits for ${cause.name}...`);
    try {
      const res = await fetch(`https://partners.every.org/v0.2/browse/${cause.id}?apiKey=${EVERY_ORG_API_KEY}&take=3`);
      const data = await res.json();
      
      const nonprofits = data.nonprofits || [];
      const campaignsToInsert = nonprofits.map(np => ({
        slug: np.slug,
        name: np.name,
        description: np.description || '',
        logo_url: np.logoUrl || '',
        cause_category: cause.id,
        building_type: cause.building,
        internal_rank: 10,
      }));

      if (campaignsToInsert.length > 0) {
        const { error } = await supabase.from('campaigns').upsert(campaignsToInsert, { onConflict: 'slug' });
        if (error) {
          console.error(`Error inserting ${cause.name}:`, error.message);
        } else {
          console.log(`Inserted ${campaignsToInsert.length} nonprofits for ${cause.name}`);
        }
      }
    } catch (e) {
      console.error(`Fetch failed for ${cause.name}:`, e.message);
    }
  }
  console.log('Done!');
}

seed();
