const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: cities } = await supabase.from('cities').select('id');
  for (const city of cities) {
    const { data: donations } = await supabase.from('donations').select('campaign_slug, cause').eq('city_id', city.id);
    if (!donations) continue;
    const uniqueCampaigns = new Set(donations.map(d => d.campaign_slug)).size;
    const uniqueCauses = new Set(donations.map(d => d.cause)).size;
    await supabase.from('cities').update({ campaigns_supported: uniqueCampaigns, causes_supported: uniqueCauses }).eq('id', city.id);
  }
  console.log("Fixed stats for all cities.");
}
run();
