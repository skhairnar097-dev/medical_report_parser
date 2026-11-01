/**
 * Admin Verification Desk & Emergency Panic Assist Controller
 */

// ==============================================================================
// 1. MEDICAL CREDENTIAL VERIFICATION DESK
// ==============================================================================

async function verifyLicenseLookup(licenseNum) {
    const input = document.getElementById('admin-license-input');
    const resultBox = document.getElementById('admin-verification-result');
    const license = licenseNum || (input ? input.value : '');

    if (!license) {
        showToast('Please enter a medical license number', 'error');
        return;
    }

    if (input) input.value = license;

    try {
        resultBox.classList.remove('hidden');
        resultBox.innerHTML = `
            <div class="p-6 text-center text-slate-400">
                <span class="inline-block animate-spin mr-2">⟳</span>
                Querying National Medical Commission (NMC) registry database...
            </div>
        `;

        const res = await fetch('/api/doctors/verify-license', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ licenseNumber: license })
        });

        const data = await res.json();
        const v = data.verification;

        if (v.verified) {
            resultBox.innerHTML = `
                <div class="p-6 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500 shadow-xl space-y-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2 text-emerald-400 font-black text-sm">
                            <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                            <span>OFFICIAL CREDENTIALS VERIFIED</span>
                        </div>
                        <span class="px-3 py-1 rounded-full bg-emerald-600 text-white font-mono text-xs font-bold uppercase">
                            ${v.status}
                        </span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <span class="text-[10px] text-slate-400 uppercase">Practitioner Full Name</span>
                            <h4 class="text-base font-bold text-white mt-0.5">${v.registryData.practitioner_name}</h4>
                        </div>
                        <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <span class="text-[10px] text-slate-400 uppercase">Registered Sub-Specialty</span>
                            <h4 class="text-base font-bold text-emerald-300 mt-0.5">${v.registryData.sub_specialty}</h4>
                        </div>
                        <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 md:col-span-2">
                            <span class="text-[10px] text-slate-400 uppercase">Accredited Medical Degrees</span>
                            <p class="font-mono text-xs text-slate-200 mt-0.5">${v.registryData.registered_qualification}</p>
                        </div>
                        <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 md:col-span-2">
                            <span class="text-[10px] text-slate-400 uppercase">Cryptographic Platform Seal (SHA-256)</span>
                            <p class="font-mono text-[11px] text-amber-300 break-all mt-0.5">${v.digitalSeal}</p>
                        </div>
                    </div>

                    <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                        <span>Disciplinary Actions on Record: <strong class="text-emerald-400">${v.registryData.disciplinary_actions} (Clean Record)</strong></span>
                        <span class="text-slate-400">Registered: ${v.registryData.registration_year}</span>
                    </div>
                </div>
            `;
            showToast('Practitioner credentials successfully verified!', 'success');
        } else {
            resultBox.innerHTML = `
                <div class="p-6 rounded-2xl bg-red-950/40 border-2 border-red-500 shadow-xl space-y-3">
                    <div class="flex items-center space-x-2 text-red-400 font-black text-sm">
                        <span class="w-3 h-3 rounded-full bg-red-500"></span>
                        <span>VERIFICATION REJECTED / SUSPENDED</span>
                    </div>
                    <h4 class="text-lg font-bold text-white">License Not Cleared for Emergency Network</h4>
                    <p class="text-xs text-red-200 leading-relaxed">${v.message}</p>
                    ${v.registryData ? `
                        <div class="mt-2 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                            <div><strong>Practitioner:</strong> ${v.registryData.practitioner_name}</div>
                            <div><strong>Registered:</strong> ${v.registryData.registered_qualification}</div>
                            <div><strong>Disciplinary Actions:</strong> <span class="text-red-400 font-bold">${v.registryData.disciplinary_actions}</span></div>
                        </div>
                    ` : ''}
                </div>
            `;
            showToast('Medical license verification failed!', 'error');
        }
    } catch (e) {
        resultBox.innerHTML = `<div class="p-4 text-red-400 text-xs">Error: ${e.message}</div>`;
    }
}

// ==============================================================================
// 2. HOSPITAL CAPABILITY LIVE MONITOR (ADMIN)
// ==============================================================================

async function loadHospitalAdminList() {
    const container = document.getElementById('admin-hospitals-list');
    if (!container) return;

    try {
        const res = await fetch('/api/hospitals');
        const data = await res.json();
        if (!data.success) return;

        container.innerHTML = data.hospitals.map(h => `
            <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div class="flex items-start justify-between">
                    <div>
                        <span class="text-[10px] font-bold uppercase text-emerald-400">${h.trauma_level}</span>
                        <h4 class="text-base font-bold text-white mt-0.5">${h.name}</h4>
                        <p class="text-xs text-slate-400">${h.address}</p>
                    </div>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">${h.verified_accreditation}</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                        <div class="flex justify-between text-slate-300 font-medium mb-1">
                            <span>Available ICU Beds</span>
                            <span id="icu-val-${h.id}" class="font-bold text-emerald-400">${h.available_icu_beds} / ${h.total_icu_beds}</span>
                        </div>
                        <input type="range" min="0" max="${h.total_icu_beds}" value="${h.available_icu_beds}"
                            id="icu-range-${h.id}"
                            oninput="document.getElementById('icu-val-${h.id}').innerText = this.value + ' / ${h.total_icu_beds}'"
                            class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500">
                    </div>

                    <div>
                        <div class="flex justify-between text-slate-300 font-medium mb-1">
                            <span>Available Ventilators</span>
                            <span id="vent-val-${h.id}" class="font-bold text-blue-400">${h.ventilators_available}</span>
                        </div>
                        <input type="range" min="0" max="20" value="${h.ventilators_available}"
                            id="vent-range-${h.id}"
                            oninput="document.getElementById('vent-val-${h.id}').innerText = this.value"
                            class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500">
                    </div>
                </div>

                <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    <div class="flex items-center space-x-4 text-xs text-slate-300">
                        <label class="flex items-center space-x-1.5 cursor-pointer">
                            <input type="checkbox" id="cath-check-${h.id}" ${h.has_247_cath_lab ? 'checked' : ''} class="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0">
                            <span>24/7 Cath Lab</span>
                        </label>
                        <label class="flex items-center space-x-1.5 cursor-pointer">
                            <input type="checkbox" id="ot-check-${h.id}" ${h.has_emergency_ot ? 'checked' : ''} class="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0">
                            <span>Emergency OT Ready</span>
                        </label>
                    </div>

                    <button onclick="saveHospitalCapability('${h.id}')"
                        class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition-all">
                        Update Live Capacity
                    </button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.warn('Admin hospitals load error:', e);
    }
}

async function saveHospitalCapability(hospitalId) {
    const icuInput = document.getElementById(`icu-range-${hospitalId}`);
    const ventInput = document.getElementById(`vent-range-${hospitalId}`);
    const cathInput = document.getElementById(`cath-check-${hospitalId}`);
    const otInput = document.getElementById(`ot-check-${hospitalId}`);

    try {
        const payload = {
            availableIcuBeds: icuInput ? parseInt(icuInput.value) : undefined,
            ventilatorsAvailable: ventInput ? parseInt(ventInput.value) : undefined,
            has247CathLab: cathInput ? cathInput.checked : undefined,
            hasEmergencyOt: otInput ? otInput.checked : undefined
        };

        const res = await fetch(`/api/hospitals/${hospitalId}/capabilities`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
            showToast('Hospital live emergency capacity updated!', 'success');
            // Refresh map view if initialized
            if (window.MapService) {
                window.MapService.loadHospitals();
            }
        }
    } catch (e) {
        showToast('Failed to update capacity: ' + e.message, 'error');
    }
}

// ==============================================================================
// 3. ONE-TAP FAMILY PANIC ASSIST
// ==============================================================================

async function generatePanicShare() {
    const nameInput = document.getElementById('panic-patient-name');
    const previewBox = document.getElementById('panic-share-preview');
    const waBtn = document.getElementById('panic-wa-btn');
    const copyBtn = document.getElementById('panic-copy-btn');

    const lastData = AppState.lastTriageData;
    const patientName = nameInput ? nameInput.value : (lastData?.patientName || 'Family Member');
    const topHospital = lastData?.recommendedHospitals ? lastData.recommendedHospitals[0] : null;

    const payload = {
        patientIdentifier: patientName,
        severityLevel: lastData?.triageResult?.overallSeverity || 'CRITICAL',
        criticalReason: lastData?.triageResult?.criticalReason || 'Severe cardiac / diagnostic anomaly detected',
        biomarkers: lastData?.triageResult?.analyzedBiomarkers || [],
        specialtyName: lastData?.specialtyGuidance?.authorizedSpecialtyName || 'Interventional Cardiology',
        hospitalName: topHospital ? topHospital.name : 'Apex Critical Care & Heart Institute',
        hospitalPhone: topHospital ? topHospital.emergency_phone : '+91-20-8000-9911',
        hospitalLat: topHospital ? topHospital.latitude : 18.52043,
        hospitalLon: topHospital ? topHospital.longitude : 73.85674,
        patientLat: AppState.userLocation.latitude,
        patientLon: AppState.userLocation.longitude
    };

    try {
        const res = await fetch('/api/emergency/panic-assist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success && previewBox) {
            previewBox.classList.remove('hidden');
            previewBox.querySelector('pre').innerText = data.share.summaryText;

            if (waBtn) {
                waBtn.href = data.share.encodedWhatsAppUrl;
                waBtn.classList.remove('hidden');
            }

            if (copyBtn) {
                copyBtn.onclick = () => {
                    navigator.clipboard.writeText(data.share.summaryText);
                    showToast('Emergency SOS alert copied to clipboard!', 'success');
                };
            }

            showToast('One-Tap Emergency Alert generated!', 'success');
        }
    } catch (e) {
        showToast('Error generating share: ' + e.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Admin license search listener
    const verifyBtn = document.getElementById('admin-verify-btn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', () => verifyLicenseLookup());
    }

    // Admin tab button triggers hospital list load
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        if (btn.dataset.tab === 'tab-admin') {
            btn.addEventListener('click', loadHospitalAdminList);
        }
    });

    const panicGenBtn = document.getElementById('generate-panic-btn');
    if (panicGenBtn) {
        panicGenBtn.addEventListener('click', generatePanicShare);
    }
});

