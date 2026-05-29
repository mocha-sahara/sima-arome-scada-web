const { supabase } = require('../config/supabaseClient');

/**
 * GET /api/telemetry/history?limit=50
 * Returns historical cold-chain temperature readings
 */
async function getTemperatureHistory(req, res) {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);

        const { data, error } = await supabase
            .from('telemetry_coldchain')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) throw error;

        res.json({ data: data || [] });
    } catch (err) {
        console.error('[Data] Telemetry history error:', err.message);
        res.status(500).json({ error: 'Gagal mengambil data telemetri.' });
    }
}

/**
 * GET /api/qc/history?limit=50
 * Returns historical QC inspection results
 */
async function getQCHistory(req, res) {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);

        const { data, error } = await supabase
            .from('qc_inspections')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        res.json({ data: data || [] });
    } catch (err) {
        console.error('[Data] QC history error:', err.message);
        res.status(500).json({ error: 'Gagal mengambil data QC.' });
    }
}

/**
 * GET /api/stats
 * Returns aggregated KPI statistics
 */
async function getStats(req, res) {
    try {
        // Total lots
        const { count: totalLots } = await supabase
            .from('qc_inspections')
            .select('*', { count: 'exact', head: true });

        // Rejected lots
        const { count: rejectedLots } = await supabase
            .from('qc_inspections')
            .select('*', { count: 'exact', head: true })
            .like('decision', '%DITOLAK%');

        // Average temperature (last 100 readings)
        const { data: tempData } = await supabase
            .from('telemetry_coldchain')
            .select('temperature')
            .order('created_at', { ascending: false })
            .limit(100);

        let avgTemp = -15.0;
        if (tempData && tempData.length > 0) {
            const sum = tempData.reduce((acc, row) => acc + parseFloat(row.temperature), 0);
            avgTemp = sum / tempData.length;
        }

        // Anomaly count (last hour)
        const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
        const { count: anomalyCount } = await supabase
            .from('telemetry_coldchain')
            .select('*', { count: 'exact', head: true })
            .eq('is_anomaly', true)
            .gte('created_at', oneHourAgo);

        const rejectionRate = totalLots > 0 ? ((rejectedLots / totalLots) * 100).toFixed(1) : 0;

        res.json({
            totalLots: totalLots || 0,
            rejectedLots: rejectedLots || 0,
            rejectionRate: parseFloat(rejectionRate),
            avgTemperature: parseFloat(avgTemp.toFixed(2)),
            anomalyCount: anomalyCount || 0
        });
    } catch (err) {
        console.error('[Data] Stats error:', err.message);
        res.status(500).json({ error: 'Gagal mengambil statistik.' });
    }
}

module.exports = { getTemperatureHistory, getQCHistory, getStats };
