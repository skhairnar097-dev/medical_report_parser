-- ==============================================================================
-- Emergency Medical Report Parser & Authorized Specialist Matchmaking Network
-- Database Schema (PostgreSQL & SQLite Relational Specification)
-- Designed for High-Integrity Medical Credentialing & Emergency Triage Tracking
-- ==============================================================================

-- 1. Medical Specialties & Anti-Misdirection Rules Table
CREATE TABLE IF NOT EXISTS specialties (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sub_specialty TEXT,
    category TEXT NOT NULL, -- e.g. Cardiology, Nephrology, Neurology, Hematology, Surgery
    required_qualification TEXT NOT NULL, -- e.g. DM Cardiology, MCh Neurosurgery
    description TEXT NOT NULL,
    misdirected_specialties TEXT NOT NULL, -- JSON array of common wrong specialties people mistakenly consult
    misdirection_danger_explanation TEXT NOT NULL, -- Clinical explanation of why consulting the wrong doctor is fatal
    golden_hour_minutes INTEGER DEFAULT 60, -- Maximum critical time window for intervention
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Hospitals & Real-Time Emergency Capabilities Table
CREATE TABLE IF NOT EXISTS hospitals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    emergency_phone TEXT NOT NULL,
    trauma_level TEXT NOT NULL, -- Level 1 Trauma, Level 2, Tertiary Emergency
    has_247_cath_lab INTEGER DEFAULT 0, -- 1 = Yes, 0 = No
    has_emergency_ot INTEGER DEFAULT 1,
    has_blood_bank INTEGER DEFAULT 1,
    total_icu_beds INTEGER NOT NULL,
    available_icu_beds INTEGER NOT NULL,
    ventilators_available INTEGER NOT NULL,
    supported_insurances TEXT NOT NULL, -- JSON array of accepted cashless insurers
    verified_accreditation TEXT NOT NULL, -- NABH, JCI, NABL
    rating REAL DEFAULT 4.8,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Authorized Specialist Doctors & Medical Board Licenses Table
CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    qualification TEXT NOT NULL, -- e.g. MBBS, MD, DM Interventional Cardiology
    specialty_id TEXT NOT NULL,
    hospital_id TEXT NOT NULL,
    license_number TEXT UNIQUE NOT NULL, -- National Medical Commission (NMC) / State Council ID
    licensing_authority TEXT NOT NULL, -- e.g. National Medical Commission / Maharashtra Medical Council
    years_experience INTEGER NOT NULL,
    verification_status TEXT DEFAULT 'VERIFIED', -- VERIFIED, PENDING_REVIEW, REJECTED
    verification_seal_hash TEXT NOT NULL, -- Cryptographic hash seal verifying medical license legitimacy
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    consultation_fee INTEGER DEFAULT 800,
    phone TEXT,
    is_on_duty_emergency INTEGER DEFAULT 1,
    rating REAL DEFAULT 4.9,
    bio TEXT,
    FOREIGN KEY (specialty_id) REFERENCES specialties(id),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- 4. National Medical Council Registry Simulation Table (for Admin Verification Desk)
CREATE TABLE IF NOT EXISTS national_medical_registry (
    license_number TEXT PRIMARY KEY,
    practitioner_name TEXT NOT NULL,
    registered_qualification TEXT NOT NULL,
    sub_specialty TEXT NOT NULL,
    registration_year INTEGER NOT NULL,
    council_status TEXT DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, DE-REGISTERED
    disciplinary_actions INTEGER DEFAULT 0
);

-- 5. Diagnostic Biomarkers & Triage Severity Protocols Table
CREATE TABLE IF NOT EXISTS triage_protocols (
    id TEXT PRIMARY KEY,
    biomarker_key TEXT NOT NULL, -- e.g. troponin_i, serum_creatinine, platelet_count, d_dimer, hemoglobin
    display_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    normal_min REAL,
    normal_max REAL,
    critical_threshold_min REAL,
    critical_threshold_max REAL,
    urgency_when_critical TEXT DEFAULT 'CRITICAL', -- CRITICAL, URGENT
    associated_specialty_id TEXT NOT NULL,
    clinical_risk_explanation TEXT NOT NULL,
    layman_explanation TEXT NOT NULL,
    immediate_first_aid_action TEXT NOT NULL,
    FOREIGN KEY (associated_specialty_id) REFERENCES specialties(id)
);

-- 6. Emergency Triage Incident Logs Table
CREATE TABLE IF NOT EXISTS triage_logs (
    id TEXT PRIMARY KEY,
    patient_name TEXT,
    uploaded_report_filename TEXT,
    extracted_text TEXT,
    triage_level TEXT NOT NULL, -- CRITICAL, URGENT, STABLE
    identified_biomarkers TEXT NOT NULL, -- JSON array of detected values
    matched_specialty_id TEXT NOT NULL,
    misdirection_prevented TEXT, -- Description of avoided doctor mistake
    user_latitude REAL,
    user_longitude REAL,
    recommended_hospital_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (matched_specialty_id) REFERENCES specialties(id),
    FOREIGN KEY (recommended_hospital_id) REFERENCES hospitals(id)
);

-- 7. One-Tap Emergency Family Shares Table
CREATE TABLE IF NOT EXISTS emergency_shares (
    id TEXT PRIMARY KEY,
    triage_log_id TEXT,
    patient_identifier TEXT NOT NULL,
    summary_text TEXT NOT NULL,
    severity_level TEXT NOT NULL,
    hospital_name TEXT NOT NULL,
    hospital_phone TEXT NOT NULL,
    hospital_map_url TEXT NOT NULL,
    patient_location_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

