// ═══════════════════════════════════════════════════════════════════
//  Google Apps Script — BT Nền Móng HUCE  (v2)
//  Nhận kết quả bài làm từ Cloudflare Worker → ghi vào Google Sheet
//  Mỗi lớp → 1 tab riêng (tên tab = classId)
//  Deploy: Ứng dụng web → Thực thi: Tôi → Truy cập: Mọi người
// ═══════════════════════════════════════════════════════════════════

const SHEET_ID     = "";                    // ← Điền Spreadsheet ID
const SECRET_TOKEN = "NenMong_HUCE_2025#";  // ← Khớp với worker.js

// ── Danh sách lớp hợp lệ ─────────────────────────────────────────
const ALLOWED_CLASSES = new Set([
  "XD1","XD2","XD3","XD4","XD5","XD6","XD7","XD8","XD9","XD10",
  "XE1","XE2","XF",
  "CD1","CD2","CD3","CDS",
  "TH1","TH2","TH3",
  "CTT","CB"
]);

// ── Header mỗi tab lớp ────────────────────────────────────────────
const HEADERS = [
  "Thời gian", "Họ tên", "Mã SV", "STT", "Lớp",
  "Bài tập", "Điểm (%)", "Tổng câu", "Đúng", "Thời gian làm (s)",
  "IP"
];

// ── doPost: nhận JSON từ Cloudflare Worker ────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Xác thực token
    if (data.token !== SECRET_TOKEN) {
      return jsonResp({ ok: false, error: "Unauthorized" });
    }

    const sheet = getOrCreateSheet(sanitize(data.lop));

    sheet.appendRow([
      new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
      sanitize(data.hoTen),
      sanitize(data.maSV),
      Number(data.stt)      || 0,
      sanitize(data.lop),
      sanitize(data.chapterId),
      Number(data.score)    || 0,
      Number(data.total)    || 0,
      Number(data.correct)  || 0,
      Number(data.duration) || 0,
      sanitize(data.ip)
    ]);

    return jsonResp({ ok: true });

  } catch (err) {
    return jsonResp({ ok: false, error: err.message });
  }
}

// ── doGet: health-check ───────────────────────────────────────────
function doGet() {
  return jsonResp({ ok: true, service: "NenMong-Results-v2" });
}

// ── Lấy tab theo classId, tự tạo nếu chưa có ─────────────────────
function getOrCreateSheet(classId) {
  if (!ALLOWED_CLASSES.has(classId)) {
    throw new Error("Lớp không hợp lệ: " + classId);
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(classId);

  if (!sheet) {
    sheet = ss.insertSheet(classId);
    sheet.appendRow(HEADERS);
    const hRange = sheet.getRange(1, 1, 1, HEADERS.length);
    hRange.setFontWeight("bold");
    hRange.setBackground("#1565c0");
    hRange.setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }

  return sheet;
}

// ── Helpers ───────────────────────────────────────────────────────
function sanitize(val) {
  if (val === undefined || val === null) return "";
  return String(val).substring(0, 200).replace(/[\r\n\t]/g, " ");
}

function jsonResp(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Test thủ công (chạy từ Apps Script editor) ────────────────────
function testDoPost() {
  const fake = {
    postData: {
      contents: JSON.stringify({
        token: "NenMong_HUCE_2025#",
        hoTen: "Nguyễn Văn Test", maSV: "2021000001",
        stt: 1, lop: "XD1", chapterId: "C1-A1",
        score: 87, correct: 7, total: 8, duration: 120,
        ip: "1.2.3.4"
      })
    }
  };
  Logger.log(doPost(fake).getContent());
}
