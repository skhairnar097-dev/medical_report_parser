/**
 * Emergency Medical Report OCR & Biomarker Parsing Engine
 * Extracts diagnostic test parameters, numerical values, units, and radiological impressions
 * from medical laboratory and diagnostic imaging reports across all medical specialties.
 */

// Comprehensive clinical regex patterns for multi-format diagnostic reports
const BIOMARKER_PATTERNS = [
    {
        key: 'troponin_i',
        name: 'High-Sensitivity Troponin-I',
        regex: /(?:troponin[\s\-_]i|hs[\s\-_]ctni|cardiac\s*troponin|troponin\s*t)[\s:=]+([0-9.]+)\s*(ng\/ml|pg\/ml|ug\/l)?/i,
        unit: 'ng/mL',
        normalize: (val, unit) => {
            let num = parseFloat(val);
            if (unit && unit.toLowerCase() === 'pg/ml') {
                return num / 1000; // normalize pg/mL to ng/mL
            }
            return num;
        }
    },
    {
        key: 'serum_creatinine',
        name: 'Serum Creatinine',
        regex: /(?:serum\s*creatinine|s\.\s*creatinine|creatinine)[\s:=]+([0-9.]+)\s*(mg\/dl|umol\/l)?/i,
        unit: 'mg/dL',
        normalize: (val, unit) => {
            let num = parseFloat(val);
            if (unit && unit.toLowerCase().includes('umol')) {
                return parseFloat((num / 88.4).toFixed(2)); // umol/L to mg/dL
            }
            return num;
        }
    },
    {
        key: 'platelet_count',
        name: 'Platelet Count',
        regex: /(?:platelet\s*count|total\s*platelet|thrombocytes|platelets)[\s:=]+([0-9,.]+)\s*(?:\/ul|\/cumm|lakhs?|lacs?|x10\^3)?/i,
        unit: '/uL',
        normalize: (val, rawText) => {
            let clean = String(val).replace(/,/g, '');
            let num = parseFloat(clean);
            if (num < 100 && (String(rawText).toLowerCase().includes('lakh') || String(rawText).toLowerCase().includes('lac'))) {
                num = num * 100000; // e.g. 0.22 lakhs -> 22000
            } else if (num < 1000 && !String(rawText).toLowerCase().includes('cumm')) {
                num = num * 1000; // e.g. 18 x 10^3 -> 18000
            }
            return Math.round(num);
        }
    },
    {
        key: 'd_dimer',
        name: 'D-Dimer Quantitative',
        regex: /(?:d[\s\-_]dimer|ddimer)[\s:=]+([0-9.]+)\s*(ug\/ml|ng\/ml|mg\/l|feu)?/i,
        unit: 'ug/mL FEU',
        normalize: (val, unit) => {
            let num = parseFloat(val);
            if (unit && unit.toLowerCase() === 'ng/ml') {
                return num / 1000;
            }
            return num;
        }
    },
    {
        key: 'hemoglobin',
        name: 'Hemoglobin (Hb)',
        regex: /(?:hemoglobin|haemoglobin|hb)[\s:=]+([0-9.]+)\s*(g\/dl|gm\/dl|g\/l)?/i,
        unit: 'g/dL',
        normalize: (val, unit) => {
            let num = parseFloat(val);
            if (unit && unit.toLowerCase() === 'g/l') {
                return num / 10;
            }
            return num;
        }
    },
    {
        key: 'total_bilirubin',
        name: 'Total Serum Bilirubin',
        regex: /(?:total\s*bilirubin|bilirubin[\s\-_]total|s\.\s*bilirubin)[\s:=]+([0-9.]+)\s*(mg\/dl|umol\/l)?/i,
        unit: 'mg/dL',
        normalize: (val) => parseFloat(val)
    },
    {
        key: 'wbc_count',
        name: 'Total Leukocyte Count (WBC / TLC)',
        regex: /(?:total\s*leukocyte\s*count|wbc\s*count|tlc|white\s*blood\s*cells)[\s:=]+([0-9,.]+)\s*(?:\/ul|\/cumm|cells\/cumm)?/i,
        unit: '/uL',
        normalize: (val) => Math.round(parseFloat(String(val).replace(/,/g, '')))
    },
    {
        key: 'blood_oxygen',
        name: 'Oxygen Saturation (SpO2)',
        regex: /(?:spo2|oxygen\s*saturation|pulse\s*oximetry|o2\s*saturation)[\s:=]+([0-9.]+)\s*(%)?/i,
        unit: '%',
        normalize: (val) => parseFloat(val)
    }
];

// Multi-specialty clinical keywords and symptoms taxonomy
const SPECIALTY_KEYWORDS = [
    {
        specialty_id: 'SPEC_NEPHRO',
        category: 'Nephrology',
        name: 'Nephrology & Renal Critical Care',
        keywords: [
            'kidney', 'creatinine', 'urea', 'bun', 'dialysis', 'urine', 'urination',
            'anuria', 'oliguria', 'nephro', 'nephrologist', 'proteinuria', 'hematuria',
            'kidney stone', 'renal failure', 'renal shutdown', 'swelling feet', 'kdigo', 'gfr',
            'edema', 'urinary tract', 'flank pain', 'burning urine'
        ]
    },
    {
        specialty_id: 'SPEC_NEURO',
        category: 'Neurology',
        name: 'Neurovascular Surgery & Stroke Neurology',
        keywords: [
            'brain', 'headache', 'migraine', 'stroke', 'paralysis', 'hemiplegia', 'aphasia',
            'slurred speech', 'facial droop', 'seizure', 'epilepsy', 'convulsion', 'fits',
            'unconscious', 'fainting', 'syncope', 'ct brain', 'mri brain', 'infarct',
            'hemorrhage', 'aneurysm', 'coma', 'numbness', 'tingling', 'neuro', 'neurosurgeon',
            'giddiness', 'vertigo', 'cranial', 'dense mca'
        ]
    },
    {
        specialty_id: 'SPEC_ORTHO',
        category: 'Orthopedics',
        name: 'Spine Surgery & Emergency Orthopedics',
        keywords: [
            'spine', 'back pain', 'sciatica', 'disc', 'herniated', 'spondylitis', 'bone',
            'fracture', 'joint pain', 'knee pain', 'ligament', 'tear', 'orthopedic', 'orthopedist',
            'spine surgeon', 'dislocation', 'x-ray fracture', 'neck pain', 'cervical', 'lumbar',
            'vertebra', 'walking difficulty', 'swollen knee'
        ]
    },
    {
        specialty_id: 'SPEC_PULMO',
        category: 'Pulmonology',
        name: 'Pulmonology & Critical Care / ARDS Care',
        keywords: [
            'cough', 'breathlessness', 'shortness of breath', 'dyspnea', 'wheezing', 'asthma',
            'copd', 'pneumonia', 'lungs', 'chest congestion', 'phlegm', 'spo2', 'oxygen saturation',
            'hypoxia', 'bronchitis', 'pulmonologist', 'inhaler', 'respiratory failure',
            'breathing difficulty', 'dry cough', 'oxygen low'
        ]
    },
    {
        specialty_id: 'SPEC_SURG_GI',
        category: 'Surgery',
        name: 'Emergency Surgical Gastroenterology & Acute Trauma',
        keywords: [
            'stomach pain', 'abdominal pain', 'belly pain', 'appendix', 'appendicitis', 'vomiting',
            'loose motion', 'diarrhea', 'ulcer', 'hernia', 'gallbladder', 'cholecystitis',
            'peritonitis', 'acute abdomen', 'blood in vomit', 'pancreatitis', 'digestive',
            'severe acidity', 'stomach ache', 'abdomen'
        ]
    },
    {
        specialty_id: 'SPEC_HEPATO',
        category: 'Hepatology',
        name: 'Hepatology & Liver Critical Care',
        keywords: [
            'liver', 'jaundice', 'bilirubin', 'yellow eyes', 'yellow skin', 'sgpt', 'sgot',
            'hepatitis', 'cirrhosis', 'ascites', 'fatty liver', 'hepatic', 'liver enzyme',
            'lft', 'dark urine'
        ]
    },
    {
        specialty_id: 'SPEC_PAED',
        category: 'Paediatrics',
        name: 'Pediatrics & Child Health',
        keywords: [
            'child', 'kid', 'baby', 'infant', 'toddler', 'newborn', 'pediatric', 'paediatric',
            'paediatrician', 'pediatrician', 'child fever', 'baby crying', 'child vomit'
        ]
    },
    {
        specialty_id: 'SPEC_ENDO',
        category: 'Endocrinology',
        name: 'Diabetology & Endocrinology',
        keywords: [
            'sugar', 'diabetes', 'diabetic', 'glucose', 'hba1c', 'hyperglycemia', 'hypoglycemia',
            'insulin', 'ketoacidosis', 'dka', 'thyroid', 'tsh', 'hypothyroid', 'hyperthyroid',
            'high sugar', 'low sugar'
        ]
    },
    {
        specialty_id: 'SPEC_DERMA',
        category: 'Dermatology',
        name: 'Dermatology & Skin Care',
        keywords: [
            'skin', 'rash', 'itching', 'eczema', 'acne', 'psoriasis', 'fungal infection',
            'allergy', 'hives', 'blister', 'boil', 'dermatologist', 'red spots'
        ]
    },
    {
        specialty_id: 'SPEC_ENT',
        category: 'ENT',
        name: 'ENT (Ear, Nose, Throat) Specialist',
        keywords: [
            'ear pain', 'ear', 'nose bleeding', 'epistaxis', 'throat pain', 'tonsils',
            'hearing loss', 'sinus', 'sinusitis', 'ear discharge', 'ent specialist', 'sore throat'
        ]
    },
    {
        specialty_id: 'SPEC_HEMATO',
        category: 'Hematology',
        name: 'Clinical Hematology & Transfusion Medicine',
        keywords: [
            'platelet', 'thrombocyte', 'dengue', 'hemoglobin', 'haemoglobin', 'anemia',
            'wbc', 'leukocyte', 'bleeding gums', 'purpura', 'petechiae', 'transfusion',
            'blood cancer', 'leukemia', 'blood test', 'cbc'
        ]
    },
    {
        specialty_id: 'SPEC_CARDIO',
        category: 'Cardiology',
        name: 'Interventional Cardiology',
        keywords: [
            'chest pain', 'heart attack', 'stemi', 'nstemi', 'angina', 'troponin', 'ecg',
            'heart', 'cardiac', 'palpitation', 'stent', 'angioplasty', 'bypass',
            'hypertension', 'high bp', 'blood pressure', 'd-dimer', 'cardiologist',
            'crushing chest pressure', 'pain in left arm'
        ]
    }
];

// Radiology and acute emergency text findings
const RADIOLOGY_EMERGENCY_KEYWORDS = [
    {
        term: 'acute appendicitis',
        specialty_id: 'SPEC_SURG_GI',
        urgency: 'CRITICAL',
        risk: 'Inflamed or perforated appendix with imminent risk of generalized peritonitis and septic shock.'
    },
    {
        term: 'perforated appendix',
        specialty_id: 'SPEC_SURG_GI',
        urgency: 'CRITICAL',
        risk: 'Ruptured appendix causing fecal peritonitis. Requires emergency laparotomy or laparoscopic decontamination.'
    },
    {
        term: 'stemi',
        specialty_id: 'SPEC_CARDIO',
        urgency: 'CRITICAL',
        risk: 'ST-Elevation Myocardial Infarction. Complete coronary arterial thrombosis. Requires urgent primary angioplasty.'
    },
    {
        term: 'acute ischemic stroke',
        specialty_id: 'SPEC_NEURO',
        urgency: 'CRITICAL',
        risk: 'Large vessel cerebral occlusion. Immediate brain tissue loss; requires urgent thrombolysis or mechanical thrombectomy.'
    },
    {
        term: 'intracranial hemorrhage',
        specialty_id: 'SPEC_NEURO',
        urgency: 'CRITICAL',
        risk: 'Active cerebral bleed with mass effect and intracranial pressure spike. Immediate neurosurgical consultation required.'
    },
    {
        term: 'pulmonary embolism',
        specialty_id: 'SPEC_CARDIO',
        urgency: 'CRITICAL',
        risk: 'Thrombus in pulmonary arterial tree impairing right ventricular function. Immediate ICU anticoagulation required.'
    }
];

/**
 * Intelligent Multi-Specialty Symptom & Diagnostic NLP Classifier
 * Evaluates any input text, symptom string, or filename to determine the most relevant medical field.
 */
function detectSpecialtyFromText(text, filename = '') {
    const combined = `${text || ''} ${filename || ''}`.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;

    for (const spec of SPECIALTY_KEYWORDS) {
        let score = 0;
        const matchedWords = [];

        for (const kw of spec.keywords) {
            if (combined.includes(kw.toLowerCase())) {
                const isHighPriority = ['child', 'baby', 'pediatric', 'infant', 'kidney', 'creatinine', 'stroke', 'brain', 'spine', 'liver', 'jaundice'].includes(kw.toLowerCase());
                score += isHighPriority ? 2 : 1;
                matchedWords.push(kw);
            }
        }

        if (score > highestScore) {
            highestScore = score;
            bestMatch = {
                specialty_id: spec.specialty_id,
                category: spec.category,
                name: spec.name,
                score,
                matchedWords
            };
        }
    }

    return bestMatch;
}

/**
 * Parses raw text extracted from a medical report (OCR output or manual input)
 * and extracts all identified clinical biomarkers, radiological findings, and symptom-specialty matches.
 */
function parseMedicalText(rawText, filename = '') {
    if (!rawText || typeof rawText !== 'string') {
        rawText = '';
    }

    const foundBiomarkers = [];
    const lines = rawText.split('\n');

    for (const biomarkerDef of BIOMARKER_PATTERNS) {
        let matched = false;
        for (const line of lines) {
            const match = line.match(biomarkerDef.regex);
            if (match) {
                const rawVal = match[1];
                const rawUnit = match[2] || '';
                const normalizedValue = biomarkerDef.normalize(rawVal, rawUnit || line);

                if (!isNaN(normalizedValue)) {
                    foundBiomarkers.push({
                        key: biomarkerDef.key,
                        name: biomarkerDef.name,
                        value: normalizedValue,
                        unit: biomarkerDef.unit,
                        rawExtractedText: match[0].trim()
                    });
                    matched = true;
                    break;
                }
            }
        }

        if (!matched) {
            const globalMatch = rawText.match(biomarkerDef.regex);
            if (globalMatch) {
                const rawVal = globalMatch[1];
                const rawUnit = globalMatch[2] || '';
                const normalizedValue = biomarkerDef.normalize(rawVal, rawUnit);

                if (!isNaN(normalizedValue)) {
                    foundBiomarkers.push({
                        key: biomarkerDef.key,
                        name: biomarkerDef.name,
                        value: normalizedValue,
                        unit: biomarkerDef.unit,
                        rawExtractedText: globalMatch[0].trim()
                    });
                }
            }
        }
    }

    // Check for acute radiology and clinical diagnosis terms
    const lowerText = rawText.toLowerCase();
    const foundRadiologyFlags = [];
    for (const item of RADIOLOGY_EMERGENCY_KEYWORDS) {
        if (lowerText.includes(item.term)) {
            foundRadiologyFlags.push({
                term: item.term,
                specialty_id: item.specialty_id,
                urgency: item.urgency,
                risk: item.risk
            });
        }
    }

    // Symptom-based multi-specialty NLP detection
    const symptomMatch = detectSpecialtyFromText(rawText, filename);

    return {
        biomarkers: foundBiomarkers,
        radiologyFlags: foundRadiologyFlags,
        symptomMatch
    };
}

module.exports = {
    parseMedicalText,
    detectSpecialtyFromText,
    BIOMARKER_PATTERNS,
    SPECIALTY_KEYWORDS,
    RADIOLOGY_EMERGENCY_KEYWORDS
};
