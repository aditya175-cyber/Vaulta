Vaulta — Dashboard Keuangan

Aplikasi pencatatan keuangan harian bergaya *finance terminal*. Data dicatat lewat form, ditampilkan sebagai ringkasan, riwayat, dan grafik, lalu disimpan ke **Google Sheets** lewat Apps Script. Berjalan penuh di sisi klien (HTML, CSS, JS), tanpa build step.

---

Fitur

- **Ringkasan** — Pemasukan, pengeluaran, dan saldo hari ini, plus sisa saldo total dari Google Sheets
- **Input Cepat** — Form transaksi dengan pilihan kategori, format Rupiah otomatis, dan tombol "+ Entri Baru" yang langsung fokus ke form
- **Riwayat Transaksi** — Daftar transaksi sesi ini dengan pencarian dan filter Pemasukan/Pengeluaran
- **Grafik 7 Hari** — Chart.js, data diambil dari Google Sheets (`doGet`)
- **Sync Google Sheets** — Transaksi dikirim ke Apps Script (`doPost`), kolom Saldo dihitung dengan formula
- **Ekspor CSV** — Unduh transaksi sesi ini
- **Responsive** — Sidebar di desktop, bottom nav di mobile
- **Animasi** — Splash screen, scroll reveal, indikator navigasi, dan efek magnetic button. Semua mati otomatis jika pengguna memilih *reduce motion*

---

Struktur Folder

```
keuangan/
│
├── index.html                # Kerangka halaman: splash, slot komponen, pemuatan script
│
├── components/               # Potongan HTML yang dimuat oleh Include.js
│   ├── sidebar.html          # Sidebar (desktop) + bottom nav (mobile)
│   ├── header.html           # Topbar
│   ├── main.html             # Halaman Ringkasan & Transaksi
│   └── footer.html
│
├── assets/
│   ├── css/
│   │   ├── base.css          # Variabel tema, reset, tipografi
│   │   ├── sidebar.css
│   │   ├── header.css
│   │   ├── main.css          # Kartu, form, riwayat, grafik
│   │   ├── footer.css
│   │   └── motion.css        # Transisi & animasi
│   │
│   ├── js/
│   │   ├── Include.js        # Memuat components/*.html, lalu app.js & motion.js
│   │   ├── app.js            # Logika dashboard: navigasi, form, riwayat, grafik, ekspor CSV
│   │   ├── motion.js         # Scroll reveal, indikator nav, header shrink, magnetic button
│   │   └── api.js            # SCRIPT_URL & pengiriman data ke Apps Script
│   │
│   └── images/
│       ├── icons/            # Ikon SVG (income, saldo, transaction, dll.)
│       ├── favicon.png
│       ├── icon.png
│       ├── splash-icon.png
│       └── android-icon-*.png
│
├── app-script/
│   └── Code.gs               # Kode Google Apps Script (disalin ke editor Apps Script)
│
└── README.md
```

Urutan pemuatan

1. `index.html` memuat CSS, lalu `api.js`, Chart.js (CDN), dan `Include.js`
2. `Include.js` mengambil semua `components/*.html` dan menyisipkannya ke slot `data-include`
3. Setelah komponen siap, `Include.js` memuat `app.js` lalu `motion.js`
4. `app.js` menyembunyikan splash screen setelah 2 detik

file peka huruf besar/kecil di GitHub Pages.** `index.html` harus memanggil `assets/js/Include.js` persis seperti nama filenya. Salah huruf besar/kecil menyebabkan 404 dan splash screen macet.



Cara Menjalankan

Komponen dimuat dengan `fetch`, jadi **tidak bisa dibuka dengan klik dua kali** (`file://`). Pakai server lokal:

- Ekstensi **Live Server** di VS Code, atau
- `python -m http.server` lalu buka `http://localhost:8000`

Deploy ke GitHub Pages

1. Push semua file ke repo
2. Settings → Pages → Deploy from a branch → `main` / root
3. Buka `https://<username>.github.io/<nama-repo>/`

Bisa juga di-deploy ke Netlify atau Vercel (static site).

---

Konfigurasi
 1. Siapkan Google Sheets

1. Buat Google Sheet baru → **Extensions → Apps Script**
2. Salin isi `app-script/Code.gs` ke editor
3. Jalankan `setupSheet()` **sekali** untuk membuat header kolom
4. **Deploy → New deployment → Web app**, akses: **Anyone**
5. Setelah mengubah kode: **Deploy → Manage deployments → Edit → New version → Deploy**

Kolom sheet: `Tanggal | Jenis | Kategori | Jumlah | Keterangan | Saldo`

2. Hubungkan ke aplikasi

Edit `assets/js/api.js`:

```js
const SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_ID/exec';
```

`app.js` memakai `SCRIPT_URL` yang sama untuk mengambil data grafik, jadi cukup diubah di satu tempat.

---

Responsivitas

| Tampilan    | Layout                                                    |
|-------------|-----------------------------------------------------------|
| **Desktop** | Sidebar tetap + konten multi-kolom                        |
| **Tablet**  | Konten menyesuaikan (breakpoint ≤ 1024px)                 |
| **Mobile**  | Bottom nav menggantikan sidebar (breakpoint ≤ 768px)      |

---

Design

Tema *finance terminal* dengan palet hijau forest, label mono, dan panel bergaris tipis. Warna dan font diatur lewat variabel CSS di `assets/css/base.css`.

---

Vaulta © 2026
