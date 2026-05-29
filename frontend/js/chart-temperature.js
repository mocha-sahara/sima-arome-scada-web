/* =========================================================
   AromeTrack - Real-Time Temperature Chart (Chart.js)
   ========================================================= */

let tempChart = null;
let tempChartFull = null;
const MAX_DATA_POINTS = 50;
const DANGER_THRESHOLD = -4.0;

/**
 * Chart.js configuration factory
 */
function createChartConfig(height) {
    return {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Suhu Cold-Chain (°C)',
                data: [],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 2,
                pointBackgroundColor: function(context) {
                    const value = context.dataset.data[context.dataIndex];
                    return value > DANGER_THRESHOLD ? '#ef4444' : '#3b82f6';
                },
                pointBorderColor: function(context) {
                    const value = context.dataset.data[context.dataIndex];
                    return value > DANGER_THRESHOLD ? '#ef4444' : '#3b82f6';
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 300 },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { family: 'Plus Jakarta Sans', size: 12 },
                        color: '#64748b'
                    }
                },
                annotation: {
                    annotations: {
                        dangerZone: {
                            type: 'box',
                            yMin: DANGER_THRESHOLD,
                            yMax: 5,
                            backgroundColor: 'rgba(239, 68, 68, 0.08)',
                            borderColor: 'rgba(239, 68, 68, 0.3)',
                            borderWidth: 1,
                            label: {
                                display: true,
                                content: 'ZONA BAHAYA',
                                position: 'start',
                                font: { size: 10, weight: 'bold' },
                                color: '#ef4444'
                            }
                        },
                        thresholdLine: {
                            type: 'line',
                            yMin: DANGER_THRESHOLD,
                            yMax: DANGER_THRESHOLD,
                            borderColor: '#ef4444',
                            borderWidth: 2,
                            borderDash: [6, 4],
                            label: {
                                display: true,
                                content: '-4°C Batas Aman',
                                position: 'end',
                                font: { size: 10 },
                                color: '#ef4444',
                                backgroundColor: 'rgba(255,255,255,0.8)'
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: { display: true, text: 'Waktu', color: '#94a3b8', font: { size: 11 } },
                    ticks: { color: '#94a3b8', font: { size: 10 }, maxRotation: 45, maxTicksLimit: 10 },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' }
                },
                y: {
                    display: true,
                    title: { display: true, text: 'Suhu (°C)', color: '#94a3b8', font: { size: 11 } },
                    min: -25,
                    max: 5,
                    ticks: { color: '#94a3b8', font: { size: 10 }, stepSize: 5 },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' }
                }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    };
}

/**
 * Inisialisasi kedua chart (dashboard mini + full analytics page)
 */
function initTemperatureChart() {
    const ctx = document.getElementById('temp-chart');
    if (ctx) {
        tempChart = new Chart(ctx, createChartConfig());
    }

    const ctxFull = document.getElementById('temp-chart-full');
    if (ctxFull) {
        tempChartFull = new Chart(ctxFull, createChartConfig());
    }
}

/**
 * Tambahkan data point baru ke kedua chart
 */
function addTemperatureDataPoint(temperature, timestamp) {
    const timeLabel = new Date(timestamp).toLocaleTimeString('id-ID', { 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });

    // Update chart utama (dashboard)
    if (tempChart) {
        tempChart.data.labels.push(timeLabel);
        tempChart.data.datasets[0].data.push(temperature);
        if (tempChart.data.labels.length > MAX_DATA_POINTS) {
            tempChart.data.labels.shift();
            tempChart.data.datasets[0].data.shift();
        }
        tempChart.update('none');
    }

    // Update chart full (analytics page)
    if (tempChartFull) {
        tempChartFull.data.labels.push(timeLabel);
        tempChartFull.data.datasets[0].data.push(temperature);
        if (tempChartFull.data.labels.length > MAX_DATA_POINTS) {
            tempChartFull.data.labels.shift();
            tempChartFull.data.datasets[0].data.shift();
        }
        tempChartFull.update('none');
    }
}

/**
 * Load historical data dari API atau Supabase langsung
 */
async function loadHistoricalTemperature() {
    try {
        let data = null;

        // Try backend first
        const token = getToken();
        if (token) {
            try {
                const API_URL = window.AROMETRACK_API_URL || 'http://localhost:3000';
                const response = await fetch(`${API_URL}/api/telemetry/history?limit=50`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const result = await response.json();
                    data = result.data;
                }
            } catch (e) { /* backend offline */ }
        }

        // Fallback to Supabase direct
        if (!data && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
            const response = await fetch(
                `${window.SUPABASE_URL}/rest/v1/telemetry_coldchain?select=temperature,created_at&order=created_at.asc&limit=50`,
                { headers: { 'apikey': window.SUPABASE_ANON_KEY, 'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}` } }
            );
            if (response.ok) {
                data = await response.json();
            }
        }

        if (data && data.length > 0) {
            data.forEach(reading => {
                addTemperatureDataPoint(
                    parseFloat(reading.temperature),
                    reading.created_at
                );
            });
        }
    } catch (err) {
        console.log('[Chart] Gagal memuat data historis.');
    }
}
