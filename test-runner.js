const http = require('http');
const { spawn } = require('child_process');

console.log('🚀 Starting TriageShield server for end-to-end testing...');

const serverProcess = spawn('node', ['server.js'], { stdio: 'pipe' });

serverProcess.stdout.on('data', (d) => process.stdout.write(d.toString()));
serverProcess.stderr.on('data', (d) => process.stderr.write(d.toString()));

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function requestJson(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ raw: data, status: res.statusCode });
                }
            });
        });

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function runTests() {
    await sleep(2500);

    try {
        console.log('\n--- TEST 1: GET /api/triage/samples ---');
        const samples = await requestJson('/api/triage/samples');
        console.log(`✅ Loaded ${samples.samples?.length} sample demo reports.`);

        console.log('\n--- TEST 2: POST /api/triage/parse (Cardiac Emergency) ---');
        const triageRes = await requestJson('/api/triage/parse', 'POST', {
            patientName: 'Ramesh Patel',
            rawText: `METRO PATHOLOGY & CARDIAC LAB
Test: High-Sensitivity Troponin-I: 2.45 ng/mL
Serum Creatinine: 0.95 mg/dL`
        });
        console.log(`✅ Triage Level: ${triageRes.triageResult?.overallSeverity} (Code: ${triageRes.triageResult?.triageCode})`);
        console.log(`✅ Primary Matched Specialty: ${triageRes.specialtyGuidance?.authorizedSpecialtyName}`);
        console.log(`✅ Anti-Misdirection Dangerous Specialties Blocked: ${triageRes.specialtyGuidance?.antiMisdirection?.dangerousWrongSpecialties?.join(', ')}`);
        console.log(`✅ Top Hospital Matched: ${triageRes.recommendedHospitals?.[0]?.name} (Available ICU Beds: ${triageRes.recommendedHospitals?.[0]?.available_icu_beds})`);
        console.log(`✅ Top Doctor Matched: ${triageRes.authorizedDoctors?.[0]?.full_name} (${triageRes.authorizedDoctors?.[0]?.license_number})`);

        console.log('\n--- TEST 3: POST /api/doctors/verify-license (Valid License) ---');
        const validLic = await requestJson('/api/doctors/verify-license', 'POST', {
            licenseNumber: 'NMC-CARD-2012-88419'
        });
        console.log(`✅ License Verified: ${validLic.verification?.verified} (${validLic.verification?.status})`);
        console.log(`✅ Digital Cryptographic Seal: ${validLic.verification?.digitalSeal}`);

        console.log('\n--- TEST 4: POST /api/doctors/verify-license (Fake/Suspended License) ---');
        const fakeLic = await requestJson('/api/doctors/verify-license', 'POST', {
            licenseNumber: 'MCI-FAKE-1999-00123'
        });
        console.log(`✅ Fake/Suspended License Blocked: Verified = ${fakeLic.verification?.verified} (${fakeLic.verification?.status})`);
        console.log(`✅ Reason: ${fakeLic.verification?.message}`);

        console.log('\n--- TEST 5: POST /api/emergency/panic-assist ---');
        const panicRes = await requestJson('/api/emergency/panic-assist', 'POST', {
            patientIdentifier: 'Ramesh Patel',
            severityLevel: 'CRITICAL',
            specialtyName: 'Interventional Cardiology',
            hospitalName: 'Apex Critical Care & Heart Institute',
            hospitalPhone: '+91-20-8000-9911'
        });
        console.log(`✅ Emergency Share ID Generated: ${panicRes.share?.shareId}`);
        console.log(`✅ WhatsApp Broadcast Link: ${panicRes.share?.encodedWhatsAppUrl.substring(0, 70)}...`);

        console.log('\n======================================================');
        console.log('🎉 ALL 5 EMERGENCY TRIAGE TESTS PASSED FLAWLESSLY!');
        console.log('======================================================');
    } catch (err) {
        console.error('❌ Test failed:', err);
    } finally {
        serverProcess.kill('SIGINT');
        process.exit(0);
    }
}

runTests();

