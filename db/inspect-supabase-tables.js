require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function inspectSupabase() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Inspecting existing tables in Supabase...');

    // Test tables
    const candidateTables = [
        'doctors', 'doctor', 'Doctors', 'Doctor',
        'specialties', 'specialty',
        'hospitals', 'hospital',
        'triage_protocols', 'protocols',
        'triage_logs', 'logs',
        'emergency_shares', 'shares'
    ];

    for (const t of candidateTables) {
        try {
            const { data, error, count } = await supabase.from(t).select('*', { count: 'exact' }).limit(5);
            if (!error) {
                console.log(`\n✅ Table Found: "${t}" with ${count !== null ? count : data.length} rows.`);
                if (data && data.length > 0) {
                    console.log(`   Columns in "${t}":`, Object.keys(data[0]));
                    console.log(`   Sample row:`, JSON.stringify(data[0], null, 2));
                } else {
                    console.log(`   (Table exists but is currently empty)`);
                }
            } else if (error.code !== 'PGRST205' && !error.message.includes('Could not find the table')) {
                console.log(`⚠️ Table "${t}" error:`, error.message);
            }
        } catch (e) {
            // ignore missing
        }
    }
}

inspectSupabase();

