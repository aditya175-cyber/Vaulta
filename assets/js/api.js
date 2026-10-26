/* =============================================================
   API.JS — Fungsi pengiriman data (Fetch) ke Google Apps Script
   ============================================================= */

/**
 * Endpoint URL Google Apps Script.
 * Ganti URL ini dengan endpoint Apps Script milik Anda.
 */
const SCRIPT_URL ='https://script.google.com/macros/s/AKfycbyKJ3oAvmTa5fJzDiWGPgPujG6Q31tiILE2EixgnUtnMAWOn4FTAMVQAmuayXI-KxQu_Q/exec';

/**
 * Mengirim data transaksi ke Google Apps Script.
 *
 * Menggunakan mode `no-cors` karena Apps Script tidak mengizinkan
 * CORS dari origin file:// / localhost.  Response bersifat opaque
 * sehingga kita tidak bisa membaca body — kita anggap sukses
 * selama tidak ada network error (throw).
 *
 * @param {Object} payload
 * @param {string} payload.tanggal  – Format YYYY-MM-DD
 * @param {string} payload.jenis    – "Pemasukan" | "Pengeluaran"
 * @param {string} payload.kategori – Nama kategori
 * @param {number} payload.jumlah   – Nominal (integer)
 * @param {string} payload.keterangan – Catatan opsional
 * @returns {Promise<void>}
 */
async function submitTransaction(payload) {
  const response = await fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  // `no-cors` → opaque response (status 0, body null)
  // Jika fetch tidak throw, kita anggap berhasil.
  return response;
}

// Expose ke global scope agar bisa dipakai dari app.js
window.submitTransaction = submitTransaction;
