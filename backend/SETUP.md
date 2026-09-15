# Hướng dẫn Deploy Backend

## Bước 1 — Tạo Google Sheet

1. Vào https://sheets.google.com → tạo spreadsheet mới
2. Đặt tên: **BT Nền Móng — Kết quả**
3. Copy **Spreadsheet ID** từ URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

## Bước 2 — Deploy Google Apps Script

1. Trong Google Sheet: **Extensions → Apps Script**
2. Xóa hết code mặc định, dán toàn bộ nội dung `appsscript.js` vào
3. Điền `SHEET_ID` ở dòng đầu:
   ```js
   var SHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms'; // ví dụ
   ```
4. **Deploy → New deployment**:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy** → copy **Web app URL** (dạng `https://script.google.com/macros/s/XXXX/exec`)
6. Test: chạy hàm `testDoPost()` trong editor, kiểm tra sheet có thêm hàng không

## Bước 3 — Tạo Cloudflare Worker

1. Vào https://workers.cloudflare.com → **Create Worker**
2. Đặt tên worker: `bt-nen-mong`
3. Xóa code mặc định, dán toàn bộ `worker.js` vào
4. **Settings → Variables → Add variable**:
   ```
   GAS_URL = [Web app URL từ bước 2]
   ```
5. **Save and Deploy**
6. Copy **Worker URL** (dạng `https://bt-nen-mong.YOUR-SUBDOMAIN.workers.dev`)

## Bước 4 — Cập nhật config.js

Mở `config.js` và điền Worker URL:
```js
window.WORKER_URL = 'https://bt-nen-mong.YOUR-SUBDOMAIN.workers.dev';
```

Commit và push lên GitHub:
```bash
git add config.js
git commit -m "Add Cloudflare Worker URL"
git push
```

## Kiểm tra hoạt động

Vào trang web, đăng nhập, làm bài và nộp → kiểm tra:
- Google Sheet tab **KetQua**: có hàng mới
- Google Sheet tab **DiemTong**: cột điểm tương ứng được cập nhật
