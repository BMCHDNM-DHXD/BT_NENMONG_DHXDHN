// ═══════════════════════════════════════════════════════════════
// BT NỀN MÓNG — clo4-page.js : dựng trang bài CLO4 (dạng A/B/C) + nộp bài
// Trang gọi:  CLO4PAGE.start({ dang:'A', mode:'A', dangIdx:1 })
// Dùng pm/ANS/updateProg/regQ/cf/revealAllMCQ của engine.js (không override).
// Phụ thuộc: config.js, engine.js, clo4.js
// ═══════════════════════════════════════════════════════════════
(function () {
'use strict';
var C = window.CLO4, CFG, EX_NUM, sv, S, MCQ = {};   // MCQ: id -> corrIdx

function shuffled(arr, r) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

// Dựng một câu trắc nghiệm; opts: [{label, ok}]; trả về HTML
function mcq(id, title, opts, expl, r) {
  var o = shuffled(opts, r), ci = 0;
  o.forEach(function (x, i) { if (x.ok) ci = i; });
  MCQ[id] = ci; ANS['mcq_' + id] = null;
  var keys = 'ABCD', h = '<div class="mw"><div class="mq"><span class="mn">' + id + '</span>' + title + '</div>';
  o.forEach(function (x, i) {
    h += '<div class="mo" id="mo-' + id + '-' + i + '" onclick="pm(\'' + id + '\',' + i + ',' + ci + ')">' +
      '<span class="mk">' + keys[i] + '</span><span>' + x.label + '</span></div>';
  });
  return h + '<div class="me" id="me-' + id + '">' + expl + '</div></div>';
}

function fillIn(q) {
  regQ(q.id, q.ans, 0);
  return '<div class="mw"><div class="mq"><span class="mn">' + q.id + '</span>' + q.q + '</div>' +
    '<div class="fill"><input class="fi" id="f-' + q.id + '" inputmode="decimal" placeholder="…" onchange="cf(\'' + q.id + '\')" onkeydown="if(event.key===\'Enter\')cf(\'' + q.id + '\')">' +
    '<button class="btn btn-sub" style="border:1px solid var(--brd)" onclick="cf(\'' + q.id + '\')">Kiểm tra</button>' +
    '<span class="fb" id="fb-' + q.id + '"></span></div></div>';
}

function refTable() {
  var rows = C.refRows(S), h = '<div class="ref"><b>Bảng yêu cầu cấu tạo — ' + C.GROUP_NAME[S.g] + '</b><table>';
  rows.forEach(function (r) { h += '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>'; });
  return h + '</table></div>';
}

function render() {
  var exIdx = EX_NUM - 1, dang = CFG.dang;
  S = C.gen(sv.stt, exIdx, CFG.dangIdx, seededRng);
  var r = seededRng(sv.stt * 1009 + exIdx * 100 + CFG.dangIdx + 500);   // rng riêng cho thứ tự đáp án
  MCQ = {}; ANS = {};
  var items = C.items(S), h = '';
  var gname = C.GROUP_NAME[S.g];

  h += '<div class="de-bai"><div class="de-hd">Đề bài — ' + gname + '</div><div class="de-body">';
  h += '<p>' + C.intro(S) + ' Bản vẽ có <b>đúng hai chỗ sai</b> về cấu tạo; mọi thông tin khác đều đúng. Kích thước tính bằng mm.</p>';
  h += C.drawSVG(S);
  h += '<ul class="legend">';
  items.forEach(function (k, i) { h += '<li><span class="cn">' + C.CIRC[i] + '</span><span>' + C.itemText(S, k) + '</span></li>'; });
  h += '</ul>';
  if (dang === 'A') h += refTable();
  if (dang === 'B') h += '<div class="hint"><b>Gợi ý:</b> một trong hai chỗ sai thuộc nhóm <b>' + C.ITEM_NAME[S.errs[0]] + '</b>.</div>';
  h += '</div></div>';

  h += '<div class="grp-hd">Ý a — Yêu cầu cấu tạo' + (dang === 'C' ? ' (chọn đáp án)' : ' (điền số)') + '</div>';
  C.A_Q(S).forEach(function (q) {
    if (dang === 'C') {
      var opts = q.opts.map(function (v) { return { label: (q.pre || '') + String(v).replace('.', ',') + (q.unit || ''), ok: v === q.ans }; });
      h += mcq(q.id, q.q, opts, '✓ ' + q.basis, r);
    } else h += fillIn(q);
  });

  h += '<div class="grp-hd">Ý b1 — Với từng mục ' + C.CIRC[0] + '–' + C.CIRC[items.length - 1] + ', chọn nhận xét đúng (có đúng 2 mục sai)</div>';
  items.forEach(function (k, i) {
    var ci = C.correctOpt(S, k);
    var opts = C.OPT[k].map(function (t, j) { return { label: t, ok: j === ci }; });
    var wrong = S.errs.indexOf(k) >= 0;
    var expl = (wrong ? '✗ Mục này sai. ' : '✓ Mục này đúng. ') + 'Căn cứ: ' + C.BASIS[k];
    h += mcq('b' + (i + 1), C.CIRC[i] + ' ' + C.itemText(S, k), opts, expl, r);
  });

  h += '<div class="grp-hd">Ý b2 — Hậu quả</div>';
  var ck = C.consequenceKey(S);
  var pool = C.consKeys(S).filter(function (k) { return S.errs.indexOf(k) < 0; });
  pool = shuffled(pool, r).slice(0, 3);
  var hopts = [{ label: C.CONSEQ[ck], ok: true }].concat(pool.map(function (k) { return { label: C.CONSEQ[k], ok: false }; }));
  h += mcq('b' + (items.length + 1), 'Hậu quả nào là của <b>một trong hai chỗ sai có trên hình</b>?', hopts,
    '✓ Chỗ sai ' + C.CIRC[items.indexOf(ck)] + ' (' + C.ITEM_NAME[ck] + '): ' + C.CONSEQ[ck] +
    ' Mục về kích thước bản đế là yêu cầu cấu tạo thuần, không hỏi hậu quả.', r);

  document.getElementById('ex-content').innerHTML = h;
  updateProg();
  var lbl = C.EX_LBL[exIdx] + (exIdx === 5 ? ' · ' + gname : '');
  document.getElementById('hdr-title').textContent = 'CLO4 · Dạng ' + dang + EX_NUM + ' — ' + lbl;
  document.getElementById('snav-info').textContent = 'Dạng ' + dang + ' · Bài ' + dang + EX_NUM + ' / 6 · ' + lbl;
  var pv = EX_NUM > 1 ? '<a class="btn btn-nav" href="' + nav(EX_NUM - 1) + '">← ' + dang + (EX_NUM - 1) + '</a>' : '';
  var nx = EX_NUM < 6 ? '<a class="btn btn-nav" href="' + nav(EX_NUM + 1) + '">' + dang + (EX_NUM + 1) + ' →</a>' : '';
  document.getElementById('prev-link').innerHTML = pv; document.getElementById('next-link').innerHTML = nx;
}
function nav(n) { return 'C4-' + CFG.dang + '.html?ex=' + n + (PREVIEW ? '&preview=1' : ''); }

function toast(m, c) { var t = document.getElementById('toast'); t.textContent = m; t.className = 'toast show ' + (c || ''); setTimeout(function () { t.classList.remove('show'); }, 3000); }

// Thứ tự doSubmit theo CLAUDE.md: guard → ngưỡng → sv/trùng → revealAllMCQ → chấm → disable → POST
window.doSubmit = function () {
  if (window._nm_submitting) return;
  window._nm_submitting = true;
  var vals = Object.values(ANS), total = vals.length;
  var attempted = vals.filter(function (v) { return v !== null; }).length;
  var attPct = total > 0 ? Math.round(attempted / total * 100) : 0, minPct = window.MIN_ATTEMPT_PCT || 80;
  if (attPct < minPct) { window._nm_submitting = false; toast('Cần làm ít nhất ' + minPct + '% — hiện ' + attPct + '%', 'warn-t'); return; }
  if (!sv || !sv.maSV) { window._nm_submitting = false; toast('Chưa đăng nhập', 'err-t'); return; }
  var subKey = 'nm_sub_' + CHAPTER_ID + EX_NUM + '_' + sv.maSV;
  if (localStorage.getItem(subKey)) { window._nm_submitting = false; toast('Đã nộp bài này rồi!', 'warn-t'); return; }
  revealAllMCQ();
  var correct = Object.values(ANS).filter(function (v) { return v === true; }).length;
  var scorePct = total > 0 ? Math.round(correct / total * 100) : 0;
  var btn = document.getElementById('sub-btn');
  btn.disabled = true; btn.innerHTML = 'Đang nộp...';
  var done = function () {
    localStorage.setItem(subKey, JSON.stringify({ score: scorePct, ts: Date.now() }));
    btn.innerHTML = 'Đã nộp · ' + scorePct + '%'; toast('Nộp thành công! Điểm: ' + scorePct + '%', 'ok-t');
  };
  if (PREVIEW) { done(); toast('PREVIEW — chưa gửi lên máy chủ. Điểm: ' + scorePct + '%', 'warn-t'); localStorage.removeItem(subKey); return; }
  fetch(window.WORKER_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hoTen: sv.hoTen, maSV: sv.maSV, stt: sv.stt, lop: sv.lop, chapterId: CHAPTER_ID + EX_NUM,
      score: scorePct, correct: correct, total: total, duration: 0 })
  }).then(function (r) { return r.json(); }).then(function (d) {
    if (d && d.ok) done(); else throw new Error((d && d.error) || 'Lỗi server');
  }).catch(function (e) {
    window._nm_submitting = false; btn.disabled = false; btn.innerHTML = 'Nộp bài'; toast('Lỗi: ' + e.message, 'err-t');
  });
};

var CHAPTER_ID, PREVIEW = false;
window.CLO4PAGE = {
  start: function (cfg) {
    CFG = cfg; CHAPTER_ID = 'C4-' + cfg.dang; window.FEEDBACK_MODE = cfg.mode;
    var sp = new URLSearchParams(location.search);
    EX_NUM = Math.max(1, Math.min(6, parseInt(sp.get('ex')) || 1));
    PREVIEW = sp.get('preview') === '1' && (!location.hostname || location.hostname === 'localhost' || location.hostname === '127.0.0.1');   // chỉ xem thử trên máy, không mở trên Pages
    if (PREVIEW) window.CHAPTER_SCHEDULE = Object.assign({}, window.CHAPTER_SCHEDULE, { c4: { active: true } });  // xem thử khi CLO4 chưa mở
    var page = initPage('c4');          // chuyển về đăng nhập nếu chưa có sv; khóa nếu chương chưa mở
    if (!page) return;
    sv = getSV();
    if (!page.isOpen && !PREVIEW) return;
    if (PREVIEW) document.querySelector('.sv-bar-txt').insertAdjacentText('beforeend', ' · PREVIEW (không nộp)');
    document.getElementById('hdr-sv').textContent = sv.maSV;
    render();
  }
};
})();
