// ═══════════════════════════════════════════════════════════════
// BT NỀN MÓNG — clo2-page.js : dựng trang bài CLO2 (dạng A/B/C) + nộp bài
// Trang gọi:  CLO2PAGE.start({ dang:'A', mode:'A', dangIdx:1 })
//   A: công thức + điền số + trắc nghiệm, phản hồi ngay · B: công thức, số phản hồi ngay, trắc nghiệm im đến khi nộp
//   C: không công thức, mọi câu là trắc nghiệm, im đến khi nộp
// Dùng pm/ANS/updateProg/regQ/cf/revealAllMCQ của engine.js (không override).
// Phụ thuộc: config.js, engine.js, clo2.js
// ═══════════════════════════════════════════════════════════════
(function () {
'use strict';
var C = window.CLO2, CFG, EX_NUM, sv, S, MCQ = {}, CHAPTER_ID, PREVIEW = false;

function shuffled(arr, r) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

// opts: [{label, ok}] — xáo thứ tự rồi dựng câu trắc nghiệm
function mcqHtml(id, title, opts, expl, r) {
  var o = shuffled(opts, r), ci = 0;
  o.forEach(function (x, i) { if (x.ok) ci = i; });
  MCQ[id] = ci; ANS['mcq_' + id] = null;
  var keys = 'ABCD', h = '<div class="mw"><div class="mq"><span class="mn">' + id + '</span>' + title + '</div>';
  o.forEach(function (x, i) {
    h += '<div class="mo" id="mo-' + id + '-' + i + '" onclick="pm(\'' + id + '\',' + i + ',' + ci + ')">' +
      '<span class="mk">' + keys[i] + '</span><span>' + x.label + '</span></div>';
  });
  return h + '<div class="me" id="me-' + id + '">✓ ' + expl + '</div></div>';
}

function fillIn(it) {
  regQ(it.id, it.ans, it.tol);
  return '<div class="mw"><div class="mq"><span class="mn">' + it.id + '</span>' + it.q + '</div>' +
    '<div class="fill"><input class="fi" id="f-' + it.id + '" inputmode="decimal" placeholder="…" onchange="cf(\'' + it.id + '\')" onkeydown="if(event.key===\'Enter\')cf(\'' + it.id + '\')">' +
    (it.unit ? '<span class="unit">' + it.unit + '</span>' : '') +
    '<button class="btn btn-sub" style="border:1px solid var(--brd)" onclick="cf(\'' + it.id + '\')">Kiểm tra</button>' +
    '<span class="fb" id="fb-' + it.id + '"></span></div></div>';
}

function formulaBox() {
  var h = '<div class="fml"><div class="ftl">Công thức (giáo trình Nền móng V08)</div><ul>';
  S.formulas.forEach(function (t) { h += '<li>' + t + '</li>'; });
  return h + '</ul></div>';
}
function alphaBox() {
  var h = '<div class="fml"><div class="ftl">Bảng hệ số ứng suất α dưới tâm móng băng (z tính từ đáy móng)</div><table class="atb"><tr><td>z/b</td>';
  S.table.forEach(function (x) { h += '<td>' + x[0] + '</td>'; });
  h += '</tr><tr><td>α</td>';
  S.table.forEach(function (x) { h += '<td>' + x[1] + '</td>'; });
  return h + '</tr></table></div>';
}

function render() {
  var exIdx = EX_NUM - 1, dang = CFG.dang;
  S = C.gen(sv.stt, exIdx, CFG.dangIdx, seededRng);
  var r = seededRng(sv.stt * 1009 + exIdx * 100 + CFG.dangIdx + 500);   // rng riêng cho thứ tự đáp án
  MCQ = {}; ANS = {};
  var h = '';
  h += '<div class="de-bai"><div class="de-hd">Đề bài — ' + C.EX_LBL[exIdx] + '</div><div class="de-body"><p>' + S.intro + '</p></div></div>';
  if (dang !== 'C') h += formulaBox();
  if (S.table) h += alphaBox();

  var hdA = true, hdB = true;
  S.items.forEach(function (it) {
    var isB = it.id.charAt(0) === 'b';
    if (!isB && hdA) { h += '<div class="grp-hd">Ý a — Tính toán' + (dang === 'C' ? ' (chọn đáp án)' : ' (điền số)') + '</div>'; hdA = false; }
    if (isB && hdB) { h += '<div class="grp-hd">Ý b — Phân tích kết quả</div>'; hdB = false; }
    if (it.type === 'mcq') {
      h += mcqHtml(it.id, it.q, it.opts.map(function (t, i) { return { label: t, ok: i === it.ci }; }), it.expl, r);
    } else if (dang === 'C') {
      var no = C.numOpts(it, r);
      h += mcqHtml(it.id, it.q, no.map(function (x) { return { label: C.f(x.v, it.dec) + (it.unit ? ' ' + it.unit : ''), ok: x.ok }; }), it.expl, r);
    } else h += fillIn(it);
  });
  h += '<div id="sol"></div>';

  document.getElementById('ex-content').innerHTML = h;
  updateProg();
  var lbl = C.EX_LBL[exIdx];
  document.getElementById('hdr-title').textContent = 'CLO2 · Dạng ' + dang + EX_NUM + ' — ' + lbl;
  document.getElementById('snav-info').textContent = 'Dạng ' + dang + ' · Bài ' + dang + EX_NUM + ' / 6 · ' + lbl;
  var pv = EX_NUM > 1 ? '<a class="btn btn-nav" href="' + nav(EX_NUM - 1) + '">← ' + dang + (EX_NUM - 1) + '</a>' : '';
  var nx = EX_NUM < 6 ? '<a class="btn btn-nav" href="' + nav(EX_NUM + 1) + '">' + dang + (EX_NUM + 1) + ' →</a>' : '';
  document.getElementById('prev-link').innerHTML = pv; document.getElementById('next-link').innerHTML = nx;
}
function nav(n) { return 'C2-' + CFG.dang + '.html?ex=' + n + (PREVIEW ? '&preview=1' : ''); }

// Lời giải từng câu, hiện sau khi nộp
function showSolutions() {
  var h = '<div class="grp-hd">Lời giải</div><div class="sol">';
  S.items.forEach(function (it) {
    h += '<div class="sol-i"><span class="mn">' + it.id + '</span> ' + it.q + '<br><span class="sol-a">' + it.expl +
      (it.type === 'num' ? ' → <b>' + C.f(it.ans, it.dec) + (it.unit ? ' ' + it.unit : '') + '</b>' : '') + '</span></div>';
  });
  document.getElementById('sol').innerHTML = h + '</div>';
}

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
    showSolutions();
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

window.CLO2PAGE = {
  start: function (cfg) {
    CFG = cfg; CHAPTER_ID = 'C2-' + cfg.dang; window.FEEDBACK_MODE = cfg.mode;
    var sp = new URLSearchParams(location.search);
    EX_NUM = Math.max(1, Math.min(6, parseInt(sp.get('ex')) || 1));
    PREVIEW = sp.get('preview') === '1' && (!location.hostname || location.hostname === 'localhost' || location.hostname === '127.0.0.1');   // chỉ xem thử trên máy
    if (PREVIEW) window.CHAPTER_SCHEDULE = Object.assign({}, window.CHAPTER_SCHEDULE, { c2: { active: true } });
    var page = initPage('c2');
    if (!page) return;
    sv = getSV();
    if (!page.isOpen && !PREVIEW) return;
    if (PREVIEW) document.querySelector('.sv-bar-txt').insertAdjacentText('beforeend', ' · PREVIEW (không nộp)');
    document.getElementById('hdr-sv').textContent = sv.maSV;
    render();
  }
};
})();
