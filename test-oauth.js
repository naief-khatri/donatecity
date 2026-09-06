const { createClient } = require('@supabase/supabase-js');

async function testOAuth() {
  require('dotenv').config({ path: '.env.local' });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `http://localhost:3000/auth/callback`,
    },
  });

  console.log("OAuth Data:", data);
  console.log("OAuth Error:", error);
}

testOAuth();
