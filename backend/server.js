/* =========================================================
   AromeTrack - Main Backend Server (Cyberhack 2026)
   ========================================================= */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { startMqttBroker, ambilDataTerakhir } = require('./config/mqtt-broker');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT_API = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: [
        'https://main.d2q768qid1m52n.amplifyapp.com',
        'http://localhost:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:5501',
        'http://127.0.0.1:5501'
    ]
}));

// === PUBLIC ROUTE: Live data (backward compatible, no auth needed for demo) ===
app.get('/api/data', (req, res) => {
    res.json(ambilDataTerakhir());
});

// === ALL OTHER API ROUTES ===
app.use('/api', apiRoutes);

// === HEALTH CHECK ===
app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// === START SERVER ===
app.listen(PORT_API, () => {
    console.log("========================================");
    console.log(" AromeTrack Enterprise Backend Server");
    console.log(" Cyberhack 2026 - Sima Arome");
    console.log("========================================");
    console.log(`[Express API] Berjalan di port ${PORT_API}`);
    console.log(`[Supabase] URL: ${process.env.SUPABASE_URL ? 'Terhubung ✓' : 'TIDAK DIKONFIGURASI ✗'}`);

    startMqttBroker();
});
