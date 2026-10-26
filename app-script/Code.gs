/**
 * VAULTA — Google Apps Script (web app)
 *
 * Kolom sheet:
 *   A tanggal | B jenis | C kategori | D jumlah | E keterangan | F sisa saldo (saldo berjalan)
 *
 * Langkah awal : jalankan setupSheet() SEKALI dari editor Apps Script.
 *   Ini juga memperbaiki kolom "sisa saldo" yang tadinya #ERROR!.
 * Setelah ubah kode: Deploy > Manage deployments > Edit > Version: New version > Deploy.
 *   (tanpa versi baru, web app tetap memakai kode lama)
 */

var HEADERS = ['tanggal', 'jenis', 'kategori', 'jumlah', 'keterangan', 'sisa saldo'];
var CHART_DAYS = 7;                  // jumlah hari terakhir yang ditampilkan di grafik
var RUPIAH_FORMAT = '"Rp "#,##0';

function getSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Teks yang diawali = + - @ akan dianggap rumus oleh Sheets → beri awalan ' agar tetap teks
function safe_(v) {
  v = String(v == null ? '' : v);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

/**
 * Saldo berjalan per baris. rows = [[jenis, jumlah], ...] urut dari atas.
 * Baris rusak (jenis/jumlah tidak valid) tidak mengubah saldo dan ditulis kosong.
 */
function runningSaldo_(rows) {
  var saldo = 0;
  return rows.map(function (r) {
    var jumlah = Number(r[1]);
    if ((r[0] !== 'Pemasukan' && r[0] !== 'Pengeluaran') || !isFinite(jumlah)) return [''];
    saldo += r[0] === 'Pemasukan' ? jumlah : -jumlah;
    return [saldo];
  });
}

/**
 * Isi ulang seluruh kolom F sebagai ANGKA (bukan rumus), jadi tidak bisa #ERROR!.
 * shortcut: hitung ulang semua baris tiap simpan, cukup sampai puluhan ribu baris;
 * di atas itu ganti dengan menghitung dari saldo baris terakhir saja.
 */
function recalcSaldo_(sheet) {
  var last = sheet.getLastRow();
  if (last < 2) return;
  var n = last - 1;
  var rows = sheet.getRange(2, 2, n, 3).getValues().map(function (r) { return [r[0], r[2]]; }); // B (jenis) & D (jumlah)
  var out = sheet.getRange(2, 6, n, 1);
  out.clearContent().setValues(runningSaldo_(rows)).setNumberFormat(RUPIAH_FORMAT);
}

function writeHeader_(sheet) {
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

/** Jalankan sekali: pasang header, format Rupiah, dan isi "sisa saldo" untuk semua data lama. */
function setupSheet() {
  var sheet = getSheet_();
  var first = String(sheet.getRange(1, 1).getValue()).toLowerCase();
  if (sheet.getLastRow() > 0 && first !== 'tanggal') sheet.insertRowBefore(1); // data lama belum punya header
  writeHeader_(sheet);
  sheet.getRange('D2:D').setNumberFormat(RUPIAH_FORMAT);
  recalcSaldo_(sheet);
}

/** Cek cepat tanpa Sheets: jalankan dari editor, error jika hitungan salah. */
function selfTest() {
  var r = runningSaldo_([['Pemasukan', 100], ['Pengeluaran', 30], ['x', 5], ['Pengeluaran', 'abc'], ['Pengeluaran', 80]]);
  if (JSON.stringify(r) !== '[[100],[70],[""],[""],[-10]]') throw new Error('runningSaldo_ salah: ' + JSON.stringify(r));
  Logger.log('OK');
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  var locked = lock.tryLock(10000);

  try {
    if (!locked) throw new Error('Server sibuk, coba lagi.');

    var sheet = getSheet_();

    // Membaca data baik dari JSON maupun Form Data biasa
    var data = (e.postData && e.postData.contents) ? JSON.parse(e.postData.contents) : e.parameter;

    var jenis = data.jenis;
    var jumlah = Number(data.jumlah);
    if (jenis !== 'Pemasukan' && jenis !== 'Pengeluaran') throw new Error('Jenis tidak valid');
    if (!isFinite(jumlah) || jumlah <= 0) throw new Error('Jumlah tidak valid');

    var tz = Session.getScriptTimeZone();
    var tanggal = /^\d{4}-\d{2}-\d{2}$/.test(data.tanggal || '')
      ? data.tanggal
      : Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');

    if (sheet.getLastRow() === 0) writeHeader_(sheet); // sheet kosong → buat header dulu

    sheet.appendRow([tanggal, jenis, safe_(data.kategori), jumlah, data.keterangan ? safe_(data.keterangan) : '-']);
    recalcSaldo_(sheet);

    return json_({ result: 'success' });

  } catch (error) {
    return json_({ result: 'error', error: String(error && error.message ? error.message : error) });
  } finally {
    if (locked) lock.releaseLock();
  }
}

/** Dipakai grafik & kartu saldo di website: { summary, chart } */
function doGet() {
  try {
    var sheet = getSheet_();
    var tz = Session.getScriptTimeZone();
    var rows = sheet.getLastRow() > 0 ? sheet.getRange(1, 1, sheet.getLastRow(), 5).getValues() : [];

    var perDay = {};
    var totalMasuk = 0;
    var totalKeluar = 0;

    rows.forEach(function (r) {
      var jenis = r[1];
      var jumlah = Number(r[3]);
      if ((jenis !== 'Pemasukan' && jenis !== 'Pengeluaran') || !isFinite(jumlah)) return; // lewati header / baris rusak

      var isDate = Object.prototype.toString.call(r[0]) === '[object Date]'; // Sheets mengubah "2026-10-14" jadi tanggal
      var key = isDate ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd') : String(r[0]);
      var day = perDay[key] || (perDay[key] = { masuk: 0, keluar: 0 });

      if (jenis === 'Pemasukan') { day.masuk += jumlah; totalMasuk += jumlah; }
      else { day.keluar += jumlah; totalKeluar += jumlah; }
    });

    var labels = [];
    var pemasukan = [];
    var pengeluaran = [];
    var now = new Date();
    for (var i = CHART_DAYS - 1; i >= 0; i--) {
      var d = new Date(now.getTime() - i * 86400000);
      var k = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
      labels.push(Utilities.formatDate(d, tz, 'dd/MM'));
      pemasukan.push(perDay[k] ? perDay[k].masuk : 0);
      pengeluaran.push(perDay[k] ? perDay[k].keluar : 0);
    }

    return json_({
      summary: { totalPemasukan: totalMasuk, totalPengeluaran: totalKeluar, saldo: totalMasuk - totalKeluar },
      chart: { labels: labels, pemasukan: pemasukan, pengeluaran: pengeluaran }
    });

  } catch (error) {
    return json_({ error: String(error && error.message ? error.message : error) });
  }
}
