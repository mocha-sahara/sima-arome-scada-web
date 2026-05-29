/* =========================================================
   AromeTrack - Toast Notification System
   ========================================================= */

const MAX_VISIBLE_TOASTS = 3;
let toastQueue = [];
let activeToasts = 0;

/**
 * Tampilkan toast notification
 * @param {string} message - Pesan notifikasi
 * @param {'danger'|'warning'|'success'|'info'} type - Tipe toast
 * @param {number} duration - Durasi tampil (ms), default 8000
 */
function showToast(message, type = 'info', duration = 8000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    if (activeToasts >= MAX_VISIBLE_TOASTS) {
        toastQueue.push({ message, type, duration });
        return;
    }

    activeToasts++;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slide-in`;

    const icons = {
        danger: 'fa-triangle-exclamation',
        warning: 'fa-exclamation-circle',
        success: 'fa-check-circle',
        info: 'fa-info-circle'
    };

    const colors = {
        danger: 'border-red-500 bg-red-50',
        warning: 'border-amber-500 bg-amber-50',
        success: 'border-emerald-500 bg-emerald-50',
        info: 'border-blue-500 bg-blue-50'
    };

    const textColors = {
        danger: 'text-red-700',
        warning: 'text-amber-700',
        success: 'text-emerald-700',
        info: 'text-blue-700'
    };

    const time = new Date().toLocaleTimeString('id-ID');

    toast.innerHTML = `
        <div class="flex items-start gap-3 p-4 rounded-xl border-l-4 shadow-lg backdrop-blur-sm ${colors[type]}">
            <i class="fa-solid ${icons[type]} ${textColors[type]} text-lg mt-0.5"></i>
            <div class="flex-1">
                <p class="text-sm font-semibold ${textColors[type]}">${message}</p>
                <p class="text-xs text-slate-500 mt-1">${time}</p>
            </div>
            <button onclick="dismissToast(this)" class="text-slate-400 hover:text-slate-600 text-lg">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
    `;

    container.appendChild(toast);

    // Auto-dismiss
    setTimeout(() => {
        removeToast(toast);
    }, duration);
}

/**
 * Hapus toast secara manual
 */
function dismissToast(button) {
    const toast = button.closest('.toast');
    if (toast) removeToast(toast);
}

/**
 * Remove toast dengan animasi
 */
function removeToast(toast) {
    toast.classList.add('animate-slide-out');
    setTimeout(() => {
        toast.remove();
        activeToasts--;

        // Process queue
        if (toastQueue.length > 0) {
            const next = toastQueue.shift();
            showToast(next.message, next.type, next.duration);
        }
    }, 300);
}

// === Alert Detection Logic ===
let lastAlertTemp = null;

/**
 * Cek apakah suhu melewati batas bahaya dan trigger toast
 */
function checkTemperatureAlert(temperature) {
    const DANGER_THRESHOLD = -4.0;

    if (temperature > DANGER_THRESHOLD) {
        // Hanya alert jika ini transisi baru (dari normal ke bahaya)
        if (lastAlertTemp === null || lastAlertTemp <= DANGER_THRESHOLD) {
            showToast(
                `⚠️ SUHU KRITIS: ${temperature.toFixed(1)}°C — Melebihi batas aman (-4°C)! Periksa unit pendingin segera.`,
                'danger',
                10000
            );
        }
    }
    lastAlertTemp = temperature;
}

/**
 * Alert untuk hasil QC ditolak
 */
function checkQCAlert(hasilAI) {
    if (hasilAI && hasilAI.status.includes('DITOLAK')) {
        showToast(
            `🔬 QC DITOLAK: ${hasilAI.lotId} — Skor AI: ${hasilAI.akurasi}%. Material perlu isolasi.`,
            'warning',
            8000
        );
    }
}
