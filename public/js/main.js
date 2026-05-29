/* =========================================================
   AromeTrack - Main Logic, SPA Routing, & API Polling
   Cyberhack 2026 - Sima Arome
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    console.log("[HMI System] Antarmuka SCADA AromeTrack siap.");

    // =========================================================
    // 0. AUTHENTICATION CHECK
    // =========================================================
    if (!isAuthenticated()) {
        showLoginOverlay();
        return;
    }

    // User authenticated — hide login, show app
    hideLoginOverlay();
    applyRoleBasedAccess();
    initApp();
});

/**
 * Handle login form submission
 */
async function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    const loginBtn = document.getElementById('login-btn');

    if (!username || !password) {
        errorDiv.textContent = 'Username dan password wajib diisi.';
        errorDiv.classList.remove('hidden');
        return;
    }

    // Loading state
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Memproses...';

    try {
        await doLogin(username, password);
        
        // Success — reload to apply auth
        hideLoginOverlay();
        applyRoleBasedAccess();
        initApp();
        
        showToast(`Selamat datang, ${getCurrentUser().displayName}!`, 'success', 4000);
    } catch (err) {
        errorDiv.textContent = err.message;
        errorDiv.classList.remove('hidden');
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket mr-2"></i>Masuk';
    }
}

function showLoginOverlay() {
    document.getElementById('login-overlay').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
}

function hideLoginOverlay() {
    document.getElementById('login-overlay').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
}

// =========================================================
// MAIN APP INITIALIZATION
// =========================================================
function initApp() {
    setupSPARouting();
    initTemperatureChart();
    loadHistoricalTemperature();
    startDataPolling();
    startUptimeCounter();
    loadStats();
}

// =========================================================
// 1. SISTEM ROUTING SINGLE PAGE APPLICATION (SPA)
// =========================================================
function setupSPARouting() {
    const menuLinks = document.querySelectorAll(".menu-link");
    const pageViews = document.querySelectorAll(".page-view");
    const headerTitle = document.getElementById("header-title");

    menuLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();

            // A. Reset semua menu
            menuLinks.forEach(m => {
                m.className = "menu-link flex items-center px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl font-medium transition-all";
                const icon = m.querySelector("i");
                if (icon) icon.classList.remove("text-emerald-400");
            });
            
            pageViews.forEach(page => {
                page.classList.remove("block");
                page.classList.add("hidden");
            });

            // B. Aktifkan menu yang diklik
            link.className = "menu-link flex items-center px-4 py-3 bg-white/10 text-white rounded-xl font-medium border border-white/5 shadow-inner backdrop-blur-sm transition-all";
            const activeIcon = link.querySelector("i");
            if (activeIcon) activeIcon.classList.add("text-emerald-400");
            
            const targetId = link.getAttribute("data-target");
            const targetView = document.getElementById(targetId);
            if (targetView) {
                targetView.classList.remove("hidden");
                targetView.classList.add("block");
            }

            // C. Update header breadcrumb
            const namaMenu = link.textContent.trim();
            if (headerTitle) {
                headerTitle.innerHTML = `<i class="fa-solid fa-house"></i> <span class="mx-2">/</span> <span class="text-sima-primary font-semibold">${namaMenu}</span>`;
            }
        });
    });
}

// =========================================================
// 2. DATA POLLING & UI UPDATE
// =========================================================
const API_URL = window.AROMETRACK_API_URL || 'http://localhost:3000';
const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_KEY = window.SUPABASE_ANON_KEY;
let lotAITerakhirDilihat = "";
let isConnected = false;
let useSupabaseDirect = false; // Fallback ke Supabase jika backend offline

function startDataPolling() {
    tarikDataDariServer();
    setInterval(tarikDataDariServer, 3000);
    
    // Load QC history from database on startup
    loadQCHistory();
}

function tarikDataDariServer() {
    fetch(`${API_URL}/api/data`)
        .then(res => {
            if (!res.ok) throw new Error("Backend offline");
            return res.json();
        })
        .then(data => {
            if (!isConnected) {
                isConnected = true;
                useSupabaseDirect = false;
                updateConnectionStatus(true, 'Backend Live');
            }
            updateSuhuCard(data);
            updateLotCard(data);
            updateAICard(data);
            updateChart(data);
        })
        .catch(() => {
            // Backend offline — fallback ke Supabase langsung
            if (!useSupabaseDirect) {
                useSupabaseDirect = true;
                isConnected = false;
                updateConnectionStatus(true, 'Supabase Direct');
                console.log('[HMI] Backend offline, beralih ke Supabase direct mode.');
            }
            fetchFromSupabaseDirect();
        });
}

/**
 * Fallback: Baca data terbaru langsung dari Supabase REST API
 * + Trigger cloud simulator untuk generate data baru
 */
async function fetchFromSupabaseDirect() {
    if (!SUPABASE_URL || !SUPABASE_KEY) return;

    try {
        // Trigger cloud simulator (generates new data in Supabase)
        try {
            await fetch('/api/simulate');
        } catch (e) { /* not on Amplify, skip */ }

        const headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        };

        // Ambil suhu terakhir
        const tempRes = await fetch(
            `${SUPABASE_URL}/rest/v1/telemetry_coldchain?select=temperature,created_at,is_anomaly&order=created_at.desc&limit=1`,
            { headers }
        );
        
        if (tempRes.ok) {
            const tempData = await tempRes.json();
            if (tempData.length > 0) {
                const latest = tempData[0];
                updateSuhuCard({ suhuColdChain: parseFloat(latest.temperature) });
                updateChart({ suhuColdChain: parseFloat(latest.temperature) });
            }
        }

        // Ambil QC terakhir
        const qcRes = await fetch(
            `${SUPABASE_URL}/rest/v1/qc_inspections?select=*&order=created_at.desc&limit=1`,
            { headers }
        );

        if (qcRes.ok) {
            const qcData = await qcRes.json();
            if (qcData.length > 0) {
                const latest = qcData[0];
                const hasilAI = {
                    lotId: latest.lot_id,
                    tipe: latest.material_type,
                    akurasi: latest.ai_score,
                    status: latest.decision,
                    waktu: latest.created_at
                };
                
                if (hasilAI.lotId !== lotAITerakhirDilihat) {
                    lotAITerakhirDilihat = hasilAI.lotId;
                    updateAICardDirect(hasilAI);
                    updateQCTable(hasilAI);
                    checkQCAlert(hasilAI);
                }
            }
        }

        // Ambil total lot count
        const countRes = await fetch(
            `${SUPABASE_URL}/rest/v1/qc_inspections?select=id&head=true`,
            { headers, method: 'HEAD' }
        );
        // Supabase returns count in content-range header when using Prefer: count=exact
        const countRes2 = await fetch(
            `${SUPABASE_URL}/rest/v1/qc_inspections?select=id`,
            { headers: { ...headers, 'Prefer': 'count=exact', 'Range-Unit': 'items', 'Range': '0-0' } }
        );
        const contentRange = countRes2.headers.get('content-range');
        if (contentRange) {
            const total = contentRange.split('/')[1];
            updateLotCard({ lotMasuk: parseInt(total) || 0 });
        }

    } catch (err) {
        console.log('[Supabase Direct] Error:', err.message);
    }
}

function updateAICardDirect(hasilAI) {
    const labelEl = document.getElementById('ai-card-label');
    const valueEl = document.getElementById('ai-card-value');
    
    if (labelEl) labelEl.innerHTML = `AI Vision: <span class="text-sima-primary font-bold">${hasilAI.lotId}</span>`;
    
    if (valueEl) {
        const isDitolak = hasilAI.status.includes("DITOLAK");
        valueEl.innerHTML = `
            <span class="text-3xl ${isDitolak ? 'text-red-600' : 'text-emerald-600'}">${isDitolak ? 'DITOLAK' : 'LULUS QC'}</span> 
            <span class="text-sm text-slate-400 block mt-1">Akurasi: ${hasilAI.akurasi}%</span>
        `;
    }
}

function updateConnectionStatus(online, mode) {
    const indicator = document.getElementById('connection-indicator');
    const label = document.getElementById('connection-label');
    if (indicator && label) {
        if (online && mode === 'Backend Live') {
            indicator.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
            label.textContent = 'Backend Live';
            label.className = 'text-xs text-emerald-400';
        } else if (online && mode === 'Supabase Direct') {
            indicator.className = 'w-2 h-2 rounded-full bg-blue-400 animate-pulse';
            label.textContent = 'Supabase Direct';
            label.className = 'text-xs text-blue-400';
        } else {
            indicator.className = 'w-2 h-2 rounded-full bg-red-400';
            label.textContent = 'Offline';
            label.className = 'text-xs text-red-400';
        }
    }
}

/**
 * Load QC history from Supabase on page load
 */
async function loadQCHistory() {
    try {
        // Try backend first
        const token = getToken();
        let data = null;

        if (token) {
            try {
                const response = await fetch(`${API_URL}/api/qc/history?limit=20`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const result = await response.json();
                    data = result.data;
                }
            } catch (e) { /* backend offline, try supabase */ }
        }

        // Fallback to Supabase direct
        if (!data && SUPABASE_URL && SUPABASE_KEY) {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/qc_inspections?select=*&order=created_at.desc&limit=20`,
                { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
            );
            if (response.ok) {
                data = await response.json();
            }
        }

        if (data && data.length > 0) {
            const tabelBody = document.getElementById("ai-log-table");
            if (tabelBody) {
                tabelBody.innerHTML = "";
                data.forEach(row => {
                    const baris = document.createElement("tr");
                    const decision = row.decision || row.status || '';
                    const labelWarna = decision.includes("DITOLAK") ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700';
                    const jam = new Date(row.created_at || row.waktu).toLocaleTimeString('id-ID');
                    const lotId = row.lot_id || row.lotId;
                    const materialType = row.material_type || row.tipe;
                    const aiScore = row.ai_score || row.akurasi;

                    baris.innerHTML = `
                        <td class="px-6 py-4 font-medium text-slate-500">${jam}</td>
                        <td class="px-6 py-4 font-bold text-slate-800">${lotId}</td>
                        <td class="px-6 py-4"><span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold">${materialType}</span></td>
                        <td class="px-6 py-4 font-medium">${aiScore}%</td>
                        <td class="px-6 py-4"><span class="px-3 py-1 rounded-full text-xs font-bold ${labelWarna}">${decision}</span></td>
                    `;
                    tabelBody.appendChild(baris);
                });
            }
        }
    } catch (err) {
        console.log('[QC] Gagal memuat riwayat QC.');
    }
}

function updateSuhuCard(data) {
    const elemenSuhu = document.getElementById("angka-suhu");
    const elemenStatus = document.getElementById("status-suhu");
    
    if (data.suhuColdChain !== undefined && elemenSuhu && elemenStatus) {
        const kartuSuhu = elemenSuhu.closest('.bg-white');
        elemenSuhu.innerHTML = `${data.suhuColdChain.toFixed(1)}°<span class="text-2xl text-slate-400">C</span>`;
        
        if (data.suhuColdChain > -4.0 || data.suhuColdChain < -20.0) {
            elemenStatus.textContent = "BAHAYA";
            elemenStatus.className = "text-xs font-bold px-2 py-1 rounded-lg bg-red-100 text-red-700";
            if (kartuSuhu) kartuSuhu.classList.add("status-alert");
        } else {
            elemenStatus.textContent = "Normal";
            elemenStatus.className = "text-xs font-bold px-2 py-1 rounded-lg bg-green-100 text-green-700";
            if (kartuSuhu) kartuSuhu.classList.remove("status-alert");
        }

        // Trigger alert check
        checkTemperatureAlert(data.suhuColdChain);
    }
}

function updateLotCard(data) {
    const elemenLot = document.getElementById("angka-lot");
    if (elemenLot && data.lotMasuk !== undefined) {
        elemenLot.innerHTML = `${data.lotMasuk} <span class="text-lg font-semibold text-slate-400">Lot</span>`;
    }
}

function updateAICard(data) {
    if (data.hasilAITerakhir && data.hasilAITerakhir.lotId !== lotAITerakhirDilihat) {
        lotAITerakhirDilihat = data.hasilAITerakhir.lotId;
        
        // Update AI card on dashboard
        const labelEl = document.getElementById('ai-card-label');
        const valueEl = document.getElementById('ai-card-value');
        
        if (labelEl) labelEl.innerHTML = `AI Vision: <span class="text-sima-primary font-bold">${data.hasilAITerakhir.lotId}</span>`;
        
        if (valueEl) {
            const isDitolak = data.hasilAITerakhir.status.includes("DITOLAK");
            valueEl.innerHTML = `
                <span class="text-3xl ${isDitolak ? 'text-red-600' : 'text-emerald-600'}">${isDitolak ? 'DITOLAK' : 'LULUS QC'}</span> 
                <span class="text-sm text-slate-400 block mt-1">Akurasi: ${data.hasilAITerakhir.akurasi}%</span>
            `;
        }

        // Update QC log table
        updateQCTable(data.hasilAITerakhir);

        // Trigger QC alert
        checkQCAlert(data.hasilAITerakhir);
    }
}

function updateQCTable(hasilAI) {
    const tabelBody = document.getElementById("ai-log-table");
    if (!tabelBody) return;

    // Hapus placeholder
    if (tabelBody.innerHTML.includes("Menunggu data")) tabelBody.innerHTML = "";
    
    const barisBaru = document.createElement("tr");
    barisBaru.className = "animate-fade-in";
    const labelWarna = hasilAI.status.includes("DITOLAK") ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700';
    const jam = new Date(hasilAI.waktu).toLocaleTimeString('id-ID');

    barisBaru.innerHTML = `
        <td class="px-3 md:px-6 py-3 md:py-4 font-medium text-slate-500">${jam}</td>
        <td class="px-3 md:px-6 py-3 md:py-4 font-bold text-slate-800">${hasilAI.lotId}</td>
        <td class="px-3 md:px-6 py-3 md:py-4"><span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold">${hasilAI.tipe}</span></td>
        <td class="px-3 md:px-6 py-3 md:py-4 font-medium">${hasilAI.akurasi}%</td>
        <td class="px-3 md:px-6 py-3 md:py-4"><span class="px-2 py-1 rounded-full text-xs font-bold ${labelWarna}">${hasilAI.status.includes("DITOLAK") ? "DITOLAK" : "LULUS"}</span></td>
    `;
    
    tabelBody.prepend(barisBaru);

    // Limit table rows to 50
    while (tabelBody.children.length > 50) {
        tabelBody.removeChild(tabelBody.lastChild);
    }
}

function updateChart(data) {
    if (data.suhuColdChain !== undefined) {
        addTemperatureDataPoint(data.suhuColdChain, new Date().toISOString());
    }
}

// =========================================================
// 3. STATS & KPI POLLING
// =========================================================
function loadStats() {
    fetchStats();
    setInterval(fetchStats, 10000); // Update stats every 10s
}

async function fetchStats() {
    let stats = null;

    // Try backend first
    const token = getToken();
    if (token) {
        try {
            const res = await fetch(`${API_URL}/api/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) stats = await res.json();
        } catch (e) { /* backend offline */ }
    }

    // Fallback to Supabase direct
    if (!stats && SUPABASE_URL && SUPABASE_KEY) {
        try {
            const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'count=exact' };
            
            // Total lots
            const totalRes = await fetch(`${SUPABASE_URL}/rest/v1/qc_inspections?select=id`, 
                { headers: { ...headers, 'Range-Unit': 'items', 'Range': '0-0' } });
            const totalRange = totalRes.headers.get('content-range');
            const totalLots = totalRange ? parseInt(totalRange.split('/')[1]) || 0 : 0;

            // Rejected lots
            const rejRes = await fetch(`${SUPABASE_URL}/rest/v1/qc_inspections?select=id&decision=like.*DITOLAK*`, 
                { headers: { ...headers, 'Range-Unit': 'items', 'Range': '0-0' } });
            const rejRange = rejRes.headers.get('content-range');
            const rejectedLots = rejRange ? parseInt(rejRange.split('/')[1]) || 0 : 0;

            // Anomaly count
            const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
            const anomRes = await fetch(`${SUPABASE_URL}/rest/v1/telemetry_coldchain?select=id&is_anomaly=eq.true&created_at=gte.${oneHourAgo}`, 
                { headers: { ...headers, 'Range-Unit': 'items', 'Range': '0-0' } });
            const anomRange = anomRes.headers.get('content-range');
            const anomalyCount = anomRange ? parseInt(anomRange.split('/')[1]) || 0 : 0;

            const rejectionRate = totalLots > 0 ? ((rejectedLots / totalLots) * 100).toFixed(1) : 0;

            stats = { totalLots, rejectedLots, rejectionRate: parseFloat(rejectionRate), anomalyCount };
        } catch (e) {
            console.log('[Stats] Supabase direct error:', e.message);
        }
    }

    if (!stats) return;

    // Rejection Rate
    const rejEl = document.getElementById('angka-rejection');
    if (rejEl) {
        const rate = stats.rejectionRate || 0;
        rejEl.innerHTML = `${rate}<span class="text-2xl text-slate-400">%</span>`;
        const card = rejEl.closest('.bg-white');
        if (card) {
            if (rate > 20) card.classList.add('status-alert');
            else card.classList.remove('status-alert');
        }
    }

    // Anomaly Count
    const anomEl = document.getElementById('angka-anomaly');
    if (anomEl) {
        anomEl.innerHTML = `${stats.anomalyCount || 0} <span class="text-lg font-semibold text-slate-400">Event</span>`;
    }
}

// =========================================================
// 4. UPTIME COUNTER
// =========================================================
function startUptimeCounter() {
    const startTime = Date.now();
    
    function updateUptime() {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const hours = String(Math.floor(elapsed / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
        const seconds = String(elapsed % 60).padStart(2, '0');
        
        const el = document.getElementById('angka-uptime');
        if (el) el.textContent = `${hours}:${minutes}:${seconds}`;
    }

    updateUptime();
    setInterval(updateUptime, 1000);
}
