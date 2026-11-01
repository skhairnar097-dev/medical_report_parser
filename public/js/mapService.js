/**
 * Interactive GIS Emergency Navigation & Hospital Capability Map Service
 * Powered by Leaflet.js and OpenStreetMap
 */

class HospitalMapService {
    constructor() {
        this.map = null;
        this.userMarker = null;
        this.hospitalMarkers = [];
        this.routePolyline = null;
        this.hospitals = [];
        this.selectedHospitalId = null;
        this.currentInsuranceFilter = 'ALL';
    }

    initMap() {
        const mapContainer = document.getElementById('leaflet-map');
        if (!mapContainer || this.map) return;

        // Default map center
        const lat = AppState.userLocation.latitude;
        const lon = AppState.userLocation.longitude;

        this.map = L.map('leaflet-map', {
            zoomControl: true,
            scrollWheelZoom: true
        }).setView([lat, lon], 13);

        // OpenStreetMap Dark Theme tiles via CartoDB
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);

        // Patient User Pin
        const userIcon = L.divIcon({
            className: 'custom-user-icon',
            html: `<div class="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-lg radar-emergency"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        this.userMarker = L.marker([lat, lon], { icon: userIcon })
            .addTo(this.map)
            .bindPopup(`<strong class="text-xs">📍 Patient Current Emergency Location</strong><br><span class="text-[11px] text-slate-300">${AppState.userLocation.address}</span>`);

        this.loadHospitals();
    }

    invalidateSize() {
        if (this.map) {
            this.map.invalidateSize();
        } else {
            this.initMap();
        }
    }

    async loadHospitals() {
        try {
            let url = '/api/hospitals';
            if (this.currentInsuranceFilter && this.currentInsuranceFilter !== 'ALL') {
                url += `?insurance=${encodeURIComponent(this.currentInsuranceFilter)}`;
            }
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                this.updateHospitals(data.hospitals, AppState.userLocation);
            }
        } catch (e) {
            console.warn('Failed to load hospitals:', e);
        }
    }

    updateHospitals(hospitalsList, userLoc) {
        this.hospitals = hospitalsList;
        const lat = userLoc ? userLoc.latitude : AppState.userLocation.latitude;
        const lon = userLoc ? userLoc.longitude : AppState.userLocation.longitude;

        // Clear existing markers
        this.hospitalMarkers.forEach(m => this.map && this.map.removeLayer(m));
        this.hospitalMarkers = [];

        if (this.routePolyline && this.map) {
            this.map.removeLayer(this.routePolyline);
            this.routePolyline = null;
        }

        hospitalsList.forEach(h => {
            const hasIcu = h.available_icu_beds > 0;
            const markerColor = hasIcu ? '#10b981' : '#ef4444';
            const iconHtml = `
                <div class="relative cursor-pointer">
                    <div class="w-8 h-8 rounded-full ${hasIcu ? 'bg-emerald-600' : 'bg-red-600'} text-white font-bold flex items-center justify-center shadow-lg border-2 border-white text-xs">
                        H
                    </div>
                    <span class="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-slate-950 text-white border border-slate-700">
                        ${h.available_icu_beds}
                    </span>
                </div>
            `;

            const icon = L.divIcon({
                className: 'hospital-marker-icon',
                html: iconHtml,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            const marker = L.marker([h.latitude, h.longitude], { icon })
                .addTo(this.map)
                .bindPopup(`
                    <div class="p-2 space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] font-bold uppercase text-emerald-400">${h.verified_accreditation}</span>
                            <span class="text-xs font-bold text-amber-400">★ ${h.rating}</span>
                        </div>
                        <h4 class="text-sm font-bold text-white">${h.name}</h4>
                        <p class="text-[11px] text-slate-300">${h.address}</p>

                        <div class="grid grid-cols-2 gap-1 text-[10px] text-center my-2">
                            <div class="p-1 rounded bg-slate-800 border border-slate-700">
                                <strong class="text-emerald-400 block text-xs">${h.available_icu_beds} Beds</strong>
                                <span>Available ICU</span>
                            </div>
                            <div class="p-1 rounded bg-slate-800 border border-slate-700">
                                <strong class="${h.has_247_cath_lab ? 'text-emerald-400' : 'text-slate-400'} block text-xs">${h.has_247_cath_lab ? 'ACTIVE' : 'NO'}</strong>
                                <span>Cath Lab</span>
                            </div>
                        </div>

                        <div class="flex gap-1 pt-1">
                            <a href="tel:${h.emergency_phone}" class="flex-1 py-1 px-2 bg-red-600 text-white rounded text-center text-xs font-bold">
                                📞 Call ER
                            </a>
                            <button onclick="window.MapService.selectAndRoute('${h.id}')" class="flex-1 py-1 px-2 bg-blue-600 text-white rounded text-xs font-bold">
                                🧭 Route
                            </button>
                        </div>
                    </div>
                `);

            marker.on('click', () => {
                this.selectAndRoute(h.id);
            });

            this.hospitalMarkers.push(marker);
        });

        // Re-render sidebar hospital capability cards
        this.renderHospitalCards();

        // Default route to the first/nearest hospital
        if (hospitalsList.length > 0) {
            this.selectAndRoute(hospitalsList[0].id);
        }
    }

    selectAndRoute(hospitalId) {
        this.selectedHospitalId = hospitalId;
        const hospital = this.hospitals.find(h => h.id === hospitalId);
        if (!hospital || !this.map) return;

        const uLat = AppState.userLocation.latitude;
        const uLon = AppState.userLocation.longitude;
        const hLat = hospital.latitude;
        const hLon = hospital.longitude;

        // Draw Route Line
        if (this.routePolyline) {
            this.map.removeLayer(this.routePolyline);
        }

        this.routePolyline = L.polyline([[uLat, uLon], [hLat, hLon]], {
            color: '#3b82f6',
            weight: 4,
            dashArray: '8, 8',
            opacity: 0.85
        }).addTo(this.map);

        // Highlight selected card in list
        document.querySelectorAll('.hospital-list-card').forEach(card => {
            if (card.dataset.hospitalId === hospitalId) {
                card.classList.add('border-blue-500', 'bg-blue-950/20');
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                card.classList.remove('border-blue-500', 'bg-blue-950/20');
            }
        });
    }

    renderHospitalCards() {
        const container = document.getElementById('hospitals-card-list');
        if (!container) return;

        container.innerHTML = this.hospitals.map(h => {
            const hasIcu = h.available_icu_beds > 0;
            const distance = h.distanceKm !== undefined ? h.distanceKm : 3.4;
            const transit = h.estimatedTravelMins !== undefined ? h.estimatedTravelMins : 12;

            return `
                <div onclick="window.MapService.selectAndRoute('${h.id}')"
                    data-hospital-id="${h.id}"
                    class="hospital-list-card p-4 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800/90 transition-all cursor-pointer shadow-md space-y-3">
                    <div class="flex items-start justify-between">
                        <div>
                            <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400">${h.trauma_level}</span>
                            <h4 class="text-sm font-bold text-white mt-0.5">${h.name}</h4>
                            <p class="text-xs text-slate-400 mt-0.5">${h.address}</p>
                        </div>
                        <span class="text-xs font-bold text-amber-400 flex items-center space-x-1">
                            <span>★</span> <span>${h.rating}</span>
                        </span>
                    </div>

                    <div class="grid grid-cols-3 gap-2 text-center text-xs">
                        <div class="p-2 rounded bg-slate-950/60 border border-slate-800">
                            <span class="block font-black ${hasIcu ? 'text-emerald-400' : 'text-red-400'}">${h.available_icu_beds} / ${h.total_icu_beds}</span>
                            <span class="text-[10px] text-slate-400 uppercase">ICU Beds</span>
                        </div>
                        <div class="p-2 rounded bg-slate-950/60 border border-slate-800">
                            <span class="block font-black ${h.has_247_cath_lab ? 'text-emerald-400' : 'text-slate-500'}">${h.has_247_cath_lab ? 'YES' : 'NO'}</span>
                            <span class="text-[10px] text-slate-400 uppercase">Cath Lab</span>
                        </div>
                        <div class="p-2 rounded bg-slate-950/60 border border-slate-800">
                            <span class="block font-black text-blue-400">${distance} km</span>
                            <span class="text-[10px] text-slate-400 uppercase">~${transit} mins</span>
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-1 text-[10px]">
                        ${(h.supportedInsurances || []).slice(0, 3).map(ins => `
                            <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">${ins}</span>
                        `).join('')}
                    </div>

                    <div class="flex gap-2 pt-1">
                        <a href="tel:${h.emergency_phone}" class="flex-1 py-1.5 px-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-center text-xs shadow">
                            📞 ${h.emergency_phone}
                        </a>
                        <a href="https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}" target="_blank" class="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-lg text-xs font-semibold">
                            Google Maps ↗
                        </a>
                    </div>
                </div>
            `;
        }).join('');
    }

    filterByInsurance(insuranceName) {
        this.currentInsuranceFilter = insuranceName;
        this.loadHospitals();
    }
}

window.MapService = new HospitalMapService();

document.addEventListener('DOMContentLoaded', () => {
    // Insurance filter button listeners
    const insuranceSelect = document.getElementById('insurance-filter-select');
    if (insuranceSelect) {
        insuranceSelect.addEventListener('change', (e) => {
            window.MapService.filterByInsurance(e.target.value);
        });
    }
});

