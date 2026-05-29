const aedes = require('aedes')();
const net = require('net');
const { supabase } = require('./supabaseClient');
const { inspeksiLotDenganAI } = require('../controllers/aiControllers');

const PORT_MQTT = 1883;
const mqttServer = net.createServer(aedes.handle);

let dataTerakhir = {
    suhuColdChain: -15.0,
    lotMasuk: 0,
    hasilAITerakhir: null,
    riwayatSuhu: [] // Buffer untuk chart real-time
};

function startMqttBroker() {
    mqttServer.listen(PORT_MQTT, () => {
        console.log(`[MQTT Broker] Berjalan secara lokal di port ${PORT_MQTT}`);
    });

    aedes.on('publish', async (packet, client) => {
        if (client) {
            const topik = packet.topic;
            const pesan = packet.payload.toString();

            try {
                const data = JSON.parse(pesan);

                if (topik === 'sima-arome/warehouse/temperature') {
                    dataTerakhir.suhuColdChain = data.temperature;
                    const isAnomaly = data.temperature > -4.0;

                    // Simpan ke buffer riwayat (max 50 untuk chart)
                    dataTerakhir.riwayatSuhu.push({
                        temperature: data.temperature,
                        timestamp: data.timestamp,
                        is_anomaly: isAnomaly
                    });
                    if (dataTerakhir.riwayatSuhu.length > 50) {
                        dataTerakhir.riwayatSuhu.shift();
                    }

                    // INSERT ke Supabase (async, non-blocking)
                    supabase.from('telemetry_coldchain').insert({
                        sensor_id: data.sensorId || 'TEMP_GUDANG_A',
                        temperature: data.temperature,
                        is_anomaly: isAnomaly
                    }).then(({ error }) => {
                        if (error) console.error('[Supabase] Insert telemetry error:', error.message);
                    });
                }

                if (topik === 'sima-arome/production/new-lot') {
                    dataTerakhir.lotMasuk += 1;

                    // Eksekusi AI secara real-time
                    const laporanQC = inspeksiLotDenganAI(data);
                    dataTerakhir.hasilAITerakhir = laporanQC;

                    console.log(`\n[🤖 AI Inspector] Menganalisis ${laporanQC.lotId}...`);
                    console.log(`[🤖 AI Result] Keputusan: ${laporanQC.status} | Skor: ${laporanQC.akurasi}%`);

                    // INSERT ke Supabase (async, non-blocking)
                    supabase.from('qc_inspections').insert({
                        lot_id: laporanQC.lotId,
                        material_type: laporanQC.tipe,
                        ai_score: parseFloat(laporanQC.akurasi),
                        decision: laporanQC.status
                    }).then(({ error }) => {
                        if (error) console.error('[Supabase] Insert QC error:', error.message);
                    });
                }
            } catch (error) {
                // Silent fail untuk packet non-JSON (internal aedes messages)
            }
        }
    });
}

module.exports = { startMqttBroker, ambilDataTerakhir: () => dataTerakhir };
