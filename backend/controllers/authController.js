const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { supabase } = require('../config/supabaseClient');

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Returns: { token, user: { username, role, displayName } }
 */
async function login(req, res) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username dan password wajib diisi.' });
        }

        // Cari user di database
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Username atau password salah.' });
        }

        // Verifikasi password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Username atau password salah.' });
        }

        // Generate JWT
        const payload = {
            userId: user.id,
            username: user.username,
            role: user.role,
            displayName: user.display_name
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({
            token,
            user: {
                username: user.username,
                role: user.role,
                displayName: user.display_name
            }
        });
    } catch (err) {
        console.error('[Auth] Login error:', err.message);
        res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
}

/**
 * GET /api/auth/me
 * Returns current user info from JWT
 */
function me(req, res) {
    res.json({ user: req.user });
}

module.exports = { login, me };
