/* =========================================================
   AromeTrack - 2D SCADA Warehouse Map Logic
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    console.log("[Warehouse Map] Memuat denah lantai 2D...");

    // Mencari wadah denah gudang yang ada di index.html
    const gridContainer = document.getElementById("warehouse-grid");
    
    // Jika wadah ditemukan, bersihkan teks loading-nya
    if (gridContainer) {
        gridContainer.innerHTML = ''; 
        gridContainer.className = 'warehouse-layout'; // Memanggil class grid dari style.css
        
        // Asumsi gudang Sima Arome memiliki kapasitas 48 slot drum (4 baris x 12 kolom)
        const totalSlots = 48; 

        // Melakukan perulangan untuk membuat kotak drum sebanyak 48 buah
        for (let i = 1; i <= totalSlots; i++) {
            // Membuat elemen kotak div baru
            const slot = document.createElement("div");
            slot.classList.add("drum-slot");

            // SIMULASI SMART SLOTTING: Mengacak status drum untuk presentasi
            const probabilitas = Math.random();
            let statusTeks = "Kosong";

            if (probabilitas < 0.2) {
                // 20% kemungkinan drum berisi bahan berbahaya
                slot.classList.add("drum-hazard");
                slot.innerText = "H" + i; // H = Hazard
                statusTeks = "Bahan Berbahaya (Perlu Pemisahan)";
            } else if (probabilitas < 0.6) {
                // 40% kemungkinan drum berisi bahan ekstrak aman
                slot.classList.add("drum-safe");
                slot.innerText = "S" + i; // S = Safe
                statusTeks = "Ekstrak Alami (Aman)";
            } else {
                // 40% kemungkinan slot kosong
                slot.classList.add("drum-empty");
                slot.innerText = i;
            }

            // Menambahkan fitur interaktif: Jika juri mengklik drum di layar, muncul detailnya
            slot.addEventListener("click", () => {
                alert(`Detail Slot Gudang #${i}\nStatus: ${statusTeks}\nKoordinat Grid: Blok ${Math.ceil(i/12)}`);
            });

            // Memasukkan kotak drum yang sudah dibuat ke dalam wadah HTML
            gridContainer.appendChild(slot);
        }
    }
});
