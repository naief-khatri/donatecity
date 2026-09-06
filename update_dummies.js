const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: profiles } = await supabase.from('profiles').select('*');
  console.log(profiles.map(p => p.username));
  
  // Make Alice anonymous
  const alice = profiles.find(p => p.username === 'AliceEco' || p.username.includes('AliceEco'));
  if (alice) {
    const clean = alice.username.replace('___ANON', '').replace('___NOVISIT', '');
    await supabase.from('profiles').update({ username: clean + '___ANON' }).eq('id', alice.id);
    await supabase.from('cities').update({ name: "Anonymous's City" }).eq('owner_id', alice.id);
  }

  // Make Bob disable visits
  const bob = profiles.find(p => p.username === 'BobBuilder' || p.username.includes('BobBuilder'));
  if (bob) {
    const clean = bob.username.replace('___ANON', '').replace('___NOVISIT', '');
    await supabase.from('profiles').update({ username: clean + '___NOVISIT' }).eq('id', bob.id);
    await supabase.from('cities').update({ name: clean + "'s City" }).eq('owner_id', bob.id);
  }
  
  console.log("Updated Alice to Anon and Bob to NoVisit");
}
run();
