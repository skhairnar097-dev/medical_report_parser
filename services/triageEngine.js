const { all } = require('../db/index');

/**
 * Emergency Clinical Triage Engine
 * Evaluates extracted biomarkers, radiology impressions, and symptom NLP matches
 * against evidence-based medical thresholds to determine urgency and the exact right medical specialist.
 */

async function evaluateTriage(parsedData, rawText = '') {
    const { biomarkers = [], radiologyFlags = [], symptomMatch = null } = parsedData;

    // Fetch all triage protocols from database
    let protocols = [];
    try {
        protocols = await all('SELECT * FROM triage_protocols');
    } catch (e) {
        protocols = [];
    }

    const protocolMap = {};
    for (const p of protocols) {
        protocolMap[p.biomarker_key] = p;
    }

    const analyzedBiomarkers = [];
    let overallSeverity = 'STABLE';
    let primarySpecialtyId = null;
    let criticalReason = '';

    // 1. Evaluate Quantitative Laboratory Biomarkers
    for (const bm of biomarkers) {
        const proto = protocolMap[bm.key];
        if (!proto) continue;

        let status = 'NORMAL';
        let severityScore = 0; // 0 = normal, 1 = warning, 2 = critical
        let flagNote = 'Within normal physiological range.';

        const val = bm.value;

        // Check if value breaches critical thresholds
        const hasCriticalMax = proto.critical_threshold_max !== null && proto.critical_threshold_max !== undefined;
        const hasCriticalMin = proto.critical_threshold_min !== null && proto.critical_threshold_min !== undefined;

        if (hasCriticalMax && val >= proto.critical_threshold_max) {
            status = 'CRITICAL';
            severityScore = 2;
            flagNote = `DANGEROUSLY ELEVATED (${val} ${bm.unit} vs Critical Cutoff ${proto.critical_threshold_max} ${bm.unit})`;
        } else if (hasCriticalMin && val <= proto.critical_threshold_min) {
            status = 'CRITICAL';
            severityScore = 2;
            flagNote = `CRITICALLY DEPLETED (${val} ${bm.unit} vs Critical Cutoff ${proto.critical_threshold_min} ${bm.unit})`;
        } else if (proto.normal_max !== null && val > proto.normal_max) {
            status = 'ELEVATED';
            severityScore = 1;
            flagNote = `Moderately elevated above normal ceiling (${proto.normal_max} ${bm.unit})`;
        } else if (proto.normal_min !== null && val < proto.normal_min) {
            status = 'LOW';
            severityScore = 1;
            flagNote = `Subnormal below normal baseline (${proto.normal_min} ${bm.unit})`;
        }

        analyzedBiomarkers.push({
            key: bm.key,
            name: proto.display_name,
            value: bm.value,
            unit: bm.unit,
            normalRange: `${proto.normal_min ?? 0} - ${proto.normal_max ?? 'N/A'} ${proto.unit}`,
            status,
            severityScore,
            flagNote,
            laymanExplanation: proto.layman_explanation,
            clinicalRisk: proto.clinical_risk_explanation,
            immediateFirstAid: proto.immediate_first_aid_action,
            associatedSpecialtyId: proto.associated_specialty_id
        });

        // Escalate overall severity
        if (severityScore === 2) {
            overallSeverity = 'CRITICAL';
            primarySpecialtyId = proto.associated_specialty_id;
            criticalReason = `${proto.display_name} is ${flagNote}. Urgent emergency intervention required.`;
        } else if (severityScore === 1 && overallSeverity !== 'CRITICAL') {
            overallSeverity = 'URGENT';
            if (!primarySpecialtyId) {
                primarySpecialtyId = proto.associated_specialty_id;
            }
        }
    }

    // 2. Check radiology emergency flags (e.g., Acute Appendicitis, STEMI, Stroke)
    if (radiologyFlags && radiologyFlags.length > 0) {
        for (const rf of radiologyFlags) {
            overallSeverity = 'CRITICAL';
            primarySpecialtyId = rf.specialty_id;
            criticalReason = `Diagnostic findings indicate: ${rf.term.toUpperCase()}. ${rf.risk}`;
            analyzedBiomarkers.push({
                key: 'radiology_finding',
                name: `Impression: ${rf.term.toUpperCase()}`,
                value: 'POSITIVE',
                unit: 'Diagnostic Finding',
                normalRange: 'Negative / Unremarkable',
                status: 'CRITICAL',
                severityScore: 2,
                flagNote: 'Acute surgical or medical emergency',
                laymanExplanation: rf.risk,
                clinicalRisk: rf.risk,
                immediateFirstAid: 'Do not administer food or water. Transport immediately to an acute surgical/trauma facility.',
                associatedSpecialtyId: rf.specialty_id
            });
        }
    }

    // 3. Check Symptom & NLP Specialty Match (Crucial for Non-Cardiac & Symptom Uploads)
    if (symptomMatch && symptomMatch.specialty_id) {
        // If no critical biomarker overrode it, or if symptom match is strong
        if (!primarySpecialtyId || overallSeverity === 'STABLE') {
            primarySpecialtyId = symptomMatch.specialty_id;
            if (overallSeverity === 'STABLE') {
                overallSeverity = 'URGENT';
            }
            if (!criticalReason) {
                criticalReason = `Diagnostic intake and symptoms indicate ${symptomMatch.name}. Matched keywords: ${symptomMatch.matchedWords.join(', ')}.`;
            }
        }
    }

    // 4. Fallback if completely unmapped (no symptoms, no biomarkers)
    if (!primarySpecialtyId) {
        primarySpecialtyId = 'SPEC_CARDIO';
    }

    return {
        overallSeverity, // 'CRITICAL' | 'URGENT' | 'STABLE'
        triageCode: overallSeverity === 'CRITICAL' ? 'RED' : (overallSeverity === 'URGENT' ? 'YELLOW' : 'GREEN'),
        criticalReason: criticalReason || (overallSeverity === 'STABLE' ? 'All analyzed laboratory biomarkers are within expected safe physiological limits.' : 'Abnormal values detected requiring medical attention.'),
        analyzedBiomarkers,
        primarySpecialtyId,
        specialtyCategory: symptomMatch ? symptomMatch.category : null,
        timestamp: new Date().toISOString()
    };
}

module.exports = { evaluateTriage };
