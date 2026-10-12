# Vaulta — Dashboard Keuangan

Aplikasi pencatatan keuangan harian dengan desain **dashboard admin** profesional. Sidebar navigasi gelap, kartu statistik bersih, dan tabel riwayat rapi — optimal untuk **mobile** dan **desktop**.

---

## ✨ Fitur

- **Dashboard** — Ringkasan pemasukan, pengeluaran & saldo hari ini
- **Input Cepat** — Form di halaman dashboard + halaman input terpisah
- **Riwayat Transaksi** — Tabel riwayat dengan filter per sesi
- **Sidebar Navigasi** — Collapsible sidebar (desktop) & drawer (mobile)
- **Sync ke Google Sheets** — Data otomatis dikirim via Apps Script
- **Multi-page Navigation** — Dashboard, Input, Riwayat
- **Responsive** — Desktop sidebar + mobile hamburger drawer

---

## 📁 Struktur Folder

```
pencatatan-keuangan/
│
├── index.html              # Halaman utama (Struktur HTML & UI)
│
├── assets/
│   ├── css/
│   │   ├── style.css       # Layout, components & responsive
│   │   └── apple-theme.css # Design tokens, variables & animations
│   │
│   ├── js/
│   │   ├── app.js          # Logika dashboard, sidebar, form & navigasi
│   │   └── api.js          # Fungsi pengiriman data ke Google Apps Script
│   │
│   └── images/
│       └── favicon.ico
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

Terinspirasi dari desain dashboard admin Moqups — clean, professional, monochrome dengan aksen semantik (hijau = pemasukan, merah = pengeluaran).

---

Vaulta © 2026
