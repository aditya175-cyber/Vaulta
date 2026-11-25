/* Memuat components/*.html ke index.html, lalu menjalankan app.js & motion.js.
   Butuh server HTTP (Live Server, GitHub Pages, dst) — fetch tidak jalan di file://
   Splash TIDAK PERNAH macet: apa pun yang gagal, tetap tertutup paling lama beberapa detik. */
(async function () {
  // jaring pengaman: dibiarkan jalan terus, tidak pernah dibatalkan — hideSplash() aman dipanggil berkali-kali
  setTimeout(() => document.getElementById('splashScreen')?.classList.add('hidden'), 6000);

  const warn = (msg) => {
    console.error(msg);
    document.body.insertAdjacentHTML('afterbegin',
      '<div style="position:fixed;z-index:2000;left:0;right:0;top:0;padding:10px 16px;background:#fff3cd;color:#000;font:13px/1.4 sans-serif">⚠ ' + msg + '</div>');
  };

  const slots = [...document.querySelectorAll('[data-include]')];
  try {
    const parts = await Promise.all(slots.map(async (el) => {
      const res = await fetch(el.dataset.include);
      if (!res.ok) throw new Error(el.dataset.include + ' → HTTP ' + res.status);
      return res.text();
    }));
    slots.forEach((el, i) => { el.insertAdjacentHTML('afterend', parts[i]); el.remove(); });
  } catch (err) {
    warn('Komponen gagal dimuat (' + err.message + '). Jika ini di GitHub Pages, pastikan semua folder/file (termasuk huruf besar-kecilnya) sudah ter-push.');
    document.getElementById('splashScreen')?.classList.add('hidden');
    return;
  }

  for (const src of ['assets/js/app.js', 'assets/js/motion.js']) {
    try {
      await new Promise((ok, no) => {
        const s = document.createElement('script');
        s.src = src; s.onload = ok; s.onerror = () => no(new Error(src));
        document.body.append(s);
      });
    } catch (err) {
      warn('File tidak ditemukan: ' + err.message + '. Cek nama file (huruf besar-kecil) dan apakah sudah ter-push ke GitHub.');
    }
  }
})();
