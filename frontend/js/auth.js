/* =========================================================
   AromeTrack - Authentication & RBAC Module
   ========================================================= */

const AUTH_TOKEN_KEY = 'arometrack_token';
const AUTH_USER_KEY = 'arometrack_user';

/**
 * Decode JWT payload tanpa library (base64)
 */
function decodeJWT(token) {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
}

/**
 * Cek apakah user sudah login dan token masih valid
 */
function isAuthenticated() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return false;

    const decoded = decodeJWT(token);
    if (!decoded) return false;

    // Cek expiry
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
        logout();
        return false;
    }

    return true;
}

/**
 * Get current user info from stored token
 */
function getCurrentUser() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return null;
    return decodeJWT(token);
}

/**
 * Get stored JWT token
 */
function getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Login: POST ke backend, atau demo mode jika backend offline
 */
async function doLogin(username, password) {
    const AUTH_API = window.AROMETRACK_API_URL || 'http://localhost:3000';
    
    try {
        const response = await fetch(`${AUTH_API}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Login gagal');
        }

        // Simpan token dan user info
        localStorage.setItem(AUTH_TOKEN_KEY, result.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.user));

        return result;
    } catch (fetchError) {
        // Backend offline — gunakan demo mode (hardcoded credentials)
        console.log('[Auth] Backend offline, menggunakan demo mode.');
        
        const demoUsers = {
            'admin': { password: 'admin123', role: 'plant_manager', displayName: 'Pak Budi - Plant Manager' },
            'inspector': { password: 'inspector123', role: 'qc_inspector', displayName: 'Ibu Sari - QC Inspector' }
        };

        const user = demoUsers[username];
        if (!user || user.password !== password) {
            throw new Error('Username atau password salah.');
        }

        // Generate fake JWT-like token for demo
        const payload = {
            userId: username === 'admin' ? 1 : 2,
            username: username,
            role: user.role,
            displayName: user.displayName,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 86400 // 24h
        };

        // Base64 encode as fake JWT (header.payload.signature)
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const body = btoa(JSON.stringify(payload));
        const fakeToken = `${header}.${body}.demo_signature`;

        localStorage.setItem(AUTH_TOKEN_KEY, fakeToken);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ username, role: user.role, displayName: user.displayName }));

        return { token: fakeToken, user: { username, role: user.role, displayName: user.displayName } };
    }
}

/**
 * Logout: Hapus semua data session
 */
function logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    window.location.reload();
}

/**
 * Terapkan RBAC: sembunyikan menu berdasarkan role
 */
function applyRoleBasedAccess() {
    const user = getCurrentUser();
    if (!user) return;

    const menuLinks = document.querySelectorAll('.menu-link');

    if (user.role === 'qc_inspector') {
        // QC Inspector hanya bisa lihat tab QC
        menuLinks.forEach(link => {
            const target = link.getAttribute('data-target');
            if (target !== 'view-qc') {
                link.style.display = 'none';
            }
        });

        // Auto-navigate ke QC view
        document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
        const qcView = document.getElementById('view-qc');
        if (qcView) {
            qcView.classList.remove('hidden');
            qcView.classList.add('block');
        }
    }

    // Update header dengan role badge
    updateRoleBadge(user);
}

/**
 * Tampilkan badge role di header
 */
function updateRoleBadge(user) {
    const header = document.querySelector('header');
    if (!header) return;

    // Hapus badge lama jika ada
    const existingBadge = document.getElementById('role-badge-container');
    if (existingBadge) existingBadge.remove();

    const roleIcon = user.role === 'plant_manager' ? '🔑' : '🔬';
    const roleLabel = user.role === 'plant_manager' ? 'Plant Manager' : 'QC Inspector';
    const roleColor = user.role === 'plant_manager' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700';

    const badgeContainer = document.createElement('div');
    badgeContainer.id = 'role-badge-container';
    badgeContainer.className = 'flex items-center gap-3 ml-auto';
    badgeContainer.innerHTML = `
        <span class="text-xs font-bold px-3 py-1.5 rounded-lg ${roleColor}">
            ${roleIcon} ${roleLabel}
        </span>
        <span class="text-xs text-slate-500">${user.displayName}</span>
        <button onclick="logout()" class="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-semibold transition-all">
            <i class="fa-solid fa-right-from-bracket mr-1"></i>Logout
        </button>
    `;

    header.appendChild(badgeContainer);
}

/**
 * Fetch wrapper yang otomatis menambahkan Authorization header
 */
async function authenticatedFetch(url, options = {}) {
    const token = getToken();
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    return fetch(url, { ...options, headers });
}
