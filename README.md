# Vaulta — Dashboard Keuangan

Aplikasi pencatatan keuangan harian dengan desain **dashboard admin** profesional. Sidebar navigasi gelap, kartu statistik bersih, dan tabel riwayat rapi — optimal untuk **mobile** dan **desktop**.

---

## ✨ Fitur

- **Dashboard** — Ringkasan pemasukan, pengeluaran & saldo hari ini
- **Input Cepat** — Form di dashboard (tombol "+ Entri Baru" langsung fokus ke form)
- **Ekspor CSV** — Unduh transaksi sesi ini
- **Riwayat Transaksi** — Tabel riwayat dengan filter per sesi
- **Navigasi** — Sidebar (desktop) & bottom nav (mobile)
- **Sync ke Google Sheets** — Data otomatis dikirim via Apps Script
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

Dark monochrome "finance terminal" — label mono, panel bergaris tipis, tombol aksi putih.

---

Vaulta © 2026
