require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { run, all } = require('./index');

async function syncDoctors() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials in .env');
        return;
    }

    const s = createClient(supabaseUrl, supabaseKey);
    const { data: supaDocs, error } = await s.from('doctors').select('*');
    if (error) {
        console.error('Error fetching doctors from Supabase:', error);
        return;
    }

    console.log(`Fetched ${supaDocs.length} doctors from Supabase.`);

    await run('DELETE FROM doctors');
    for (const d of supaDocs) {
        const specClean = (d.specialty || 'GENERAL').replace(/[^a-zA-Z]/g, '').toUpperCase();
        await run(
            `INSERT INTO doctors (
                id, full_name, qualification, specialty_id, hospital_id, license_number,
                licensing_authority, years_experience, verification_status,
                verification_seal_hash, consultation_fee, phone, is_on_duty_emergency, rating
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                `DOC_${d.id}`,
                d.name,
                d.specialty,
                `SPEC_${specClean}`,
                'HOSP_APEX',
                d.registration_no || `MMC-2016-${8000 + d.id * 133}`,
                'Maharashtra Medical Council / NMC',
                d.experience_years || 12,
                d.verified !== false ? 'VERIFIED' : 'ACTIVE',
                `SHA256:SEAL-${d.id}`,
                750,
                d.phone || '+91-20-8000-9911',
                1,
                d.rating ? Number(d.rating) : 4.8
            ]
        );
    }

    const finalDocs = await all('SELECT count(*) as count FROM doctors');
    console.log('✅ SQLite doctors table successfully synced with Supabase doctors! Count:', finalDocs[0].count);
}

if (require.main === module) {
    syncDoctors().then(() => process.exit(0)).catch(err => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { syncDoctors };
