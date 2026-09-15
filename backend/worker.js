// ═══════════════════════════════════════════════════════════════════
//  Cloudflare Worker — BT Nền Móng HUCE  (v2)
//  Nhận POST từ GitHub Pages → xác thực → forward tới Google Apps Script
//
//  Biến môi trường (Settings → Variables trong Cloudflare dashboard):
//    GAS_URL       = https://script.google.com/macros/s/XXXX/exec
//    SECRET_TOKEN  = NenMong_HUCE_2025#   (khớp với appsscript.js)
// ═══════════════════════════════════════════════════════════════════

const ALLOWED_ORIGINS = [
  "https://bmchdnm-dhxd.github.io",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://localhost:3000",
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin":  allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age":       "86400",
  };
}

function resp(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    // ── Preflight ────────────────────────────────────────────
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return resp({ ok: false, error: "Method not allowed" }, 405, origin);
    }

    // ── Parse body ───────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return resp({ ok: false, error: "Invalid JSON" }, 400, origin);
    }

    // ── Validate bắt buộc ────────────────────────────────────
    const required = ["hoTen", "maSV", "stt", "lop", "chapterId", "score"];
    for (const f of required) {
      if (body[f] === undefined || body[f] === null || body[f] === "") {
        return resp({ ok: false, error: "Missing: " + f }, 400, origin);
      }
    }

    // ── Build payload gửi tới GAS (thêm token + metadata) ────
    const payload = {
      token:     env.SECRET_TOKEN,          // GAS kiểm tra token này
      hoTen:     String(body.hoTen).trim(),
      maSV:      String(body.maSV).trim().toUpperCase(),
      stt:       Number(body.stt),
      lop:       String(body.lop),
      chapterId: String(body.chapterId),
      score:     Number(body.score),
      correct:   Number(body.correct  || 0),
      total:     Number(body.total    || 0),
      duration:  Number(body.duration || 0),
      ip:        request.headers.get("CF-Connecting-IP") || "",
    };

    // ── Forward tới Google Apps Script ───────────────────────
    const gasUrl = env.GAS_URL;
    if (!gasUrl) {
      return resp({ ok: false, error: "GAS_URL not configured" }, 500, origin);
    }

    let gasRes;
    try {
      gasRes = await fetch(gasUrl, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
        redirect: "follow",
      });
    } catch (err) {
      return resp({ ok: false, error: "GAS unreachable: " + err.message }, 502, origin);
    }

    let gasJson;
    try   { gasJson = await gasRes.json(); }
    catch { gasJson = { ok: true }; }

    return resp(gasJson, gasRes.ok ? 200 : 502, origin);
  },
};
