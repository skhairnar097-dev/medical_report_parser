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

