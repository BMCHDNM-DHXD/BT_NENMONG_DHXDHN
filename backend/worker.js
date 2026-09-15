// ═══════════════════════════════════════════════════════════════════
//  worker.js  –  Cloudflare Worker  —  BT Nền Móng HUCE  (v3)
//  Proxy giữa GitHub Pages frontend và Google Apps Script
//
//  Cloudflare Dashboard → Settings → Variables & Secrets:
//    GAS_URL        = https://script.google.com/macros/s/AKf.../exec
//    SECRET_TOKEN   = NenMong_HUCE_2025#   (khớp appsscript.js)
//
//  Cloudflare Dashboard → Workers KV → tạo namespace "NM_KV"
//    → Bind vào Worker với tên biến: NM_KV
//    (dùng cho chặn nộp trùng + rate-limit)
// ═══════════════════════════════════════════════════════════════════

const ALLOWED_ORIGINS = [
  "https://bmchdnm-dhxd.github.io",
  "http://127.0.0.1",
  "http://localhost",
  "null"                // file:// kéo thả test local
];

// Chặn spam: tối đa 5 lần nộp trong 5 phút (cùng maSV + bài tập)
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW   = 300;  // giây

// Chỉ forward đúng các field này tới GAS — loại bỏ field lạ
const ALLOWED_FIELDS = new Set([
  "hoTen", "maSV", "stt", "lop", "chapterId",
  "score", "total", "correct", "duration"
]);

// Phải khớp với ALLOWED_CLASSES trong appsscript.js
const ALLOWED_CLASSES = new Set([
  "XD1","XD2","XD3","XD4","XD5","XD6","XD7","XD8","XD9","XD10",
  "XE1","XE2","XF",
  "CD1","CD2","CD3","CDS",
  "TH1","TH2","TH3",
  "CTT","CB"
]);

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "null";

    // ── Preflight ────────────────────────────────────────────
    if (request.method === "OPTIONS") return preflight(origin);

    if (request.method === "GET") {
      return corsResp({ ok: true, service: "NenMong-Results-v2", status: "online" }, 200, origin);
    }

    if (request.method !== "POST") {
      return corsResp({ ok: false, error: "Method not allowed" }, 405, origin);
    }

    // Chặn origin lạ
    if (!ALLOWED_ORIGINS.some(o => origin.startsWith(o))) {
      return corsResp({ ok: false, error: "Forbidden origin" }, 403, origin);
    }

    // ── Parse body ───────────────────────────────────────────
    let body;
    try { body = await request.json(); }
    catch {
      return corsResp({ ok: false, error: "Invalid JSON" }, 400, origin);
    }

    // ── Validate field bắt buộc ──────────────────────────────
    const required = ["hoTen", "maSV", "stt", "lop", "chapterId", "score", "total", "correct"];
    for (const f of required) {
      if (body[f] === undefined || body[f] === null || body[f] === "") {
        return corsResp({ ok: false, error: "Missing field: " + f }, 400, origin);
      }
    }

    // ── Sanity checks — chặn payload vô lý ───────────────────
    const score   = Number(body.score);
    const total   = Number(body.total);
    const correct = Number(body.correct);
    const stt     = Number(body.stt);

    if (isNaN(score)   || score < 0   || score > 100)    return corsResp({ ok: false, error: "Invalid score"   }, 400, origin);
    if (isNaN(total)   || total <= 0  || total > 500)     return corsResp({ ok: false, error: "Invalid total"   }, 400, origin);
    if (isNaN(correct) || correct < 0 || correct > total) return corsResp({ ok: false, error: "Invalid correct" }, 400, origin);
    if (isNaN(stt)     || stt < 1     || stt > 500)       return corsResp({ ok: false, error: "Invalid stt"     }, 400, origin);

    // Mã SV: 6–12 chữ số
    if (!/^\d{6,12}$/.test(String(body.maSV))) {
      return corsResp({ ok: false, error: "Invalid maSV format (6-12 digits)" }, 400, origin);
    }

    // Lớp phải nằm trong danh sách
    if (!ALLOWED_CLASSES.has(String(body.lop))) {
      return corsResp({ ok: false, error: "Invalid lop: " + body.lop }, 400, origin);
    }

    // ── Chặn nộp trùng (maSV + chapterId, vĩnh viễn) ─────────
    if (env.NM_KV) {
      const subKey = `sub:${body.maSV}:${body.chapterId}`;
      const already = await env.NM_KV.get(subKey);
      if (already) {
        return corsResp(
          { ok: false, error: "Bạn đã nộp bài này rồi." }, 409, origin
        );
      }
    }

    // ── Rate-limit: chặn spam liên tiếp ──────────────────────
    if (env.NM_KV) {
      const rlKey = `rl:${body.maSV}:${body.chapterId}`;
      const count = parseInt(await env.NM_KV.get(rlKey) || "0");
      if (count >= RATE_LIMIT_REQUESTS) {
        return corsResp(
          { ok: false, error: "Quá nhiều lần nộp. Thử lại sau 5 phút." }, 429, origin
        );
      }
      ctx.waitUntil(
        env.NM_KV.put(rlKey, String(count + 1), { expirationTtl: RATE_LIMIT_WINDOW })
      );
    }

    // ── Lọc field, thêm IP + token ────────────────────────────
    const payload = {};
    for (const [k, v] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(k)) payload[k] = v;
    }
    payload.ip    = request.headers.get("CF-Connecting-IP") || "unknown";
    payload.token = env.SECRET_TOKEN;

    // ── Forward tới Google Apps Script ────────────────────────
    let gasResp;
    try {
      gasResp = await fetch(env.GAS_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
        redirect: "follow",
      });
    } catch (err) {
      return corsResp({ ok: false, error: "GAS unreachable: " + err.message }, 502, origin);
    }

    let gasData;
    try   { gasData = await gasResp.json(); }
    catch { gasData = { ok: gasResp.ok };   }

    // ── Đánh dấu "đã nộp" CHỈ khi GAS xác nhận thành công ────
    // → nếu GAS lỗi, SV vẫn có thể thử lại
    if (gasData.ok && env.NM_KV) {
      const subKey = `sub:${body.maSV}:${body.chapterId}`;
      ctx.waitUntil(
        env.NM_KV.put(subKey, JSON.stringify({ score, ts: Date.now() }))
        // Không có expirationTtl → lưu vĩnh viễn
      );
    }

    return corsResp(gasData, gasResp.ok ? 200 : 502, origin);
  }
};

// ── CORS helpers ───────────────────────────────────────────────────
function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin":  ALLOWED_ORIGINS.some(o => origin.startsWith(o)) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age":       "86400",
  };
}
function corsResp(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) }
  });
}
function preflight(origin) {
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}
