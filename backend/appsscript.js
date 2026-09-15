// ══════════════════════════════════════════════════════════════
//  Google Apps Script — BT Nền Móng HUCE
//  Dán toàn bộ file này vào Apps Script Editor, deploy as
//  "Web app" → Execute as: Me → Who has access: Anyone
//
//  Google Sheet cần có 2 sheet (tab):
//    1. "KetQua"   — ghi mỗi lần nộp bài
//    2. "DiemTong" — tổng hợp điểm cao nhất theo maSV × chapterId
// ══════════════════════════════════════════════════════════════

var SHEET_ID = ''; // ← Điền Spreadsheet ID vào đây (lấy từ URL sheet)

// ── Tên các cột trong sheet KetQua ───────────────────────────
var HEADERS_KETQUA = [
  'Thời gian', 'Họ tên', 'Mã SV', 'STT', 'Lớp',
  'Bài tập', 'Điểm (%)', 'Đúng', 'Tổng câu', 'Thời làm (s)',
  'IP', 'Quốc gia'
];

// ── Tên các cột trong sheet DiemTong ─────────────────────────
var HEADERS_DIEMTONG = [
  'Mã SV', 'Họ tên', 'Lớp', 'STT',
  'C1-A1','C1-A2','C1-A3','C1-A4','C1-A5','C1-A6',
  'C1-B1','C1-B2','C1-B3','C1-B4','C1-B5','C1-B6',
  'C1-C1','C1-C2','C1-C3','C1-C4','C1-C5','C1-C6',
  'Cập nhật lần cuối'
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    writeKetQua(data);
    updateDiemTong(data);
    return jsonResponse({ ok: true, message: 'Đã lưu thành công' });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message }, 500);
  }
}

// ── Ghi vào sheet KetQua ─────────────────────────────────────
function writeKetQua(d) {
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = getOrCreateSheet(ss, 'KetQua', HEADERS_KETQUA);

  sheet.appendRow([
    d.ts        || new Date().toISOString(),
    d.hoTen     || '',
    d.maSV      || '',
    d.stt       || '',
    d.lop       || '',
    d.chapterId || '',
    d.score     || 0,
    d.correct   || 0,
    d.total     || 0,
    d.duration  || 0,
    d.ip        || '',
    d.country   || '',
  ]);
}

// ── Cập nhật DiemTong (chỉ giữ điểm cao nhất) ────────────────
function updateDiemTong(d) {
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = getOrCreateSheet(ss, 'DiemTong', HEADERS_DIEMTONG);

  var maSV      = String(d.maSV || '').trim().toUpperCase();
  var chapterId = String(d.chapterId || '');
  var score     = Number(d.score || 0);

  // Tìm cột tương ứng với chapterId
  var colIdx = HEADERS_DIEMTONG.indexOf(chapterId);
  if (colIdx < 0) return; // chapterId không có trong header → bỏ qua

  // Tìm hàng của maSV
  var data     = sheet.getDataRange().getValues();
  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toUpperCase() === maSV) {
      rowIndex = i + 1; // 1-indexed trong Sheets
      break;
    }
  }

  if (rowIndex < 0) {
    // Chưa có → tạo hàng mới
    var newRow = new Array(HEADERS_DIEMTONG.length).fill('');
    newRow[0] = maSV;
    newRow[1] = d.hoTen || '';
    newRow[2] = d.lop   || '';
    newRow[3] = d.stt   || '';
    newRow[colIdx] = score;
    newRow[HEADERS_DIEMTONG.length - 1] = new Date().toISOString();
    sheet.appendRow(newRow);
  } else {
    // Đã có → chỉ cập nhật nếu điểm mới cao hơn
    var cell     = sheet.getRange(rowIndex, colIdx + 1);
    var existing = Number(cell.getValue()) || 0;
    if (score > existing) {
      cell.setValue(score);
      sheet.getRange(rowIndex, HEADERS_DIEMTONG.length).setValue(new Date().toISOString());
    }
    // Cập nhật họ tên / lớp / stt phòng khi sai lần trước
    sheet.getRange(rowIndex, 2).setValue(d.hoTen || '');
    sheet.getRange(rowIndex, 3).setValue(d.lop   || '');
    sheet.getRange(rowIndex, 4).setValue(d.stt   || '');
  }
}

// ── Helper: lấy sheet, tạo mới nếu chưa có ──────────────────
function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    // Format header row
    var hdr = sheet.getRange(1, 1, 1, headers.length);
    hdr.setFontWeight('bold');
    hdr.setBackground('#1565C0');
    hdr.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ── Helper: trả về JSON response ─────────────────────────────
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Test thủ công (chạy từ Apps Script editor) ────────────────
function testDoPost() {
  var fake = {
    postData: {
      contents: JSON.stringify({
        hoTen: 'Nguyễn Văn Test', maSV: '2021000001',
        stt: 1, lop: 'test-class', chapterId: 'C1-A1',
        score: 87, correct: 7, total: 8, duration: 120,
        ip: '1.2.3.4', country: 'VN',
        ts: new Date().toISOString()
      })
    }
  };
  Logger.log(doPost(fake).getContent());
}
