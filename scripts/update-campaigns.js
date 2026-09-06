const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function update() {
  await supabase.from('campaigns').update({ cause_category: 'climate', building_type: 'Forest' }).eq('slug', 'onetreeplanted');
  await supabase.from('campaigns').update({ cause_category: 'children', building_type: 'Youth Center' }).eq('slug', '1111-media-impact');
  await supabase.from('campaigns').update({ cause_category: 'climate', building_type: 'Windmill' }).eq('slug', 'sute');
  await supabase.from('campaigns').update({ cause_category: 'energy', building_type: 'Solar Farm' }).eq('slug', 'lighted-impact-foundation');
  
  console.log('Database updated successfully!');
}
update();
