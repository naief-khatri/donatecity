const { createClient } = require('@supabase/supabase-js');

async function testApp() {
  require('dotenv').config({ path: '.env.local' });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  console.log("1. Testing Signup...");
  const testEmail = `test${Date.now()}@gmail.com`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'password123',
  });

  if (authError) {
    console.error("Signup failed:", authError.message);
    return;
  }
  console.log("Signup success! User ID:", authData.user.id);
}
testApp();
