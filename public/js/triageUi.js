/**
 * Triage UI & Report Scanner Controller
 * Handles report upload, OCR execution, sample presets, and rendering diagnostic summaries.
 */

let sampleReportsList = [];

// Fetch sample reports on initialization
async function loadSampleReports() {
    try {
        const res = await fetch('/api/triage/samples');
        const data = await res.json();
        if (data.success) {
            sampleReportsList = data.samples;
            renderSamplePills();
        }
    } catch (e) {
        console.warn('Could not load samples:', e);
    }
}

// Render 1-Click Demo Sample Pills
function renderSamplePills() {
    const container = document.getElementById('sample-pills-container');
    if (!container) return;

    container.innerHTML = sampleReportsList.map((sample, idx) => `
        <button type="button" onclick="selectSampleReport('${sample.id}')"
            class="text-left px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-300 transition-all flex flex-col justify-between group hover:border-blue-500">
            <span class="font-semibold text-white group-hover:text-blue-400">${sample.title}</span>
            <span class="text-[11px] text-slate-400 mt-1">${sample.patientName}</span>
        </button>
    `).join('');
}

// Select a sample preset to auto-fill
function selectSampleReport(sampleId) {
    const sample = sampleReportsList.find(s => s.id === sampleId);
    if (!sample) return;

    AppState.selectedSample = sample;
    const nameInput = document.getElementById('patient-name-input');
    const textInput = document.getElementById('raw-text-input');
    const filenameLabel = document.getElementById('selected-file-label');

    if (nameInput) nameInput.value = sample.patientName;
    if (textInput) textInput.value = sample.rawText;
    if (filenameLabel) filenameLabel.innerText = `Sample: ${sample.filename}`;

    showToast(`Loaded: ${sample.title}`, 'info');

    // Auto-trigger parse for instant demo gratification
    submitTriageReport();
}

// Handle File Drag and Drop / Selection
function setupFileUploadListeners() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('report-file-input');
    const filenameLabel = document.getElementById('selected-file-label');

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('border-blue-500', 'bg-blue-950/20');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-blue-500', 'bg-blue-950/20');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileSelection(files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleFileSelection(fileInput.files[0]);
        }
    });
}

function handleFileSelection(file) {
    const filenameLabel = document.getElementById('selected-file-label');
    if (filenameLabel) {
        filenameLabel.innerText = `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    }

    // If it's a text file, preview its contents into the text input
    if (file.type.includes('text') || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const textInput = document.getElementById('raw-text-input');
            if (textInput) textInput.value = e.target.result;
        };
        reader.readAsText(file);
    }
}

// Submit report for OCR & Triage evaluation
async function submitTriageReport() {
    const submitBtn = document.getElementById('triage-submit-btn');
    const resultsContainer = document.getElementById('triage-results-container');
    const spinner = document.getElementById('triage-spinner');

    if (submitBtn) submitBtn.disabled = true;
    if (spinner) spinner.classList.remove('hidden');

    try {
        const fileInput = document.getElementById('report-file-input');
        const textInput = document.getElementById('raw-text-input');
        const nameInput = document.getElementById('patient-name-input');

        const formData = new FormData();
        formData.append('patientName', nameInput ? nameInput.value : 'Emergency Patient');
        formData.append('rawText', textInput ? textInput.value : '');
        formData.append('latitude', AppState.userLocation.latitude);
        formData.append('longitude', AppState.userLocation.longitude);

        if (fileInput && fileInput.files.length > 0) {
            formData.append('reportFile', fileInput.files[0]);
        }

        const res = await fetch('/api/triage/parse', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (!data.success) {
            throw new Error(data.error || 'Triage parsing failed');
        }

        AppState.lastTriageData = data;
        renderTriageResults(data);

        // Update Anti-Misdirection and Map views with the new matched context
        if (window.renderAntiMisdirection) {
            window.renderAntiMisdirection(data.specialtyGuidance);
        }
        if (window.MapService) {
            window.MapService.updateHospitals(data.recommendedHospitals, AppState.userLocation);
        }

        // Trigger Audio Feedback based on Severity
        if (data.triageResult.overallSeverity === 'CRITICAL') {
            AudioEngine.playEmergencyAlarm();
            showToast('🚨 CRITICAL EMERGENCY DETECTED! Immediate specialist intervention required!', 'error');
        } else if (data.triageResult.overallSeverity === 'URGENT') {
            AudioEngine.playNormalChime();
            showToast('⚠️ Urgent medical condition detected. Specialist consultation required.', 'info');
        } else {
            AudioEngine.playNormalChime();
            showToast('✅ Triage analysis complete: Biomarkers within normal limits.', 'success');
        }

        // Smooth scroll to results
        if (resultsContainer) {
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } catch (err) {
        console.error('Triage error:', err);
        showToast('Error parsing report: ' + err.message, 'error');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (spinner) spinner.classList.add('hidden');
    }
}

// Render the Decoded Diagnostic Summary
function renderTriageResults(data) {
    const container = document.getElementById('triage-results-container');
    if (!container) return;

    container.classList.remove('hidden');

    const triage = data.triageResult;
    const specialty = data.specialtyGuidance;
    const topHospital = data.recommendedHospitals && data.recommendedHospitals[0];
    const topDoctor = data.authorizedDoctors && data.authorizedDoctors[0];

    const isCritical = triage.overallSeverity === 'CRITICAL';
    const isUrgent = triage.overallSeverity === 'URGENT';

    // 1. High-Contrast Severity Banner
    let bannerHtml = '';
    if (isCritical) {
        bannerHtml = `
            <div class="p-6 rounded-2xl bg-gradient-to-r from-red-950/80 via-red-900/60 to-rose-950/80 border-2 border-red-500 shadow-2xl relative overflow-hidden animate-emergency-banner">
                <div class="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                    <svg class="w-64 h-64 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 10h2v4h-2zm0 6h2v2h-2z"/></svg>
                </div>
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="flex items-start space-x-4">
                        <div class="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 radar-emergency">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                        </div>
                        <div>
                            <div class="flex items-center space-x-3">
                                <span class="px-2.5 py-0.5 rounded-full text-xs font-black tracking-widest bg-red-600 text-white uppercase">TRIAGE LEVEL 1</span>
                                <span class="text-red-400 text-xs font-mono font-bold tracking-wider">CODE RED • IMMEDIATE LIFE THREAT</span>
                            </div>
                            <h2 class="text-2xl font-black text-white mt-1">EMERGENCY INTERVENTION REQUIRED</h2>
                            <p class="text-red-200 text-sm mt-1 max-w-2xl">${triage.criticalReason}</p>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <button onclick="switchTab('tab-panic')" class="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center space-x-2 text-sm">
                            <span>🆘 One-Tap Family Panic Share</span>
                        </button>
                        <button onclick="switchTab('tab-anti-misdirection')" class="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center space-x-2 text-sm">
                            <span>⚠️ Anti-Misdirection Guide</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    } else if (isUrgent) {
        bannerHtml = `
            <div class="p-6 rounded-2xl bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-yellow-950/80 border-2 border-amber-500 shadow-xl">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 flex-shrink-0 font-black text-xl">!</div>
                    <div>
                        <span class="px-2.5 py-0.5 rounded-full text-xs font-black tracking-widest bg-amber-500 text-slate-950 uppercase">TRIAGE LEVEL 2</span>
                        <h2 class="text-xl font-bold text-white mt-0.5">URGENT CLINICAL ESCALATION WARNING</h2>
                        <p class="text-amber-200 text-sm mt-1">${triage.criticalReason}</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        bannerHtml = `
            <div class="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-teal-950/80 border-2 border-emerald-500 shadow-xl">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 font-black text-xl radar-green">✓</div>
                    <div>
                        <span class="px-2.5 py-0.5 rounded-full text-xs font-black tracking-widest bg-emerald-500 text-white uppercase">TRIAGE LEVEL 3</span>
                        <h2 class="text-xl font-bold text-white mt-0.5">ROUTINE / STABLE BASELINE</h2>
                        <p class="text-emerald-200 text-sm mt-1">${triage.criticalReason}</p>
                    </div>
                </div>
            </div>
        `;
    }

    // 2. Anti-Misdirection High Alert Strip
    let antiMisdirectionStrip = '';
    if (specialty && specialty.antiMisdirection) {
        antiMisdirectionStrip = `
            <div class="p-5 rounded-2xl bg-slate-900 border border-slate-700 shadow-lg">
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div class="space-y-1">
                        <div class="flex items-center space-x-2">
                            <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                            <span class="text-xs font-bold uppercase tracking-wider text-red-400">Anti-Misdirection Clinical Alert</span>
                        </div>
                        <h3 class="text-lg font-bold text-white">
                            Consult <span class="text-blue-400 underline decoration-blue-500">${specialty.authorizedSpecialtyName}</span> (${specialty.requiredQualification})
                        </h3>
                        <p class="text-xs text-slate-300 max-w-3xl leading-relaxed">
                            <strong class="text-rose-400">DO NOT CONSULT:</strong> ${specialty.antiMisdirection.dangerousWrongSpecialties.join(', ')}.
                            <span class="text-slate-400">${specialty.antiMisdirection.dangerExplanation}</span>
                        </p>
                    </div>
                    <button onclick="switchTab('tab-anti-misdirection')" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-white whitespace-nowrap">
                        View Decision Matrix →
                    </button>
                </div>
            </div>
        `;
    }

    // 3. Biomarkers Decoded Grid (with Layman Explanations for Relatives)
    const biomarkersHtml = triage.analyzedBiomarkers.map(bm => {
        const isBmCrit = bm.status === 'CRITICAL';
        const isBmElev = bm.status === 'ELEVATED' || bm.status === 'LOW';
        const cardBorder = isBmCrit ? 'border-red-500/80 bg-red-950/20' : (isBmElev ? 'border-amber-500/60 bg-amber-950/10' : 'border-slate-800 bg-slate-900/60');
        const badgeColor = isBmCrit ? 'bg-red-500 text-white' : (isBmElev ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-white');

        return `
            <div class="p-5 rounded-xl border ${cardBorder} shadow-lg flex flex-col justify-between transition-all hover:border-slate-600">
                <div>
                    <div class="flex items-start justify-between">
                        <div>
                            <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">${bm.key.replace(/_/g, ' ')}</span>
                            <h4 class="text-base font-bold text-white">${bm.name}</h4>
                        </div>
                        <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${badgeColor}">${bm.status}</span>
                    </div>

                    <div class="mt-4 flex items-baseline space-x-2">
                        <span class="text-3xl font-black ${isBmCrit ? 'text-red-400' : (isBmElev ? 'text-amber-400' : 'text-emerald-400')}">
                            ${bm.value}
                        </span>
                        <span class="text-xs text-slate-400">${bm.unit}</span>
                    </div>
                    <div class="text-[11px] text-slate-400 mt-1">
                        Normal Reference: <span class="font-mono text-slate-300">${bm.normalRange}</span>
                    </div>

                    <div class="mt-4 pt-3 border-t border-slate-800">
                        <div class="text-xs font-semibold text-blue-400 flex items-center space-x-1">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span>Plain English Meaning:</span>
                        </div>
                        <p class="text-xs text-slate-300 mt-1 leading-relaxed">${bm.laymanExplanation}</p>
                    </div>
                </div>

                ${isBmCrit ? `
                    <div class="mt-3 p-2.5 rounded-lg bg-red-950/40 border border-red-900/60 text-[11px] text-red-200">
                        <strong>First-Aid Directive:</strong> ${bm.immediateFirstAid}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    // 4. Immediate Matched Hospital & Doctor Cards
    let hospitalMatchHtml = '';
    if (topHospital) {
        hospitalMatchHtml = `
            <div class="p-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-wider text-emerald-400">Top Recommended Equipped Hospital</span>
                    <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-900/60 text-blue-300">${topHospital.verified_accreditation}</span>
                </div>
                <h3 class="text-xl font-black text-white mt-2">${topHospital.name}</h3>
                <p class="text-xs text-slate-400 mt-0.5">${topHospital.address}, ${topHospital.city}</p>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-center">
                    <div class="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                        <span class="block text-xl font-bold text-emerald-400">${topHospital.available_icu_beds} / ${topHospital.total_icu_beds}</span>
                        <span class="text-[10px] text-slate-400 uppercase">Available ICU Beds</span>
                    </div>
                    <div class="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                        <span class="block text-xl font-bold ${topHospital.has_247_cath_lab ? 'text-emerald-400' : 'text-slate-500'}">${topHospital.has_247_cath_lab ? 'ACTIVE' : 'N/A'}</span>
                        <span class="text-[10px] text-slate-400 uppercase">24/7 Cath Lab</span>
                    </div>
                    <div class="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                        <span class="block text-xl font-bold text-blue-400">${topHospital.distanceKm} km</span>
                        <span class="text-[10px] text-slate-400 uppercase">Distance</span>
                    </div>
                    <div class="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                        <span class="block text-xl font-bold text-amber-400">~${topHospital.estimatedTravelMins} mins</span>
                        <span class="text-[10px] text-slate-400 uppercase">Transit Time</span>
                    </div>
                </div>

                <div class="mt-4 flex flex-wrap gap-2">
                    <a href="tel:${topHospital.emergency_phone}" class="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-center text-xs shadow transition-all flex items-center justify-center space-x-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                        <span>Emergency Desk: ${topHospital.emergency_phone}</span>
                    </a>
                    <button onclick="switchTab('tab-map')" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-semibold rounded-xl text-xs">
                        View Route on GIS Map →
                    </button>
                </div>
            </div>
        `;
    }

    let doctorMatchHtml = '';
    if (topDoctor) {
        doctorMatchHtml = `
            <div class="p-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-wider text-blue-400">Matched Authorized Sub-Specialist</span>
                    <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center space-x-1">
                        <span>✓</span> <span>VERIFIED LICENSE</span>
                    </span>
                </div>
                <h3 class="text-xl font-black text-white mt-2">${topDoctor.full_name}</h3>
                <p class="text-xs text-blue-300 font-medium">${topDoctor.qualification}</p>
                <p class="text-xs text-slate-400 mt-1">${topDoctor.bio}</p>

                <div class="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                    <div><strong>License ID:</strong> <span class="font-mono text-amber-300">${topDoctor.license_number}</span> (${topDoctor.licensing_authority})</div>
                    <div class="truncate"><strong>Digital Verification Seal:</strong> <span class="font-mono text-[10px] text-slate-400">${topDoctor.verification_seal_hash}</span></div>
                    <div><strong>Affiliated Facility:</strong> ${topDoctor.hospital_name} (~${topDoctor.distanceKm} km away)</div>
                </div>

                <div class="mt-4 flex gap-2">
                    <button onclick="openBookingModal('${topDoctor.id}')" class="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-center text-xs shadow transition-all">
                        Priority Emergency Admission
                    </button>
                    <button onclick="switchTab('tab-admin')" class="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs rounded-xl">
                        Verify Credentials
                    </button>
                </div>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="space-y-6">
            ${bannerHtml}
            ${antiMisdirectionStrip}

            <div>
                <h3 class="text-lg font-bold text-white mb-3 flex items-center space-x-2">
                    <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                    <span>Extracted Diagnostic Biomarkers & Plain-English Meanings</span>
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${biomarkersHtml}
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                ${hospitalMatchHtml}
                ${doctorMatchHtml}
            </div>
        </div>
    `;
}

// Emergency Booking Modal simulation
function openBookingModal(doctorId) {
    const doc = AppState.lastTriageData?.authorizedDoctors?.find(d => d.id === doctorId);
    const doctorName = doc ? doc.full_name : 'Authorized Specialist';
    const hospitalName = doc ? doc.hospital_name : 'Emergency Facility';

    alert(`🏥 EMERGENCY PRIORITY INTAKE INITIATED\n\nPatient: ${AppState.lastTriageData?.patientName || 'Emergency Patient'}\nDoctor: ${doctorName}\nHospital: ${hospitalName}\n\nEmergency dispatch signal sent to triage intake coordinator. Trauma OT & Cath Lab standing by.`);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSampleReports();
    setupFileUploadListeners();

    const submitBtn = document.getElementById('triage-submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            submitTriageReport();
        });
    }
});

