require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testSupabase() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

    console.log('Testing Supabase Client...');
    console.log('URL:', supabaseUrl);
    console.log('Key prefix:', supabaseKey ? supabaseKey.substring(0, 15) + '...' : 'none');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test a basic call
    const { data, error } = await supabase.from('specialties').select('*').limit(1);
    if (error) {
        console.log('Supabase API response error code:', error.code, 'message:', error.message);
        if (error.code === 'PGRST205' || error.message.includes('relation "public.specialties" does not exist') || error.message.includes('Could not find the table')) {
            console.log('✅ Connected to Supabase successfully! (Tables have not been created yet in Supabase).');
        }
    } else {
        console.log('✅ Connected to Supabase successfully! Found rows:', data ? data.length : 0);
    }
}

testSupabase();

