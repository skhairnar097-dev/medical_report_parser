/**
 * TriageShield AI - Left-Hand Sidebar Dashboard 4-Step Flow & Auth Controller
 * 1. Upload report or enter symptoms
 * 2. Analyse report & generate summary
 * 3. Show right specialist (Anti-Misdirection)
 * 4. Call it / Message
 */

const AppState = {
    currentStep: 1,
    triageData: null,
    currentUser: null,
    selectedDoctor: null,
    bookedAppointment: null,
    step4Map: null,
    step4Marker: null,
    step4Polyline: null,
    userLocation: {
        latitude: 19.9975,
        longitude: 73.7898,
        hasRealGps: false,
        gpsAccuracy: null,
        error: null
    }
};

// Built-in presets for instant 1-click teacher/viva testing
const PRESETS = {
    cardiac: {
        name: 'Ramesh Patel (58 Y, Male)',
        text: `METRO PATHOLOGY & ADVANCED DIAGNOSTICS
PATIENT: Ramesh Patel, Age: 58 / M
CLINICAL INDICATION: Severe crushing retrosternal chest pain radiating to left jaw

EMERGENCY CARDIAC PANEL:
--------------------------------------------------------------
High-Sensitivity Troponin-I (hs-cTnI) : 2.45  (Normal: 0.00 - 0.04 ng/mL)
D-Dimer Quantitative               : 0.38  (Normal: 0.00 - 0.50 ug/mL FEU)
Serum Creatinine                   : 0.95  (Normal: 0.60 - 1.20 mg/dL)
Hemoglobin                         : 14.2  (Normal: 12.5 - 16.5 g/dL)
Total Leukocyte Count (WBC)        : 9,800 (Normal: 4,000 - 11,000 /uL)

IMPRESSION:
Critical acute elevation of Cardiac Troponin-I (> 60x upper limit of normal).
Strongly diagnostic of Acute Myocardial Infarction (STEMI / NSTEMI).
IMMEDIATE PRIMARY ANGIOPLASTY & INTERVENTIONAL CARDIOLOGY REQUIRED.`
    },
    renal: {
        name: 'Sunita Sharma (62 Y, Female)',
        text: `CENTRAL REGIONAL DIAGNOSTIC LABORATORIES
PATIENT: Sunita Sharma, Age: 62 / F
CLINICAL INDICATION: Sudden anuria (no urination for 24 hours), severe nausea, metabolic acidosis

EMERGENCY RENAL FUNCTION PANEL:
--------------------------------------------------------------
Serum Creatinine                   : 4.80  (Normal: 0.60 - 1.20 mg/dL)
Hemoglobin                         : 9.80  (Normal: 12.0 - 15.5 g/dL)
Platelet Count                     : 220,000 (Normal: 150,000 - 450,000 /uL)
Total Bilirubin                    : 0.80  (Normal: 0.20 - 1.20 mg/dL)

IMPRESSION:
Severe Acute Kidney Injury (KDIGO Stage 3) / Acute Renal Failure.
Severe nitrogenous waste retention with lethal hyperkalemia risk.
IMMEDIATE EMERGENCY NEPHROLOGY CONSULT & URGENT HEMODIALYSIS REQUIRED.`
    },
    dengue: {
        name: 'Kunal Deshmukh (29 Y, Male)',
        text: `PRIME DIAGNOSTIC & MOLECULAR PATH LAB
PATIENT: Kunal Deshmukh, Age: 29 / M
CLINICAL INDICATION: Dengue NS1 Positive Day 5, petechial rash and gum bleeding

COMPLETE BLOOD PICTURE (CBC):
--------------------------------------------------------------
Total Platelet Count               : 16,000 (Normal: 150,000 - 450,000 /uL)
Hemoglobin                         : 16.8   (Normal: 13.0 - 17.0 g/dL)
Total Leukocyte Count (WBC)        : 2,800  (Normal: 4,000 - 11,000 /uL)
Serum Creatinine                   : 0.85   (Normal: 0.70 - 1.20 mg/dL)

ALERT:
CRITICAL SEVERE THROMBOCYTOPENIA (< 20,000 /uL). High danger of spontaneous internal/brain hemorrhage.
IMMEDIATE CLINICAL HEMATOLOGY ADMISSION & APHERESIS PLATELET TRANSFUSION NEEDED.`
    },
    routine: {
        name: 'Priya Verma (34 Y, Female)',
        text: `METRO PREVENTIVE HEALTH CLINIC
PATIENT: Priya Verma, Age: 34 / F
PACKAGE: Annual Comprehensive Health Checkup

TEST FINDINGS:
--------------------------------------------------------------
High-Sensitivity Troponin-I        : 0.01  (Normal: 0.00 - 0.04 ng/mL)
Serum Creatinine                   : 0.80  (Normal: 0.60 - 1.20 mg/dL)
Total Platelet Count               : 285,000 (Normal: 150,000 - 450,000 /uL)
Hemoglobin                         : 13.5  (Normal: 12.0 - 15.5 g/dL)
Total Leukocyte Count (WBC)        : 6,400 (Normal: 4,000 - 11,000 /uL)
D-Dimer Quantitative               : 0.15  (Normal: 0.00 - 0.50 ug/mL FEU)

IMPRESSION:
All parameters within normal physiological limits. Normal routine baseline.`
    }
};

const STEP_METADATA = {
    1: { sub: 'STEP 1 OF 4', title: 'Upload Medical Report or Enter Symptoms' },
    2: { sub: 'STEP 2 OF 4', title: 'Report Analysis & Decoded Summary' },
    3: { sub: 'STEP 3 OF 4', title: 'Right Specialist Match & Anti-Misdirection' },
    4: { sub: 'STEP 4 OF 4', title: 'Call Specialist or Send Emergency Message' }
};

// ==============================================================================
// AUTHENTICATION & GUEST MODE CONTROLLER
// ==============================================================================

function initAuth() {
    const savedUser = sessionStorage.getItem('triage_user');
    const authScreen = document.getElementById('auth-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');

    if (savedUser) {
        try {
            AppState.currentUser = JSON.parse(savedUser);
            showDashboard();
            return;
        } catch (e) {
            sessionStorage.removeItem('triage_user');
        }
    }

    // Default: Show Sign-In Screen
    if (authScreen) authScreen.classList.remove('hidden');
    if (dashboardScreen) dashboardScreen.classList.add('hidden');
}

// Emergency Quick Access - Continue as Guest
function continueAsGuest() {
    const guestUser = {
        name: 'Guest Caregiver',
        email: 'guest@emergency.local',
        role: 'Emergency Quick Access',
        isGuest: true
    };

    AppState.currentUser = guestUser;
    sessionStorage.setItem('triage_user', JSON.stringify(guestUser));
    showDashboard();
    showToast('⚡ Continuing as Guest (Emergency Mode Active)', 'success');
}

// Sign In with email / password
function handleUserSignIn(event) {
    if (event) event.preventDefault();

    const emailInput = document.getElementById('signin-email');
    const passInput = document.getElementById('signin-password');
    const email = emailInput ? emailInput.value.trim() : '';

    if (!email) {
        showToast('Please enter your Login ID, email, or phone number', 'warning');
        if (emailInput) emailInput.focus();
        return;
    }

    const user = {
        name: email.includes('@') ? email.split('@')[0].replace('.', ' ') : email,
        email: email,
        role: 'Verified Caregiver',
        isGuest: false
    };

    AppState.currentUser = user;
    sessionStorage.setItem('triage_user', JSON.stringify(user));
    showDashboard();
    showToast(`Signed in as ${user.name}`, 'success');
}

// Autofill demo credentials
function fillDemoCredentials() {
    const emailInput = document.getElementById('signin-email');
    const passInput = document.getElementById('signin-password');
    if (emailInput) emailInput.value = 'caregiver.ramesh@familycare.org';
    if (passInput) passInput.value = 'triage123';
    showToast('Demo credentials filled.', 'info');
}

// Switch view from Auth to Dashboard
function showDashboard() {
    const authScreen = document.getElementById('auth-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const userDisplay = document.getElementById('sidebar-user-display');
    const userRole = document.getElementById('sidebar-user-role');
    const userAvatar = document.getElementById('sidebar-user-avatar');

    if (authScreen) authScreen.classList.add('hidden');
    if (dashboardScreen) dashboardScreen.classList.remove('hidden');

    if (AppState.currentUser) {
        if (userDisplay) userDisplay.innerText = AppState.currentUser.name;
        if (userRole) userRole.innerText = AppState.currentUser.role;
        if (userAvatar) userAvatar.innerText = AppState.currentUser.isGuest ? '⚡' : '👤';
    }

    goToStep(1);
}

// Sign out and return to login screen
function userSignOut() {
    sessionStorage.removeItem('triage_user');
    AppState.currentUser = null;
    AppState.triageData = null;

    const authScreen = document.getElementById('auth-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');

    if (dashboardScreen) dashboardScreen.classList.add('hidden');
    if (authScreen) authScreen.classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Signed out of emergency session.', 'info');
}

// ==============================================================================
// 4-STEP DASHBOARD CONTROLLER
// ==============================================================================

// Load Preset and auto-execute for instant viva demo
function loadSamplePreset(key) {
    const preset = PRESETS[key];
    if (!preset) return;

    const nameInput = document.getElementById('patient-name-input');
    const textInput = document.getElementById('raw-text-input');
    const fileLabel = document.getElementById('selected-file-label');

    if (nameInput) nameInput.value = preset.name;
    if (textInput) textInput.value = preset.text;
    if (fileLabel) fileLabel.innerText = `Preset Loaded: ${key.toUpperCase()} Sample Report`;

    executeStep1To2();
}

// Navigate between Steps 1, 2, 3, 4
function goToStep(step) {
    if (step > 1 && !AppState.triageData) {
        showToast('Please upload a report or enter symptoms first in Step 1.', 'info');
        return;
    }

    AppState.currentStep = step;

    // Toggle main content view visibility
    for (let i = 1; i <= 4; i++) {
        const view = document.getElementById(`step-view-${i}`);
        if (view) {
            if (i === step) {
                view.classList.remove('hidden');
            } else {
                view.classList.add('hidden');
            }
        }
    }

    // Update Left-Hand Sidebar Stepper
    for (let i = 1; i <= 4; i++) {
        const navItem = document.getElementById(`step-nav-${i}`);
        const circle = document.getElementById(`step-circle-${i}`);
        const title = document.getElementById(`step-title-${i}`);
        const sub = document.getElementById(`step-sub-${i}`);

        if (!circle || !title) continue;

        if (i < step) {
            // Completed step
            circle.className = 'step-circle w-10 h-10 rounded-full border-2 border-emerald-600 bg-emerald-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 completed shadow-xs';
            circle.innerHTML = '✓';
            title.className = 'block text-sm font-bold text-emerald-700';
            if (sub) sub.className = 'block text-xs text-slate-500 truncate';
            if (navItem) {
                navItem.classList.add('completed');
                navItem.classList.remove('bg-blue-50/60');
            }
        } else if (i === step) {
            // Active current step
            circle.className = 'step-circle w-10 h-10 rounded-full border-2 border-blue-600 bg-blue-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 active shadow-md';
            circle.innerHTML = i.toString();
            title.className = 'block text-sm font-bold text-blue-600';
            if (sub) sub.className = 'block text-xs text-blue-500 truncate';
            if (navItem) {
                navItem.classList.remove('completed');
                navItem.classList.add('bg-blue-50/60');
            }
        } else {
            // Inactive upcoming step
            circle.className = 'step-circle w-10 h-10 rounded-full border-2 border-slate-200 bg-white text-slate-500 font-bold text-sm flex items-center justify-center flex-shrink-0 inactive';
            circle.innerHTML = i.toString();
            title.className = 'block text-sm font-semibold text-slate-700';
            if (sub) sub.className = 'block text-xs text-slate-400 truncate';
            if (navItem) {
                navItem.classList.remove('completed', 'bg-blue-50/60');
            }
        }
    }

    // Update Topbar Title & Subtitle
    const topSub = document.getElementById('topbar-step-sub');
    const topTitle = document.getElementById('topbar-step-title');
    if (topSub && topTitle && STEP_METADATA[step]) {
        topSub.innerText = STEP_METADATA[step].sub;
        topTitle.innerText = STEP_METADATA[step].title;
    }

    // Special handling when entering Step 4: Re-render with selected doctor & hospital
    if (step === 4) {
        if (AppState.triageData) {
            populateStep4(AppState.triageData);
        }
        setTimeout(initStep4Map, 200);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Step 1 -> Step 2: Call backend API to parse report
async function executeStep1To2() {
    const analyzeBtn = document.getElementById('analyze-btn');
    const spinner = document.getElementById('analyze-spinner');
    const nameInput = document.getElementById('patient-name-input');
    const textInput = document.getElementById('raw-text-input');
    const fileInput = document.getElementById('report-file-input');

    const patientName = nameInput ? nameInput.value.trim() : 'Emergency Patient';
    const rawText = textInput ? textInput.value.trim() : '';

    if (!rawText && (!fileInput || !fileInput.files || fileInput.files.length === 0)) {
        showToast('Please enter report text or select a file/preset.', 'error');
        return;
    }

    if (analyzeBtn) analyzeBtn.disabled = true;
    if (spinner) spinner.classList.remove('hidden');

    try {
        const formData = new FormData();
        formData.append('patientName', patientName);
        formData.append('rawText', rawText);
        formData.append('latitude', AppState.userLocation.latitude);
        formData.append('longitude', AppState.userLocation.longitude);

        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            formData.append('reportFile', fileInput.files[0]);
        }

        const res = await fetch('/api/triage/parse', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to parse report');
        }

        AppState.triageData = data;

        // Update Left Sidebar Live Status Box
        updateSidebarStatus(data);

        // Populate Steps 2, 3, 4 with parsed response
        populateStep2(data);
        populateStep3(data);
        populateStep4(data);

        // Transition to Step 2
        goToStep(2);
        showToast(`✅ Report analyzed & saved to Supabase (ID: ${data.triageLogId || 'SAVED'})`, 'success');

    } catch (err) {
        console.error('Triage error:', err);
        showToast('Error parsing report: ' + err.message, 'error');
    } finally {
        if (analyzeBtn) analyzeBtn.disabled = false;
        if (spinner) spinner.classList.add('hidden');
    }
}

// Update the Left Sidebar Live Status Widget
function updateSidebarStatus(data) {
    const statusBox = document.getElementById('sidebar-status-box');
    const badge = document.getElementById('sidebar-triage-badge');
    const nameEl = document.getElementById('sidebar-patient-name');
    const specEl = document.getElementById('sidebar-matched-spec');

    if (!statusBox) return;

    statusBox.classList.remove('hidden');
    if (nameEl) nameEl.innerText = data.patientName || 'Emergency Patient';
    if (specEl) specEl.innerText = data.specialtyGuidance?.authorizedSpecialtyName || 'Emergency Specialist';

    if (badge) {
        const severity = data.triageResult?.overallSeverity || 'CRITICAL';
        if (severity === 'CRITICAL') {
            badge.className = 'px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-100 text-red-700';
            badge.innerText = 'CODE RED';
        } else if (severity === 'URGENT') {
            badge.className = 'px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-800';
            badge.innerText = 'CODE YELLOW';
        } else {
            badge.className = 'px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800';
            badge.innerText = 'CODE GREEN';
        }
    }
}

// Populate Step 2: Report Analysis & Summary
function populateStep2(data) {
    const triage = data.triageResult;
    const isCritical = triage.overallSeverity === 'CRITICAL';
    const isUrgent = triage.overallSeverity === 'URGENT';

    // 1. Severity Banner
    const bannerContainer = document.getElementById('step-2-severity-banner');
    if (bannerContainer) {
        if (isCritical) {
            bannerContainer.innerHTML = `
                <div class="p-5 rounded-2xl bg-red-50 border-2 border-red-500 shadow-xs flex items-center space-x-4">
                    <div class="w-12 h-12 rounded-full bg-red-600 text-white font-extrabold text-xl flex items-center justify-center flex-shrink-0 radar-emergency-light">
                        !
                    </div>
                    <div>
                        <div class="flex items-center space-x-2">
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-600 text-white">TRIAGE LEVEL 1</span>
                            <span class="text-xs font-black text-red-600 tracking-wider">CODE RED • IMMEDIATE MEDICAL EMERGENCY</span>
                        </div>
                        <h3 class="text-lg font-black text-red-900 mt-0.5">Critical Life-Threatening Metrics Detected</h3>
                        <p class="text-xs text-red-700 mt-1">${triage.criticalReason}</p>
                    </div>
                </div>
            `;
        } else if (isUrgent) {
            bannerContainer.innerHTML = `
                <div class="p-5 rounded-2xl bg-amber-50 border-2 border-amber-500 shadow-xs flex items-center space-x-4">
                    <div class="w-12 h-12 rounded-full bg-amber-500 text-white font-extrabold text-xl flex items-center justify-center flex-shrink-0">
                        !
                    </div>
                    <div>
                        <div class="flex items-center space-x-2">
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-white">TRIAGE LEVEL 2</span>
                            <span class="text-xs font-black text-amber-700 tracking-wider">CODE YELLOW • URGENT MEDICAL ATTENTION</span>
                        </div>
                        <h3 class="text-lg font-black text-amber-900 mt-0.5">Elevated Risk Parameters</h3>
                        <p class="text-xs text-amber-800 mt-1">${triage.criticalReason}</p>
                    </div>
                </div>
            `;
        } else {
            bannerContainer.innerHTML = `
                <div class="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-500 shadow-xs flex items-center space-x-4">
                    <div class="w-12 h-12 rounded-full bg-emerald-600 text-white font-extrabold text-xl flex items-center justify-center flex-shrink-0">
                        ✓
                    </div>
                    <div>
                        <div class="flex items-center space-x-2">
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white">TRIAGE LEVEL 3</span>
                            <span class="text-xs font-black text-emerald-700 tracking-wider">CODE GREEN • NORMAL / STABLE</span>
                        </div>
                        <h3 class="text-lg font-black text-emerald-900 mt-0.5">All Biomarkers Within Safe Baseline</h3>
                        <p class="text-xs text-emerald-700 mt-1">${triage.criticalReason}</p>
                    </div>
                </div>
            `;
        }
    }

    // 2. Biomarkers Grid
    const biomarkersGrid = document.getElementById('step-2-biomarkers-grid');
    if (biomarkersGrid) {
        biomarkersGrid.innerHTML = triage.analyzedBiomarkers.map(bm => {
            const isCrit = bm.status === 'CRITICAL';
            const isElev = bm.status === 'ELEVATED' || bm.status === 'LOW';
            const borderColor = isCrit ? 'border-red-300 bg-red-50/40' : (isElev ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-slate-50/40');
            const badgeColor = isCrit ? 'bg-red-600 text-white' : (isElev ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white');
            const valColor = isCrit ? 'text-red-700' : (isElev ? 'text-amber-700' : 'text-emerald-700');

            return `
                <div class="p-4 rounded-xl border ${borderColor} shadow-xs space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-slate-700">${bm.name}</span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${badgeColor}">${bm.status}</span>
                    </div>
                    <div class="flex items-baseline space-x-2">
                        <span class="text-2xl font-black ${valColor}">${bm.value}</span>
                        <span class="text-xs text-slate-500 font-medium">${bm.unit}</span>
                    </div>
                    <div class="text-[11px] text-slate-500">
                        Normal Range: <strong class="text-slate-700">${bm.normalRange}</strong>
                    </div>
                    <div class="pt-2 border-t border-slate-200/80 text-xs text-slate-600 leading-relaxed">
                        <strong class="text-slate-800">Meaning:</strong> ${bm.laymanExplanation}
                    </div>
                </div>
            `;
        }).join('');
    }

    // 3. Layman Summary Box
    const laymanSummaryEl = document.getElementById('step-2-layman-summary');
    if (laymanSummaryEl) {
        if (isCritical) {
            laymanSummaryEl.innerHTML = `
                ⚠️ <strong class="text-red-700">Immediate Action Required:</strong> The patient's lab metrics indicate acute physiological compromise. For example, ${triage.criticalReason}
                Do not attempt home remedies or visit a general neighborhood clinic that lacks emergency equipment. Proceed directly to Step 3 to view the verified sub-specialist and equipped hospital.
            `;
        } else {
            laymanSummaryEl.innerHTML = `
                All analyzed diagnostic metrics are within expected healthy reference limits. Standard general physician review is adequate.
            `;
        }
    }
}

// Populate Step 3: Right Specialist & Anti-Misdirection Warnings
function populateStep3(data) {
    const specialty = data.specialtyGuidance;
    const doctors = data.authorizedDoctors || [];

    if (!specialty) return;

    // Wrong doctors badges
    const wrongDoctorsContainer = document.getElementById('step-3-wrong-doctors-list');
    if (wrongDoctorsContainer && specialty.antiMisdirection) {
        wrongDoctorsContainer.innerHTML = specialty.antiMisdirection.dangerousWrongSpecialties.map(doc => `
            <span class="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-red-100 text-red-800 border border-red-300 text-xs font-bold">
                <span>✕</span> <span>${doc}</span>
            </span>
        `).join('');
    }

    // Danger explanation
    const dangerEl = document.getElementById('step-3-danger-explanation');
    if (dangerEl && specialty.antiMisdirection) {
        dangerEl.innerText = specialty.antiMisdirection.dangerExplanation;
    }

    // Right specialty details
    const specTitle = document.getElementById('step-3-specialty-title');
    const specDegree = document.getElementById('step-3-specialty-degree');
    const goldenWin = document.getElementById('step-3-golden-window');

    if (specTitle) specTitle.innerText = specialty.authorizedSpecialtyName;
    if (specDegree) specDegree.innerText = specialty.requiredQualification;
    if (goldenWin) goldenWin.innerText = specialty.goldenHourMinutes || '60';

    // Doctors List
    const doctorsList = document.getElementById('step-3-doctors-list');
    if (doctorsList) {
        doctorsList.innerHTML = doctors.map(d => {
            const hospName = d.hospital_name || 'Tertiary Super Specialty Center';
            const hospAddr = d.hospital_address || d.hospital_city || 'Main Healthcare Road, Maharashtra';
            const fee = d.consultation_fee || 800;
            const dist = d.distanceKm || '2.8';

            return `
            <div class="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 transition shadow-xs space-y-4">
                <!-- Top Row: Doctor Info & Rating -->
                <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div class="space-y-1 min-w-0 flex-1">
                        <div class="flex items-center space-x-2 flex-wrap">
                            <h4 class="text-base font-bold text-slate-900">${d.full_name}</h4>
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-0.5">
                                <span>✓</span> <span>NMC VERIFIED</span>
                            </span>
                        </div>
                        <p class="text-xs text-blue-700 font-semibold">${d.qualification}</p>
                        <p class="text-xs text-slate-600 font-medium flex items-center space-x-1">
                            <span>🏥</span> <strong class="text-slate-800">${hospName}</strong>
                            <span class="text-slate-400">•</span>
                            <span class="text-slate-500 truncate">${hospAddr}</span>
                        </p>
                        <div class="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                            <span>📍 Distance: <strong class="text-slate-800">~${dist} km</strong> away</span>
                            <span>• 📞 Phone: <strong class="text-blue-700 font-mono font-bold">${d.phone || '+91-20-8000-9911'}</strong></span>
                            <span>• License: <strong class="text-slate-700">${d.license_number}</strong></span>
                            <span>• Fee: <strong class="text-emerald-700">₹${fee}</strong></span>
                        </div>
                    </div>

                    <div class="flex sm:flex-col items-center sm:items-end justify-between flex-shrink-0">
                        <span class="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">★ ${d.rating || '4.9'} / 5.0</span>
                        <span class="text-[10px] text-emerald-600 font-bold mt-1">● Available Today</span>
                    </div>
                </div>

                <!-- Action Buttons: Book Appointment (Primary) + View Hospital Location + Call -->
                <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <button type="button" onclick="openBookingModal('${d.id}')"
                        class="flex-1 min-w-[150px] py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer">
                        <span>📅</span>
                        <span>Book Appointment</span>
                    </button>

                    <button type="button" onclick="viewHospitalLocationForDoctor('${d.id}')"
                        class="py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer">
                        <span>📍</span>
                        <span>View Location & Route</span>
                    </button>

                    <a href="tel:${(d.phone || '+912080009911').replace(/[^0-9+]/g, '')}"
                        class="py-2.5 px-3.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer">
                        <span>📞</span>
                        <span>Call</span>
                    </a>

                    <button type="button" onclick="selectDoctorForCall('${d.id}')"
                        class="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer">
                        <span>Details →</span>
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }
}

// Calculate Haversine distance in KM
function getDistanceKm(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 2.5;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
}

// Request Live User GPS Location
function requestLiveUserLocation(callback, errorCallback) {
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser', 'error');
        if (errorCallback) errorCallback(new Error('Geolocation unsupported'));
        return;
    }

    const gpsPill = document.getElementById('booking-gps-pill');
    const gpsDetail = document.getElementById('booking-gps-detail');
    if (gpsPill) {
        gpsPill.className = 'px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800';
        gpsPill.innerText = 'Detecting GPS...';
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            AppState.userLocation.latitude = pos.coords.latitude;
            AppState.userLocation.longitude = pos.coords.longitude;
            AppState.userLocation.hasRealGps = true;
            AppState.userLocation.gpsAccuracy = pos.coords.accuracy;

            updateGpsStatusUI();
            if (callback) callback(pos.coords);
        },
        (err) => {
            console.warn('Geolocation disabled / error:', err.message);
            AppState.userLocation.hasRealGps = false;
            AppState.userLocation.error = err.message;

            updateGpsStatusUI();
            showLocationAlertModal();
            if (errorCallback) errorCallback(err);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
}

// Update GPS Status in UI
function updateGpsStatusUI() {
    const gpsPill = document.getElementById('booking-gps-pill');
    const gpsDetail = document.getElementById('booking-gps-detail');
    const step4GpsText = document.getElementById('step-4-gps-text');

    if (AppState.userLocation.hasRealGps) {
        const lat = AppState.userLocation.latitude;
        const lng = AppState.userLocation.longitude;
        if (gpsPill) {
            gpsPill.className = 'px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800';
            gpsPill.innerText = '🟢 Real GPS Active';
        }
        if (gpsDetail) {
            gpsDetail.innerHTML = `Connected to your live coordinates: <strong class="text-slate-800">${lat.toFixed(4)}, ${lng.toFixed(4)}</strong>`;
        }
        if (step4GpsText) {
            step4GpsText.innerText = `Live GPS Connected: (${lat.toFixed(4)}, ${lng.toFixed(4)}) • Real-Time Route Active`;
        }
    } else {
        if (gpsPill) {
            gpsPill.className = 'px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800';
            gpsPill.innerText = '⚠️ GPS Needed';
        }
        if (gpsDetail) {
            gpsDetail.innerHTML = `Device Location is OFF. Turn ON Location to view real-time distance.`;
        }
    }
}

// Show/Close Location Permission Alert Modal
function showLocationAlertModal() {
    const modal = document.getElementById('location-alert-modal');
    if (modal) {
        const topDoc = AppState.selectedDoctor;
        const hospName = topDoc ? topDoc.hospital_name : 'Hospital';
        const hospAddr = topDoc ? topDoc.hospital_address : '';
        const fallbackBtn = document.getElementById('location-fallback-gmaps-btn');
        if (fallbackBtn) {
            fallbackBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hospName + ', ' + hospAddr)}&travelmode=driving`;
        }
        modal.classList.remove('hidden');
    }
}

function closeLocationAlertModal() {
    const modal = document.getElementById('location-alert-modal');
    if (modal) modal.classList.add('hidden');
}

function retryGetRealLocation() {
    closeLocationAlertModal();
    requestLiveUserLocation(() => {
        showToast('📍 Live GPS location successfully detected!', 'success');
        if (AppState.currentStep === 4) {
            initStep4Map();
        }
    }, () => {
        showToast('Please make sure Location / GPS is turned ON in your device settings.', 'error');
    });
}

function refreshUserGpsLocation() {
    requestLiveUserLocation(() => {
        showToast('📍 GPS Location Refreshed!', 'success');
        if (AppState.currentStep === 4) {
            initStep4Map();
        }
    }, () => {
        showLocationAlertModal();
    });
}

// Build Google Maps turn-by-turn navigation URL
function buildGoogleMapsRouteUrl(hospLat, hospLon, hospName, hospAddr) {
    const destination = hospName ? `${hospName}, ${hospAddr || 'Maharashtra'}` : `${hospLat},${hospLon}`;
    if (AppState.userLocation.hasRealGps) {
        const uLat = AppState.userLocation.latitude;
        const uLon = AppState.userLocation.longitude;
        return `https://www.google.com/maps/dir/?api=1&origin=${uLat},${uLon}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}

// Open Appointment Booking Modal
function openBookingModal(docId) {
    let doctor = null;
    if (AppState.triageData && AppState.triageData.authorizedDoctors) {
        doctor = AppState.triageData.authorizedDoctors.find(d => String(d.id) === String(docId));
    }
    if (!doctor && AppState.selectedDoctor) {
        doctor = AppState.selectedDoctor;
    }
    if (!doctor && AppState.triageData?.authorizedDoctors?.[0]) {
        doctor = AppState.triageData.authorizedDoctors[0];
    }
    if (!doctor) {
        showToast('No doctor selected for booking.', 'error');
        return;
    }

    AppState.selectedDoctor = doctor;

    const modal = document.getElementById('booking-modal');
    const formView = document.getElementById('booking-modal-form-view');
    const successView = document.getElementById('booking-modal-success-view');

    if (!modal) return;

    if (formView) formView.classList.remove('hidden');
    if (successView) successView.classList.add('hidden');

    // Fill doctor details in modal
    const nameEl = document.getElementById('modal-doc-name');
    const specEl = document.getElementById('modal-doc-spec');
    const hospEl = document.getElementById('modal-doc-hosp');
    const patientInput = document.getElementById('booking-patient-name');
    const dateInput = document.getElementById('booking-date');

    if (nameEl) nameEl.innerText = doctor.full_name;
    if (specEl) specEl.innerText = `${doctor.qualification} • ${doctor.license_number || 'NMC Verified'}`;
    if (hospEl) hospEl.innerText = `🏥 ${doctor.hospital_name} • ${doctor.hospital_address || doctor.hospital_city || ''}`;

    if (patientInput) {
        patientInput.value = AppState.triageData?.patientName || '';
    }

    if (dateInput) {
        const todayStr = new Date().toISOString().split('T')[0];
        dateInput.value = todayStr;
        dateInput.min = todayStr;
    }

    modal.classList.remove('hidden');

    // Automatically check user GPS for the modal
    requestLiveUserLocation();
}

function openBookingModalForSelected() {
    const topDoc = AppState.selectedDoctor || (AppState.triageData?.authorizedDoctors?.[0]);
    if (topDoc) {
        openBookingModal(topDoc.id);
    } else {
        openBookingModal('DEFAULT');
    }
}

function closeBookingModal() {
    const modal = document.getElementById('booking-modal');
    if (modal) modal.classList.add('hidden');
}

// Confirm Appointment Booking Form Submit
async function handleConfirmAppointment(event) {
    if (event) event.preventDefault();

    const doctor = AppState.selectedDoctor;
    if (!doctor) {
        showToast('No doctor selected.', 'error');
        return;
    }

    const patientName = document.getElementById('booking-patient-name')?.value.trim() || 'Emergency Patient';
    const patientPhone = document.getElementById('booking-patient-phone')?.value.trim() || '+91 98765 43210';
    const appointmentDate = document.getElementById('booking-date')?.value || new Date().toISOString().split('T')[0];
    const appointmentTime = document.getElementById('booking-time-slot')?.value || '⚡ Immediate Emergency (Next 15-20 Mins)';

    const submitBtn = document.getElementById('booking-submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Booking Appointment...';
    }

    try {
        const payload = {
            doctorId: doctor.id,
            doctorName: doctor.full_name,
            specialty: doctor.qualification,
            hospitalName: doctor.hospital_name,
            hospitalAddress: doctor.hospital_address || doctor.hospital_city,
            hospitalLat: doctor.hospital_lat || 19.9975,
            hospitalLng: doctor.hospital_lng || 73.7898,
            patientName,
            patientPhone,
            appointmentDate,
            appointmentTime,
            symptomsSummary: AppState.triageData?.triageResult?.criticalReason || 'Emergency medical triage',
            userLat: AppState.userLocation.latitude,
            userLng: AppState.userLocation.longitude
        };

        const res = await fetch('/api/appointments/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success && data.appointment) {
            AppState.bookedAppointment = data.appointment;
            AppState.selectedDoctor = doctor;
            if (AppState.triageData) {
                populateStep4(AppState.triageData);
            }

            // Show Success View in Modal
            const formView = document.getElementById('booking-modal-form-view');
            const successView = document.getElementById('booking-modal-success-view');

            if (formView) formView.classList.add('hidden');
            if (successView) successView.classList.remove('hidden');

            document.getElementById('confirmed-token').innerText = data.bookingToken || data.appointment.id;
            document.getElementById('confirmed-doc').innerText = doctor.full_name;
            document.getElementById('confirmed-spec').innerText = doctor.qualification;
            document.getElementById('confirmed-hosp').innerText = doctor.hospital_name;
            document.getElementById('confirmed-addr').innerText = doctor.hospital_address || doctor.hospital_city || 'Main Healthcare Road';
            document.getElementById('confirmed-time').innerText = `${appointmentDate} at ${appointmentTime}`;

            // Calculate distance
            const dist = getDistanceKm(AppState.userLocation.latitude, AppState.userLocation.longitude, doctor.hospital_lat || 19.9975, doctor.hospital_lng || 73.7898);
            const distBadge = document.getElementById('confirmed-dist-badge');
            if (distBadge) distBadge.innerText = `~${dist} km away • ~${Math.round(dist * 3.5)} Mins`;

            // Prepare Google Maps URL
            const gmapsUrl = buildGoogleMapsRouteUrl(doctor.hospital_lat, doctor.hospital_lng, doctor.hospital_name, doctor.hospital_address);
            const gmapsBtn = document.getElementById('confirmed-gmaps-btn');
            if (gmapsBtn) gmapsBtn.href = gmapsUrl;

            // Update embedded Google Map in modal
            const modalMapIframe = document.getElementById('modal-gmap-iframe');
            const modalMapClickBox = document.getElementById('modal-gmap-click-box');
            if (modalMapClickBox) modalMapClickBox.href = gmapsUrl;
            if (modalMapIframe) {
                const query = encodeURIComponent(`${doctor.hospital_name}, ${doctor.hospital_address || doctor.hospital_city || 'Maharashtra'}`);
                modalMapIframe.src = `https://maps.google.com/maps?q=${query}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
            }

            showToast(`✅ Appointment booked & saved to Supabase (Token: ${data.bookingToken || data.appointment.id})`, 'success');
        } else {
            showToast(data.error || 'Failed to book appointment', 'error');
        }
    } catch (err) {
        console.error('Booking error:', err);
        showToast('Error booking appointment: ' + err.message, 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = '✓ Confirm & Get Hospital Route';
        }
    }
}

// View Hospital Location for Doctor from Step 3
function viewHospitalLocationForDoctor(docId) {
    if (AppState.triageData && AppState.triageData.authorizedDoctors) {
        const found = AppState.triageData.authorizedDoctors.find(d => String(d.id) === String(docId));
        if (found) {
            AppState.selectedDoctor = found;
        }
    }
    if (AppState.triageData) {
        populateStep4(AppState.triageData);
    }
    // Proceed to Step 4 and trigger GPS check
    goToStep(4);
    requestLiveUserLocation(() => {
        initStep4Map();
    }, () => {
        showLocationAlertModal();
    });
}

// Select specific doctor and proceed to Step 4
function selectDoctorForCall(docId) {
    if (AppState.triageData && AppState.triageData.authorizedDoctors) {
        const found = AppState.triageData.authorizedDoctors.find(d => String(d.id) === String(docId));
        if (found) {
            AppState.selectedDoctor = found;
        }
    }
    if (AppState.triageData) {
        populateStep4(AppState.triageData);
    }
    goToStep(4);
}

// Populate Step 4: Call / Message Center
function populateStep4(data) {
    const topDoctor = AppState.selectedDoctor || (data.authorizedDoctors && data.authorizedDoctors[0]);
    const topHospital = data.recommendedHospitals && data.recommendedHospitals[0];
    const triage = data.triageResult;
    const specialty = data.specialtyGuidance;
    const patientName = data.patientName || 'Emergency Patient';

    const hospitalName = topDoctor?.hospital_name || topHospital?.name || 'Apex Critical Care & Heart Institute';
    const hospitalPhone = topDoctor?.phone || topHospital?.emergency_phone || '+91-20-8000-9911';
    const hospitalAddr = topDoctor?.hospital_address || topDoctor?.hospital_city || topHospital?.address || 'Main Healthcare Road, Maharashtra';
    const doctorName = topDoctor ? `${topDoctor.full_name} (${topDoctor.qualification})` : 'Authorized Sub-Specialist';
    const availableBeds = topHospital ? `● ${topHospital.available_icu_beds} / ${topHospital.total_icu_beds} Available ICU Beds` : '● ICU Beds & ER Ready';

    const hospLat = topDoctor?.hospital_lat || topHospital?.latitude || 19.9975;
    const hospLon = topDoctor?.hospital_lng || topHospital?.longitude || 73.7898;

    // Populate Hospital info in Step 4
    const hospNameEl = document.getElementById('step-4-hospital-name');
    const docInfoEl = document.getElementById('step-4-doctor-info');
    const addrEl = document.getElementById('step-4-hospital-address');
    const bedsEl = document.getElementById('step-4-hospital-beds');
    const callBtn = document.getElementById('step-4-call-btn');
    const gmapsLink = document.getElementById('step-4-gmaps-link');
    const distText = document.getElementById('step-4-distance-text');

    if (hospNameEl) hospNameEl.innerText = hospitalName;
    if (docInfoEl) docInfoEl.innerText = `Matched Specialist: ${doctorName}`;
    if (addrEl) addrEl.innerText = `📍 ${hospitalAddr}`;
    if (bedsEl) bedsEl.innerText = `${availableBeds} • 24/7 Trauma Unit Active`;

    const phoneDisplayEl = document.getElementById('step-4-phone-display');
    if (phoneDisplayEl) phoneDisplayEl.innerText = hospitalPhone;

    if (callBtn) {
        callBtn.href = `tel:${hospitalPhone.replace(/[^0-9+]/g, '')}`;
        callBtn.title = `Call ${hospitalName}: ${hospitalPhone}`;
    }

    // Calculate distance with real coordinates
    const dist = getDistanceKm(AppState.userLocation.latitude, AppState.userLocation.longitude, hospLat, hospLon);
    if (distText) {
        distText.innerText = `Distance: ~${dist} km from your location • Estimated Driving Time: ~${Math.round(dist * 3.5)} Mins`;
    }

    const mapsUrl = buildGoogleMapsRouteUrl(hospLat, hospLon, hospitalName, hospitalAddr);
    if (gmapsLink) gmapsLink.href = mapsUrl;

    // Direct Clickable Google Map Box in Step 4
    const mapClickBox = document.getElementById('step-4-map-click-box');
    const mapIframe = document.getElementById('step-4-gmap-iframe');
    const overlayHospName = document.getElementById('step-4-overlay-hospital-name');
    const overlayDistText = document.getElementById('step-4-overlay-dist-text');

    if (mapClickBox) mapClickBox.href = mapsUrl;
    if (overlayHospName) overlayHospName.innerText = hospitalName;
    if (overlayDistText) overlayDistText.innerText = `Distance: ~${dist} km • ~${Math.round(dist * 3.5)} Mins`;

    if (mapIframe) {
        if (AppState.userLocation.hasRealGps) {
            const uLat = AppState.userLocation.latitude;
            const uLon = AppState.userLocation.longitude;
            mapIframe.src = `https://maps.google.com/maps?saddr=${uLat},${uLon}&daddr=${encodeURIComponent(hospitalName + ', ' + hospitalAddr)}&output=embed`;
        } else {
            const query = encodeURIComponent(`${hospitalName}, ${hospitalAddr}`);
            mapIframe.src = `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        }
    }

    // Show appointment ticket badge if booked
    const ticketBox = document.getElementById('step-4-appointment-ticket');
    const ticketId = document.getElementById('step-4-ticket-id');
    const ticketSlot = document.getElementById('step-4-ticket-slot');
    if (AppState.bookedAppointment && ticketBox) {
        ticketBox.classList.remove('hidden');
        if (ticketId) ticketId.innerText = AppState.bookedAppointment.id;
        if (ticketSlot) ticketSlot.innerText = `Slot: ${AppState.bookedAppointment.appointment_date} at ${AppState.bookedAppointment.appointment_time}`;
    } else if (ticketBox) {
        ticketBox.classList.add('hidden');
    }

    // Generate formatted WhatsApp message
    const keyBiomarkerStr = (triage?.analyzedBiomarkers || [])
        .filter(b => b.status === 'CRITICAL' || b.status === 'ELEVATED')
        .map(b => `• ${b.name}: ${b.value} ${b.unit} (${b.status})`)
        .join('\n');

    const appointmentNote = AppState.bookedAppointment
        ? `\n🎟️ *Appointment Token:* ${AppState.bookedAppointment.id} (${AppState.bookedAppointment.appointment_time})`
        : '';

    const messageText = `🚨 *EMERGENCY MEDICAL TRIAGE ALERT* 🚨
*Patient:* ${patientName}
*Urgency Level:* ${triage?.overallSeverity || 'CRITICAL'} (CODE RED)
*Required Specialist:* ${specialty?.authorizedSpecialtyName || 'Interventional Cardiology'}
${appointmentNote}

⚠️ *Critical Report Findings:*
${keyBiomarkerStr || '• Severe diagnostic abnormality detected'}

🏥 *Target Hospital:* ${hospitalName} (${hospitalAddr})
📞 *Emergency ER Phone:* ${hospitalPhone}
📍 *Live Emergency Navigation:* ${mapsUrl}

_Sent via Emergency Medical Report Parser & Authorized Specialist Network_`;

    const previewEl = document.getElementById('step-4-message-preview');
    const waBtn = document.getElementById('step-4-wa-btn');

    if (previewEl) previewEl.innerText = messageText;
    if (waBtn) waBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;

    // Request GPS location when entering Step 4
    if (!AppState.userLocation.hasRealGps) {
        requestLiveUserLocation(() => {
            initStep4Map();
        });
    }
}

// Copy Emergency Message
function copyEmergencyMessage() {
    const previewEl = document.getElementById('step-4-message-preview');
    if (previewEl) {
        navigator.clipboard.writeText(previewEl.innerText);
        showToast('Emergency message copied to clipboard!', 'success');
    }
}

// Update Real Google Map for Step 4
function initStep4Map() {
    const data = AppState.triageData;
    const topDoctor = AppState.selectedDoctor || (data?.authorizedDoctors && data.authorizedDoctors[0]);
    const topHospital = data?.recommendedHospitals ? data.recommendedHospitals[0] : null;

    const hospitalName = topDoctor?.hospital_name || topHospital?.name || 'Target Hospital';
    const hospitalAddr = topDoctor?.hospital_address || topDoctor?.hospital_city || topHospital?.address || 'Main Healthcare Road, Maharashtra';
    const hospLat = topDoctor?.hospital_lat || topHospital?.latitude || 19.9975;
    const hospLon = topDoctor?.hospital_lng || topHospital?.longitude || 73.7898;

    const dist = getDistanceKm(AppState.userLocation.latitude, AppState.userLocation.longitude, hospLat, hospLon);
    const mapsUrl = buildGoogleMapsRouteUrl(hospLat, hospLon, hospitalName, hospitalAddr);

    const mapClickBox = document.getElementById('step-4-map-click-box');
    const mapIframe = document.getElementById('step-4-gmap-iframe');
    const overlayHospName = document.getElementById('step-4-overlay-hospital-name');
    const overlayDistText = document.getElementById('step-4-overlay-dist-text');
    const distText = document.getElementById('step-4-distance-text');
    const gmapsLink = document.getElementById('step-4-gmaps-link');

    if (gmapsLink) gmapsLink.href = mapsUrl;
    if (mapClickBox) mapClickBox.href = mapsUrl;
    if (overlayHospName) overlayHospName.innerText = hospitalName;
    if (overlayDistText) overlayDistText.innerText = `Distance: ~${dist} km • ~${Math.round(dist * 3.5)} Mins`;
    if (distText) distText.innerText = `Distance: ~${dist} km from your location • Estimated Driving Time: ~${Math.round(dist * 3.5)} Mins`;

    if (mapIframe) {
        if (AppState.userLocation.hasRealGps) {
            const uLat = AppState.userLocation.latitude;
            const uLon = AppState.userLocation.longitude;
            mapIframe.src = `https://maps.google.com/maps?saddr=${uLat},${uLon}&daddr=${encodeURIComponent(hospitalName + ', ' + hospitalAddr)}&output=embed`;
        } else {
            const query = encodeURIComponent(`${hospitalName}, ${hospitalAddr}`);
            mapIframe.src = `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        }
    }
}

// Simple Toast Notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const bg = type === 'error' ? 'bg-red-600' : (type === 'success' ? 'bg-emerald-600' : 'bg-slate-900');
    toast.className = `fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl text-white text-xs font-bold flex items-center space-x-2 transition-all duration-300 transform translate-y-10 opacity-0 ${bg}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.remove('translate-y-10', 'opacity-0'), 50);
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// File drop-zone setup
function setupDropZone() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('report-file-input');
    const fileLabel = document.getElementById('selected-file-label');

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-blue-500', 'bg-blue-50/50');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-blue-500', 'bg-blue-50/50');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-blue-500', 'bg-blue-50/50');
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleFile(fileInput.files[0]);
        }
    });

    function handleFile(file) {
        if (fileLabel) {
            fileLabel.innerText = `Selected File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        }
        if (file.type.includes('text') || file.name.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const textInput = document.getElementById('raw-text-input');
                if (textInput) textInput.value = e.target.result;
            };
            reader.readAsText(file);
        }
    }
}

// ==============================================================================
// PATIENT & CAREGIVER FEEDBACK CONTROLLER (DOCTOR & PLATFORM)
// ==============================================================================
let currentDocRating = 0;
let currentPlatRating = 0;

function setDocRating(n) {
    currentDocRating = n;
    const input = document.getElementById('feedback-doctor-rating');
    if (input) input.value = n;
    restoreDocStars();
}

function previewDocRating(n) {
    const stars = document.querySelectorAll('.star-doc');
    stars.forEach((s, idx) => {
        if (idx < n) {
            s.classList.remove('text-slate-300');
            s.classList.add('text-amber-400');
        } else {
            s.classList.remove('text-amber-400');
            s.classList.add('text-slate-300');
        }
    });
}

function restoreDocStars() {
    const stars = document.querySelectorAll('.star-doc');
    stars.forEach((s, idx) => {
        if (idx < currentDocRating) {
            s.classList.remove('text-slate-300');
            s.classList.add('text-amber-400');
        } else {
            s.classList.remove('text-amber-400');
            s.classList.add('text-slate-300');
        }
    });
}

function setPlatRating(n) {
    currentPlatRating = n;
    const input = document.getElementById('feedback-platform-rating');
    if (input) input.value = n;
    restorePlatStars();
}

function previewPlatRating(n) {
    const stars = document.querySelectorAll('.star-plat');
    stars.forEach((s, idx) => {
        if (idx < n) {
            s.classList.remove('text-slate-300');
            s.classList.add('text-amber-400');
        } else {
            s.classList.remove('text-amber-400');
            s.classList.add('text-slate-300');
        }
    });
}

function restorePlatStars() {
    const stars = document.querySelectorAll('.star-plat');
    stars.forEach((s, idx) => {
        if (idx < currentPlatRating) {
            s.classList.remove('text-slate-300');
            s.classList.add('text-amber-400');
        } else {
            s.classList.remove('text-amber-400');
            s.classList.add('text-slate-300');
        }
    });
}

function openFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    if (!modal) return;

    // Prefill patient name if available
    const patientInput = document.getElementById('feedback-patient-name');
    if (patientInput) {
        if (AppState.bookedAppointment && AppState.bookedAppointment.patient_name) {
            patientInput.value = AppState.bookedAppointment.patient_name;
        } else if (AppState.triageData && AppState.triageData.patientName) {
            patientInput.value = AppState.triageData.patientName;
        } else if (AppState.user && AppState.user.name) {
            patientInput.value = AppState.user.name;
        }
    }

    // Prefill doctor name if available
    const docInput = document.getElementById('feedback-doctor-name');
    if (docInput) {
        if (AppState.selectedDoctor && AppState.selectedDoctor.full_name) {
            docInput.value = AppState.selectedDoctor.full_name;
        } else if (AppState.bookedAppointment && AppState.bookedAppointment.doctor_name) {
            docInput.value = AppState.bookedAppointment.doctor_name;
        }
    }

    // Prefill token if available
    const tokenInput = document.getElementById('feedback-token');
    if (tokenInput && AppState.bookedAppointment && AppState.bookedAppointment.id) {
        tokenInput.value = AppState.bookedAppointment.id;
    }

    // Keep stars initially unselected / empty (Requested by User)
    setDocRating(0);
    setPlatRating(0);

    modal.classList.remove('hidden');
    loadRecentFeedbacks();
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    if (modal) modal.classList.add('hidden');
}

function openFeedbackModalFromAppointment() {
    closeBookingModal();
    openFeedbackModal();
}

async function handleFeedbackSubmit(e) {
    e.preventDefault();

    if (!currentDocRating || currentDocRating === 0) {
        showToast('Please select Doctor Treatment Rating (1 to 5 stars)', 'warning');
        return;
    }

    if (!currentPlatRating || currentPlatRating === 0) {
        showToast('Please select Website Experience Rating (1 to 5 stars)', 'warning');
        return;
    }

    const btn = document.getElementById('feedback-submit-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerText = 'Submitting...';
    }

    try {
        const payload = {
            patientName: document.getElementById('feedback-patient-name').value.trim(),
            appointmentId: document.getElementById('feedback-token').value.trim() || null,
            doctorId: AppState.selectedDoctor ? AppState.selectedDoctor.id : null,
            doctorName: document.getElementById('feedback-doctor-name').value.trim(),
            doctorRating: currentDocRating,
            doctorReview: document.getElementById('feedback-doctor-review').value.trim(),
            platformRating: currentPlatRating,
            platformReview: document.getElementById('feedback-platform-review').value.trim()
        };

        const res = await fetch('/api/feedback/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
            showToast('✅ Feedback successfully saved in Supabase database!', 'success');
            document.getElementById('feedback-doctor-review').value = '';
            document.getElementById('feedback-platform-review').value = '';
            loadRecentFeedbacks();
            setTimeout(() => {
                closeFeedbackModal();
            }, 1200);
        } else {
            showToast('Error submitting feedback: ' + (data.error || 'Failed'), 'error');
        }
    } catch (err) {
        console.error('Feedback submit error:', err);
        showToast('Error: ' + err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = 'Submit Feedback';
        }
    }
}

async function loadRecentFeedbacks() {
    const container = document.getElementById('recent-feedbacks-container');
    if (!container) return;

    try {
        const res = await fetch('/api/feedbacks');
        const data = await res.json();

        if (data.success && data.feedbacks && data.feedbacks.length > 0) {
            container.innerHTML = data.feedbacks.map(f => `
                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div class="flex items-center justify-between">
                        <span class="font-bold text-slate-900">${f.patient_name || 'Patient'}</span>
                        <span class="text-amber-500 font-bold">${'★'.repeat(f.doctor_rating || 5)}${'☆'.repeat(5 - (f.doctor_rating || 5))}</span>
                    </div>
                    <div class="text-[11px] text-blue-700 font-semibold">Doctor: ${f.doctor_name}</div>
                    <p class="text-[11px] text-slate-600 italic">"${f.doctor_review || 'Good treatment experience.'}"</p>
                    <div class="pt-1 text-[10px] text-emerald-700 font-medium border-t border-slate-100 flex items-center justify-between">
                        <span>Platform: ${f.platform_rating || 5}/5 ★</span>
                        <span>${f.created_at ? new Date(f.created_at).toLocaleDateString() : 'Just now'}</span>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-slate-400 text-[11px] text-center py-2">No feedbacks recorded yet. Be the first to review!</p>';
        }
    } catch (e) {
        container.innerHTML = '<p class="text-slate-400 text-[11px] text-center py-2">Could not load reviews.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    setupDropZone();
});
