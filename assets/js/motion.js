/* =============================================================
   MOTION.JS — scroll reveal, header shrink, indikator nav, magnetic
   Semua efek mati otomatis jika pengguna memilih "reduce motion".
   ============================================================= */
(function () {
  'use strict';

  const $$ = (s) => document.querySelectorAll(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. Indikator navigasi (spring) ── */
  function placeIndicators() {
    $$('[data-indicator]').forEach((box) => {
      const ind = box.querySelector('.nav-indicator');
      const active = box.querySelector('.nav-item.active');
      if (!ind || !active) return;
      ind.style.setProperty('--x', active.offsetLeft + 'px');
      ind.style.setProperty('--y', active.offsetTop + 'px');
      ind.style.setProperty('--w', active.offsetWidth + 'px');
      ind.style.setProperty('--h', active.offsetHeight + 'px');
    });
  }
  const syncNav = () => requestAnimationFrame(placeIndicators);

  placeIndicators();
  // aktifkan transisi setelah posisi awal terpasang (tanpa meluncur dari 0)
  requestAnimationFrame(() => $$('[data-indicator]').forEach((b) => b.classList.add('anim')));
  document.addEventListener('click', (e) => { if (e.target.closest('.nav-item, .js-new, .js-history')) syncNav(); });
  addEventListener('resize', syncNav);
  if (document.fonts) document.fonts.ready.then(placeIndicators); // lebar teks berubah setelah font termuat

  /* ── 2. Header: elevasi + mengecil saat scroll ── */
  const topbar = document.querySelector('.topbar');
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      topbar.classList.toggle('scrolled', scrollY > 8);
      ticking = false;
    });
  }, { passive: true });

  /* ── 3. Scroll reveal (stagger per kelompok yang muncul bersamaan) ── */
  const STAGGER = 60;   // ms, standard cascade
  const MAX_STEPS = 5;  // total delay ≤ 300ms
  let revealStarted = false;

  function startReveal() {
    if (revealStarted) return;
    revealStarted = true;
    const items = $$('[data-reveal]');
    if (!('IntersectionObserver' in window) || reduce) { items.forEach((el) => el.classList.add('in')); return; }

    const io = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((e, i) => {
        const el = e.target;
        el.style.transitionDelay = Math.min(i, MAX_STEPS) * STAGGER + 'ms';
        el.classList.add('in');
        // delay hanya untuk reveal; bersihkan agar hover tidak ikut tertunda
        el.addEventListener('transitionend', () => { el.style.transitionDelay = ''; }, { once: true });
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    items.forEach((el) => io.observe(el));
  }
  // mulai setelah splash tertutup (app.js memicu event ini); fallback jika terlewat
  document.addEventListener('vaulta:ready', startReveal, { once: true });
  setTimeout(startReveal, 3000);

  /* ── 4. Magnetic button (hanya mouse/trackpad) ── */
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const RADIUS = 80;   // px dari tepi tombol
    const PULL = 0.25;   // seberapa kuat tarikan
    const MAX = 6;       // px
    const buttons = [...$$('.btn-primary')];
    const clamp = (v) => Math.max(-MAX, Math.min(MAX, v));
    let frame = 0;

    addEventListener('pointermove', (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        buttons.forEach((b) => {
          const r = b.getBoundingClientRect();
          if (!r.width) return; // tersembunyi (mis. sidebar di mobile)
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          const near = Math.abs(dx) < r.width / 2 + RADIUS && Math.abs(dy) < r.height / 2 + RADIUS;
          b.style.translate = near ? `${clamp(dx * PULL)}px ${clamp(dy * PULL)}px` : '';
        });
      });
    }, { passive: true });
  }
})();