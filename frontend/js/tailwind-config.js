/* =========================================================
   AromeTrack - Tailwind CSS Custom Configuration
   ========================================================= */

tailwind.config = {
    theme: {
        extend: {
            // Mengatur Plus Jakarta Sans sebagai font utama agar terlihat sangat modern dan bersih
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            },
            // Mendaftarkan palet warna khusus "Sima" agar bisa dipanggil langsung di HTML
            colors: {
                sima: {
                    dark: '#022C22',    // Hijau Zamrud Sangat Gelap (Untuk warna Sidebar)
                    primary: '#059669', // Hijau Sima Arome (Untuk tombol dan aksen utama)
                    light: '#ECFDF5',   // Hijau Sangat Muda (Untuk latar belakang atau highlight)
                    gold: '#D97706'     // Aksen Emas Elegan (Untuk garis tajuk atau peringatan)
                }
            }
        }
    }
}
