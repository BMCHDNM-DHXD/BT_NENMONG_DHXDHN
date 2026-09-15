# Hướng dẫn Deploy Backend — BT Nền Móng HUCE

## Bước 1 — Tạo Google Sheet

1. Vào https://sheets.google.com → tạo spreadsheet mới
2. Đặt tên: **BT Nền Móng — Kết quả**
3. Copy **Spreadsheet ID** từ URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```
4. Không cần tạo tab thủ công — Apps Script tự tạo tab cho từng lớp khi có dữ liệu đầu tiên.

## Bước 2 — Deploy Google Apps Script

1. Trong Google Sheet: **Extensions → Apps Script**
2. Xóa hết code mặc định, dán toàn bộ nội dung `appsscript.js`
3. Điền `SHEET_ID` ở dòng 8:
   ```js
   const SHEET_ID = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"; // ví dụ
   ```
4. **Deploy → New deployment**:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy** → copy **Web app URL**
   (dạng `https://script.google.com/macros/s/XXXX/exec`)
6. Test: chạy hàm `testDoPost()` trong editor, kiểm tra tab **XD1** có thêm hàng không.

> **Mỗi lần sửa appsscript.js phải deploy lại** (New deployment hoặc Manage deployments → Edit).

## Bước 3 — Tạo KV Namespace (chặn nộp trùng)

1. Cloudflare Dashboard → **Workers & Pages → KV**
2. **Create namespace** → đặt tên: `NM_KV`
3. Ghi nhớ namespace ID để dùng ở Bước 4.

## Bước 4 — Tạo Cloudflare Worker

1. Vào https://workers.cloudflare.com → **Create Worker**
2. Đặt tên: `bt-nen-mong`
3. Xóa code mặc định, dán toàn bộ `worker.js`
4. **Settings → Variables → Add** 2 biến:

   | Variable       | Value                                            |
   |----------------|--------------------------------------------------|
   | `GAS_URL`      | Web app URL từ Bước 2                            |
   | `SECRET_TOKEN` | `NenMong_HUCE_2025#`  *(khớp với appsscript.js)* |

5. **Settings → KV Namespace Bindings → Add**:
   - Variable name: `NM_KV`
   - KV namespace: `NM_KV` *(vừa tạo ở Bước 3)*

6. **Save and Deploy** → copy **Worker URL**
   (dạng `https://bt-nen-mong.YOUR-SUBDOMAIN.workers.dev`)

> **KV hoạt động như thế nào:**
> - Khi SV nộp bài thành công → Worker ghi key `sub:maSV:chapterId` vào KV (vĩnh viễn)
> - Lần sau nộp lại → Worker thấy key đó → từ chối ngay, không tốn quota GAS
> - Rate-limit: key `rl:maSV:chapterId` tự xóa sau 5 phút

## Bước 4 — Cập nhật config.js

Mở `config.js`, điền Worker URL:
```js
window.WORKER_URL = 'https://bt-nen-mong.YOUR-SUBDOMAIN.workers.dev';
```

Rồi commit và push:
```bash
git add config.js
git commit -m "Add Worker URL"
git push
```

## Cấu trúc Google Sheet

Mỗi lớp được tự động tạo 1 tab riêng (ví dụ: **XD1**, **XD2**, **CD1**...) với các cột:

| Thời gian | Họ tên | Mã SV | STT | Lớp | Bài tập | Điểm (%) | Tổng câu | Đúng | Thời gian làm (s) | IP |
|-----------|--------|-------|-----|-----|---------|----------|----------|------|-------------------|----|

## Danh sách lớp hợp lệ

```
XD1–XD10  |  XE1, XE2, XF  |  CD1, CD2, CD3, CDS  |  TH1, TH2, TH3  |  CTT, CB
```
Thêm/xoá lớp: chỉnh `ALLOWED_CLASSES` trong `appsscript.js` **và** `CLASS_LIST` trong `config.js`.
