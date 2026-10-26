/* =============================================================
   API.JS — Semua komunikasi ke Google Apps Script (wajib login)
   ============================================================= */

/** Endpoint URL Google Apps Script (deployment web app). */
const SCRIPT_URL ='https://script.google.com/macros/s/AKfycbyKJ3oAvmTa5fJzDiWGPgPujG6Q31tiILE2EixgnUtnMAWOn4FTAMVQAmuayXI-KxQu_Q/exec';

const TOKEN_KEY = 'vaulta_token';

/**
 * Kirim aksi ke Apps Script lewat POST text/plain (tanpa preflight CORS, balasan bisa dibaca).
 * Aksi: login | logout | add | data. Token disisipkan otomatis.
 * Jika token ditolak server → event "vaulta:logout" agar app.js menampilkan halaman login.
 */
async function api(action, data = {}) {
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...data, action, token: localStorage.getItem(TOKEN_KEY) || '' }),
  });
  const out = await res.json();
  if (out.error === 'auth') document.dispatchEvent(new Event('vaulta:logout'));
  if (out.error) throw new Error(out.error);
  return out;
}

window.api = api;
window.submitTransaction = (payload) => api('add', payload);
