/* =========================================================
   AromeTrack - Simulated AI Vision & Quality Control Engine
   ========================================================= */

function inspeksiLotDenganAI(dataLot) {
    // 1. Mengekstrak data yang masuk dari sensor/PPIC
    const nomorLot = dataLot.lotNumber;
    const jenisMaterial = dataLot.materialType;

    // 2. Simulasi Model Machine Learning (Probabilistic Logic)
    // AI memiliki akurasi dasar 80%, ditambah variasi acak hingga 19%
    const baseConfidence = 80;
    const randomVariance = Math.random() * 19; 
    
    // 15% kemungkinan ada anomali/kontaminasi pada bahan
    const isTerkontaminasi = Math.random() < 0.15; 

    let aiScore;
    let keputusanAI;

    if (isTerkontaminasi) {
        // Jika kotor/rusak, AI memberi skor rendah (antara 40% - 65%)
        aiScore = (Math.random() * 25) + 40;
        keputusanAI = "DITOLAK (Anomali Visual)";
    } else {
        // Jika aman, skor di atas 80%
        aiScore = baseConfidence + randomVariance;
        keputusanAI = "LULUS QC (Optimal)";
    }

    // 3. Mengembalikan hasil analisis
    return {
        lotId: nomorLot,
        tipe: jenisMaterial,
        akurasi: aiScore.toFixed(2),
        status: keputusanAI,
        waktu: new Date().toISOString()
    };
}

// Mengekspor fungsi agar bisa dipakai oleh peladen utama
module.exports = { inspeksiLotDenganAI };
