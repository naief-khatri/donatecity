const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  const dummyUsers = [
    { email: 'alice@example.com', username: 'AliceEco' },
    { email: 'bob@example.com', username: 'BobBuilder' },
    { email: 'charlie@example.com', username: 'CharlieCharity' }
  ];
  
  for (const u of dummyUsers) {
    const { data: users } = await supabase.auth.admin.listUsers();
    let existing = users.users.find(x => x.email === u.email);
    if (!existing) continue;
    let userId = existing.id;
    
    await supabase.from('profiles').upsert({ id: userId, username: u.username });
    
    // get existing city
    let { data: city } = await supabase.from('cities').select('*').eq('owner_id', userId).single();
    if (!city) {
      const { data: newCity } = await supabase.from('cities').insert({ owner_id: userId, name: `${u.username}'s City` }).select().single();
      city = newCity;
    }
    
    await supabase.from('donations').delete().eq('city_id', city.id);

    const campaigns = [
      { slug: 'cool-earth', name: 'Cool Earth', cause: 'climate' },
      { slug: 'water-org', name: 'Water.org', cause: 'water' },
      { slug: 'save-children', name: 'Save the Children', cause: 'children' }
    ];
    
    let total = 0;
    let seq = 1;
    for (const c of campaigns) {
      const amount = Math.floor(Math.random() * 150) + 10;
      total += amount;
      await supabase.from('donations').insert({
        user_id: userId,
        city_id: city.id,
        campaign_slug: c.slug,
        campaign_name: c.name,
        cause: c.cause,
        amount,
        sequence: seq++
      });
    }
    
    await supabase.from('cities').update({ total_donated: total, campaigns_supported: 3, causes_supported: 3 }).eq('id', city.id);
  }
  console.log("Seeded properly!");
}
seed();
