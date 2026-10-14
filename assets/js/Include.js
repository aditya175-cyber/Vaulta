/* Memuat components/*.html ke index.html, lalu menjalankan app.js & motion.js.
   Butuh server lokal (mis. Live Server) — fetch tidak jalan di file:// */
(async function () {
  const slots = [...document.querySelectorAll('[data-include]')];
  try {
    const parts = await Promise.all(slots.map(async (el) => {
      const res = await fetch(el.dataset.include);
      if (!res.ok) throw new Error(el.dataset.include + ' → HTTP ' + res.status);
      return res.text();
    }));
    slots.forEach((el, i) => { el.insertAdjacentHTML('afterend', parts[i]); el.remove(); });
  } catch (err) {
    console.error('Gagal memuat komponen:', err);
    document.body.insertAdjacentHTML('afterbegin',
      '<p style="padding:24px;font:16px sans-serif">Komponen gagal dimuat. Buka lewat server lokal (mis. ekstensi Live Server), bukan klik dua kali index.html.</p>');
    document.getElementById('splashScreen')?.remove();
    return;
  }
  for (const src of ['assets/js/app.js', 'assets/js/motion.js']) {
    await new Promise((ok, no) => {
      const s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = () => no(new Error(src));
      document.body.append(s);
    });
  }
})();