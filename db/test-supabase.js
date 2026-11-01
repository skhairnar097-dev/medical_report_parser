require('dotenv').config();
const { isPostgres, pgPool, initializeDatabase, all } = require('./index');
const { seedDatabase } = require('./seed');

async function testSupabaseConnection() {
    console.log('=======================================================');
    console.log('🔍 Testing Supabase PostgreSQL Database Connection...');
    console.log('=======================================================');

    const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    if (!dbUrl) {
        console.log('⚠️ DATABASE_URL is not set in .env.');
        console.log('👉 Please paste your Supabase connection URI into the .env file:');
        console.log('   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres\n');
        process.exit(1);
    }

    try {
        const timeRes = await pgPool.query('SELECT NOW() as current_time, current_database() as db_name, version()');
        console.log('✅ Successfully connected to Supabase PostgreSQL!');
        console.log('🕒 Server Time:', timeRes.rows[0].current_time);
        console.log('📦 Database Name:', timeRes.rows[0].db_name);
        console.log('ℹ️ Version:', timeRes.rows[0].version.split(' on ')[0]);

        console.log('\n📦 Initializing relational schema (schema-postgres.sql)...');
        await initializeDatabase();

        console.log('\n🌱 Populating seed data into Supabase...');
        await seedDatabase();

        console.log('\n🔍 Verifying seeded tables in Supabase:');
        const specs = await all('SELECT COUNT(*) as count FROM specialties');
        const hosps = await all('SELECT COUNT(*) as count FROM hospitals');
        const docs = await all('SELECT COUNT(*) as count FROM doctors');
        const protos = await all('SELECT COUNT(*) as count FROM triage_protocols');

        console.log(`   - Specialties: ${specs[0].count}`);
        console.log(`   - Hospitals: ${hosps[0].count}`);
        console.log(`   - Verified Doctors: ${docs[0].count}`);
        console.log(`   - Triage Protocols: ${protos[0].count}`);

        console.log('\n=======================================================');
        console.log('🎉 SUPABASE DATABASE IS 100% READY & SYNCED!');
        console.log('=======================================================');
        process.exit(0);
    } catch (err) {
        console.error('❌ Supabase Connection or Setup Failed:', err.message);
        if (err.message.includes('password authentication failed')) {
            console.error('👉 Tip: Check the database password you provided in DATABASE_URL.');
        } else if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
            console.error('👉 Tip: Check the host URL/project reference in DATABASE_URL.');
        }
        process.exit(1);
    }
}

testSupabaseConnection();

