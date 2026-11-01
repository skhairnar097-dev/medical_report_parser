const { db, run, all } = require('./index');

async function seedDatabase() {
    try {
        console.log('🌱 Seeding Emergency Medical Triage database...');

        // 1. Clear existing seed data if needed
        await run('DELETE FROM emergency_shares');
        await run('DELETE FROM triage_logs');
        await run('DELETE FROM doctors');
        await run('DELETE FROM hospitals');
        await run('DELETE FROM triage_protocols');
        await run('DELETE FROM specialties');
        await run('DELETE FROM national_medical_registry');

        // 2. Insert Specialties & Anti-Misdirection Rules
        const specialties = [
            {
                id: 'SPEC_CARDIO',
                name: 'Interventional Cardiology',
                sub_specialty: 'Acute Coronary Syndromes, STEMI & Emergency Angioplasty',
                category: 'Cardiology',
                required_qualification: 'MBBS, MD (Medicine), DM / DNB (Cardiology), FESC',
                description: 'Super-specialized in acute heart attack rescue, primary percutaneous coronary intervention (PPCI), and emergency cardiac catheterization.',
                misdirected_specialties: JSON.stringify([
                    'General Physician / Family Doctor',
                    'Orthopedic Doctor / Spine Specialist',
                    'Gastroenterologist (Mistaking chest pain for acidity)',
                    'Homeopathic / Unverified Clinic'
                ]),
                misdirection_danger_explanation: 'CRITICAL WARNING: Panicking families frequently confuse acute heart attack pain (chest pressure radiating to left arm/jaw) with acidity or muscular strain, leading them to local clinics or orthopedic doctors. A general clinic lacks a Cardiac Catheterization Lab (Cath Lab). Every 30 minutes of delay causes irreversible cardiac muscle death. STEMI requires emergency balloon angioplasty within the 90-minute Golden Hour.',
                golden_hour_minutes: 60
            },
            {
                id: 'SPEC_NEPHRO',
                name: 'Nephrology & Renal Critical Care',
                sub_specialty: 'Acute Kidney Injury (AKI), Dialysis & Hyperkalemia Emergencies',
                category: 'Nephrology',
                required_qualification: 'MBBS, MD (General Medicine), DM (Nephrology)',
                description: 'Specializes in severe renal shutdown, urgent dialysis intervention, electrolyte crisis, and acute metabolic acidosis.',
                misdirected_specialties: JSON.stringify([
                    'General Physician',
                    'General Surgeon',
                    'Urologist (Urologists handle surgical kidneys, not medical AKI/shutdown)'
                ]),
                misdirection_danger_explanation: 'DANGEROUS MISDIRECTION: High serum creatinine (> 3.5 mg/dL) indicates acute medical renal failure. Relatives frequently rush to surgical urologists or general practitioners. General clinics attempt IV fluid loading which can trigger fatal pulmonary edema (fluid in lungs) and sudden cardiac arrest from hyperkalemia (high potassium). Immediate Nephrology intervention and emergency hemodialysis are vital.',
                golden_hour_minutes: 120
            },
            {
                id: 'SPEC_HEMATO',
                name: 'Clinical Hematology & Transfusion Medicine',
                sub_specialty: 'Severe Thrombocytopenia, Hemorrhagic Emergencies & Coagulopathy',
                category: 'Hematology',
                required_qualification: 'MBBS, MD (Pathology / Medicine), DM (Clinical Hematology)',
                description: 'Specializes in acute blood disorders, severe platelet destruction (Dengue Shock Syndrome / ITP), and emergency apheresis transfusions.',
                misdirected_specialties: JSON.stringify([
                    'Local Neighborhood Clinic',
                    'Ayurvedic / Herbal Practitioners (Home remedies like papaya leaf juice)',
                    'General Outpatient Doctor'
                ]),
                misdirection_danger_explanation: 'LETHAL DELAY: When platelets plunge below 20,000 /uL in Dengue or severe coagulopathy, patients face imminent spontaneous intracranial (brain) hemorrhage or internal bleeding. Waiting for home remedies or outpatient antibiotics while delaying single-donor platelet (SDP) apheresis in a hospital with an approved blood bank is frequently fatal.',
                golden_hour_minutes: 90
            },
            {
                id: 'SPEC_NEURO',
                name: 'Neurovascular Surgery & Stroke Neurology',
                sub_specialty: 'Acute Ischemic Stroke, Intracranial Hemorrhage & Brain Aneurysms',
                category: 'Neurology',
                required_qualification: 'MBBS, MS (Surgery), MCh (Neurosurgery) / DM (Neurology)',
                description: 'Emergency stroke thrombolysis, mechanical thrombectomy, and surgical decompression for acute intracranial catastrophes.',
                misdirected_specialties: JSON.stringify([
                    'Physiotherapist',
                    'Ophthalmologist / Eye Clinic',
                    'General Physician / ENT Specialist'
                ]),
                misdirection_danger_explanation: 'PERMANENT DISABILITY RISK: Sudden facial asymmetry, slurred speech, or limb weakness are often misdiagnosed as pinched nerves or vertigo by non-specialists. Acute ischemic stroke brain cells die at 2 million neurons per minute. Thrombolysis (IV tPA) must occur within 4.5 hours and mechanical thrombectomy within 6 hours at a designated Comprehensive Stroke Center.',
                golden_hour_minutes: 90
            },
            {
                id: 'SPEC_SURG_GI',
                name: 'Emergency Surgical Gastroenterology & Acute Trauma',
                sub_specialty: 'Peritonitis, Acute Perforated Appendicitis & Septic Abdomen',
                category: 'Surgery',
                required_qualification: 'MBBS, MS (General Surgery), DNB (Surgical Gastroenterology)',
                description: 'Emergency laparoscopic and open surgical interventions for life-threatening acute abdominal emergencies.',
                misdirected_specialties: JSON.stringify([
                    'General Physician',
                    'Homeopathic / Ayurvedic Clinic',
                    'Non-surgical Gastroenterologist'
                ]),
                misdirection_danger_explanation: 'FATAL SEPSIS DANGER: Acute lower quadrant abdominal pain with fever and severe leukocytosis is frequently mistreated with oral antacids and antispasmodics. A ruptured appendix causes fecal peritonitis, systemic septic shock, and multi-organ failure if emergency surgical decontamination is delayed beyond 6 hours.',
                golden_hour_minutes: 180
            },
            {
                id: 'SPEC_PULMO',
                name: 'Pulmonology & Critical Care / ARDS Care',
                sub_specialty: 'Severe Hypoxemic Respiratory Failure & Mechanical Ventilation',
                category: 'Pulmonology',
                required_qualification: 'MBBS, MD (Respiratory Medicine), DM (Critical Care)',
                description: 'Intensive mechanical ventilation, high-flow nasal cannula (HFNC), and ECMO management for severe lung compromise.',
                misdirected_specialties: JSON.stringify([
                    'General Outpatient Doctor',
                    'ENT (Ear, Nose, Throat) Clinic',
                    'Homeopathic Cough Clinic'
                ]),
                misdirection_danger_explanation: 'HYPOXIC BRAIN DAMAGE: Oxygen saturation dropping below 85% or severe arterial blood gas hypoxemia cannot be stabilized with oral cough syrups or nebulizers in small outpatient clinics. Relatives waste precious minutes while the patient risks hypoxic brain injury and sudden respiratory arrest. Requires immediate ICU admission with invasive ventilator support.',
                golden_hour_minutes: 30
            }
        ];

        for (const s of specialties) {
            await run(
                `INSERT INTO specialties (id, name, sub_specialty, category, required_qualification, description, misdirected_specialties, misdirection_danger_explanation, golden_hour_minutes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [s.id, s.name, s.sub_specialty, s.category, s.required_qualification, s.description, s.misdirected_specialties, s.misdirection_danger_explanation, s.golden_hour_minutes]
            );
        }

        // 3. Insert Hospitals with Real-Time Capabilities
        const hospitals = [
            {
                id: 'HOSP_APEX',
                name: 'Apex Critical Care & Heart Institute',
                address: 'Plot 42, Healthcare Boulevard, Metro South',
                city: 'Central Metro',
                latitude: 18.52043,
                longitude: 73.85674,
                emergency_phone: '+91-20-8000-9911',
                trauma_level: 'Level 1 Comprehensive Emergency & Trauma Center',
                has_247_cath_lab: 1,
                has_emergency_ot: 1,
                has_blood_bank: 1,
                total_icu_beds: 28,
                available_icu_beds: 6,
                ventilators_available: 9,
                supported_insurances: JSON.stringify([
                    'Star Health',
                    'Care Health Insurance',
                    'HDFC ERGO',
                    'ICICI Lombard',
                    'Ayushman Bharat PM-JAY',
                    'Max Bupa / Niva Bupa',
                    'Bajaj Allianz'
                ]),
                verified_accreditation: 'NABH Digital Gold & NABL Emergency Accredited',
                rating: 4.9
            },
            {
                id: 'HOSP_METRO_NEURO',
                name: 'Metro Neurosciences & Multi-Specialty Hospital',
                address: '108 Greenfield Ring Road, North Corridor',
                city: 'Central Metro',
                latitude: 18.53120,
                longitude: 73.84410,
                emergency_phone: '+91-20-8000-9922',
                trauma_level: 'Level 1 Comprehensive Stroke & Neuro-Trauma Center',
                has_247_cath_lab: 1,
                has_emergency_ot: 1,
                has_blood_bank: 1,
                total_icu_beds: 32,
                available_icu_beds: 4,
                ventilators_available: 7,
                supported_insurances: JSON.stringify([
                    'Star Health',
                    'HDFC ERGO',
                    'Bajaj Allianz',
                    'New India Assurance',
                    'Ayushman Bharat PM-JAY',
                    'Tata AIG'
                ]),
                verified_accreditation: 'JCI International & NABH Accredited',
                rating: 4.8
            },
            {
                id: 'HOSP_LIFELINE_RENAL',
                name: 'Lifeline Emergency Trauma & Renal Care Center',
                address: 'Sector 9, Expressway Junction, West City',
                city: 'Central Metro',
                latitude: 18.50850,
                longitude: 73.86900,
                emergency_phone: '+91-20-8000-9933',
                trauma_level: 'Level 2 Emergency & 24/7 Dialysis Center',
                has_247_cath_lab: 0,
                has_emergency_ot: 1,
                has_blood_bank: 1,
                total_icu_beds: 20,
                available_icu_beds: 7,
                ventilators_available: 5,
                supported_insurances: JSON.stringify([
                    'Star Health',
                    'Care Health Insurance',
                    'ICICI Lombard',
                    'Oriental Insurance',
                    'Ayushman Bharat PM-JAY'
                ]),
                verified_accreditation: 'NABH Accredited Tertiary Center',
                rating: 4.7
            },
            {
                id: 'HOSP_CITY_DIVINE',
                name: 'City Divine Super-Specialty Medical Center',
                address: 'Opp. Central Metro Station, East Hub',
                city: 'Central Metro',
                latitude: 18.54200,
                longitude: 73.87800,
                emergency_phone: '+91-20-8000-9944',
                trauma_level: 'Level 1 Tertiary Emergency Hospital',
                has_247_cath_lab: 1,
                has_emergency_ot: 1,
                has_blood_bank: 1,
                total_icu_beds: 40,
                available_icu_beds: 9,
                ventilators_available: 12,
                supported_insurances: JSON.stringify([
                    'Star Health',
                    'HDFC ERGO',
                    'Care Health Insurance',
                    'Tata AIG',
                    'Ayushman Bharat PM-JAY',
                    'United India Insurance'
                ]),
                verified_accreditation: 'NABH Digital & Green OT Certified',
                rating: 4.9
            }
        ];

        for (const h of hospitals) {
            await run(
                `INSERT INTO hospitals (id, name, address, city, latitude, longitude, emergency_phone, trauma_level, has_247_cath_lab, has_emergency_ot, has_blood_bank, total_icu_beds, available_icu_beds, ventilators_available, supported_insurances, verified_accreditation, rating)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [h.id, h.name, h.address, h.city, h.latitude, h.longitude, h.emergency_phone, h.trauma_level, h.has_247_cath_lab, h.has_emergency_ot, h.has_blood_bank, h.total_icu_beds, h.available_icu_beds, h.ventilators_available, h.supported_insurances, h.verified_accreditation, h.rating]
            );
        }

        // 4. Insert Authorized Specialist Doctors with Cryptographic Seals
        const doctors = [
            {
                id: 'DOC_RATHORE',
                full_name: 'Dr. Vikramaditya Rathore',
                qualification: 'MBBS, MD (Medicine), DM (Interventional Cardiology), FACC',
                specialty_id: 'SPEC_CARDIO',
                hospital_id: 'HOSP_APEX',
                license_number: 'NMC-CARD-2012-88419',
                licensing_authority: 'National Medical Commission (NMC India)',
                years_experience: 16,
                verification_status: 'VERIFIED',
                verification_seal_hash: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
                consultation_fee: 1000,
                phone: '+91-98220-11234',
                is_on_duty_emergency: 1,
                rating: 4.95,
                bio: 'Senior Interventional Cardiologist with over 4,500 emergency primary angioplasties performed. On-call chief for acute STEMI and coronary intervention at Apex Cath Lab.'
            },
            {
                id: 'DOC_KULKARNI',
                full_name: 'Dr. Ananya Kulkarni',
                qualification: 'MBBS, MD (General Medicine), DM (Nephrology), FISN',
                specialty_id: 'SPEC_NEPHRO',
                hospital_id: 'HOSP_LIFELINE_RENAL',
                license_number: 'MMC-NEPH-2015-44290',
                licensing_authority: 'Maharashtra Medical Council & NMC',
                years_experience: 12,
                verification_status: 'VERIFIED',
                verification_seal_hash: 'SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                consultation_fee: 900,
                phone: '+91-98220-22345',
                is_on_duty_emergency: 1,
                rating: 4.9,
                bio: 'Lead Renal Critical Care specialist. Specializes in emergency hemodialysis, CRRT in septic shock, acute glomerulonephritis, and severe toxic nephropathy.'
            },
            {
                id: 'DOC_SEN',
                full_name: 'Dr. Rajeshwar Sen',
                qualification: 'MBBS, MS (General Surgery), MCh (Neurosurgery), FINR',
                specialty_id: 'SPEC_NEURO',
                hospital_id: 'HOSP_METRO_NEURO',
                license_number: 'NMC-NEUR-2009-31205',
                licensing_authority: 'National Medical Commission (NMC India)',
                years_experience: 18,
                verification_status: 'VERIFIED',
                verification_seal_hash: 'SHA256:ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
                consultation_fee: 1200,
                phone: '+91-98220-33456',
                is_on_duty_emergency: 1,
                rating: 4.92,
                bio: 'Head of Neuro-Trauma and Interventional Stroke Team. Pioneer in acute mechanical thrombectomy for emergency ischemic stroke within golden time windows.'
            },
            {
                id: 'DOC_RAO',
                full_name: 'Dr. Priyadarshini Rao',
                qualification: 'MBBS, MD (Pathology / Medicine), DM (Clinical Hematology)',
                specialty_id: 'SPEC_HEMATO',
                hospital_id: 'HOSP_CITY_DIVINE',
                license_number: 'NMC-HEMA-2016-59102',
                licensing_authority: 'National Medical Commission (NMC India)',
                years_experience: 11,
                verification_status: 'VERIFIED',
                verification_seal_hash: 'SHA256:5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
                consultation_fee: 850,
                phone: '+91-98220-44567',
                is_on_duty_emergency: 1,
                rating: 4.88,
                bio: 'Emergency Clinical Hematologist specializing in severe thrombocytopenia, Dengue hemorrhagic fever management, and life-saving therapeutic apheresis.'
            },
            {
                id: 'DOC_MEHTA',
                full_name: 'Dr. Devendra Mehta',
                qualification: 'MBBS, MS (General Surgery), DNB (Surgical Gastroenterology)',
                specialty_id: 'SPEC_SURG_GI',
                hospital_id: 'HOSP_APEX',
                license_number: 'MMC-SURG-2011-73911',
                licensing_authority: 'Maharashtra Medical Council & NMC',
                years_experience: 15,
                verification_status: 'VERIFIED',
                verification_seal_hash: 'SHA256:4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
                consultation_fee: 950,
                phone: '+91-98220-55678',
                is_on_duty_emergency: 1,
                rating: 4.89,
                bio: 'Chief of Acute Abdominal Surgery & Emergency Trauma. Expert in acute peritonitis, perforated viscus, strangulated hernia, and ruptured appendix interventions.'
            },
            {
                id: 'DOC_SHARMA',
                full_name: 'Dr. Sanjay Sharma',
                qualification: 'MBBS, MD (Pulmonary Medicine), DM (Critical Care)',
                specialty_id: 'SPEC_PULMO',
                hospital_id: 'HOSP_CITY_DIVINE',
                license_number: 'NMC-PULM-2014-61023',
                licensing_authority: 'National Medical Commission (NMC India)',
                years_experience: 13,
                verification_status: 'VERIFIED',
                verification_seal_hash: 'SHA256:6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
                consultation_fee: 900,
                phone: '+91-98220-66789',
                is_on_duty_emergency: 1,
                rating: 4.87,
                bio: 'Critical Care Pulmonologist. Specialist in acute hypoxemic respiratory failure, adult respiratory distress syndrome (ARDS), and ECMO circuit monitoring.'
            }
        ];

        for (const d of doctors) {
            await run(
                `INSERT INTO doctors (id, full_name, qualification, specialty_id, hospital_id, license_number, licensing_authority, years_experience, verification_status, verification_seal_hash, consultation_fee, phone, is_on_duty_emergency, rating, bio)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [d.id, d.full_name, d.qualification, d.specialty_id, d.hospital_id, d.license_number, d.licensing_authority, d.years_experience, d.verification_status, d.verification_seal_hash, d.consultation_fee, d.phone, d.is_on_duty_emergency, d.rating, d.bio]
            );
        }

        // 5. Insert National Medical Council Registry Data (for Admin Verification Desk lookups)
        const registryEntries = [
            {
                license_number: 'NMC-CARD-2012-88419',
                practitioner_name: 'Dr. Vikramaditya Rathore',
                registered_qualification: 'MBBS (2007), MD (Medicine 2010), DM (Cardiology 2012)',
                sub_specialty: 'Interventional Cardiology',
                registration_year: 2012,
                council_status: 'ACTIVE',
                disciplinary_actions: 0
            },
            {
                license_number: 'MMC-NEPH-2015-44290',
                practitioner_name: 'Dr. Ananya Kulkarni',
                registered_qualification: 'MBBS (2010), MD (Medicine 2013), DM (Nephrology 2015)',
                sub_specialty: 'Nephrology',
                registration_year: 2015,
                council_status: 'ACTIVE',
                disciplinary_actions: 0
            },
            {
                license_number: 'NMC-NEUR-2009-31205',
                practitioner_name: 'Dr. Rajeshwar Sen',
                registered_qualification: 'MBBS (2003), MS (Surgery 2006), MCh (Neurosurgery 2009)',
                sub_specialty: 'Neurosurgery',
                registration_year: 2009,
                council_status: 'ACTIVE',
                disciplinary_actions: 0
            },
            {
                license_number: 'NMC-HEMA-2016-59102',
                practitioner_name: 'Dr. Priyadarshini Rao',
                registered_qualification: 'MBBS (2011), MD (Pathology 2014), DM (Hematology 2016)',
                sub_specialty: 'Clinical Hematology',
                registration_year: 2016,
                council_status: 'ACTIVE',
                disciplinary_actions: 0
            },
            {
                license_number: 'MMC-SURG-2011-73911',
                practitioner_name: 'Dr. Devendra Mehta',
                registered_qualification: 'MBBS (2005), MS (Surgery 2008), DNB (Surgical Gastro 2011)',
                sub_specialty: 'Surgical Gastroenterology',
                registration_year: 2011,
                council_status: 'ACTIVE',
                disciplinary_actions: 0
            },
            {
                license_number: 'NMC-PULM-2014-61023',
                practitioner_name: 'Dr. Sanjay Sharma',
                registered_qualification: 'MBBS (2008), MD (Respiratory Med 2011), DM (Critical Care 2014)',
                sub_specialty: 'Pulmonary Critical Care',
                registration_year: 2014,
                council_status: 'ACTIVE',
                disciplinary_actions: 0
            },
            // An unverified / pending doctor license for demonstration in Admin desk
            {
                license_number: 'MCI-FAKE-1999-00123',
                practitioner_name: 'Dr. Suresh Verma',
                registered_qualification: 'BAMS (Alternative Medicine - Not DM Cardiology)',
                sub_specialty: 'General Practice',
                registration_year: 1999,
                council_status: 'SUSPENDED',
                disciplinary_actions: 2
            }
        ];

        for (const reg of registryEntries) {
            await run(
                `INSERT INTO national_medical_registry (license_number, practitioner_name, registered_qualification, sub_specialty, registration_year, council_status, disciplinary_actions)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [reg.license_number, reg.practitioner_name, reg.registered_qualification, reg.sub_specialty, reg.registration_year, reg.council_status, reg.disciplinary_actions]
            );
        }

        // 6. Insert Triage Protocols & Diagnostic Biomarkers
        const protocols = [
            {
                id: 'PROTO_TROPONIN',
                biomarker_key: 'troponin_i',
                display_name: 'High-Sensitivity Troponin-I (hs-cTnI)',
                unit: 'ng/mL',
                normal_min: 0.0,
                normal_max: 0.04,
                critical_threshold_min: null,
                critical_threshold_max: 0.40, // Values above 0.40 are critical
                urgency_when_critical: 'CRITICAL',
                associated_specialty_id: 'SPEC_CARDIO',
                clinical_risk_explanation: 'Troponin-I is a structural cardiac protein released into blood ONLY when heart muscle cells undergo acute necrosis (death) due to coronary occlusion (Acute Myocardial Infarction / Heart Attack).',
                layman_explanation: 'Heart muscle cells are actively starving for oxygen and dying. This is a severe medical emergency. The patient must reach a hospital with an active Cath Lab immediately for emergency stent placement.',
                immediate_first_aid_action: 'Keep patient resting completely still. Loosen tight clothing. Do not give water or heavy food. Do not visit local clinic; call emergency ambulance immediately.'
            },
            {
                id: 'PROTO_CREATININE',
                biomarker_key: 'serum_creatinine',
                display_name: 'Serum Creatinine',
                unit: 'mg/dL',
                normal_min: 0.6,
                normal_max: 1.2,
                critical_threshold_min: null,
                critical_threshold_max: 3.5, // Above 3.5 is severe acute renal failure
                urgency_when_critical: 'CRITICAL',
                associated_specialty_id: 'SPEC_NEPHRO',
                clinical_risk_explanation: 'Sharp creatinine elevation indicates severe Acute Kidney Injury (AKI) or acute-on-chronic renal shutdown with critical retention of nitrogenous wastes and dangerous potassium accumulation (Hyperkalemia).',
                layman_explanation: 'The kidneys have suddenly stopped filtering toxins and excess fluid. Deadly potassium spikes can stop the heart without warning. Emergency dialysis or specialized kidney care is required right now.',
                immediate_first_aid_action: 'Strictly stop all potassium-rich foods (bananas, coconut water, citrus). Restrict fluid intake. Rush to a tertiary center equipped with an active emergency hemodialysis unit.'
            },
            {
                id: 'PROTO_PLATELETS',
                biomarker_key: 'platelet_count',
                display_name: 'Platelet Count (Thrombocytes)',
                unit: '/uL',
                normal_min: 150000,
                normal_max: 450000,
                critical_threshold_min: 25000, // Below 25,000 is critical spontaneous bleed risk
                critical_threshold_max: null,
                urgency_when_critical: 'CRITICAL',
                associated_specialty_id: 'SPEC_HEMATO',
                clinical_risk_explanation: 'Extreme thrombocytopenia (Platelets < 25,000 /uL, typical in Dengue hemorrhagic fever, acute leukemia, or ITP) impairs primary hemostasis and precipitates life-threatening spontaneous intracranial or gastrointestinal bleeding.',
                layman_explanation: 'Blood clotting cells have fallen to critically dangerous levels. The patient can suffer sudden internal bleeding in the brain, stomach, or lungs with minimal or no injury.',
                immediate_first_aid_action: 'Protect patient from falls, bumps, or sharp objects. Do NOT give aspirin, ibuprofen, or pain relief pills. Do NOT delay with home remedies; proceed to a hospital with an accredited blood bank for platelet transfusion.'
            },
            {
                id: 'PROTO_D_DIMER',
                biomarker_key: 'd_dimer',
                display_name: 'D-Dimer Quantitative',
                unit: 'ug/mL FEU',
                normal_min: 0.0,
                normal_max: 0.50,
                critical_threshold_min: null,
                critical_threshold_max: 2.5, // Above 2.5 is high thromboembolism risk
                urgency_when_critical: 'CRITICAL',
                associated_specialty_id: 'SPEC_CARDIO',
                clinical_risk_explanation: 'Massive D-Dimer elevation marks active intravascular fibrin formation and breakdown, strongly suggestive of Pulmonary Embolism (PE), Deep Vein Thrombosis (DVT), or Disseminated Intravascular Coagulation (DIC).',
                layman_explanation: 'Abnormal blood clots are forming and breaking inside major blood vessels, which could travel and block blood supply to lungs or heart.',
                immediate_first_aid_action: 'Keep patient seated in upright position. Minimize physical movement. Transfer immediately to emergency department for CT Pulmonary Angiogram and anticoagulation.'
            },
            {
                id: 'PROTO_HEMOGLOBIN',
                biomarker_key: 'hemoglobin',
                display_name: 'Hemoglobin (Hb)',
                unit: 'g/dL',
                normal_min: 12.0,
                normal_max: 16.5,
                critical_threshold_min: 6.5, // Below 6.5 is severe anemia / hemorrhage
                critical_threshold_max: null,
                urgency_when_critical: 'CRITICAL',
                associated_specialty_id: 'SPEC_HEMATO',
                clinical_risk_explanation: 'Severe acute hemoglobin drop (< 6.5 g/dL) causes profound tissue hypoxia, hypovolemic shock, cardiac ischemia, and multi-organ failure.',
                layman_explanation: 'Oxygen-carrying red blood cells are drastically depleted, either from internal blood loss or rapid cell destruction. The heart is under massive strain.',
                immediate_first_aid_action: 'Keep patient lying flat with legs slightly elevated to preserve cerebral blood flow. Prepare for emergency packed red blood cell (PRBC) crossmatch and transfusion.'
            },
            {
                id: 'PROTO_TOTAL_BILIRUBIN',
                biomarker_key: 'total_bilirubin',
                display_name: 'Total Serum Bilirubin',
                unit: 'mg/dL',
                normal_min: 0.2,
                normal_max: 1.2,
                critical_threshold_min: null,
                critical_threshold_max: 7.0, // Above 7.0 is severe hepatic distress
                urgency_when_critical: 'URGENT',
                associated_specialty_id: 'SPEC_SURG_GI',
                clinical_risk_explanation: 'High total bilirubin indicates severe acute hepatic decompensation, acute biliary obstruction (cholangitis), or severe hemolysis.',
                layman_explanation: 'Liver function is failing or the bile duct is dangerously blocked, accumulating toxic bile pigments in brain and bloodstream.',
                immediate_first_aid_action: 'Avoid self-medication, especially paracetamol/NSAIDs which tax liver. Consult specialized surgical gastroenterology.'
            },
            {
                id: 'PROTO_WBC',
                biomarker_key: 'wbc_count',
                display_name: 'Total Leukocyte Count (WBC / TLC)',
                unit: '/uL',
                normal_min: 4000,
                normal_max: 11000,
                critical_threshold_min: null,
                critical_threshold_max: 22000, // Above 22,000 indicates severe sepsis / acute surgical abdomen
                urgency_when_critical: 'CRITICAL',
                associated_specialty_id: 'SPEC_SURG_GI',
                clinical_risk_explanation: 'Extreme leukocytosis (> 22,000 /uL) with bandemia indicates hyper-acute systemic inflammatory response syndrome (SIRS), severe concealed sepsis, or acute abdominal hollow viscus rupture (peritonitis/perforated appendicitis).',
                layman_explanation: 'The body immune system is fighting an overwhelming, dangerous internal infection. Rapid surgical evaluation is needed to check for appendix rupture or internal abscess.',
                immediate_first_aid_action: 'Do not eat or drink (keep NPO for potential emergency surgery). Do not apply heating pads to stomach. Proceed immediately to surgical emergency.'
            },
            {
                id: 'PROTO_SPO2',
                biomarker_key: 'blood_oxygen',
                display_name: 'Blood Oxygen Saturation (SpO2)',
                unit: '%',
                normal_min: 95.0,
                normal_max: 100.0,
                critical_threshold_min: 88.0, // Below 88% is critical respiratory failure
                critical_threshold_max: null,
                urgency_when_critical: 'CRITICAL',
                associated_specialty_id: 'SPEC_PULMO',
                clinical_risk_explanation: 'Severe hypoxemia with SpO2 falling below 88% causes rapid cerebral anoxia, lethal arrhythmias, and acute cardiopulmonary arrest.',
                layman_explanation: 'The lungs cannot transfer enough oxygen to vital organs. Brain and heart damage occurs within minutes without medical oxygen therapy.',
                immediate_first_aid_action: 'Prop patient upright in high Fowler position. Administer supplemental medical oxygen if available. Rush to hospital with ICU ventilator facility.'
            }
        ];

        for (const p of protocols) {
            await run(
                `INSERT INTO triage_protocols (id, biomarker_key, display_name, unit, normal_min, normal_max, critical_threshold_min, critical_threshold_max, urgency_when_critical, associated_specialty_id, clinical_risk_explanation, layman_explanation, immediate_first_aid_action)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [p.id, p.biomarker_key, p.display_name, p.unit, p.normal_min, p.normal_max, p.critical_threshold_min, p.critical_threshold_max, p.urgency_when_critical, p.associated_specialty_id, p.clinical_risk_explanation, p.layman_explanation, p.immediate_first_aid_action]
            );
        }

        console.log('✅ Database seeded with 6 specialties, 4 equipped hospitals, 6 verified doctors, 7 national registry records, and 8 triage protocols.');
    } catch (err) {
        console.error('❌ Error during seeding:', err);
    }
}

module.exports = { seedDatabase };

if (require.main === module) {
    seedDatabase().then(() => {
        console.log('Seed completed successfully.');
        process.exit(0);
    });
}

