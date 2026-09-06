const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fetchCamps() {
  const { data, error } = await supabase.from('campaigns').select('*');
  if (error) {
    console.error(error);
  } else {
    data.forEach(c => {
      console.log(`[${c.cause_category}] ${c.name} (${c.building_type}): ${c.description.substring(0, 100)}...`);
    });
  }
}
fetchCamps();
