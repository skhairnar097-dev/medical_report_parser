const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'medical_triage.sqlite'));
const schema = fs.readFileSync(path.join(__dirname, 'schema-postgres.sql'), 'utf8');

function escapeSql(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return val;
    return "'" + String(val).replace(/'/g, "''") + "'";
}

async function exportSql() {
    let out = '-- ================================================================\n';
    out += '-- SUPABASE COMPLETE ONE-CLICK SETUP & DATA SEEDING SCRIPT\n';
    out += '-- Run this entire file in Supabase SQL Editor (https://supabase.com)\n';
    out += '-- ================================================================\n\n';
    out += schema + '\n\n';

    const tables = ['specialties', 'hospitals', 'doctors', 'national_medical_registry', 'triage_protocols'];

    for (const t of tables) {
        await new Promise((resolve, reject) => {
            db.all('SELECT * FROM ' + t, [], (err, rows) => {
                if (err) return reject(err);
                if (!rows || !rows.length) return resolve();
                out += '-- -----------------------------------------------------\n';
                out += '-- Data for ' + t + '\n';
                out += '-- -----------------------------------------------------\n';
                for (const row of rows) {
                    const cols = Object.keys(row);
                    const vals = cols.map(c => escapeSql(row[c]));
                    out += 'INSERT INTO ' + t + ' (' + cols.join(', ') + ') VALUES (' + vals.join(', ') + ') ON CONFLICT DO NOTHING;\n';
                }
                out += '\n';
                resolve();
            });
        });
    }

    const targetPath = path.join(__dirname, 'supabase-complete-setup.sql');
    fs.writeFileSync(targetPath, out, 'utf8');
    console.log('✅ Generated db/supabase-complete-setup.sql successfully! Total size:', out.length, 'bytes');
    db.close();
}

exportSql().catch(err => {
    console.error('Export error:', err);
    process.exit(1);
});

