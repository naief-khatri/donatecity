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
    let userId;
    
    // Check if auth user exists
    const { data: users } = await supabase.auth.admin.listUsers();
    let existing = users.users.find(x => x.email === u.email);
    
    if (!existing) {
        const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
            email: u.email,
            password: 'password123',
            email_confirm: true
        });
        if (authErr) { console.error("Auth err:", authErr); continue; }
        userId = authUser.user.id;
    } else {
        userId = existing.id;
    }
    
    const { error: pErr } = await supabase.from('profiles').upsert({
      id: userId,
      username: u.username,
    });
    
    let { data: city, error: cErr } = await supabase.from('cities').upsert({
      id: userId,
      owner_id: userId,
      name: `${u.username}'s City`,
      total_donated: 0,
    }).select().single();
    
    await supabase.from('donations').delete().eq('city_id', userId);

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
  console.log("Seeded!");
}
seed();
