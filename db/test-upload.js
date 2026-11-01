const http = require('http');
const fs = require('fs');

fs.writeFileSync('temp_test.pdf', 'dummy content');

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
let body = '';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="reportFile"; filename="Patient_Kidney_KFT_Report.pdf"\r\n';
body += 'Content-Type: application/pdf\r\n\r\n';
body += fs.readFileSync('temp_test.pdf');
body += '\r\n--' + boundary + '--\r\n';

const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/triage/parse',
    method: 'POST',
    headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': Buffer.byteLength(body)
    }
}, (res) => {
    let resBody = '';
    res.on('data', chunk => resBody += chunk);
    res.on('end', () => {
        const json = JSON.parse(resBody);
        console.log('UPLOAD FILE TEST: Patient_Kidney_KFT_Report.pdf');
        console.log('Suggested Specialty:', json.specialtyGuidance ? json.specialtyGuidance.authorizedSpecialtyName : 'N/A');
        console.log('Doctors matched from Supabase:');
        if (json.authorizedDoctors) {
            json.authorizedDoctors.forEach(d => console.log('  -> ' + d.full_name + ' (' + d.qualification + ' - ' + d.hospital_name + ')'));
        }
        if (fs.existsSync('temp_test.pdf')) fs.unlinkSync('temp_test.pdf');
    });
});
req.write(body);
req.end();

