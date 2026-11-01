const { get, all } = require('../db/index');

/**
 * Comprehensive Anti-Misdirection Specialty Catalog
 * Provides evidence-based clinical guidance and anti-misdirection warnings
 * for all major specialties in the emergency network.
 */
const SPECIALTY_CATALOG = {
    SPEC_CARDIO: {
        id: 'SPEC_CARDIO',
        authorizedSpecialtyName: 'Interventional Cardiology',
        subSpecialty: 'Acute Coronary Syndromes, STEMI & Emergency Angioplasty',
        category: 'Cardiology',
        requiredQualification: 'MBBS, MD (Medicine), DM / DNB (Cardiology), FESC',
        description: 'Super-specialized in acute heart attack rescue, primary percutaneous coronary intervention (PPCI), and emergency cardiac catheterization.',
        goldenHourMinutes: 60,
        misdirectedSpecialties: [
            'General Physician / Family Doctor',
            'Orthopedic Doctor / Spine Specialist',
            'Gastroenterologist (Mistaking chest pain for acidity)',
            'Homeopathic / Unverified Clinic'
        ],
        dangerExplanation: 'CRITICAL WARNING: Panicking families frequently confuse acute heart attack pain (chest pressure radiating to left arm/jaw) with acidity or muscular strain, leading them to local clinics or orthopedic doctors. A general clinic lacks a Cardiac Catheterization Lab (Cath Lab). Every 30 minutes of delay causes irreversible cardiac muscle death. STEMI requires emergency balloon angioplasty within the 90-minute Golden Hour.'
    },
    SPEC_NEPHRO: {
        id: 'SPEC_NEPHRO',
        authorizedSpecialtyName: 'Nephrology & Renal Critical Care',
        subSpecialty: 'Acute Kidney Injury (AKI), Dialysis & Hyperkalemia Emergencies',
        category: 'Nephrology',
        requiredQualification: 'MBBS, MD (General Medicine), DM (Nephrology)',
        description: 'Specializes in severe renal shutdown, urgent dialysis intervention, electrolyte crisis, and acute metabolic acidosis.',
        goldenHourMinutes: 120,
        misdirectedSpecialties: [
            'General Physician',
            'General Surgeon',
            'Urologist (Urologists handle surgical kidneys, not medical AKI/shutdown)',
            'Local Pharmacy / Over-the-counter painkillers'
        ],
        dangerExplanation: 'DANGEROUS MISDIRECTION: High serum creatinine (> 3.5 mg/dL) indicates acute medical renal failure. Relatives frequently rush to surgical urologists or general practitioners. General clinics attempt IV fluid loading which can trigger fatal pulmonary edema (fluid in lungs) and sudden cardiac arrest from hyperkalemia (high potassium). Immediate Nephrology intervention and emergency hemodialysis are vital.'
    },
    SPEC_NEURO: {
        id: 'SPEC_NEURO',
        authorizedSpecialtyName: 'Neurovascular Surgery & Stroke Neurology',
        subSpecialty: 'Acute Ischemic Stroke, Intracranial Hemorrhage & Brain Aneurysms',
        category: 'Neurology',
        requiredQualification: 'MBBS, MS (Surgery), MCh (Neurosurgery) / DM (Neurology)',
        description: 'Emergency stroke thrombolysis, mechanical thrombectomy, and surgical decompression for acute intracranial catastrophes.',
        goldenHourMinutes: 90,
        misdirectedSpecialties: [
            'Physiotherapist',
            'Ophthalmologist / Eye Clinic',
            'General Physician / ENT Specialist',
            'Massage / Chiropractic Clinic'
        ],
        dangerExplanation: 'PERMANENT DISABILITY RISK: Sudden facial asymmetry, slurred speech, or limb weakness are often misdiagnosed as pinched nerves or vertigo by non-specialists. Acute ischemic stroke brain cells die at 2 million neurons per minute. Thrombolysis (IV tPA) must occur within 4.5 hours and mechanical thrombectomy within 6 hours at a designated Comprehensive Stroke Center.'
    },
    SPEC_ORTHO: {
        id: 'SPEC_ORTHO',
        authorizedSpecialtyName: 'Spine Surgery & Emergency Orthopedics',
        subSpecialty: 'Acute Spine Disc Herniation, Fractures & Trauma',
        category: 'Orthopedics',
        requiredQualification: 'MBBS, MS (Orthopedics), DNB (Ortho), Fellowship in Spine Surgery',
        description: 'Surgical repair of complex fractures, spine cord decompression, and acute musculoskeletal trauma.',
        goldenHourMinutes: 180,
        misdirectedSpecialties: [
            'Unqualified Bone-Setters / Traditional Healers',
            'General Physician',
            'Massage Therapists / Acupressure',
            'Homeopathic Pain Centers'
        ],
        dangerExplanation: 'IRREVERSIBLE PARALYSIS WARNING: Severe spine trauma or cauda equina syndrome with progressive leg weakness requires urgent surgical decompression. Visiting unqualified bone setters or waiting with pain sprays risks permanent nerve damage, paralysis, and permanent bladder/bowel incontinence.'
    },
    SPEC_PULMO: {
        id: 'SPEC_PULMO',
        authorizedSpecialtyName: 'Pulmonology & Critical Care / ARDS Care',
        subSpecialty: 'Severe Hypoxemic Respiratory Failure & Mechanical Ventilation',
        category: 'Pulmonology',
        requiredQualification: 'MBBS, MD (Respiratory Medicine), DM (Critical Care)',
        description: 'Intensive mechanical ventilation, high-flow nasal cannula (HFNC), and ECMO management for severe lung compromise.',
        goldenHourMinutes: 30,
        misdirectedSpecialties: [
            'General Outpatient Doctor',
            'ENT (Ear, Nose, Throat) Clinic',
            'Homeopathic Cough Clinic',
            'Over-the-counter Cough Syrup Shops'
        ],
        dangerExplanation: 'HYPOXIC BRAIN DAMAGE: Oxygen saturation dropping below 88% or severe arterial blood gas hypoxemia cannot be stabilized with oral cough syrups or nebulizers in small outpatient clinics. Relatives waste precious minutes while the patient risks hypoxic brain injury and sudden respiratory arrest. Requires immediate ICU admission with invasive ventilator support.'
    },
    SPEC_SURG_GI: {
        id: 'SPEC_SURG_GI',
        authorizedSpecialtyName: 'Emergency Surgical Gastroenterology & Acute Trauma',
        subSpecialty: 'Peritonitis, Acute Perforated Appendicitis & Septic Abdomen',
        category: 'Surgery',
        requiredQualification: 'MBBS, MS (General Surgery), DNB (Surgical Gastroenterology)',
        description: 'Emergency laparoscopic and open surgical interventions for life-threatening acute abdominal emergencies.',
        goldenHourMinutes: 180,
        misdirectedSpecialties: [
            'General Physician',
            'Homeopathic / Ayurvedic Clinic',
            'Non-surgical Gastroenterologist',
            'Pharmacy Antacid Self-Medication'
        ],
        dangerExplanation: 'FATAL SEPSIS DANGER: Acute lower quadrant abdominal pain with fever and severe leukocytosis is frequently mistreated with oral antacids and antispasmodics. A ruptured appendix causes fecal peritonitis, systemic septic shock, and multi-organ failure if emergency surgical decontamination is delayed beyond 6 hours.'
    },
    SPEC_HEPATO: {
        id: 'SPEC_HEPATO',
        authorizedSpecialtyName: 'Hepatology & Liver Critical Care',
        subSpecialty: 'Acute Hepatic Failure, Cirrhosis & Portal Hypertension',
        category: 'Hepatology',
        requiredQualification: 'MBBS, MD (Medicine), DM (Hepatology / Gastroenterology)',
        description: 'Specializes in severe jaundice, liver failure, hepatic encephalopathy, and gastrointestinal bleeding from varices.',
        goldenHourMinutes: 120,
        misdirectedSpecialties: [
            'Ayurvedic Herbal Treatment for Jaundice',
            'General Physician',
            'Unverified Liver Tonic Sellers'
        ],
        dangerExplanation: 'SEVERE ENCEPHALOPATHY RISK: Severe jaundice with elevated bilirubin and hepatic dysfunction requires specialized hepatology monitoring. Herbal remedies can trigger toxic drug-induced liver injury (DILI), worsening liver coma and acute coagulopathy.'
    },
    SPEC_PAED: {
        id: 'SPEC_PAED',
        authorizedSpecialtyName: 'Pediatrics & Child Health',
        subSpecialty: 'Pediatric Critical Care & Neonatal Emergencies',
        category: 'Paediatrics',
        requiredQualification: 'MBBS, MD (Pediatrics), DCH, DNB (Pediatrics)',
        description: 'Specialized healthcare for infants, toddlers, and adolescents facing acute infections, dehydration, and pediatric distress.',
        goldenHourMinutes: 60,
        misdirectedSpecialties: [
            'Adult General Physician',
            'Adult Emergency Clinic',
            'Alternative Medicine Centers'
        ],
        dangerExplanation: 'DOSAGE TOXICITY WARNING: Children have distinct physiology, weight-based drug metabolisms, and rapid decompensation patterns. Adult practitioners frequently prescribe improper antibiotic/fluid dosages that can cause pediatric shock or organ strain.'
    },
    SPEC_ENDO: {
        id: 'SPEC_ENDO',
        authorizedSpecialtyName: 'Diabetology & Endocrinology',
        subSpecialty: 'Diabetic Ketoacidosis (DKA) & Metabolic Crises',
        category: 'Endocrinology',
        requiredQualification: 'MBBS, MD (Medicine), DM (Endocrinology) / Fellowship in Diabetology',
        description: 'Specialized care for acute glycemic spikes, DKA, hyperosmolar state, and endocrine emergencies.',
        goldenHourMinutes: 90,
        misdirectedSpecialties: [
            'Unverified Diet Clinics',
            'Herbal Diabetes Cure Sellers',
            'General Pharmacist Adjusting Insulin'
        ],
        dangerExplanation: 'METABOLIC COLLAPSE RISK: Extreme blood sugar elevations (> 350 mg/dL) with ketonuria can trigger lethal diabetic ketoacidosis (DKA) with cerebral edema and severe electrolyte imbalances requiring ICU insulin infusion protocols.'
    },
    SPEC_DERMA: {
        id: 'SPEC_DERMA',
        authorizedSpecialtyName: 'Dermatology & Skin Emergency',
        subSpecialty: 'Severe Cutaneous Drug Reactions, Anaphylaxis & Bullous Diseases',
        category: 'Dermatology',
        requiredQualification: 'MBBS, MD (Dermatology, Venereology & Leprosy - DVD/DNB)',
        description: 'Expertise in acute severe skin rashes, toxic epidermal necrolysis, severe allergies, and cutaneous emergencies.',
        goldenHourMinutes: 120,
        misdirectedSpecialties: [
            'Beauty Salons / Cosmetic Centers',
            'General Store Ointments (Steroid misuse)',
            'Homeopathic Skin Clinics'
        ],
        dangerExplanation: 'STEROID OVERUSE DANGER: Using random topical steroid creams on undiagnosed skin eruptions masks bacterial/fungal infections and can cause skin atrophy and systemic absorption hazards.'
    },
    SPEC_ENT: {
        id: 'SPEC_ENT',
        authorizedSpecialtyName: 'ENT (Ear, Nose, Throat) Specialist',
        subSpecialty: 'Acute Airway Obstruction, Severe Epistaxis & Otology',
        category: 'ENT',
        requiredQualification: 'MBBS, MS (ENT / Otolaryngology), DLO',
        description: 'Comprehensive management of nasal bleeding, acute foreign body inhalation, tonsillar abscess, and inner ear emergencies.',
        goldenHourMinutes: 60,
        misdirectedSpecialties: [
            'General Physician',
            'Audiology Shops without ENT Surgeons',
            'Dentist for Throat Complaints'
        ],
        dangerExplanation: 'AIRWAY COMPROMISE: Uncontrolled epistaxis (nosebleeds) or retropharyngeal infections can obstruct breathing pathways. Immediate surgical visualization and cautery/packing by an ENT surgeon is required.'
    },
    SPEC_HEMATO: {
        id: 'SPEC_HEMATO',
        authorizedSpecialtyName: 'Clinical Hematology & Transfusion Medicine',
        subSpecialty: 'Severe Thrombocytopenia, Hemorrhagic Emergencies & Coagulopathy',
        category: 'Hematology',
        requiredQualification: 'MBBS, MD (Pathology / Medicine), DM (Clinical Hematology)',
        description: 'Specializes in acute blood disorders, severe platelet destruction (Dengue Shock Syndrome / ITP), and emergency apheresis transfusions.',
        goldenHourMinutes: 90,
        misdirectedSpecialties: [
            'Local Neighborhood Clinic',
            'Ayurvedic / Herbal Practitioners (Home remedies like papaya leaf juice)',
            'General Outpatient Doctor'
        ],
        dangerExplanation: 'LETHAL DELAY: When platelets plunge below 20,000 /uL in Dengue or severe coagulopathy, patients face imminent spontaneous intracranial (brain) hemorrhage or internal bleeding. Waiting for home remedies or outpatient antibiotics while delaying single-donor platelet (SDP) apheresis in a hospital with an approved blood bank is frequently fatal.'
    }
};

async function getSpecialtyGuidance(specialtyId) {
    if (!specialtyId) {
        specialtyId = 'SPEC_CARDIO';
    }

    // Try database first
    let specialty = null;
    try {
        specialty = await get('SELECT * FROM specialties WHERE id = ?', [specialtyId]);
    } catch (e) {
        specialty = null;
    }

    if (specialty) {
        let misdirectedSpecialties = [];
        try {
            misdirectedSpecialties = JSON.parse(specialty.misdirected_specialties);
        } catch (e) {
            misdirectedSpecialties = [specialty.misdirected_specialties];
        }

        return {
            id: specialty.id,
            authorizedSpecialtyName: specialty.name,
            subSpecialty: specialty.sub_specialty,
            category: specialty.category,
            requiredQualification: specialty.required_qualification,
            description: specialty.description,
            goldenHourMinutes: specialty.golden_hour_minutes || 60,
            antiMisdirection: {
                dangerousWrongSpecialties: misdirectedSpecialties,
                dangerExplanation: specialty.misdirection_danger_explanation,
                whyIncorrect: `Visiting these non-specialized providers risks delayed intervention, inappropriate symptomatic medication, and crossing the ${specialty.golden_hour_minutes || 60}-minute critical golden treatment window.`,
                clinicalStandardDirective: `Consult strictly an authorized ${specialty.name} practitioner holding ${specialty.required_qualification} at an equipped hospital.`
            }
        };
    }

    // Fallback to built-in catalog
    const catalogItem = SPECIALTY_CATALOG[specialtyId] || SPECIALTY_CATALOG.SPEC_CARDIO;
    return {
        id: catalogItem.id,
        authorizedSpecialtyName: catalogItem.authorizedSpecialtyName,
        subSpecialty: catalogItem.subSpecialty,
        category: catalogItem.category,
        requiredQualification: catalogItem.requiredQualification,
        description: catalogItem.description,
        goldenHourMinutes: catalogItem.goldenHourMinutes,
        antiMisdirection: {
            dangerousWrongSpecialties: catalogItem.misdirectedSpecialties,
            dangerExplanation: catalogItem.dangerExplanation,
            whyIncorrect: `Visiting these non-specialized providers risks delayed intervention, inappropriate symptomatic medication, and crossing the ${catalogItem.goldenHourMinutes}-minute critical golden treatment window.`,
            clinicalStandardDirective: `Consult strictly an authorized ${catalogItem.authorizedSpecialtyName} practitioner holding ${catalogItem.requiredQualification} at an equipped hospital.`
        }
    };
}

module.exports = {
    getSpecialtyGuidance,
    SPECIALTY_CATALOG
};
