/* =============================================================
   APP.JS — Dashboard logic: navigasi, form, riwayat, ekspor
   ============================================================= */

(function () {
  'use strict';

  const CATEGORIES = {
    Pemasukan:   ['Gaji', 'Investasi', 'Bonus', 'Freelance', 'Transfer'],
    Pengeluaran: ['Makanan', 'Transport', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan'],
  };

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const form = $('#financeForm');
  const inputTanggal = $('#tanggal');
  const inputKategori = $('#kategori');
  const inputJumlah = $('#jumlah');
  const inputKeterangan = $('#keterangan');
  const btnSubmit = $('#btnSubmit');
  const btnText = $('#btnText');
  const pills = $('#categoryPills');
  const searchInput = $('#searchInput');

  const SKELETON = `<li class="history-item" aria-hidden="true">
    <span class="skeleton" style="width:34px;height:34px"></span>
    <div><span class="skeleton sk-line" style="width:40%"></span><span class="skeleton sk-line" style="width:65%"></span></div>
    <span class="skeleton sk-line" style="width:84px"></span></li>`;

  let currentJenis = 'Pemasukan';
  let isSubmitting = false;
  let entries = [];
  let filter = 'all';
  let today = '';

  /* ── Init ── */
  function init() {
    const d = new Date();
    today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    inputTanggal.value = today;
    $('#dateChip').textContent = `${today.split('-').reverse().join('/')} · Sesi Aktif`;

    $$('.nav-item[data-page]').forEach((b) => b.addEventListener('click', () => navigateTo(b.dataset.page)));
    $$('.js-new').forEach((b) => b.addEventListener('click', newEntry));
    $$('.js-history').forEach((b) => b.addEventListener('click', () => navigateTo('history')));
    $$('.filter button').forEach((b) => b.addEventListener('click', () => {
      filter = b.dataset.filter;
      $$('.filter button').forEach((x) => x.classList.toggle('active', x.dataset.filter === filter));
      renderHistory();
    }));
    $$('input[name="jenis"]').forEach((r) => r.addEventListener('change', () => {
      currentJenis = r.value;
      renderPills();
    }));
    searchInput.addEventListener('input', renderHistory);
    $('#btnExport').addEventListener('click', exportCsv);
    form.addEventListener('submit', (e) => { e.preventDefault(); submitForm(); });
    bindAmountInput(inputJumlah);

    const setNet = () => { $('#netStatus').textContent = navigator.onLine ? 'ONLINE' : 'OFFLINE'; };
    window.addEventListener('online', setNet);
    window.addEventListener('offline', setNet);
    setNet();

    renderPills();
    loadSession();
    loadChart();
    setTimeout(() => {
      $('#splashScreen').classList.add('hidden'); // selaras durasi loader
      document.dispatchEvent(new Event('vaulta:ready')); // memulai scroll reveal (motion.js)
    }, 2000);
  }

  /* ── Navigasi ── */
  function navigateTo(page) {
    $$('.nav-item[data-page]').forEach((i) => i.classList.toggle('active', i.dataset.page === page));
    $$('.page-section').forEach((s) => s.classList.toggle('active', s.id === `page-${page}`));
    window.scrollTo(0, 0);
  }

  function newEntry() {
    navigateTo('dashboard');
    $('#quickInput').scrollIntoView({ block: 'start' });
    inputJumlah.focus({ preventScroll: true });
  }

  /* ── Kategori ── */
  function renderPills() {
    pills.innerHTML = '';
    inputKategori.value = '';
    CATEGORIES[currentJenis].forEach((cat) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pill';
      btn.textContent = cat;
      btn.addEventListener('click', () => {
        const wasActive = btn.classList.contains('active');
        pills.querySelectorAll('.active').forEach((p) => p.classList.remove('active'));
        btn.classList.toggle('active', !wasActive);
        inputKategori.value = wasActive ? '' : cat;
      });
      pills.appendChild(btn);
    });
  }

  /* ── Format angka ── */
  function bindAmountInput(el) {
    el.addEventListener('input', () => {
      const raw = el.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
      el.value = formatNumber(raw);
    });
    el.addEventListener('focus', () => setTimeout(() => el.select(), 0));
  }
  function formatNumber(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function parseAmount(f)  { return parseInt(f.replace(/\./g, ''), 10) || 0; }
  function formatRupiah(n) { return 'Rp ' + formatNumber(String(n)); }

  /* ── Submit ── */
  async function submitForm() {
    if (isSubmitting) return;

    const tanggal = inputTanggal.value;
    const kategori = inputKategori.value.trim();
    const jumlah = parseAmount(inputJumlah.value);
    const keterangan = inputKeterangan.value.trim();

    if (!tanggal) { showToast('error', 'Oops!', 'Silakan pilih tanggal.'); inputTanggal.focus(); return; }
    if (!kategori) { showToast('error', 'Oops!', 'Silakan pilih atau ketik kategori.'); inputKategori.focus(); return; }
    if (jumlah <= 0) { showToast('error', 'Oops!', 'Masukkan jumlah yang valid.'); inputJumlah.focus(); return; }

    const payload = { tanggal, jenis: currentJenis, kategori, jumlah, keterangan };
    setLoading(true);

    try {
      await window.submitTransaction(payload);
      showToast('success', 'Tersimpan!', `${payload.jenis} "${kategori}" sebesar ${formatRupiah(jumlah)} berhasil dicatat.`);
      entries.unshift({ ...payload, id: Date.now() });
      sessionStorage.setItem('vaulta_session', JSON.stringify(entries));
      updateSummary();
      renderHistory();
      renderPills(); // juga mengosongkan kategori
      inputJumlah.value = '';
      inputKeterangan.value = '';
      loadChart(); // sinkronkan grafik dengan Sheets
    } catch (err) {
      renderHistory(); // buang skeleton
      showToast('error', 'Gagal!', 'Tidak dapat mengirim data. Periksa koneksi Anda.');
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  }

  function setLoading(loading) {
    isSubmitting = loading;
    btnSubmit.disabled = loading;
    btnText.innerHTML = loading ? '<div class="spinner"></div> Menyimpan…' : '+ Simpan Transaksi';
    // placeholder shimmer selama menunggu; diganti oleh renderHistory()
    if (loading) $$('.history').forEach((ul) => {
      ul.querySelector('.empty')?.remove();
      ul.insertAdjacentHTML('afterbegin', SKELETON);
    });
  }

  /* ── Grafik (Chart.js · data dari Google Sheets via doGet) ──
     Memakai SCRIPT_URL dari api.js; jangan dideklarasikan ulang di sini. */
  let financeChart = null;

  async function loadChart() {
    const note = $('#chartNote');
    const showNote = (msg) => { if (!financeChart) { note.hidden = false; note.textContent = msg; } };

    if (typeof Chart === 'undefined') { showNote('Library grafik gagal dimuat. Periksa koneksi internet.'); return; }

    try {
      const res = await fetch(SCRIPT_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const c = data && data.chart;
      if (!c || !Array.isArray(c.labels) || !Array.isArray(c.pemasukan) || !Array.isArray(c.pengeluaran)) {
        throw new Error('Format data grafik tidak sesuai');
      }

      // Sisa saldo seluruh data di Sheets (bukan hanya sesi ini)
      const saldo = Number(data.summary && data.summary.saldo);
      if (Number.isFinite(saldo)) $('#totalSaldo').textContent = (saldo < 0 ? '- ' : '') + formatRupiah(Math.abs(Math.round(saldo)));
      note.hidden = true;

      // Chart.js error jika canvas dipakai dua kali → perbarui data saja
      if (financeChart) {
        financeChart.data.labels = c.labels;
        financeChart.data.datasets[0].data = c.pemasukan;
        financeChart.data.datasets[1].data = c.pengeluaran;
        financeChart.update();
        return;
      }

      const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
      const forest = css('--forest');
      const ink = css('--ink');
      Chart.defaults.font.family = css('--font');
      Chart.defaults.color = ink;

      financeChart = new Chart($('#financeChart').getContext('2d'), {
        type: 'line',
        data: {
          labels: c.labels,
          datasets: [
            {
              label: 'Pemasukan',
              data: c.pemasukan,
              borderColor: forest,
              backgroundColor: 'rgba(40, 90, 72, 0.12)',
              fill: true,
              tension: 0.4, // kurva halus
              pointRadius: 4,
              pointBackgroundColor: forest,
            },
            {
              label: 'Pengeluaran',
              data: c.pengeluaran,
              borderColor: ink,
              borderDash: [6, 4], // garis putus-putus: tidak bergantung pada warna saja
              backgroundColor: 'rgba(9, 20, 19, 0.06)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointStyle: 'rectRot',
              pointBackgroundColor: ink,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: matchMedia('(prefers-reduced-motion: reduce)').matches ? false : { duration: 400, easing: 'easeOutQuart' },
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { position: 'top', labels: { font: { size: 12, weight: '500' } } },
            tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatRupiah(Math.round(ctx.parsed.y))}` } },
          },
          scales: {
            x: { grid: { display: false } }, // tanpa garis grid vertikal
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(64, 138, 113, 0.25)' },
              ticks: { callback: (value) => 'Rp ' + Number(value).toLocaleString('id-ID') },
            },
          },
        },
      });
    } catch (err) {
      console.error('Gagal memuat data grafik:', err);
      showNote('Grafik belum bisa dimuat dari Google Sheets.');
    }
  }

  /* ── Ringkasan ── */
  function updateSummary() {
    const sum = (list, jenis) => list.filter((e) => e.jenis === jenis).reduce((t, e) => t + e.jumlah, 0);
    const todays = entries.filter((e) => e.tanggal === today);
    const inc = sum(todays, 'Pemasukan');
    const exp = sum(todays, 'Pengeluaran');

    animateValue($('#todayIncome'), inc);
    animateValue($('#todayExpense'), exp);
    animateValue($('#todayBalance'), inc - exp);

    const totalIn = sum(entries, 'Pemasukan');
    const totalOut = sum(entries, 'Pengeluaran');
    const pct = totalIn + totalOut ? Math.round((totalIn / (totalIn + totalOut)) * 100) : 0;
    $('#flowPct').textContent = `${pct}%`;
    $('#flowBar').style.width = `${pct}%`;
    $('#totalIn').textContent = formatRupiah(totalIn);
    $('#totalOut').textContent = formatRupiah(totalOut);

    $('#sessionCount').textContent = entries.length;
    const badge = $('#navBadge');
    badge.hidden = entries.length === 0;
    badge.textContent = entries.length;
  }

  function animateValue(el, target) {
    const dur = 400;
    const start = performance.now();
    const txt = el.textContent;
    const from = (txt.trim().startsWith('-') ? -1 : 1) * (parseInt(txt.replace(/\D/g, ''), 10) || 0);

    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const v = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      el.textContent = (v < 0 ? '- ' : '') + formatRupiah(Math.abs(v));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ── Riwayat ── */
  function visibleEntries() {
    const q = searchInput.value.trim().toLowerCase();
    return entries.filter((e) =>
      (filter === 'all' || e.jenis === filter) &&
      (!q || `${e.kategori} ${e.keterangan} ${e.jenis} ${e.jumlah}`.toLowerCase().includes(q)));
  }

  function renderHistory() {
    const list = visibleEntries();
    renderInto($('#historyList'), $('#historyCount'), list, 5);
    renderInto($('#historyListFull'), $('#historyCountFull'), list, 0);
  }

  function renderInto(listEl, countEl, list, limit) {
    countEl.textContent = `${list.length} entri`;
    if (list.length === 0) {
      listEl.innerHTML = `<li class="empty"><span class="empty-ic">▤</span>
        <b>Belum ada transaksi tercatat</b>Catat transaksi pertama melalui formulir Input Cepat.</li>`;
      return;
    }
    listEl.innerHTML = (limit ? list.slice(0, limit) : list).map((e) => {
      const inc = e.jenis === 'Pemasukan';
      return `<li class="history-item ${inc ? 'income' : 'expense'}">
        <span class="hi-icon"><img class="ic" src="assets/images/icons/${inc ? 'icon_income' : 'icon_production'}.svg" alt="" width="18" height="18"></span>
        <div class="hi-body">
          <div class="hi-category">${escapeHtml(e.kategori)}</div>
          <div class="hi-note">${e.keterangan ? escapeHtml(e.keterangan) : '—'}</div>
        </div>
        <span class="hi-date mono">${escapeHtml(e.tanggal)}</span>
        <span class="hi-amount">${inc ? '+' : '−'} ${formatRupiah(e.jumlah)}</span>
      </li>`;
    }).join('');
  }

  function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  /* ── Ekspor CSV ── */
  function exportCsv() {
    if (!entries.length) { showToast('error', 'Kosong', 'Belum ada transaksi untuk diekspor.'); return; }
    // awalan ' mencegah formula injection saat dibuka di Excel/Sheets
    const cell = (v) => { v = String(v); if (/^[=+\-@]/.test(v)) v = "'" + v; return `"${v.replace(/"/g, '""')}"`; };
    const rows = [['Tanggal', 'Jenis', 'Kategori', 'Jumlah', 'Keterangan'],
      ...entries.map((e) => [e.tanggal, e.jenis, e.kategori, e.jumlah, e.keterangan])];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.map((r) => r.map(cell).join(',')).join('\n')], { type: 'text/csv' }));
    a.download = `transaksi-${today}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ── Sesi ── */
  function loadSession() {
    try {
      entries = JSON.parse(sessionStorage.getItem('vaulta_session')) || [];
    } catch (_) { entries = []; }
    updateSummary();
    renderHistory();
  }

  /* ── Toast ── */
  function showToast(type, title, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${type === 'success' ? '✓' : '✕'}</div>
      <div class="toast-body">
        <div class="toast-title">${escapeHtml(title)}</div>
        <div class="toast-message">${escapeHtml(message)}</div>
      </div>`;
    $('#toastContainer').appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, 4000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();