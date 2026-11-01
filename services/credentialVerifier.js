const crypto = require('crypto');
const { get, run, all } = require('../db/index');

const VERIFICATION_SALT = 'AURA_MED_VERIFICATION_SECRET_SALT_2026';

/**
 * Computes a verifiable cryptographic digital seal for a doctor's credentials.
 */
function generateVerificationSeal(licenseNumber, qualification, authority) {
    const rawData = `${licenseNumber.trim().toUpperCase()}|${qualification.trim()}|${authority.trim()}|${VERIFICATION_SALT}`;
    const hash = crypto.createHash('sha256').update(rawData).digest('hex');
    return `SEAL-SHA256:${hash.substring(0, 32).toUpperCase()}`;
}

/**
 * Verifies a doctor license against the National Medical Registry
 */
async function verifyDoctorLicense(licenseNumber) {
    if (!licenseNumber) {
        return { verified: false, message: 'License number is required.' };
    }

    const cleanLicense = licenseNumber.trim();
    const registryEntry = await get(
        'SELECT * FROM national_medical_registry WHERE UPPER(license_number) = UPPER(?)',
        [cleanLicense]
    );

    if (!registryEntry) {
        return {
            verified: false,
            status: 'UNREGISTERED',
            message: `License '${cleanLicense}' was not found in the National Medical Commission (NMC) registry. Doctor is unverified.`
        };
    }

    if (registryEntry.council_status !== 'ACTIVE') {
        return {
            verified: false,
            status: registryEntry.council_status,
            registryData: registryEntry,
            message: `License '${cleanLicense}' is currently ${registryEntry.council_status}. Disciplinary actions on record: ${registryEntry.disciplinary_actions}. Platform badge cannot be granted.`
        };
    }

    const digitalSeal = generateVerificationSeal(
        registryEntry.license_number,
        registryEntry.registered_qualification,
        'National Medical Commission'
    );

    return {
        verified: true,
        status: 'ACTIVE_VERIFIED',
        registryData: registryEntry,
        digitalSeal,
        verifiedAt: new Date().toISOString(),
        message: `Official National Medical Commission credentials verified for ${registryEntry.practitioner_name}. Sub-specialty: ${registryEntry.sub_specialty}.`
    };
}

module.exports = {
    generateVerificationSeal,
    verifyDoctorLicense
};

