/* =============================================================
   APP.JS — Dashboard logic: sidebar, pages, forms, history
   ============================================================= */

(function () {
  'use strict';

  /* ── Category Presets ── */
  const CATEGORIES = {
    Pemasukan:   ['💼 Gaji', '📈 Investasi', '🎁 Bonus', '💰 Freelance', '🏦 Transfer'],
    Pengeluaran: ['🍔 Makanan', '🚗 Transport', '🛒 Belanja', '🏠 Tagihan', '🎮 Hiburan', '💊 Kesehatan'],
  };

  /* Page metadata */
  const PAGE_META = {
    dashboard: { title: 'Dashboard',         subtitle: 'Selamat datang! Ini ringkasan keuangan Anda.' },
    input:     { title: 'Input Transaksi',    subtitle: 'Catat pemasukan atau pengeluaran baru.' },
    history:   { title: 'Riwayat Transaksi',  subtitle: 'Seluruh transaksi sesi ini.' },
  };

  /* ── DOM ── */
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  // Sidebar
  const sidebar        = $('#sidebar');
  const sidebarToggle  = $('#sidebarToggle');
  const sidebarOverlay = $('#sidebarOverlay');
  const mobileMenuBtn  = $('#mobileMenuBtn');
  const pageTitle      = $('#pageTitle');
  const pageSubtitle   = $('#pageSubtitle');

  // Dashboard form
  const form            = $('#financeForm');
  const inputTanggal    = $('#tanggal');
  const inputKategori   = $('#kategori');
  const inputJumlah     = $('#jumlah');
  const inputKeterangan = $('#keterangan');
  const btnSubmit       = $('#btnSubmit');
  const btnText         = $('#btnText');
  const segCtrl         = $('#segmentedControl');
  const pillContainer   = $('#categoryPills');

  // Full form (Input page)
  const formFull            = $('#financeFormFull');
  const inputTanggalFull    = $('#tanggalFull');
  const inputKategoriFull   = $('#kategoriFull');
  const inputJumlahFull     = $('#jumlahFull');
  const inputKeteranganFull = $('#keteranganFull');
  const btnSubmitFull       = $('#btnSubmitFull');
  const btnTextFull         = $('#btnTextFull');
  const segCtrlFull         = $('#segmentedControlFull');
  const pillContainerFull   = $('#categoryPillsFull');

  // Summary
  const todayIncome   = $('#todayIncome');
  const todayExpense  = $('#todayExpense');
  const todayBalance  = $('#todayBalance');

  // History (dashboard)
  const historyList   = $('#historyList');
  const historyCount  = $('#historyCount');
  const historyEmpty  = $('#historyEmpty');

  // History (full page)
  const historyListFull  = $('#historyListFull');
  const historyCountFull = $('#historyCountFull');
  const historyEmptyFull = $('#historyEmptyFull');

  // Nav badge
  const navBadge = $('#navBadge');

  const toastContainer = $('#toastContainer');

  /* ── State ── */
  let currentJenis     = 'Pemasukan';
  let currentJenisFull = 'Pemasukan';
  let selectedPill     = null;
  let selectedPillFull = null;
  let isSubmitting     = false;
  let sessionEntries   = [];
  let currentPage      = 'dashboard';

  /* =============================================================
     INIT
     ============================================================= */
  function init() {
    setTodayDate();
    bindSidebar();
    bindNavigation();
    bindSegmentedControl();
    bindSegmentedControlFull();
    renderPills(pillContainer, currentJenis);
    renderPills(pillContainerFull, currentJenisFull);
    bindAmountInput(inputJumlah);
    bindAmountInput(inputJumlahFull);
    bindFormSubmit();
    bindFormSubmitFull();
    loadSession();
  }

  function setTodayDate() {
    const d = new Date();
    const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    inputTanggal.value = str;
    inputTanggalFull.value = str;
  }

  /* =============================================================
     SIDEBAR
     ============================================================= */
  function bindSidebar() {
    // Collapse toggle (desktop)
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      sidebarToggle.textContent = sidebar.classList.contains('collapsed') ? '›' : '‹';
      localStorage.setItem('sidebar_collapsed', sidebar.classList.contains('collapsed'));
    });

    // Restore collapsed state
    if (localStorage.getItem('sidebar_collapsed') === 'true') {
      sidebar.classList.add('collapsed');
      sidebarToggle.textContent = '›';
    }

    // Mobile menu
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.add('mobile-open');
      sidebarOverlay.classList.add('visible');
    });

    sidebarOverlay.addEventListener('click', closeMobileSidebar);
  }

  function closeMobileSidebar() {
    sidebar.classList.remove('mobile-open');
    sidebarOverlay.classList.remove('visible');
  }

  /* =============================================================
     PAGE NAVIGATION
     ============================================================= */
  function bindNavigation() {
    $$('.nav-item[data-page]').forEach((item) => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        navigateTo(page);
        closeMobileSidebar();
      });
    });
  }

  function navigateTo(page) {
    currentPage = page;

    // Update nav active state
    $$('.nav-item[data-page]').forEach((item) => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Show correct section
    $$('.page-section').forEach((s) => {
      s.classList.toggle('active', s.id === `page-${page}`);
    });

    // Update topbar
    const meta = PAGE_META[page] || {};
    pageTitle.textContent = meta.title || '';
    pageSubtitle.textContent = meta.subtitle || '';
  }

  /* =============================================================
     SEGMENTED CONTROL — Dashboard
     ============================================================= */
  function bindSegmentedControl() {
    $$('#segmentedControl input[name="jenis"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        currentJenis = radio.value;
        segCtrl.classList.toggle('pengeluaran', currentJenis === 'Pengeluaran');
        selectedPill = null;
        renderPills(pillContainer, currentJenis);
      });
    });
  }

  function bindSegmentedControlFull() {
    $$('#segmentedControlFull input[name="jenisFull"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        currentJenisFull = radio.value;
        segCtrlFull.classList.toggle('pengeluaran', currentJenisFull === 'Pengeluaran');
        selectedPillFull = null;
        renderPills(pillContainerFull, currentJenisFull);
      });
    });
  }

  /* =============================================================
     CATEGORY PILLS
     ============================================================= */
  function renderPills(container, jenis) {
    const cats = CATEGORIES[jenis] || [];
    container.innerHTML = '';

    cats.forEach((cat) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pill';
      btn.textContent = cat;
      btn.addEventListener('click', () => {
        const isDashboard = container === pillContainer;
        handlePillSelect(btn, cat, isDashboard);
      });
      container.appendChild(btn);
    });
  }

  function handlePillSelect(btn, cat, isDashboard) {
    const container = isDashboard ? pillContainer : pillContainerFull;
    const input = isDashboard ? inputKategori : inputKategoriFull;

    container.querySelectorAll('.pill.active').forEach((p) => p.classList.remove('active'));

    if (isDashboard) {
      if (selectedPill === cat) {
        selectedPill = null;
        input.value = '';
      } else {
        btn.classList.add('active');
        selectedPill = cat;
        input.value = cat.replace(/^[^\w\s]+\s*/, '');
      }
    } else {
      if (selectedPillFull === cat) {
        selectedPillFull = null;
        input.value = '';
      } else {
        btn.classList.add('active');
        selectedPillFull = cat;
        input.value = cat.replace(/^[^\w\s]+\s*/, '');
      }
    }
  }

  /* =============================================================
     AMOUNT FORMATTING
     ============================================================= */
  function bindAmountInput(el) {
    el.addEventListener('input', () => {
      let raw = el.value.replace(/\D/g, '');
      if (raw === '') { el.value = ''; return; }
      raw = raw.replace(/^0+/, '') || '0';
      el.value = formatNumber(raw);
    });
    el.addEventListener('focus', () => setTimeout(() => el.select(), 0));
  }

  function formatNumber(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function parseAmount(f)  { return parseInt(f.replace(/\./g, ''), 10) || 0; }
  function formatRupiah(n) { return 'Rp ' + formatNumber(String(n)); }

  /* =============================================================
     FORM SUBMISSION — Dashboard quick form
     ============================================================= */
  function bindFormSubmit() {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitForm({
        tanggalEl: inputTanggal,
        jenisVal: currentJenis,
        kategoriEl: inputKategori,
        jumlahEl: inputJumlah,
        keteranganEl: inputKeterangan,
        btnEl: btnSubmit,
        btnTextEl: btnText,
        isDashboard: true,
      });
    });
  }

  function bindFormSubmitFull() {
    formFull.addEventListener('submit', (e) => {
      e.preventDefault();
      submitForm({
        tanggalEl: inputTanggalFull,
        jenisVal: currentJenisFull,
        kategoriEl: inputKategoriFull,
        jumlahEl: inputJumlahFull,
        keteranganEl: inputKeteranganFull,
        btnEl: btnSubmitFull,
        btnTextEl: btnTextFull,
        isDashboard: false,
      });
    });
  }

  async function submitForm(cfg) {
    if (isSubmitting) return;

    const tanggal    = cfg.tanggalEl.value;
    const jenis      = cfg.jenisVal;
    const kategori   = cfg.kategoriEl.value.trim();
    const jumlah     = parseAmount(cfg.jumlahEl.value);
    const keterangan = cfg.keteranganEl.value.trim();

    if (!tanggal) { showToast('error', 'Oops!', 'Silakan pilih tanggal.'); cfg.tanggalEl.focus(); return; }
    if (!kategori) { showToast('error', 'Oops!', 'Silakan pilih atau ketik kategori.'); cfg.kategoriEl.focus(); return; }
    if (!jumlah || jumlah <= 0) { showToast('error', 'Oops!', 'Masukkan jumlah yang valid.'); cfg.jumlahEl.focus(); return; }

    const payload = { tanggal, jenis, kategori, jumlah, keterangan };
    setLoading(cfg.btnEl, cfg.btnTextEl, true);

    try {
      await window.submitTransaction(payload);
      showToast('success', 'Tersimpan!', `${jenis} "${kategori}" sebesar ${formatRupiah(jumlah)} berhasil dicatat.`);

      sessionEntries.unshift({ ...payload, id: Date.now() });
      sessionStorage.setItem('vaulta_session', JSON.stringify(sessionEntries));
      updateSummary();
      renderHistory();

      // Reset
      if (cfg.isDashboard) {
        selectedPill = null;
        pillContainer.querySelectorAll('.pill.active').forEach((p) => p.classList.remove('active'));
      } else {
        selectedPillFull = null;
        pillContainerFull.querySelectorAll('.pill.active').forEach((p) => p.classList.remove('active'));
      }
      cfg.kategoriEl.value = '';
      cfg.jumlahEl.value = '';
      cfg.keteranganEl.value = '';
    } catch (err) {
      showToast('error', 'Gagal!', 'Tidak dapat mengirim data. Periksa koneksi Anda.');
      console.error('Submit error:', err);
    } finally {
      setLoading(cfg.btnEl, cfg.btnTextEl, false);
    }
  }

  function setLoading(btnEl, textEl, loading) {
    isSubmitting = loading;
    btnEl.disabled = loading;
    textEl.innerHTML = loading
      ? '<div class="spinner"></div> Menyimpan…'
      : '+ Simpan Transaksi';
  }

  /* =============================================================
     SUMMARY
     ============================================================= */
  function updateSummary() {
    const today = inputTanggal.value;
    let inc = 0, exp = 0;

    sessionEntries.forEach((e) => {
      if (e.tanggal === today) {
        if (e.jenis === 'Pemasukan')   inc += e.jumlah;
        if (e.jenis === 'Pengeluaran') exp += e.jumlah;
      }
    });

    animateValue(todayIncome, inc);
    animateValue(todayExpense, exp);
    animateValue(todayBalance, inc - exp);

    // Update nav badge
    if (sessionEntries.length > 0) {
      navBadge.style.display = '';
      navBadge.textContent = sessionEntries.length;
    } else {
      navBadge.style.display = 'none';
    }
  }

  function animateValue(el, target) {
    const dur = 400;
    const start = performance.now();
    const from = parseAmount(el.textContent.replace(/Rp\s?-?/, '').trim()) || 0;

    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (target - from) * eased);
      el.textContent = formatRupiah(Math.abs(v));
      if (target < 0 && p >= 1) el.textContent = '- ' + formatRupiah(Math.abs(target));
      if (p < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  /* =============================================================
     HISTORY
     ============================================================= */
  function renderHistory() {
    renderHistoryInto(historyList, historyCount, historyEmpty, 5);     // Dashboard: last 5
    renderHistoryInto(historyListFull, historyCountFull, historyEmptyFull, 0); // Full: all
  }

  function renderHistoryInto(listEl, countEl, emptyEl, limit) {
    const entries = limit > 0 ? sessionEntries.slice(0, limit) : sessionEntries;

    if (sessionEntries.length === 0) {
      emptyEl.style.display = '';
      countEl.textContent = '0 entri';
      return;
    }

    emptyEl.style.display = 'none';
    countEl.textContent = `${sessionEntries.length} entri`;

    const frag = document.createDocumentFragment();
    entries.forEach((entry, i) => {
      const li = document.createElement('li');
      const isIncome = entry.jenis === 'Pemasukan';
      li.className = `history-item ${isIncome ? 'income' : 'expense'}`;
      li.style.animationDelay = `${i * 0.04}s`;

      const icon = getCategoryIcon(entry.kategori, isIncome);

      li.innerHTML = `
        <div class="hi-icon">${icon}</div>
        <div class="hi-body">
          <div class="hi-category">${escapeHtml(entry.kategori)}</div>
          <div class="hi-note">${entry.keterangan ? escapeHtml(entry.keterangan) : '—'}</div>
        </div>
        <div class="hi-date">${entry.tanggal}</div>
        <div class="hi-amount">${isIncome ? '+' : '−'} ${formatRupiah(entry.jumlah)}</div>
      `;
      frag.appendChild(li);
    });

    listEl.querySelectorAll('.history-item').forEach((el) => el.remove());
    listEl.insertBefore(frag, emptyEl);
  }

  function getCategoryIcon(cat, isIncome) {
    const c = cat.toLowerCase();
    const map = {
      gaji: '💼', investasi: '📈', bonus: '🎁', freelance: '💰', transfer: '🏦',
      makanan: '🍔', transport: '🚗', belanja: '🛒', tagihan: '🏠',
      hiburan: '🎮', kesehatan: '💊',
    };
    for (const [k, v] of Object.entries(map)) if (c.includes(k)) return v;
    return isIncome ? '↗' : '↘';
  }

  function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  /* =============================================================
     SESSION
     ============================================================= */
  function loadSession() {
    const cached = sessionStorage.getItem('vaulta_session');
    if (cached) {
      try {
        sessionEntries = JSON.parse(cached);
        updateSummary();
        renderHistory();
      } catch (_) { /* ignore */ }
    }
  }

  /* =============================================================
     TOAST
     ============================================================= */
  function showToast(type, title, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${type === 'success' ? '✓' : '✕'}</div>
      <div class="toast-body">
        <div class="toast-title">${escapeHtml(title)}</div>
        <div class="toast-message">${escapeHtml(message)}</div>
      </div>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, 4000);
  }

  /* ── Boot ── */
  document.addEventListener('DOMContentLoaded', init);
})();
