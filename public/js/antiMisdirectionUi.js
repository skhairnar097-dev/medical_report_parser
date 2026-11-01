/**
 * Anti-Misdirection Specialty Matrix Controller
 * Explains clinical reasons why visiting the wrong medical specialist causes fatal delays,
 * and contrasts dangerous choices against authorized sub-specialty requirements.
 */

let allSpecialtiesList = [];

async function loadSpecialtiesMatrix() {
    try {
        const res = await fetch('/api/specialties');
        const data = await res.json();
        if (data.success) {
            allSpecialtiesList = data.specialties;
            renderSpecialtyTabs();
            // Default render first specialty or currently active one
            if (AppState.lastTriageData && AppState.lastTriageData.specialtyGuidance) {
                renderAntiMisdirection(AppState.lastTriageData.specialtyGuidance);
            } else if (allSpecialtiesList.length > 0) {
                selectSpecialtyDetail(allSpecialtiesList[0].id);
            }
        }
    } catch (e) {
        console.warn('Could not load specialties matrix:', e);
    }
}

// Render Specialty selector buttons
function renderSpecialtyTabs() {
    const container = document.getElementById('specialty-selector-tabs');
    if (!container) return;

    container.innerHTML = allSpecialtiesList.map(s => `
        <button onclick="selectSpecialtyDetail('${s.id}')"
            class="specialty-tab-btn px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-all flex items-center space-x-2"
            data-spec-id="${s.id}">
            <span class="w-2 h-2 rounded-full ${s.id === 'SPEC_CARDIO' ? 'bg-red-500' : (s.id === 'SPEC_NEPHRO' ? 'bg-amber-500' : 'bg-blue-500')}"></span>
            <span>${s.name}</span>
        </button>
    `).join('');
}

function selectSpecialtyDetail(specialtyId) {
    const s = allSpecialtiesList.find(item => item.id === specialtyId);
    if (!s) return;

    // Highlight active button
    document.querySelectorAll('.specialty-tab-btn').forEach(btn => {
        if (btn.dataset.specId === specialtyId) {
            btn.classList.add('bg-blue-600', 'text-white', 'border-blue-500');
            btn.classList.remove('bg-slate-800', 'text-slate-300');
        } else {
            btn.classList.remove('bg-blue-600', 'text-white', 'border-blue-500');
            btn.classList.add('bg-slate-800', 'text-slate-300');
        }
    });

    renderAntiMisdirection({
        id: s.id,
        authorizedSpecialtyName: s.name,
        subSpecialty: s.sub_specialty,
        category: s.category,
        requiredQualification: s.required_qualification,
        description: s.description,
        goldenHourMinutes: s.golden_hour_minutes,
        antiMisdirection: {
            dangerousWrongSpecialties: s.misdirectedSpecialties || [],
            dangerExplanation: s.misdirection_danger_explanation,
            whyIncorrect: `Visiting non-specialized general clinics exhausts the ${s.golden_hour_minutes}-minute critical golden treatment window.`,
            clinicalStandardDirective: `Consult strictly an authorized ${s.name} practitioner holding ${s.required_qualification} at a tertiary hospital.`
        }
    });
}

function renderAntiMisdirection(specialtyGuidance) {
    const container = document.getElementById('anti-misdirection-display');
    if (!container || !specialtyGuidance) return;

    const wrongSpecialties = specialtyGuidance.antiMisdirection?.dangerousWrongSpecialties || [];
    const wrongBadges = wrongSpecialties.map(ws => `
        <span class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-800/80 text-red-200 text-xs font-bold">
            <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            <span>${ws}</span>
        </span>
    `).join('');

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header Banner -->
            <div class="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div class="flex items-center space-x-2">
                        <span class="px-2.5 py-0.5 rounded text-[10px] font-black tracking-widest uppercase bg-blue-900/60 text-blue-300">ANTI-MISDIRECTION DECISION MATRIX</span>
                        <span class="text-xs text-slate-400">• Clinical Sub-Specialty Protocol</span>
                    </div>
                    <h2 class="text-2xl font-black text-white mt-1">${specialtyGuidance.authorizedSpecialtyName}</h2>
                    <p class="text-sm text-blue-300 font-medium">${specialtyGuidance.subSpecialty}</p>
                </div>
                <div class="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-center flex-shrink-0">
                    <span class="text-2xl font-black text-amber-400 font-mono">${specialtyGuidance.goldenHourMinutes} MINS</span>
                    <span class="block text-[10px] uppercase font-bold text-amber-200 tracking-wider">Golden Hour Window</span>
                </div>
            </div>

            <!-- Side-by-Side Comparison: Dangerous Mistakes vs Correct Specialty -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- LEFT: DANGEROUS WRONG CHOICES -->
                <div class="p-6 rounded-2xl bg-gradient-to-b from-red-950/30 to-slate-900/90 border-2 border-red-900/60 shadow-xl flex flex-col justify-between">
                    <div>
                        <div class="flex items-center space-x-2 text-red-400">
                            <div class="w-8 h-8 rounded-full bg-red-600/30 flex items-center justify-center font-black">✕</div>
                            <h3 class="text-lg font-black text-red-400 uppercase tracking-wide">DANGEROUS SPECIALTIES TO AVOID</h3>
                        </div>
                        <p class="text-xs text-slate-400 mt-2">
                            Panicked families frequently make rushed appointments at these clinics due to hearsay or generic searches:
                        </p>

                        <div class="flex flex-wrap gap-2 mt-4">
                            ${wrongBadges}
                        </div>

                        <div class="mt-6 p-4 rounded-xl bg-red-950/60 border border-red-900/80">
                            <h4 class="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center space-x-1">
                                <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                <span>Fatal Clinical Consequence of Misdirection:</span>
                            </h4>
                            <p class="text-xs text-red-100 mt-2 leading-relaxed">
                                ${specialtyGuidance.antiMisdirection?.dangerExplanation}
                            </p>
                        </div>
                    </div>

                    <div class="mt-6 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400">
                        ⚠️ <em>Commercial booking apps often show paid ads for general outpatient clinics regardless of patient acuity. TriageShield AI strictly suppresses unequipped clinics during emergencies.</em>
                    </div>
                </div>

                <!-- RIGHT: AUTHORIZED SPECIALIST REQUIREMENTS -->
                <div class="p-6 rounded-2xl bg-gradient-to-b from-blue-950/30 to-slate-900/90 border-2 border-blue-900/60 shadow-xl flex flex-col justify-between">
                    <div>
                        <div class="flex items-center space-x-2 text-emerald-400">
                            <div class="w-8 h-8 rounded-full bg-emerald-600/30 flex items-center justify-center font-black">✓</div>
                            <h3 class="text-lg font-black text-emerald-400 uppercase tracking-wide">REQUIRED AUTHORIZED SPECIALIST</h3>
                        </div>
                        <p class="text-xs text-slate-400 mt-2">
                            Only consult medical board certified sub-specialists holding these exact qualifications:
                        </p>

                        <div class="mt-4 p-4 rounded-xl bg-slate-950/80 border border-blue-900/50 space-y-3">
                            <div>
                                <span class="text-[10px] uppercase font-bold text-slate-400">Authorized Sub-Specialty Title</span>
                                <h4 class="text-base font-bold text-white">${specialtyGuidance.authorizedSpecialtyName}</h4>
                            </div>
                            <div>
                                <span class="text-[10px] uppercase font-bold text-slate-400">Mandatory Board Qualification</span>
                                <p class="text-xs font-mono font-bold text-emerald-300">${specialtyGuidance.requiredQualification}</p>
                            </div>
                            <div>
                                <span class="text-[10px] uppercase font-bold text-slate-400">Clinical Scope of Emergency Care</span>
                                <p class="text-xs text-slate-300 leading-relaxed">${specialtyGuidance.description}</p>
                            </div>
                        </div>

                        <div class="mt-6 p-4 rounded-xl bg-blue-950/50 border border-blue-800/80">
                            <h4 class="text-xs font-bold text-blue-300 uppercase tracking-wider">Mandatory Hospital Capabilities:</h4>
                            <ul class="text-xs text-blue-100 mt-2 space-y-1">
                                <li class="flex items-center space-x-1.5">
                                    <span class="text-emerald-400">✓</span>
                                    <span>24/7 Dedicated Emergency Operating Theaters / Cath Lab</span>
                                </li>
                                <li class="flex items-center space-x-1.5">
                                    <span class="text-emerald-400">✓</span>
                                    <span>Level 1 / Level 2 Intensive Care Unit (ICU) with Mechanical Ventilators</span>
                                </li>
                                <li class="flex items-center space-x-1.5">
                                    <span class="text-emerald-400">✓</span>
                                    <span>NABH / NABL Accredited Blood Bank & 24/7 Diagnostic Pathology</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-6 flex gap-3">
                        <button onclick="switchTab('tab-map')" class="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-center text-xs shadow-lg transition-all">
                            Locate Equipped Hospitals & Doctors →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Attach to window so triageUi can invoke it
window.renderAntiMisdirection = renderAntiMisdirection;

document.addEventListener('DOMContentLoaded', () => {
    loadSpecialtiesMatrix();
});

