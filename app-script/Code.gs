/**
 * VAULTA — Google Apps Script (web app)
 *
 * Kolom sheet:
 *   A Tanggal | B Jenis | C Kategori | D Jumlah | E Keterangan | F Saldo (sisa saldo berjalan)
 *
 * Langkah awal : jalankan setupSheet() SEKALI dari editor Apps Script.
 * Setelah ubah kode: Deploy > Manage deployments > Edit > Version: New version > Deploy.
 *   (tanpa versi baru, web app tetap memakai kode lama)
 */

var HEADERS = ['Tanggal', 'Jenis', 'Kategori', 'Jumlah', 'Keterangan', 'Saldo'];
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

// Saldo baris ini = saldo baris di atasnya ± jumlah (header "Saldo" dihitung 0 oleh N())
function setSaldoFormula_(sheet, row) {
  sheet.getRange(row, 6).setFormula(
    '=N(F' + (row - 1) + ')+IF(B' + row + '="Pemasukan",D' + row + ',-D' + row + ')'
  );
}

function writeHeader_(sheet) {
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

/** Jalankan sekali: pasang header, rumus Saldo untuk data lama, dan format Rupiah. */
function setupSheet() {
  var sheet = getSheet_();
  var first = String(sheet.getRange(1, 1).getValue()).toLowerCase();
  if (sheet.getLastRow() > 0 && first !== 'tanggal') sheet.insertRowBefore(1); // data lama belum punya header
  writeHeader_(sheet);

  var last = sheet.getLastRow();
  for (var r = 2; r <= last; r++) setSaldoFormula_(sheet, r);

  sheet.getRange('D2:D').setNumberFormat(RUPIAH_FORMAT);
  sheet.getRange('F2:F').setNumberFormat(RUPIAH_FORMAT);
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
    setSaldoFormula_(sheet, sheet.getLastRow());

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