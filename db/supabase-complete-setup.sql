-- ================================================================
-- SUPABASE COMPLETE ONE-CLICK SETUP & DATA SEEDING SCRIPT
-- Run this entire file in Supabase SQL Editor (https://supabase.com)
-- ================================================================

-- ==============================================================================
-- Emergency Medical Report Parser & Authorized Specialist Matchmaking Network
-- PostgreSQL Production DDL Specification
-- Strict relational model for academic project documentation & production deployment
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Specialties & Anti-Misdirection Rules
CREATE TABLE IF NOT EXISTS specialties (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    sub_specialty VARCHAR(128),
    category VARCHAR(64) NOT NULL,
    required_qualification VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    misdirected_specialties TEXT NOT NULL,
    misdirection_danger_explanation TEXT NOT NULL,
    golden_hour_minutes INT DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Hospitals & Real-time Emergency Capabilities
CREATE TABLE IF NOT EXISTS hospitals (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    emergency_phone VARCHAR(32) NOT NULL,
    trauma_level VARCHAR(64) NOT NULL,
    has_247_cath_lab INT DEFAULT 0,
    has_emergency_ot INT DEFAULT 1,
    has_blood_bank INT DEFAULT 1,
    total_icu_beds INT NOT NULL,
    available_icu_beds INT NOT NULL,
    ventilators_available INT NOT NULL,
    supported_insurances TEXT NOT NULL,
    verified_accreditation VARCHAR(64) NOT NULL,
    rating DECIMAL(2, 1) DEFAULT 4.8,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Authorized Specialist Doctors & Medical Board Licenses
CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    qualification VARCHAR(255) NOT NULL,
    specialty_id VARCHAR(64) REFERENCES specialties(id) ON DELETE CASCADE,
    hospital_id VARCHAR(64) REFERENCES hospitals(id) ON DELETE CASCADE,
    license_number VARCHAR(64) UNIQUE NOT NULL,
    licensing_authority VARCHAR(255) NOT NULL,
    years_experience INT NOT NULL,
    verification_status VARCHAR(32) DEFAULT 'VERIFIED',
    verification_seal_hash VARCHAR(128) NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    consultation_fee INT DEFAULT 800,
    phone VARCHAR(32),
    is_on_duty_emergency INT DEFAULT 1,
    rating DECIMAL(2, 1) DEFAULT 4.9,
    bio TEXT
);

-- 4. National Medical Council Registry Simulation Table
CREATE TABLE IF NOT EXISTS national_medical_registry (
    license_number VARCHAR(64) PRIMARY KEY,
    practitioner_name VARCHAR(255) NOT NULL,
    registered_qualification VARCHAR(255) NOT NULL,
    sub_specialty VARCHAR(128) NOT NULL,
    registration_year INT NOT NULL,
    council_status VARCHAR(32) DEFAULT 'ACTIVE',
    disciplinary_actions INT DEFAULT 0
);

-- 5. Diagnostic Biomarkers & Triage Protocols
CREATE TABLE IF NOT EXISTS triage_protocols (
    id VARCHAR(64) PRIMARY KEY,
    biomarker_key VARCHAR(64) NOT NULL,
    display_name VARCHAR(128) NOT NULL,
    unit VARCHAR(32) NOT NULL,
    normal_min DECIMAL(10, 2),
    normal_max DECIMAL(10, 2),
    critical_threshold_min DECIMAL(10, 2),
    critical_threshold_max DECIMAL(10, 2),
    urgency_when_critical VARCHAR(32) DEFAULT 'CRITICAL',
    associated_specialty_id VARCHAR(64) REFERENCES specialties(id),
    clinical_risk_explanation TEXT NOT NULL,
    layman_explanation TEXT NOT NULL,
    immediate_first_aid_action TEXT NOT NULL
);

-- 6. Emergency Triage Incident Logs
CREATE TABLE IF NOT EXISTS triage_logs (
    id VARCHAR(64) PRIMARY KEY,
    patient_name VARCHAR(255),
    uploaded_report_filename VARCHAR(255),
    extracted_text TEXT,
    triage_level VARCHAR(32) NOT NULL,
    identified_biomarkers TEXT NOT NULL,
    matched_specialty_id VARCHAR(64) REFERENCES specialties(id),
    misdirection_prevented TEXT,
    user_latitude DECIMAL(10, 8),
    user_longitude DECIMAL(11, 8),
    recommended_hospital_id VARCHAR(64) REFERENCES hospitals(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. One-Tap Emergency Family Shares
CREATE TABLE IF NOT EXISTS emergency_shares (
    id VARCHAR(64) PRIMARY KEY,
    triage_log_id VARCHAR(64),
    patient_identifier VARCHAR(255) NOT NULL,
    summary_text TEXT NOT NULL,
    severity_level VARCHAR(32) NOT NULL,
    hospital_name VARCHAR(255) NOT NULL,
    hospital_phone VARCHAR(32) NOT NULL,
    hospital_map_url TEXT NOT NULL,
    patient_location_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast emergency lookups
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors(specialty_id);
CREATE INDEX IF NOT EXISTS idx_doctors_license ON doctors(license_number);
CREATE INDEX IF NOT EXISTS idx_hospitals_geo ON hospitals(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_triage_biomarkers ON triage_protocols(biomarker_key);



-- -----------------------------------------------------
-- Data for specialties
-- -----------------------------------------------------
INSERT INTO specialties (id, name, sub_specialty, category, required_qualification, description, misdirected_specialties, misdirection_danger_explanation, golden_hour_minutes, created_at) VALUES ('SPEC_CARDIO', 'Interventional Cardiology', 'Acute Coronary Syndromes, STEMI & Emergency Angioplasty', 'Cardiology', 'MBBS, MD (Medicine), DM / DNB (Cardiology), FESC', 'Super-specialized in acute heart attack rescue, primary percutaneous coronary intervention (PPCI), and emergency cardiac catheterization.', '["General Physician / Family Doctor","Orthopedic Doctor / Spine Specialist","Gastroenterologist (Mistaking chest pain for acidity)","Homeopathic / Unverified Clinic"]', 'CRITICAL WARNING: Panicking families frequently confuse acute heart attack pain (chest pressure radiating to left arm/jaw) with acidity or muscular strain, leading them to local clinics or orthopedic doctors. A general clinic lacks a Cardiac Catheterization Lab (Cath Lab). Every 30 minutes of delay causes irreversible cardiac muscle death. STEMI requires emergency balloon angioplasty within the 90-minute Golden Hour.', 60, '2026-10-31 16:53:33') ON CONFLICT DO NOTHING;
INSERT INTO specialties (id, name, sub_specialty, category, required_qualification, description, misdirected_specialties, misdirection_danger_explanation, golden_hour_minutes, created_at) VALUES ('SPEC_NEPHRO', 'Nephrology & Renal Critical Care', 'Acute Kidney Injury (AKI), Dialysis & Hyperkalemia Emergencies', 'Nephrology', 'MBBS, MD (General Medicine), DM (Nephrology)', 'Specializes in severe renal shutdown, urgent dialysis intervention, electrolyte crisis, and acute metabolic acidosis.', '["General Physician","General Surgeon","Urologist (Urologists handle surgical kidneys, not medical AKI/shutdown)"]', 'DANGEROUS MISDIRECTION: High serum creatinine (> 3.5 mg/dL) indicates acute medical renal failure. Relatives frequently rush to surgical urologists or general practitioners. General clinics attempt IV fluid loading which can trigger fatal pulmonary edema (fluid in lungs) and sudden cardiac arrest from hyperkalemia (high potassium). Immediate Nephrology intervention and emergency hemodialysis are vital.', 120, '2026-10-31 16:53:33') ON CONFLICT DO NOTHING;
INSERT INTO specialties (id, name, sub_specialty, category, required_qualification, description, misdirected_specialties, misdirection_danger_explanation, golden_hour_minutes, created_at) VALUES ('SPEC_HEMATO', 'Clinical Hematology & Transfusion Medicine', 'Severe Thrombocytopenia, Hemorrhagic Emergencies & Coagulopathy', 'Hematology', 'MBBS, MD (Pathology / Medicine), DM (Clinical Hematology)', 'Specializes in acute blood disorders, severe platelet destruction (Dengue Shock Syndrome / ITP), and emergency apheresis transfusions.', '["Local Neighborhood Clinic","Ayurvedic / Herbal Practitioners (Home remedies like papaya leaf juice)","General Outpatient Doctor"]', 'LETHAL DELAY: When platelets plunge below 20,000 /uL in Dengue or severe coagulopathy, patients face imminent spontaneous intracranial (brain) hemorrhage or internal bleeding. Waiting for home remedies or outpatient antibiotics while delaying single-donor platelet (SDP) apheresis in a hospital with an approved blood bank is frequently fatal.', 90, '2026-10-31 16:53:33') ON CONFLICT DO NOTHING;
INSERT INTO specialties (id, name, sub_specialty, category, required_qualification, description, misdirected_specialties, misdirection_danger_explanation, golden_hour_minutes, created_at) VALUES ('SPEC_NEURO', 'Neurovascular Surgery & Stroke Neurology', 'Acute Ischemic Stroke, Intracranial Hemorrhage & Brain Aneurysms', 'Neurology', 'MBBS, MS (Surgery), MCh (Neurosurgery) / DM (Neurology)', 'Emergency stroke thrombolysis, mechanical thrombectomy, and surgical decompression for acute intracranial catastrophes.', '["Physiotherapist","Ophthalmologist / Eye Clinic","General Physician / ENT Specialist"]', 'PERMANENT DISABILITY RISK: Sudden facial asymmetry, slurred speech, or limb weakness are often misdiagnosed as pinched nerves or vertigo by non-specialists. Acute ischemic stroke brain cells die at 2 million neurons per minute. Thrombolysis (IV tPA) must occur within 4.5 hours and mechanical thrombectomy within 6 hours at a designated Comprehensive Stroke Center.', 90, '2026-10-31 16:53:33') ON CONFLICT DO NOTHING;
INSERT INTO specialties (id, name, sub_specialty, category, required_qualification, description, misdirected_specialties, misdirection_danger_explanation, golden_hour_minutes, created_at) VALUES ('SPEC_SURG_GI', 'Emergency Surgical Gastroenterology & Acute Trauma', 'Peritonitis, Acute Perforated Appendicitis & Septic Abdomen', 'Surgery', 'MBBS, MS (General Surgery), DNB (Surgical Gastroenterology)', 'Emergency laparoscopic and open surgical interventions for life-threatening acute abdominal emergencies.', '["General Physician","Homeopathic / Ayurvedic Clinic","Non-surgical Gastroenterologist"]', 'FATAL SEPSIS DANGER: Acute lower quadrant abdominal pain with fever and severe leukocytosis is frequently mistreated with oral antacids and antispasmodics. A ruptured appendix causes fecal peritonitis, systemic septic shock, and multi-organ failure if emergency surgical decontamination is delayed beyond 6 hours.', 180, '2026-10-31 16:53:33') ON CONFLICT DO NOTHING;
INSERT INTO specialties (id, name, sub_specialty, category, required_qualification, description, misdirected_specialties, misdirection_danger_explanation, golden_hour_minutes, created_at) VALUES ('SPEC_PULMO', 'Pulmonology & Critical Care / ARDS Care', 'Severe Hypoxemic Respiratory Failure & Mechanical Ventilation', 'Pulmonology', 'MBBS, MD (Respiratory Medicine), DM (Critical Care)', 'Intensive mechanical ventilation, high-flow nasal cannula (HFNC), and ECMO management for severe lung compromise.', '["General Outpatient Doctor","ENT (Ear, Nose, Throat) Clinic","Homeopathic Cough Clinic"]', 'HYPOXIC BRAIN DAMAGE: Oxygen saturation dropping below 85% or severe arterial blood gas hypoxemia cannot be stabilized with oral cough syrups or nebulizers in small outpatient clinics. Relatives waste precious minutes while the patient risks hypoxic brain injury and sudden respiratory arrest. Requires immediate ICU admission with invasive ventilator support.', 30, '2026-10-31 16:53:33') ON CONFLICT DO NOTHING;

-- -----------------------------------------------------
-- Data for hospitals
-- -----------------------------------------------------
INSERT INTO hospitals (id, name, address, city, latitude, longitude, emergency_phone, trauma_level, has_247_cath_lab, has_emergency_ot, has_blood_bank, total_icu_beds, available_icu_beds, ventilators_available, supported_insurances, verified_accreditation, rating, created_at) VALUES ('HOSP_APEX', 'Apex Critical Care & Heart Institute', 'Plot 42, Healthcare Boulevard, Metro South', 'Central Metro', 18.52043, 73.85674, '+91-20-8000-9911', 'Level 1 Comprehensive Emergency & Trauma Center', 1, 1, 1, 28, 6, 9, '["Star Health","Care Health Insurance","HDFC ERGO","ICICI Lombard","Ayushman Bharat PM-JAY","Max Bupa / Niva Bupa","Bajaj Allianz"]', 'NABH Digital Gold & NABL Emergency Accredited', 4.9, '2026-10-31 16:53:33') ON CONFLICT DO NOTHING;
INSERT INTO hospitals (id, name, address, city, latitude, longitude, emergency_phone, trauma_level, has_247_cath_lab, has_emergency_ot, has_blood_bank, total_icu_beds, available_icu_beds, ventilators_available, supported_insurances, verified_accreditation, rating, created_at) VALUES ('HOSP_METRO_NEURO', 'Metro Neurosciences & Multi-Specialty Hospital', '108 Greenfield Ring Road, North Corridor', 'Central Metro', 18.5312, 73.8441, '+91-20-8000-9922', 'Level 1 Comprehensive Stroke & Neuro-Trauma Center', 1, 1, 1, 32, 4, 7, '["Star Health","HDFC ERGO","Bajaj Allianz","New India Assurance","Ayushman Bharat PM-JAY","Tata AIG"]', 'JCI International & NABH Accredited', 4.8, '2026-10-31 16:53:33') ON CONFLICT DO NOTHING;
INSERT INTO hospitals (id, name, address, city, latitude, longitude, emergency_phone, trauma_level, has_247_cath_lab, has_emergency_ot, has_blood_bank, total_icu_beds, available_icu_beds, ventilators_available, supported_insurances, verified_accreditation, rating, created_at) VALUES ('HOSP_LIFELINE_RENAL', 'Lifeline Emergency Trauma & Renal Care Center', 'Sector 9, Expressway Junction, West City', 'Central Metro', 18.5085, 73.869, '+91-20-8000-9933', 'Level 2 Emergency & 24/7 Dialysis Center', 0, 1, 1, 20, 7, 5, '["Star Health","Care Health Insurance","ICICI Lombard","Oriental Insurance","Ayushman Bharat PM-JAY"]', 'NABH Accredited Tertiary Center', 4.7, '2026-10-31 16:53:33') ON CONFLICT DO NOTHING;
INSERT INTO hospitals (id, name, address, city, latitude, longitude, emergency_phone, trauma_level, has_247_cath_lab, has_emergency_ot, has_blood_bank, total_icu_beds, available_icu_beds, ventilators_available, supported_insurances, verified_accreditation, rating, created_at) VALUES ('HOSP_CITY_DIVINE', 'City Divine Super-Specialty Medical Center', 'Opp. Central Metro Station, East Hub', 'Central Metro', 18.542, 73.878, '+91-20-8000-9944', 'Level 1 Tertiary Emergency Hospital', 1, 1, 1, 40, 9, 12, '["Star Health","HDFC ERGO","Care Health Insurance","Tata AIG","Ayushman Bharat PM-JAY","United India Insurance"]', 'NABH Digital & Green OT Certified', 4.9, '2026-10-31 16:53:33') ON CONFLICT DO NOTHING;

-- -----------------------------------------------------
-- Data for doctors
-- -----------------------------------------------------
INSERT INTO doctors (id, full_name, qualification, specialty_id, hospital_id, license_number, licensing_authority, years_experience, verification_status, verification_seal_hash, verified_at, consultation_fee, phone, is_on_duty_emergency, rating, bio) VALUES ('DOC_RATHORE', 'Dr. Vikramaditya Rathore', 'MBBS, MD (Medicine), DM (Interventional Cardiology), FACC', 'SPEC_CARDIO', 'HOSP_APEX', 'NMC-CARD-2012-88419', 'National Medical Commission (NMC India)', 16, 'VERIFIED', 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069', '2026-10-31 16:53:33', 1000, '+91-98220-11234', 1, 4.95, 'Senior Interventional Cardiologist with over 4,500 emergency primary angioplasties performed. On-call chief for acute STEMI and coronary intervention at Apex Cath Lab.') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, full_name, qualification, specialty_id, hospital_id, license_number, licensing_authority, years_experience, verification_status, verification_seal_hash, verified_at, consultation_fee, phone, is_on_duty_emergency, rating, bio) VALUES ('DOC_KULKARNI', 'Dr. Ananya Kulkarni', 'MBBS, MD (General Medicine), DM (Nephrology), FISN', 'SPEC_NEPHRO', 'HOSP_LIFELINE_RENAL', 'MMC-NEPH-2015-44290', 'Maharashtra Medical Council & NMC', 12, 'VERIFIED', 'SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', '2026-10-31 16:53:33', 900, '+91-98220-22345', 1, 4.9, 'Lead Renal Critical Care specialist. Specializes in emergency hemodialysis, CRRT in septic shock, acute glomerulonephritis, and severe toxic nephropathy.') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, full_name, qualification, specialty_id, hospital_id, license_number, licensing_authority, years_experience, verification_status, verification_seal_hash, verified_at, consultation_fee, phone, is_on_duty_emergency, rating, bio) VALUES ('DOC_SEN', 'Dr. Rajeshwar Sen', 'MBBS, MS (General Surgery), MCh (Neurosurgery), FINR', 'SPEC_NEURO', 'HOSP_METRO_NEURO', 'NMC-NEUR-2009-31205', 'National Medical Commission (NMC India)', 18, 'VERIFIED', 'SHA256:ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb', '2026-10-31 16:53:33', 1200, '+91-98220-33456', 1, 4.92, 'Head of Neuro-Trauma and Interventional Stroke Team. Pioneer in acute mechanical thrombectomy for emergency ischemic stroke within golden time windows.') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, full_name, qualification, specialty_id, hospital_id, license_number, licensing_authority, years_experience, verification_status, verification_seal_hash, verified_at, consultation_fee, phone, is_on_duty_emergency, rating, bio) VALUES ('DOC_RAO', 'Dr. Priyadarshini Rao', 'MBBS, MD (Pathology / Medicine), DM (Clinical Hematology)', 'SPEC_HEMATO', 'HOSP_CITY_DIVINE', 'NMC-HEMA-2016-59102', 'National Medical Commission (NMC India)', 11, 'VERIFIED', 'SHA256:5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', '2026-10-31 16:53:33', 850, '+91-98220-44567', 1, 4.88, 'Emergency Clinical Hematologist specializing in severe thrombocytopenia, Dengue hemorrhagic fever management, and life-saving therapeutic apheresis.') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, full_name, qualification, specialty_id, hospital_id, license_number, licensing_authority, years_experience, verification_status, verification_seal_hash, verified_at, consultation_fee, phone, is_on_duty_emergency, rating, bio) VALUES ('DOC_MEHTA', 'Dr. Devendra Mehta', 'MBBS, MS (General Surgery), DNB (Surgical Gastroenterology)', 'SPEC_SURG_GI', 'HOSP_APEX', 'MMC-SURG-2011-73911', 'Maharashtra Medical Council & NMC', 15, 'VERIFIED', 'SHA256:4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a', '2026-10-31 16:53:33', 950, '+91-98220-55678', 1, 4.89, 'Chief of Acute Abdominal Surgery & Emergency Trauma. Expert in acute peritonitis, perforated viscus, strangulated hernia, and ruptured appendix interventions.') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, full_name, qualification, specialty_id, hospital_id, license_number, licensing_authority, years_experience, verification_status, verification_seal_hash, verified_at, consultation_fee, phone, is_on_duty_emergency, rating, bio) VALUES ('DOC_SHARMA', 'Dr. Sanjay Sharma', 'MBBS, MD (Pulmonary Medicine), DM (Critical Care)', 'SPEC_PULMO', 'HOSP_CITY_DIVINE', 'NMC-PULM-2014-61023', 'National Medical Commission (NMC India)', 13, 'VERIFIED', 'SHA256:6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b', '2026-10-31 16:53:33', 900, '+91-98220-66789', 1, 4.87, 'Critical Care Pulmonologist. Specialist in acute hypoxemic respiratory failure, adult respiratory distress syndrome (ARDS), and ECMO circuit monitoring.') ON CONFLICT DO NOTHING;

-- -----------------------------------------------------
-- Data for national_medical_registry
-- -----------------------------------------------------
INSERT INTO national_medical_registry (license_number, practitioner_name, registered_qualification, sub_specialty, registration_year, council_status, disciplinary_actions) VALUES ('NMC-CARD-2012-88419', 'Dr. Vikramaditya Rathore', 'MBBS (2007), MD (Medicine 2010), DM (Cardiology 2012)', 'Interventional Cardiology', 2012, 'ACTIVE', 0) ON CONFLICT DO NOTHING;
INSERT INTO national_medical_registry (license_number, practitioner_name, registered_qualification, sub_specialty, registration_year, council_status, disciplinary_actions) VALUES ('MMC-NEPH-2015-44290', 'Dr. Ananya Kulkarni', 'MBBS (2010), MD (Medicine 2013), DM (Nephrology 2015)', 'Nephrology', 2015, 'ACTIVE', 0) ON CONFLICT DO NOTHING;
INSERT INTO national_medical_registry (license_number, practitioner_name, registered_qualification, sub_specialty, registration_year, council_status, disciplinary_actions) VALUES ('NMC-NEUR-2009-31205', 'Dr. Rajeshwar Sen', 'MBBS (2003), MS (Surgery 2006), MCh (Neurosurgery 2009)', 'Neurosurgery', 2009, 'ACTIVE', 0) ON CONFLICT DO NOTHING;
INSERT INTO national_medical_registry (license_number, practitioner_name, registered_qualification, sub_specialty, registration_year, council_status, disciplinary_actions) VALUES ('NMC-HEMA-2016-59102', 'Dr. Priyadarshini Rao', 'MBBS (2011), MD (Pathology 2014), DM (Hematology 2016)', 'Clinical Hematology', 2016, 'ACTIVE', 0) ON CONFLICT DO NOTHING;
INSERT INTO national_medical_registry (license_number, practitioner_name, registered_qualification, sub_specialty, registration_year, council_status, disciplinary_actions) VALUES ('MMC-SURG-2011-73911', 'Dr. Devendra Mehta', 'MBBS (2005), MS (Surgery 2008), DNB (Surgical Gastro 2011)', 'Surgical Gastroenterology', 2011, 'ACTIVE', 0) ON CONFLICT DO NOTHING;
INSERT INTO national_medical_registry (license_number, practitioner_name, registered_qualification, sub_specialty, registration_year, council_status, disciplinary_actions) VALUES ('NMC-PULM-2014-61023', 'Dr. Sanjay Sharma', 'MBBS (2008), MD (Respiratory Med 2011), DM (Critical Care 2014)', 'Pulmonary Critical Care', 2014, 'ACTIVE', 0) ON CONFLICT DO NOTHING;
INSERT INTO national_medical_registry (license_number, practitioner_name, registered_qualification, sub_specialty, registration_year, council_status, disciplinary_actions) VALUES ('MCI-FAKE-1999-00123', 'Dr. Suresh Verma', 'BAMS (Alternative Medicine - Not DM Cardiology)', 'General Practice', 1999, 'SUSPENDED', 2) ON CONFLICT DO NOTHING;

-- -----------------------------------------------------
-- Data for triage_protocols
-- -----------------------------------------------------
INSERT INTO triage_protocols (id, biomarker_key, display_name, unit, normal_min, normal_max, critical_threshold_min, critical_threshold_max, urgency_when_critical, associated_specialty_id, clinical_risk_explanation, layman_explanation, immediate_first_aid_action) VALUES ('PROTO_TROPONIN', 'troponin_i', 'High-Sensitivity Troponin-I (hs-cTnI)', 'ng/mL', 0, 0.04, NULL, 0.4, 'CRITICAL', 'SPEC_CARDIO', 'Troponin-I is a structural cardiac protein released into blood ONLY when heart muscle cells undergo acute necrosis (death) due to coronary occlusion (Acute Myocardial Infarction / Heart Attack).', 'Heart muscle cells are actively starving for oxygen and dying. This is a severe medical emergency. The patient must reach a hospital with an active Cath Lab immediately for emergency stent placement.', 'Keep patient resting completely still. Loosen tight clothing. Do not give water or heavy food. Do not visit local clinic; call emergency ambulance immediately.') ON CONFLICT DO NOTHING;
INSERT INTO triage_protocols (id, biomarker_key, display_name, unit, normal_min, normal_max, critical_threshold_min, critical_threshold_max, urgency_when_critical, associated_specialty_id, clinical_risk_explanation, layman_explanation, immediate_first_aid_action) VALUES ('PROTO_CREATININE', 'serum_creatinine', 'Serum Creatinine', 'mg/dL', 0.6, 1.2, NULL, 3.5, 'CRITICAL', 'SPEC_NEPHRO', 'Sharp creatinine elevation indicates severe Acute Kidney Injury (AKI) or acute-on-chronic renal shutdown with critical retention of nitrogenous wastes and dangerous potassium accumulation (Hyperkalemia).', 'The kidneys have suddenly stopped filtering toxins and excess fluid. Deadly potassium spikes can stop the heart without warning. Emergency dialysis or specialized kidney care is required right now.', 'Strictly stop all potassium-rich foods (bananas, coconut water, citrus). Restrict fluid intake. Rush to a tertiary center equipped with an active emergency hemodialysis unit.') ON CONFLICT DO NOTHING;
INSERT INTO triage_protocols (id, biomarker_key, display_name, unit, normal_min, normal_max, critical_threshold_min, critical_threshold_max, urgency_when_critical, associated_specialty_id, clinical_risk_explanation, layman_explanation, immediate_first_aid_action) VALUES ('PROTO_PLATELETS', 'platelet_count', 'Platelet Count (Thrombocytes)', '/uL', 150000, 450000, 25000, NULL, 'CRITICAL', 'SPEC_HEMATO', 'Extreme thrombocytopenia (Platelets < 25,000 /uL, typical in Dengue hemorrhagic fever, acute leukemia, or ITP) impairs primary hemostasis and precipitates life-threatening spontaneous intracranial or gastrointestinal bleeding.', 'Blood clotting cells have fallen to critically dangerous levels. The patient can suffer sudden internal bleeding in the brain, stomach, or lungs with minimal or no injury.', 'Protect patient from falls, bumps, or sharp objects. Do NOT give aspirin, ibuprofen, or pain relief pills. Do NOT delay with home remedies; proceed to a hospital with an accredited blood bank for platelet transfusion.') ON CONFLICT DO NOTHING;
INSERT INTO triage_protocols (id, biomarker_key, display_name, unit, normal_min, normal_max, critical_threshold_min, critical_threshold_max, urgency_when_critical, associated_specialty_id, clinical_risk_explanation, layman_explanation, immediate_first_aid_action) VALUES ('PROTO_D_DIMER', 'd_dimer', 'D-Dimer Quantitative', 'ug/mL FEU', 0, 0.5, NULL, 2.5, 'CRITICAL', 'SPEC_CARDIO', 'Massive D-Dimer elevation marks active intravascular fibrin formation and breakdown, strongly suggestive of Pulmonary Embolism (PE), Deep Vein Thrombosis (DVT), or Disseminated Intravascular Coagulation (DIC).', 'Abnormal blood clots are forming and breaking inside major blood vessels, which could travel and block blood supply to lungs or heart.', 'Keep patient seated in upright position. Minimize physical movement. Transfer immediately to emergency department for CT Pulmonary Angiogram and anticoagulation.') ON CONFLICT DO NOTHING;
INSERT INTO triage_protocols (id, biomarker_key, display_name, unit, normal_min, normal_max, critical_threshold_min, critical_threshold_max, urgency_when_critical, associated_specialty_id, clinical_risk_explanation, layman_explanation, immediate_first_aid_action) VALUES ('PROTO_HEMOGLOBIN', 'hemoglobin', 'Hemoglobin (Hb)', 'g/dL', 12, 16.5, 6.5, NULL, 'CRITICAL', 'SPEC_HEMATO', 'Severe acute hemoglobin drop (< 6.5 g/dL) causes profound tissue hypoxia, hypovolemic shock, cardiac ischemia, and multi-organ failure.', 'Oxygen-carrying red blood cells are drastically depleted, either from internal blood loss or rapid cell destruction. The heart is under massive strain.', 'Keep patient lying flat with legs slightly elevated to preserve cerebral blood flow. Prepare for emergency packed red blood cell (PRBC) crossmatch and transfusion.') ON CONFLICT DO NOTHING;
INSERT INTO triage_protocols (id, biomarker_key, display_name, unit, normal_min, normal_max, critical_threshold_min, critical_threshold_max, urgency_when_critical, associated_specialty_id, clinical_risk_explanation, layman_explanation, immediate_first_aid_action) VALUES ('PROTO_TOTAL_BILIRUBIN', 'total_bilirubin', 'Total Serum Bilirubin', 'mg/dL', 0.2, 1.2, NULL, 7, 'URGENT', 'SPEC_SURG_GI', 'High total bilirubin indicates severe acute hepatic decompensation, acute biliary obstruction (cholangitis), or severe hemolysis.', 'Liver function is failing or the bile duct is dangerously blocked, accumulating toxic bile pigments in brain and bloodstream.', 'Avoid self-medication, especially paracetamol/NSAIDs which tax liver. Consult specialized surgical gastroenterology.') ON CONFLICT DO NOTHING;
INSERT INTO triage_protocols (id, biomarker_key, display_name, unit, normal_min, normal_max, critical_threshold_min, critical_threshold_max, urgency_when_critical, associated_specialty_id, clinical_risk_explanation, layman_explanation, immediate_first_aid_action) VALUES ('PROTO_WBC', 'wbc_count', 'Total Leukocyte Count (WBC / TLC)', '/uL', 4000, 11000, NULL, 22000, 'CRITICAL', 'SPEC_SURG_GI', 'Extreme leukocytosis (> 22,000 /uL) with bandemia indicates hyper-acute systemic inflammatory response syndrome (SIRS), severe concealed sepsis, or acute abdominal hollow viscus rupture (peritonitis/perforated appendicitis).', 'The body immune system is fighting an overwhelming, dangerous internal infection. Rapid surgical evaluation is needed to check for appendix rupture or internal abscess.', 'Do not eat or drink (keep NPO for potential emergency surgery). Do not apply heating pads to stomach. Proceed immediately to surgical emergency.') ON CONFLICT DO NOTHING;
INSERT INTO triage_protocols (id, biomarker_key, display_name, unit, normal_min, normal_max, critical_threshold_min, critical_threshold_max, urgency_when_critical, associated_specialty_id, clinical_risk_explanation, layman_explanation, immediate_first_aid_action) VALUES ('PROTO_SPO2', 'blood_oxygen', 'Blood Oxygen Saturation (SpO2)', '%', 95, 100, 88, NULL, 'CRITICAL', 'SPEC_PULMO', 'Severe hypoxemia with SpO2 falling below 88% causes rapid cerebral anoxia, lethal arrhythmias, and acute cardiopulmonary arrest.', 'The lungs cannot transfer enough oxygen to vital organs. Brain and heart damage occurs within minutes without medical oxygen therapy.', 'Prop patient upright in high Fowler position. Administer supplemental medical oxygen if available. Rush to hospital with ICU ventilator facility.') ON CONFLICT DO NOTHING;

