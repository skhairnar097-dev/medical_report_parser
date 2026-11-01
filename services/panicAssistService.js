const { v4: uuidv4 } = require('uuid');
const { run, get } = require('../db/index');

/**
 * Calculates straight-line distance in kilometers between two GPS coordinates
 * using the Haversine formula.
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
}

/**
 * Generates an emergency share package for family members
 */
async function createEmergencyShare(payload) {
    const {
        patientIdentifier = 'Family Member',
        severityLevel = 'CRITICAL',
        criticalReason = 'Severe diagnostic anomaly detected',
        biomarkers = [],
        specialtyName = 'Emergency Specialist',
        hospitalName = 'Apex Critical Care & Heart Institute',
        hospitalPhone = '+91-20-8000-9911',
        hospitalLat = 18.52043,
        hospitalLon = 73.85674,
        patientLat = 18.525,
        patientLon = 73.850
    } = payload;

    const shareId = `SOS-${uuidv4().substring(0, 8).toUpperCase()}`;
    const hospitalMapUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospitalLat},${hospitalLon}`;
    const patientLocationUrl = patientLat ? `https://www.google.com/maps?q=${patientLat},${patientLon}` : null;

    // Format red flags summary
    const keyBiomarkerText = biomarkers
        .filter(b => b.status === 'CRITICAL' || b.status === 'ELEVATED')
        .map(b => `• ${b.name}: ${b.value} ${b.unit} (${b.status})`)
        .join('\n');

    const summaryText = `🚨 *EMERGENCY MEDICAL TRIAGE ALERT* 🚨
*Patient:* ${patientIdentifier}
*Urgency Level:* ${severityLevel} (RED ALERT)
*Required Specialty:* ${specialtyName}

⚠️ *Critical Report Findings:*
${keyBiomarkerText || '• ' + criticalReason}

🏥 *Recommended Hospital:*
*${hospitalName}*
📞 *Emergency Desk:* ${hospitalPhone}
📍 *Live Emergency Navigation:* ${hospitalMapUrl}
${patientLocationUrl ? `📍 *Patient Current Location:* ${patientLocationUrl}` : ''}

_Generated via TriageShield AI Emergency Medical Network_`;

    const encodedWhatsAppUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`;

    // Save record to emergency_shares table
    await run(
        `INSERT INTO emergency_shares (id, patient_identifier, summary_text, severity_level, hospital_name, hospital_phone, hospital_map_url, patient_location_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [shareId, patientIdentifier, summaryText, severityLevel, hospitalName, hospitalPhone, hospitalMapUrl, patientLocationUrl]
    );

    return {
        shareId,
        summaryText,
        encodedWhatsAppUrl,
        hospitalMapUrl,
        patientLocationUrl,
        hospitalPhone
    };
}

module.exports = {
    calculateDistanceKm,
    createEmergencyShare
};

