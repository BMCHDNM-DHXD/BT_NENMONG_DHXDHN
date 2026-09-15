// ══════════════════════════════════════════════════════════════
//  Cloudflare Worker — BT Nền Móng HUCE
//  Nhận POST từ GitHub Pages → forward tới Google Apps Script
//
//  Biến môi trường cần set trong Cloudflare dashboard:
//    GAS_URL  = https://script.google.com/macros/s/XXXX/exec
//    SECRET   = một chuỗi bí mật tùy ý (để xác thực nếu cần)
// ══════════════════════════════════════════════════════════════

const ALLOWED_ORIGINS = [
  'https://bmchdnm-dhxd.github.io',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://localhost:3000',
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age':       '86400',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    // ── Preflight ────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // ── Chỉ nhận POST ────────────────────────────────────────
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    // ── Parse body ───────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    // ── Validate fields bắt buộc ─────────────────────────────
    const required = ['hoTen', 'maSV', 'stt', 'lop', 'chapterId', 'score'];
    for (const f of required) {
      if (body[f] === undefined || body[f] === null || body[f] === '') {
        return new Response(JSON.stringify({ ok: false, error: 'Missing field: ' + f }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });
      }
    }

    // ── Thêm metadata ────────────────────────────────────────
    const payload = {
      hoTen:     String(body.hoTen).trim(),
      maSV:      String(body.maSV).trim().toUpperCase(),
      stt:       Number(body.stt),
      lop:       String(body.lop),
      chapterId: String(body.chapterId),
      score:     Number(body.score),
      correct:   Number(body.correct  || 0),
      total:     Number(body.total    || 0),
      duration:  Number(body.duration || 0),
      ip:        request.headers.get('CF-Connecting-IP') || '',
      country:   request.headers.get('CF-IPCountry')     || '',
      ts:        new Date().toISOString(),
    };

    // ── Forward tới Google Apps Script ───────────────────────
    const gasUrl = env.GAS_URL;
    if (!gasUrl) {
      return new Response(JSON.stringify({ ok: false, error: 'GAS_URL not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    let gasRes;
    try {
      gasRes = await fetch(gasUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: 'GAS unreachable: ' + err.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    let gasJson;
    try {
      gasJson = await gasRes.json();
    } catch {
      gasJson = { ok: true };
    }

    return new Response(JSON.stringify(gasJson), {
      status:  gasRes.ok ? 200 : 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  },
};
