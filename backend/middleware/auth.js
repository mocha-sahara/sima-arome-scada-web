const jwt = require('jsonwebtoken');

/**
 * Middleware: Verifikasi JWT Token
 * Mengekstrak token dari header Authorization: Bearer <token>
 */
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token tidak valid atau sudah kedaluwarsa.' });
    }
}

/**
 * Middleware: Cek Role tertentu
 * Penggunaan: requireRole('plant_manager')
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Tidak terautentikasi.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Akses ditolak. Role tidak memiliki izin.' });
        }
        next();
    };
}

module.exports = { verifyToken, requireRole };
