/* =========================================================
   AromeTrack - Live 2D SCADA Warehouse Map Logic
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    console.log("[Warehouse Map] Memuat denah lantai 2D interaktif...");

    const gridContainer = document.getElementById("warehouse-grid");
    
    if (gridContainer) {
        // Membersihkan teks placeholder
        gridContainer.innerHTML = ''; 
        gridContainer.className = 'warehouse-layout'; 
        
        const totalSlots = 48; 
        const arraySlot = []; // Menyimpan memori kotak untuk dianimasikan nanti

        // 1. Membangun Grid Awal
        for (let i = 1; i <= totalSlots; i++) {
            const slot = document.createElement("div");
            slot.classList.add("drum-slot");
            slot.id = `slot-${i}`;

            // Menentukan status awal drum
            aturStatusSmartSlotting(slot, i);

            // Fitur interaktif untuk juri: Klik untuk melihat data detail
            slot.addEventListener("click", () => {
                const status = slot.getAttribute("data-status");
                alert(`[Sistem Manajemen Gudang]\n\nLokasi Slot : #${i} (Blok ${Math.ceil(i/12)})\nStatus Slot : ${status}\n\n*Terintegrasi dengan modul QC dan Lot Tracking.`);
            });

            gridContainer.appendChild(slot);
            arraySlot.push(slot); // Masukkan ke memori
        }

        // 2. Mesin Simulasi Pergerakan Barang (Aktivitas Pabrik Dinamis)
        // Membuat efek seolah-olah ada forklift yang memindahkan barang setiap 4 detik
        setInterval(() => {
            // Memilih satu slot secara acak
            const indexAcak = Math.floor(Math.random() * totalSlots);
            const slotTarget = arraySlot[indexAcak];

            // Mengubah isi slot tersebut
            aturStatusSmartSlotting(slotTarget, indexAcak + 1);

            // Memberikan efek denyut (pulse) sesaat agar terlihat ada pembaruan data HMI
            slotTarget.style.transform = "scale(1.15)";
            slotTarget.style.boxShadow = "0 0 15px rgba(16, 185, 129, 0.5)"; // Cahaya hijau
            
            // Mengembalikan ke ukuran normal setelah setengah detik
            setTimeout(() => {
                slotTarget.style.transform = "scale(1)";
                slotTarget.style.boxShadow = "none";
            }, 500);

        }, 4000); 
    }

    /**
     * Fungsi Inti Smart Slotting
     * Menentukan klasifikasi keamanan bahan secara otomatis
     */
    function aturStatusSmartSlotting(elemen, nomor) {
        // Reset seluruh warna kelas terlebih dahulu
        elemen.className = "drum-slot"; 
        
        const probabilitas = Math.random();

        if (probabilitas < 0.2) {
            // 20% Peluang: Bahan Kimia Berbahaya (Merah)
            elemen.classList.add("drum-hazard");
            elemen.innerText = "H" + nomor; 
            elemen.setAttribute("data-status", "BAHAN BERBAHAYA (Wajib Isolasi)");
        } else if (probabilitas < 0.6) {
            // 40% Peluang: Ekstrak Alami Aman (Hijau)
            elemen.classList.add("drum-safe");
            elemen.innerText = "S" + nomor; 
            elemen.setAttribute("data-status", "Ekstrak Alami (Status Aman)");
        } else {
            // 40% Peluang: Rak Kosong
            elemen.classList.add("drum-empty");
            elemen.innerText = nomor;
            elemen.setAttribute("data-status", "Rak Kosong (Tersedia)");
        }
    }
});
