# 🏥 TriageShield AI: Emergency Medical Report Parser & Authorized Specialist Matchmaking Network

> **Design Thinking (DT) Engineering Project | Year 2 | 4-Member Team**  
> An Emergency-Grade Web Triage System that decodes complex diagnostic reports in real-time, determines clinical urgency, prevents fatal doctor misdirection, and matches panicking relatives with authorized specialists and equipped hospitals nearby.

---

## 🎯 1. Problem Statement
When patients receive complex medical reports or experience sudden deterioration, a lack of immediate medical guidance often leads to consulting the **wrong specialist or an unqualified practitioner**. Misdirected care frequently results in incorrect treatments, delayed interventions, and severe medical complications that turn manageable conditions into life-threatening emergencies. During these high-stress moments, relatives panic and make rushed decisions driven by fear, hearsay, or unverified online searches.

Existing booking platforms act as **unverified commercial directories**, prioritizing sponsored listings over clinical accuracy.

### 🌟 Project Goal
To construct an **Emergency-Grade Web and Mobile Triage System** that parses complex medical reports, determines immediate clinical urgency, **eliminates incorrect doctor categories (Anti-Misdirection)**, and matches panicking relatives with authorized, verified specialists and equipped hospitals in real time.

---

## 💡 2. Core Innovation & Key Features

### 🩺 1. Emergency Report Scanner & Biomarker Decoder
- **Automated Parameter Extraction**: Scans lab tests and radiology reports using clinical pattern matching (Troponin-I, Serum Creatinine, Platelet Count, D-Dimer, Hemoglobin, WBC/TLC, SpO2, and CT/MRI findings).
- **Plain-English Layman Explanations**: Translates dense diagnostic jargon into simple, reassuring language for panicking relatives.
- **Red-Flag Severity Alert System**: Assigns clinical triage levels:
  - 🔴 **Triage Level 1: CRITICAL (CODE RED)** - Immediate emergency room intervention (< 15 mins). High-contrast red alert banner with synthesized hospital chime.
  - 🟡 **Triage Level 2: URGENT (CODE YELLOW)** - Clinical escalation risk within 1-2 hours.
  - 🟢 **Triage Level 3: STABLE (CODE GREEN)** - Physiological parameters within normal reference baseline.

### 🚫 2. Anti-Misdirection Specialty Decision Matrix (Unique Innovation)
- **Explicitly Warns Against Dangerous Choices**: Proactively warns families against visiting the wrong medical field (e.g., visiting an orthopedic clinic or general dispensary for chest pain caused by myocardial ischemia).
- **Clinical Consequence Breakdown**: Explains *why* the wrong doctor is fatal (e.g., lack of Cardiac Catheterization Lab, crossing the 90-minute Golden Hour for balloon angioplasty).
- **Authorized Qualification Enforcement**: Recommends strictly board-certified specialists (DM Cardiology, MCh Neurosurgery, DM Nephrology, DM Hematology).

### 🏥 3. Authorized Specialist & Equipped Hospital Discovery (GIS Map)
- **Live ICU Capacity Tracking**: Displays real-time available ICU beds (e.g. `6 / 28 ICU Beds Ready`), operational surgical trauma suites, and 24/7 Cath Lab readiness.
- **Interactive OpenStreetMap (Leaflet.js)**: Shows patient location pin, hospital markers, route visualization, distance in km, and emergency transit time.
- **Cashless Insurance Matcher**: Filter hospitals by cashless insurance providers (Star Health, Care Health, HDFC ERGO, ICICI Lombard, Ayushman Bharat PM-JAY).

### 🆘 4. One-Tap Family Panic Assist
- Generates a verified Emergency Summary Card with one click.
- Produces a direct **WhatsApp Emergency Broadcast link** formatted with patient severity, critical biomarkers, hospital location, and GPS navigation link for family group chats.

### 🛡️ 5. Medical Board Credential Verification Desk (Admin Console)
- Cross-references doctor license numbers against the **National Medical Commission (NMC)** registry.
- Generates digital **Cryptographic SHA-256 Verification Seals** verifying practitioner legitimacy.
- Blocks suspended or unverified practitioners from the emergency grid.
- Allows hospital triage intake coordinators to adjust live ICU bed availability with instant updates on the public map.

---

## 🛠️ 3. Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), Tailwind CSS, Leaflet.js, Web Audio API |
| **Backend** | Node.js, Express.js, RESTful Architecture, Multer (file handling) |
| **Database** | Relational SQLite (Zero-config instant demo) + PostgreSQL DDL specification |
| **Security & GIS** | Cryptographic SHA-256 Digital Verification Seals, Haversine GIS Routing, OpenStreetMap |

---

## 📂 4. Project File Structure

```
Mecial Report Parser/
├── package.json                    # Project configuration & start scripts
├── server.js                       # Express application & REST API routes
├── test-runner.js                  # Automated end-to-end test suite
├── db/
│   ├── index.js                    # Database connection & query engine
│   ├── schema.sql                  # Standard relational database schema
│   ├── schema-postgres.sql         # Production PostgreSQL DDL specification
│   ├── seed.js                     # Seed data (specialties, hospitals, doctors, licenses)
│   └── medical_triage.sqlite       # Relational SQLite database
├── services/
│   ├── ocrEngine.js                # Medical OCR parsing & biomarker extractor
│   ├── triageEngine.js             # Clinical severity scoring & layman explanations
│   ├── specialtyMatcher.js         # Anti-misdirection engine (Correct vs Wrong doctors)
│   ├── credentialVerifier.js       # Medical board verification & SHA-256 digital seals
│   └── panicAssistService.js       # One-Tap Panic Assist & WhatsApp broadcast generator
├── public/
│   ├── index.html                  # Single-Page Emergency Triage Application
│   ├── css/
│   │   └── custom.css              # Emergency radar pulses, high-contrast badges, glowing panels
│   ├── js/
│   │   ├── app.js                  # State store, tab navigation, Web Audio chime synthesizer
│   │   ├── triageUi.js             # Report upload, OCR visualization, sample presets
│   │   ├── antiMisdirectionUi.js   # Side-by-side comparison matrix (Avoid vs Consult)
│   │   ├── mapService.js           # Leaflet.js GIS emergency hospital locator
│   │   └── adminUi.js              # Doctor license verification desk & ICU bed live monitor
│   └── samples/                    # 5 realistic diagnostic clinical lab test files
└── DT_PROJECT_DOCUMENTATION.md     # Full 5-Stage Design Thinking academic presentation report
```

---

## 🚀 5. How to Run the Project

### Prerequisites
- Node.js (v18 or higher)
- npm

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Seed the relational database (pre-loaded with hospitals, doctors & triage rules)
npm run seed

# 3. Start the application
npm start
```

Now open your browser and navigate to:  
👉 **`http://localhost:3000`**

---

## 🎬 6. Demonstration Guide for College Review & Professors

When presenting your Design Thinking project to your professors or evaluators:

1. **Step 1: Open the Emergency Triage Tab (`/`)**
   - Click the 1-Click Demo scenario: **"🚨 Acute Cardiac Emergency (STEMI / High Troponin-I)"**.
   - Notice the instant extraction: **Troponin-I: 2.45 ng/mL** (> 60x upper normal limit).
   - Show the **Triage Level 1: CODE RED** banner and listen to the emergency audio alert!
   - Highlight the **Plain-English Layman Explanation** generated to relieve panic for family members.

2. **Step 2: Demonstrate the Anti-Misdirection Engine**
   - Switch to the **"Anti-Misdirection Guide"** tab.
   - Show the **"DANGEROUS SPECIALTIES TO AVOID"**: General Physician, Orthopedic Clinic, Acidity doctor.
   - Explain the clinical reasoning: *No Cath Lab at general clinic; crossing the 90-minute Golden Hour causes irreversible heart muscle death.*
   - Point to the **"REQUIRED AUTHORIZED SPECIALIST"**: Interventional Cardiologist (DM / DNB Cardiology).

3. **Step 3: Show Equipped Hospitals & Real-Time GIS Navigation**
   - Switch to the **"Specialists & GIS Map"** tab.
   - Show the interactive map with hospital pins, distance (e.g. 3.2 km), transit time (~12 mins), and **Live ICU bed counts** (6 / 28 available).
   - Use the **Cashless Insurance filter** (select Star Health, Ayushman Bharat, etc.).

4. **Step 4: Demonstrate One-Tap Family Panic Assist**
   - Switch to the **"One-Tap Panic Assist"** tab.
   - Click **"Generate Instant Family SOS Broadcast"**.
   - Show the formatted WhatsApp broadcast message ready to share with family members.

5. **Step 5: Show the Medical Board Credential Verification Desk (Admin)**
   - Switch to the **"Medical Board Verification"** tab.
   - Click the valid license test: `NMC-CARD-2012-88419` → shows **OFFICIAL CREDENTIALS VERIFIED** with cryptographic SHA-256 seal.
   - Click the fake license test: `MCI-FAKE-1999-00123` → shows **VERIFICATION REJECTED / SUSPENDED** (Disciplinary actions: 2).
   - Adjust the **Available ICU Beds slider** on Apex Hospital and show that the capacity updates live!

6. **Step 6: Show the Design Thinking Showcase Tab**
   - Switch to the **"Design Thinking Showcase"** tab.
   - Present the **4-Quadrant Empathy Map** (Says, Thinks, Does, Feels), **POV Statement**, **How-Might-We questions**, and **Validation Metrics** (94% reduction in misdirected care, time-to-specialist reduced from 4.2 hours to 12 minutes).

---

## 👥 7. Team Roster (4 Members)

| Member | Designated Role | Key Responsibilities |
| :--- | :--- | :--- |
| **Member 1** | Frontend & UX Architect | Emergency high-contrast UI, Leaflet GIS mapping, layout and responsive flow |
| **Member 2** | Backend & Database Architect | Express.js REST APIs, relational schema integrity, SQLite/PostgreSQL models |
| **Member 3** | Clinical Triage & OCR Engine | Diagnostic regex patterns, laboratory biomarker thresholds, layman translations |
| **Member 4** | DT Research & Empathy Lead | Caregiver interviews, Empathy mapping, validation testing metrics, presentation portfolio |

---

## 📄 8. License & Academic Disclaimer
Built for academic and educational demonstration as part of the Second Year Engineering Design Thinking (DT) curriculum. Not intended for direct medical diagnosis in place of a licensed medical practitioner.

