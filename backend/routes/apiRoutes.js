const express = require('express');
const router = express.Router();

const { login, me } = require('../controllers/authController');
const { getTemperatureHistory, getQCHistory, getStats } = require('../controllers/dataController');
const { verifyToken } = require('../middleware/auth');

// === AUTH ROUTES (Public) ===
router.post('/auth/login', login);

// === AUTH ROUTES (Protected) ===
router.get('/auth/me', verifyToken, me);

// === DATA ROUTES (Protected) ===
router.get('/telemetry/history', verifyToken, getTemperatureHistory);
router.get('/qc/history', verifyToken, getQCHistory);
router.get('/stats', verifyToken, getStats);

module.exports = router;
