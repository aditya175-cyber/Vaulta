# Vaulta — Dashboard Keuangan

Aplikasi pencatatan keuangan harian bergaya **Apple minimalis**: sidebar hitam, latar kuning, kartu putih/hitam yang bersih — optimal untuk **mobile** dan **desktop**.

---

## ✨ Fitur

- **Dashboard** — Ringkasan pemasukan, pengeluaran & saldo hari ini
- **Input Cepat** — Form di dashboard (tombol "+ Entri Baru" langsung fokus ke form)
- **Ekspor CSV** — Unduh transaksi sesi ini
- **Riwayat Transaksi** — Tabel riwayat dengan filter per sesi
- **Navigasi** — Sidebar (desktop) & bottom nav (mobile)
- **Sync ke Google Sheets** — Data otomatis dikirim via Apps Script, kolom `sisa saldo` terisi otomatis (angka, bukan rumus)
- **Responsive** — Desktop sidebar + mobile bottom nav

---

## 📁 Struktur Folder

```
pencatatan-keuangan/
│
├── index.html              # Halaman utama (Struktur HTML & UI)
│
├── assets/
│   ├── css/
│   │   └── style.css       # Tema monochrome, layout & responsive
│   │
│   ├── js/
│   │   ├── app.js          # Logika dashboard, sidebar, form & navigasi
│   │   └── api.js          # Fungsi pengiriman data ke Google Apps Script
│   │
│   └── images/
│       └── favicon.png
│
└── README.md
```

---

## 🚀 Cara Deploy

1. Buka `index.html` di browser
2. Atau deploy ke GitHub Pages / Netlify / Vercel

---

## ⚙️ Konfigurasi

Edit `assets/js/api.js` untuk mengganti endpoint:

```js
const SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_ID/exec';
```

---

## 📱 Responsivitas

| Tampilan       | Layout                                              |
|----------------|-----------------------------------------------------|
| **Desktop**    | Sidebar tetap + 2-column content grid               |
| **Tablet**     | Sidebar tetap (collapsed) + single column            |
| **Mobile**     | Sidebar drawer (hamburger) + stacked cards           |

---

## 🎨 Design

Apple minimalis — komposisi warna 20% putih · 40% hitam · 40% kuning (#FFD60A). Sidebar, header, kartu statistik & grafik hitam; latar kuning; form & riwayat putih. Animasi halus (easing tanpa overshoot, respek `prefers-reduced-motion`).

---

Vaulta © 2026
