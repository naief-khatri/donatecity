const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  await supabase.from('cities').delete().eq('id', '3d215580-8504-4b06-8db0-cf0962e4f613');
  await supabase.from('cities').delete().eq('id', 'cff83b74-cadb-4e58-bd6e-442e9b094e36');
  await supabase.from('cities').delete().eq('id', '90759828-483f-4da2-a58d-5d74700a15f5');
  console.log("Deleted duplicates.");
}
run();
