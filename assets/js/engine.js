// ═══════════════════════════════════════════════════════════════
// BT NỀN MÓNG — engine.js  v1.0
// Thư viện dùng chung: PRNG, phân loại đất, chấm điểm, SVG trụ
// ═══════════════════════════════════════════════════════════════

// ── Làm tròn ──────────────────────────────────────────────────
function r1(v){ return Math.round(v * 10) / 10; }
function r2(v){ return Math.round(v * 100) / 100; }
function r3(v){ return Math.round(v * 1000) / 1000; }

// ── PRNG seeded (Mulberry32) ──────────────────────────────────
// Cùng seed → cùng chuỗi số ngẫu nhiên mỗi lần
function seededRng(seed) {
  var s = seed >>> 0;
  return function() {
    s = (s + 0x6D2B79F5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Session sinh viên ─────────────────────────────────────────
var SV_KEY = 'nm_sv_v1';

function setSV(data) {
  try {
    sessionStorage.setItem(SV_KEY, JSON.stringify(data));
    // Tương thích CLO2 (C2-A/B/C đọc khóa cũ 'ncm_sv' với name/classId)
    sessionStorage.setItem('ncm_sv', JSON.stringify({
      name: data.hoTen, maSV: data.maSV, stt: data.stt, classId: data.lop
    }));
  } catch(e){}
}

function getSV() {
  try { return JSON.parse(sessionStorage.getItem(SV_KEY)); } catch(e){ return null; }
}

// ── Khởi tạo trang chương ─────────────────────────────────────
// Trả về { sv, stt, isOpen } hoặc null nếu chưa đăng nhập
function initPage(chId) {
  var sv = getSV();
  if (!sv) {
    var root = window.location.pathname.indexOf('chuong-') >= 0 ? '../' : '';
    window.location.href = root + 'index.html';
    return null;
  }

  // Hiển thị info SV
  ['sv-name','sv-meta','sv-stt','sv-lop'].forEach(function(id){
    var el = document.getElementById(id);
    if (!el) return;
    if (id === 'sv-name') el.textContent = sv.hoTen;
    else if (id === 'sv-meta') el.textContent = sv.maSV + ' · ' + sv.lop;
    else if (id === 'sv-stt') el.textContent = sv.stt;
    else if (id === 'sv-lop') el.textContent = sv.lop;
  });

  // Kiểm tra lịch
  var cfg = window.CHAPTER_SCHEDULE && window.CHAPTER_SCHEDULE[chId];
  var now = new Date();
  var isOpen = !cfg || (cfg.active !== false &&
    (!cfg.open  || new Date(cfg.open)  <= now) &&
    (!cfg.close || new Date(cfg.close) >= now));

  if (!isOpen) {
    var main = document.querySelector('main');
    if (main) main.innerHTML = '<div style="text-align:center;padding:80px 20px;color:#546E7A">'
      + '<div style="font-size:52px;margin-bottom:16px">🔒</div>'
      + '<h2 style="margin-bottom:8px">Chương chưa mở</h2>'
      + '<p>Giảng viên chưa mở nội dung này. Vui lòng kiểm tra lại sau.</p></div>';
  }

  return { sv: sv, stt: parseInt(sv.stt) || 1, isOpen: isOpen };
}

// ── Theo dõi tiến độ ─────────────────────────────────────────
var ANS = {};

function updateProg() {
  var vals = Object.values(ANS);
  var total    = vals.length;
  var attempted = vals.filter(function(v){ return v !== null; }).length;
  var pct   = total > 0 ? Math.round(attempted / total * 100) : 0;
  var pfill = document.getElementById('pfill');
  var ptxt  = document.getElementById('ptxt');
  var hprog = document.getElementById('hprog');
  if (pfill) pfill.style.width = pct + '%';
  if (ptxt)  ptxt.textContent  = attempted + '/' + total + ' (' + pct + '%)';
  if (hprog) hprog.textContent = attempted + ' / ' + total;
}

// ── Đăng ký và chấm ô điền số ────────────────────────────────
// Khi load trang: regQ('id', answerValue, tolerance)
// Khi SV bấm ✓: cf('id') hoặc cf('id', answer, tol) inline
var _Q = {};  // { id: { ans, tol } }

function regQ(id, ans, tol) {
  _Q[id]   = { ans: parseFloat(ans), tol: parseFloat(tol) || 0 };
  ANS[id]  = null;
  updateProg();
}

function cf(id, ans, tol) {
  var rec = _Q[id];
  var answer    = (ans !== undefined) ? parseFloat(ans) : (rec ? rec.ans : NaN);
  var tolerance = (tol !== undefined) ? parseFloat(tol) : (rec ? rec.tol : 0);
  var inp = document.getElementById('f-' + id);
  var fb  = document.getElementById('fb-' + id);
  if (!inp) return;
  var val = parseFloat(inp.value.replace(',', '.'));
  if (isNaN(val)) return;
  var effTol = Math.max(tolerance, Math.abs(answer) * 0.02, 0.005);
  var ok = Math.abs(val - answer) <= effTol;
  inp.className = 'fi ' + (ok ? 'ok' : 'no');
  if (fb) fb.textContent = ok ? '✓' : '✗ Đáp án: ' + answer;
  ANS[id] = ok;
  updateProg();
}

// ── MCQ ────────────────────────────────────────────────────────
// window.FEEDBACK_MODE: 'A' (full), 'B' (no explain, no reveal), 'C' (silent until submit)
var _MCQ_DONE    = {};
var _MCQ_CORRECT = {};  // { name: correctIdx } — dùng để reveal sau submit

function pm(name, picked, correct) {
  _MCQ_CORRECT[name] = correct;
  _MCQ_DONE[name] = picked;  // lưu lựa chọn mới nhất (cho revealAllMCQ)

  var mode = window.FEEDBACK_MODE || 'A';
  var opts = document.querySelectorAll('[id^="mo-' + name + '-"]');

  if (mode === 'A') {
    opts.forEach(function(el, i) {
      if (i === picked) el.className = 'mo ' + (i === correct ? 'ok' : 'no');
      else if (i === correct) el.className = 'mo rok';
      else el.className = 'mo';
      el.setAttribute('data-picked', i === picked ? '1' : '0');
    });
    var exp = document.getElementById('me-' + name);
    if (exp) exp.className = 'me show ' + (picked === correct ? 'ok-e' : 'no-e');
  } else {
    opts.forEach(function(el, i) {
      el.className = i === picked ? 'mo sel' : 'mo';
      el.setAttribute('data-picked', i === picked ? '1' : '0');
    });
  }

  ANS['mcq_' + name] = (picked === correct);
  updateProg();
}

// Gọi sau khi submit (Dạng B/C) để tiết lộ kết quả
function revealAllMCQ() {
  Object.keys(_MCQ_DONE).forEach(function(name) {
    var correct = _MCQ_CORRECT[name];
    var picked  = _MCQ_DONE[name];
    if (correct === undefined || picked === undefined) return;
    var opts = document.querySelectorAll('[id^="mo-' + name + '-"]');
    opts.forEach(function(el, i) {
      if (i === picked) el.className = 'mo ' + (i === correct ? 'ok' : 'no');
      else if (i === correct) el.className = 'mo rok';
      else el.className = 'mo';
    });
    var exp = document.getElementById('me-' + name);
    if (exp) exp.className = 'me show ' + (picked === correct ? 'ok-e' : 'no-e');
  });
}

// ── Collapse / Expand ─────────────────────────────────────────
function tog(id) {
  var bd = document.getElementById('bd-' + id);
  var cv = document.getElementById('cv-' + id);
  if (!bd) return;
  var open = bd.classList.contains('open');
  bd.className = 'exbd' + (open ? '' : ' open');
  var hd = bd.previousElementSibling;
  if (hd && hd.classList.contains('exhd')) hd.className = 'exhd' + (open ? '' : ' open');
  if (cv) cv.className = 'ti ti-chevron-right echv' + (open ? '' : ' open');
}

// ── Phân loại đất dính ────────────────────────────────────────
function classifyDinh(w, wL, wP) {
  var A = wL - wP;
  var B = r2((w - wP) / A);
  var ten;
  if (A > 17)     ten = 'Sét';
  else if (A >= 7) ten = 'Sét pha';
  else             ten = 'Cát pha';

  var tt, tot, trung;
  if      (B > 1.00) { tt = 'Chảy';      tot=false; trung=false; }
  else if (B > 0.75) { tt = 'Dẻo chảy'; tot=false; trung=false; }
  else if (B > 0.50) { tt = 'Dẻo mềm';  tot=false; trung=true;  }
  else if (B > 0.25) { tt = 'Dẻo cứng'; tot=true;  trung=false; }
  else if (B > 0.00) { tt = 'Nửa cứng'; tot=true;  trung=false; }
  else               { tt = 'Cứng';     tot=true;  trung=false; }

  var icon = tot ? '✅' : (trung ? '⚠' : '❌');
  var cls  = tot ? 'tot' : (trung ? 'tb' : 'yeu');
  return { A: A, B: B, ten: ten, trangThai: tt, tot: tot, trung: trung, icon: icon, cls: cls };
}

// ── Phân loại đất rời theo NSPT ───────────────────────────────
function classifyNSPT(nspt) {
  var tt, tot;
  if      (nspt < 4)  { tt='Rất rời';  tot=false; }
  else if (nspt < 10) { tt='Rời';      tot=false; }
  else if (nspt < 30) { tt='Chặt vừa'; tot=true;  }
  else if (nspt < 50) { tt='Chặt';     tot=true;  }
  else                { tt='Rất chặt'; tot=true;  }
  return { trangThai: tt, tot: tot, icon: tot ? '✅' : '❌', cls: tot ? 'tot' : 'yeu' };
}

// ── Phân loại đất rời theo qc ─────────────────────────────────
function classifyQc(qc) {
  var tt, tot;
  if      (qc < 4)  { tt='Rất rời/Rời'; tot=false; }
  else if (qc < 12) { tt='Chặt vừa';    tot=true;  }
  else if (qc < 20) { tt='Chặt';         tot=true;  }
  else              { tt='Rất chặt';     tot=true;  }
  return { trangThai: tt, tot: tot, icon: tot ? '✅' : '❌', cls: tot ? 'tot' : 'yeu' };
}

// ── Sinh số liệu CLO1 theo pattern và Dạng ───────────────────
// patternIdx: 1-6 → 'T-T-T-T','X-T-T-T','T-X-T-T','X-X-T-T','T-T-X-T','X-X-X-T'
// dangIdx: 1=A, 2=B, 3=C
var C1_PATTERNS = ['T-T-T-T','X-T-T-T','T-X-T-T','X-X-T-T','T-T-X-T','X-X-X-T'];

function genC1ByPattern(stt, patternIdx, dangIdx) {
  var seed = stt * 1009 + patternIdx * 100 + (dangIdx || 1);
  var rng = seededRng(seed);
  var pattern = C1_PATTERNS[(patternIdx - 1) % 6];

  var L1x = (pattern[0] === 'X');
  var L2x = (pattern[2] === 'X');
  var L3x = (pattern[4] === 'X');

  // Lớp 1 — đất dính
  var A1  = 18 + Math.round(rng() * 12);
  var wP1 = 18 + Math.round(rng() * 9);
  var wL1 = wP1 + A1;
  // Biên chừa lề cho sai số làm tròn w: lớp T có B ≤ 0,44 (dẻo cứng trở lên); lớp X có B ≥ 0,80 (dẻo chảy/chảy); không sinh dẻo mềm.
  var B1  = r2(L1x ? (0.80 + rng() * 0.31) : (0.04 + rng() * 0.40));
  var w1  = Math.round(wP1 + B1 * A1);
  var h1  = r1((L2x && !L1x ? 4.0 : 2.5) + rng() * (L2x && !L1x ? 2.0 : 3.5));  // T-X-T-T: L1 dày ≥ 4 m để móng nông còn khoảng cách tới đỉnh L2

  // Lớp 2 — đất dính
  var A2  = 17 + Math.round(rng() * 13);
  var wP2 = 19 + Math.round(rng() * 10);
  var wL2 = wP2 + A2;
  var B2  = r2(L2x ? (0.80 + rng() * 0.31) : (0.03 + rng() * 0.40));
  var w2  = Math.round(wP2 + B2 * A2);
  var h2  = r1(3.0 + rng() * (L3x ? 1.5 : 4.5));  // T-T-X-T: L1+L2 mỏng để L3 rời nằm trong vùng ảnh hưởng của móng nông

  // Lớp 3 — đất rời, NSPT
  var nspt3 = L3x ? (2 + Math.round(rng() * 4)) : (15 + Math.round(rng() * 27));
  var h3    = r1(3.0 + rng() * 4.0);
  var cat3  = ['Cát hạt nhỏ','Cát hạt trung'][Math.floor(rng() * 2)];

  // Lớp 4 — đất rời, qc, luôn tốt
  var qc4   = r1(14 + rng() * 14);
  var cat4  = ['Cát hạt trung','Cát hạt thô'][Math.floor(rng() * 2)];

  // Tải trọng
  var nNho = 200 + Math.round(rng() * 150);
  var nTb  = 500 + Math.round(rng() * 400);
  var nLon = 1500 + Math.round(rng() * 1000);

  var cl1 = classifyDinh(w1, wL1, wP1);
  var cl2 = classifyDinh(w2, wL2, wP2);
  var cl3 = classifyNSPT(nspt3);
  var cl4 = classifyQc(qc4);

  return {
    layers: [
      { idx:1, h:h1, w:w1, wL:wL1, wP:wP1, type:'dinh', tenDat:cl1.ten, trangThai:cl1.trangThai, tot:cl1.tot, A:cl1.A, B:cl1.B, icon:cl1.icon, cls:cl1.cls },
      { idx:2, h:h2, w:w2, wL:wL2, wP:wP2, type:'dinh', tenDat:cl2.ten, trangThai:cl2.trangThai, tot:cl2.tot, A:cl2.A, B:cl2.B, icon:cl2.icon, cls:cl2.cls },
      { idx:3, h:h3, nspt:nspt3, type:'roi', tenDat:cat3, trangThai:cl3.trangThai, tot:cl3.tot, icon:cl3.icon, cls:cl3.cls },
      { idx:4, h:null, qc:qc4, type:'roi', tenDat:cat4, trangThai:cl4.trangThai, tot:cl4.tot, icon:cl4.icon, cls:cl4.cls }
    ],
    loads: { nho: nNho, tb: nTb, lon: nLon },
    pattern: pattern,
    patternIdx: patternIdx,
    dangIdx: dangIdx,
    seed: seed
  };
}

// ── MCQ phương án móng (4 option đa dạng, 1 đúng) ────────────
// Trả về { correct: idx, opts: [{text, explain}] }
function getFoundationMCQ(pattern, loadLevel, seed) {
  // Ngưỡng tải (kN/m băng): nhỏ < 400 · trung bình 400–1000 · lớn > 1000.
  // Quy ước đất: T = B ≤ 0,50 (dẻo cứng trở lên) hoặc cát chặt vừa trở lên; X = B > 0,75 (dẻo chảy/chảy) hoặc cát rời.
  var DB = {
    'T-T-T-T': {
      nho: { correct:0, opts: [
        { t:'Móng đơn hoặc móng băng nông đặt trên L1', e:'✅ Đúng! T-T-T-T, tải nhỏ (< 400 kN/m) → đất đều tốt, móng đơn/băng nông trên L1 là kinh tế nhất, không cần giải pháp phức tạp hơn.' },
        { t:'Cọc đóng/ép xuyên L1-L2 vào cát L3',       e:'❌ Sai. Cọc quá tốn kém khi đất tốt + tải nhỏ. Không cần vượt qua các lớp tốt để cắm vào cát.' },
        { t:'Móng bè kết hợp cải tạo đất nền L1',        e:'❌ Sai. Cải tạo đất không cần thiết vì L1 đã tốt. Móng bè dùng khi tải lớn phân bố rộng hoặc đất yếu.' },
        { t:'Cọc khoan nhồi D ≥ 800 mm cắm sâu vào L4',  e:'❌ Sai. Cọc nhồi dành cho công trình tải rất lớn. T-T-T-T + tải nhỏ hoàn toàn không cần đến.' }
      ]},
      tb: { correct:1, opts: [
        { t:'Móng băng đơn một phương, bề rộng đáy nhỏ như tải nhỏ', e:'❌ Sai. Tải trung bình (400–1000 kN/m) → bề rộng đáy cần lớn hơn nhiều; phải mở rộng đáy bằng băng giao thoa hoặc bè để áp lực đáy không vượt SCT nền.' },
        { t:'Móng băng giao thoa hoặc móng bè nông trên L1/L2', e:'✅ Đúng! T-T-T-T, tải trung bình → tăng diện tích đáy bằng móng băng giao thoa hoặc bè đặt trong L1/L2 tốt. Kinh tế, hợp lý.' },
        { t:'Cọc ngắn đặt nổi trong L1-L2',                e:'❌ Sai. Đất nông đã tốt nên cọc không cần thiết, tốn kém hơn móng băng giao thoa/bè nông.' },
        { t:'Cọc khoan nhồi cắm sâu vào L4 cát thô',       e:'❌ Sai. Quá mức cần thiết. Đất tốt + tải trung bình xử lý được bằng móng băng giao thoa/bè nông.' }
      ]},
      lon: { correct:2, opts: [
        { t:'Móng bè dày 1,5–2,0 m đặt toàn diện',         e:'❌ Sai. Tải lớn (> 1000 kN/m) → áp lực đáy bè nông vẫn lớn, vùng ứng suất lan sâu, lún lớn. Cọc truyền tải xuống lớp chặt sâu hợp lý hơn.' },
        { t:'Móng băng mở rộng đến 3–4 m',                  e:'❌ Sai. Móng băng giới hạn SCT bởi lớp đất nông. Tải lớn cần truyền sâu xuống L3/L4.' },
        { t:'Cọc đóng/ép ngắn cắm vào cát chặt L3/L4',      e:'✅ Đúng! T-T-T-T, tải lớn → cọc đóng/ép ngắn (xuyên L1-L2 vào L3/L4 cát chặt) là kinh tế và đảm bảo SCT.' },
        { t:'Cọc khoan nhồi D = 1,2 m cắm 40 m vào đá gốc', e:'❌ Sai. Quy mô này dành cho siêu cao tầng hoặc nền đặc biệt. Với đất tốt T-T-T-T là dư thừa.' }
      ]}
    },
    'X-T-T-T': {
      nho: { correct:1, opts: [
        { t:'Móng đơn nông đặt trực tiếp trong L1 dẻo chảy/chảy', e:'❌ Sai! L1 xấu (B > 0,75) → đất yếu, biến dạng lớn. Móng đặt trực tiếp trong L1 sẽ lún lớn, không đều.' },
        { t:'Xử lý nền L1 (đệm cát/đào thay khi mỏng; cọc cát, CDM khi dày) rồi đặt móng nông', e:'✅ Đúng! L1 xấu, L2-L4 tốt, tải nhỏ → không cần cọc; xử lý L1 để móng nông làm việc. L1 mỏng: đào thay bằng đệm cát; L1 dày (không đào hết được): gia cố bằng cọc cát, CDM... xuống L2 tốt.' },
        { t:'Móng bè đặt trên L1 chảy, không xử lý nền',          e:'❌ Sai. Bè trên L1 dẻo chảy/chảy không xử lý vẫn lún lớn và không đều; bè chỉ giảm áp lực đáy, không làm L1 hết yếu.' },
        { t:'Cọc dài xuyên toàn bộ 4 lớp',                        e:'❌ Sai. Chỉ L1 xấu, tải nhỏ → cọc dài tốn kém hoàn toàn không cần thiết khi L2-L4 tốt.' }
      ]},
      tb: { correct:2, opts: [
        { t:'Móng băng nông trong L1 xấu',                e:'❌ Sai. L1 xấu không đặt móng trực tiếp, dù là băng. Lún không đều và mất ổn định.' },
        { t:'Móng bè dày 2 m đặt trên L1 không xử lý',    e:'❌ Sai. Bè trên L1 xấu → áp lực đáy bè vẫn tác dụng lên đất yếu, lún lớn và không đều dù bè cứng.' },
        { t:'Cọc ngắn xuyên L1 xấu, ngàm một đoạn vào L2 tốt',  e:'✅ Đúng! L1 xấu nhưng L2-L4 tốt, tải trung bình → cọc ngắn xuyên L1, tựa vào L2 tốt. (Gia cố sâu bằng cọc cát/CDM cũng làm được nhưng với tải này cọc ngắn chắc chắn hơn.)' },
        { t:'Cọc khoan nhồi D = 1 m cắm sâu vào L4',      e:'❌ Sai. Quá mức cần thiết. Chỉ cần xuyên qua L1 vào L2 tốt là đủ cho tải trung bình.' }
      ]},
      lon: { correct:2, opts: [
        { t:'Móng bè BTCT cứng đặt trên L1',              e:'❌ Sai. L1 xấu + tải lớn → dù bè cứng đến đâu vẫn lún và không thể kiểm soát biến dạng.' },
        { t:'Cọc ngắn chỉ xuyên L1, mũi dừng ngay mặt L2 (không ngàm)',    e:'❌ Sai. Tải lớn → cần ngàm sâu vào L2 hoặc L3 để phát huy đủ SCT. Cọc dừng ngay mặt L2 không đảm bảo.' },
        { t:'Cọc xuyên L1, ngàm sâu vào L2/L3 tốt',       e:'✅ Đúng! Tải lớn + L1 xấu → cọc xuyên L1 và ngàm sâu vào L2/L3 tốt, đảm bảo SCT cọc đơn và nhóm cọc.' },
        { t:'Giằng móng siêu cứng kết hợp móng đơn nông', e:'❌ Sai. Giằng cứng không tăng SCT nền. Đặt móng nông trong L1 xấu vẫn bị lún dù có giằng.' }
      ]}
    },
    'T-X-T-T': {
      nho: { correct:0, opts: [
        { t:'Móng nông đặt trong L1 tốt, chọn kích thước đáy móng để L2 xấu đủ sức chịu tải', e:'✅ Đúng! L1 tốt-L2 xấu, tải nhỏ → đặt móng nông trong L1 (nền tự nhiên), kiểm soát kích thước đáy móng để lớp 2 xấu đủ SCT. Ứng suất vẫn lan xuống đỉnh L2 nên phải kiểm tra áp lực tại đỉnh L2; không đạt thì đổi phương án.' },
        { t:'Móng đặt trực tiếp vào L2 dẻo chảy/chảy',  e:'❌ Sai! L2 xấu (B > 0,75) → đặt móng vào L2 gây lún không đều, mất ổn định nền.' },
        { t:'Cọc ngắn xuyên L1 tốt dừng ở đầu L2 xấu',  e:'❌ Sai. Mũi cọc ở L2 xấu = cọc nổi trong đất yếu, không có SCT mũi. Phải xuyên QUA L2, không dừng Ở L2.' },
        { t:'Đào sâu đến L4, đặt móng đơn vào cát chặt', e:'❌ Sai. Đào sâu qua L2 cho tải nhỏ không kinh tế và nguy hiểm về ổn định hố đào.' }
      ]},
      tb: { correct:1, opts: [
        { t:'Móng bè nông trong L1, ứng suất phân bố đều xuống L2 xấu', e:'❌ Sai. Tải trung bình → vùng ứng suất từ bè nông lan xuống L2 xấu với giá trị lớn, vượt SCT L2 và gây lún nén lớn không đều.' },
        { t:'Cọc xuyên qua L2 xấu, mũi cọc ngàm vào L3 tốt', e:'✅ Đúng! L2 xấu + tải trung bình → cọc phải XUYÊN HẾT L2, mũi vào L3. SCT cọc từ ma sát L1 + mũi trong L3.' },
        { t:'Cọc cát/cọc vôi gia cố nông L1 rồi đặt móng bè', e:'❌ Sai. Gia cố nông chỉ cải thiện L1 vốn đã tốt; ứng suất vẫn truyền xuống L2 xấu nằm bên dưới vùng gia cố.' },
        { t:'Cọc đặt nổi trong L2, không xuyên qua',      e:'❌ Sai. Cọc nổi trong đất yếu = cọc không có chỗ tựa → lún theo đất.' }
      ]},
      lon: { correct:2, opts: [
        { t:'Móng nông L1, ứng suất truyền qua L2 xấu xuống L3', e:'❌ Sai. Tải lớn + L2 xấu → ứng suất lớn lan sâu, L2 xấu chịu tải nặng → lún rất lớn, không kiểm soát.' },
        { t:'Cọc ngắn xuyên một phần L2, dừng giữa L2 xấu', e:'❌ Sai. Cọc phải xuyên HẾT L2. Dừng giữa L2 = mũi cọc vẫn trong đất yếu → không đảm bảo tải lớn.' },
        { t:'Cọc xuyên hết L2 xấu, ngàm sâu vào cát chặt L3/L4', e:'✅ Đúng! Tải lớn + L2 xấu → cọc xuyên toàn bộ L2, ngàm đủ sâu vào L3/L4 để phát huy cả ma sát và SCT mũi.' },
        { t:'Móng bè BTCT dày 2,5 m cứng tuyệt đối',       e:'❌ Sai. Tăng độ cứng bè không giải quyết L2 xấu dưới tải lớn.' }
      ]}
    },
    'X-X-T-T': {
      nho: { correct:0, opts: [
        { t:'Cọc ngắn xuyên L1-L2 xấu tựa vào L3 tốt, hoặc gia cố sâu (cọc cát, CDM) qua cả L1-L2', e:'✅ Đúng! Cả L1-L2 xấu → dù tải nhỏ vẫn không đặt móng nông trực tiếp được. Hai hướng hợp lý: (1) cọc ngắn xuyên 2 lớp xấu tựa L3 tốt; (2) gia cố nền sâu (cọc cát, CDM...) xuyên hết cả L1 và L2 rồi đặt móng nông. Chọn theo chiều dày L1+L2 và giá thành.' },
        { t:'Móng đơn nông đặt trong L1 xấu',                e:'❌ Sai! 2 lớp đầu đều xấu. Móng đặt trong L1/L2 không xử lý đều không đủ SCT.' },
        { t:'Gia cố riêng L1 bằng vôi, đặt móng bè trên L1', e:'❌ Sai. Chỉ gia cố L1 là chưa đủ vì L2 xấu bên dưới vẫn chịu ứng suất lan xuống và gây lún.' },
        { t:'Móng bè siêu dày trên L1+L2 xấu, không xử lý',  e:'❌ Sai. Bè trên 2 lớp xấu → lún lớn và không đều dù bè cứng. Không giải quyết bản chất.' }
      ]},
      tb: { correct:1, opts: [
        { t:'Móng bè nông trên L1 xấu, không xử lý nền',    e:'❌ Sai. Bè trên L1-L2 xấu không xử lý → lún lớn, không đều. Không giải quyết bản chất.' },
        { t:'Cọc đóng/ép xuyên qua L1-L2 xấu, mũi vào L3 tốt', e:'✅ Đúng! X-X-T-T, tải trung bình → cọc xuyên cả 2 lớp xấu. SCT cọc từ ma sát trong L3 và SCT mũi cọc.' },
        { t:'Cọc ngắn chỉ xuyên L1, dừng ở giữa L2 xấu',   e:'❌ Sai. Cọc dừng trong L2 xấu → mũi cọc vẫn trong đất yếu. Phải xuyên HẾT cả 2 lớp.' },
        { t:'Móng băng nông mở rộng bề rộng ≥ 4 m trong L1', e:'❌ Sai. Mở rộng đáy trong đất xấu chỉ làm vùng ứng suất lan sâu hơn xuống L2 xấu, không đủ SCT.' }
      ]},
      lon: { correct:2, opts: [
        { t:'Nhiều cọc ngắn tập trung, khoảng cách dày đặc', e:'❌ Sai. Nhiều cọc ngắn trong đất xấu không hiệu quả. Mỗi cọc phải đủ dài để ngàm vào đất tốt.' },
        { t:'Cọc xuyên L1, dừng giữa L2 xấu',               e:'❌ Sai. Cọc phải xuyên HẾT L2 xấu. Dừng trong L2 = mũi cọc trong đất yếu, không đảm bảo tải lớn.' },
        { t:'Cọc xuyên hết L1-L2 xấu, ngàm sâu vào L3/L4',  e:'✅ Đúng! X-X-T-T, tải lớn → cọc xuyên hết 2 lớp xấu, ngàm đủ sâu vào L3/L4 đảm bảo SCT. Chiều dài cọc = chiều dày L1+L2 + đoạn ngàm.' },
        { t:'Nền móng hộp cứng (box foundation)',            e:'❌ Sai. Móng hộp là giải pháp bù tải, ít phù hợp khi tải lớn trên 2 lớp xấu; cọc xuyên vào lớp tốt là lựa chọn hợp lý hơn.' }
      ]}
    },
    'T-T-X-T': {
      nho: { correct:0, opts: [
        { t:'Móng nông trong L1/L2 tốt, chọn kích thước đáy móng để L3 xấu đủ sức chịu tải', e:'✅ Đúng! L1-L2 tốt, L3 xấu (cát rời), tải nhỏ → móng nông trong L1/L2 (nền tự nhiên), kiểm soát kích thước đáy móng để lớp 3 xấu đủ SCT, đồng thời kiểm tra lún.' },
        { t:'Cọc ngắn dừng ngay đầu L3 xấu',                e:'❌ Sai. Mũi cọc nằm ở đầu lớp cát rời xấu → không có SCT mũi tốt. Phải xuyên QUA L3 vào L4.' },
        { t:'Móng cọc cắm vào L3 xấu (cát rời)',             e:'❌ Sai! Đặt mũi cọc vào L3 xấu = không có điểm tựa tốt. Phải xuyên qua L3 vào L4 cát chặt.' },
        { t:'Đào hết L3 xấu, đặt móng bè trên L4',          e:'❌ Sai. Đào hết L3 rất sâu, không kinh tế và nguy hiểm hố đào.' }
      ]},
      tb: { correct:1, opts: [
        { t:'Móng bè nông trong L1/L2, ứng suất phân tán xuống L3 xấu', e:'❌ Sai. Tải trung bình → vùng ứng suất từ bè nông lan xuống L3 xấu (cát rời), SCT thấp, lún lớn và không đều.' },
        { t:'Cọc xuyên qua L3 xấu (cát rời), mũi ngàm vào cát chặt L4', e:'✅ Đúng! T-T-X-T, tải trung bình → cọc XUYÊN QUA L3 cát rời, mũi vào L4 cát chặt. SCT cọc từ ma sát L1/L2 và SCT mũi trong L4.' },
        { t:'Cọc ngắn đặt nổi trong L1-L2, không xuyên L3',   e:'❌ Sai. Mũi cọc không tựa lớp chặt, tải truyền xuống L3 rời bên dưới mũi → SCT thấp và lún lớn.' },
        { t:'Móng đơn với hệ dầm giằng siêu cứng',          e:'❌ Sai. Dầm giằng cứng không tăng SCT nền hay giảm lún từ L3 xấu khi tải trung bình.' }
      ]},
      lon: { correct:2, opts: [
        { t:'Cọc ngắn xuyên L1-L2, dừng ngay đầu L3 xấu',  e:'❌ Sai. Mũi cọc ở đầu cát rời L3 → SCT mũi thấp. Tải lớn cần cọc xuyên hết L3 vào cát chặt L4.' },
        { t:'Cọc xuyên L3 nhưng chỉ ngàm nông vào L4',     e:'❌ Sai. Tải lớn → cần chiều dài ngàm vào L4 đủ lớn để phát huy đủ ma sát và SCT mũi. Ngàm nông không đảm bảo.' },
        { t:'Cọc xuyên hết L3 xấu, ngàm đủ sâu vào cát chặt L4', e:'✅ Đúng! T-T-X-T, tải lớn → cọc xuyên hoàn toàn qua L3 cát rời, ngàm đủ sâu vào L4. Chiều dài cọc phụ thuộc chiều dày L1-L3.' },
        { t:'Móng nông mở rộng đáy đến L3 hoặc L4',         e:'❌ Sai. Đặt đáy móng vào L3 xấu → không đảm bảo. Đặt vào L4 thì quá sâu, không khả thi như móng nông thông thường.' }
      ]}
    },
    'X-X-X-T': {
      nho: { correct:0, opts: [
        { t:'Cọc xuyên hết 3 lớp L1-L2-L3 xấu, mũi ngàm vào L4 tốt', e:'✅ Đúng! 3 lớp đầu đều xấu và dày → không có móng nông khả thi, gia cố xuyên cả 3 lớp không kinh tế. Dù tải nhỏ vẫn dùng cọc xuyên qua cả 3 lớp vào L4 cát chặt.' },
        { t:'Móng đơn nông trong L1 dẻo chảy/chảy',         e:'❌ Sai! 3 lớp đầu đều xấu. Móng nông trong L1/L2/L3 không xử lý đều không đủ SCT.' },
        { t:'Gia cố L1 bằng cọc vôi, dùng móng bè',         e:'❌ Sai. Chỉ gia cố L1 không đủ khi L2 và L3 bên dưới cũng xấu. Ứng suất vẫn lan xuống L2/L3 xấu.' },
        { t:'Móng băng kết hợp giằng siêu cứng',            e:'❌ Sai. Giằng cứng không giải quyết 3 lớp đất xấu. Tải vẫn truyền vào đất yếu.' }
      ]},
      tb: { correct:1, opts: [
        { t:'Cọc ngắn dừng trong L2 xấu',                   e:'❌ Sai. L3 cũng xấu → cọc dừng trong L2 xấu = mũi cọc trong đất yếu. Phải xuyên cả 3 lớp.' },
        { t:'Cọc xuyên hết L1-L2-L3 xấu, ngàm vào cát chặt L4', e:'✅ Đúng! X-X-X-T, tải trung bình → cọc xuyên cả 3 lớp xấu (chiều dài = tổng chiều dày L1-L3 + đoạn ngàm). SCT chủ yếu từ mũi cọc và ma sát trong L4 tốt.' },
        { t:'Cọc trung bình dừng ở L3 cát rời xấu',         e:'❌ Sai. Cọc dừng trong L3 xấu (cát rời) → SCT mũi thấp. Phải xuyên vào L4 cát chặt.' },
        { t:'Móng bè trên nền L1-L3 không xử lý',           e:'❌ Sai. Cả 3 lớp xấu → bè lún lớn và không đều. Gia cố đồng thời 3 lớp phức tạp, đắt; cọc hiệu quả hơn.' }
      ]},
      lon: { correct:2, opts: [
        { t:'Cọc đóng dừng trong L2 xấu',        e:'❌ Sai. L3 cũng xấu, tải lớn → cọc dừng trong L2 có mũi trong đất yếu, không đủ. Phải xuyên vào L4 cát chặt.' },
        { t:'Nhiều cọc ngắn khoảng cách dày đặc',            e:'❌ Sai. Nhiều cọc ngắn trong đất xấu không hiệu quả. Mỗi cọc phải ngàm vào đất tốt mới phát huy SCT.' },
        { t:'Cọc khoan nhồi D ≥ 800 mm hoặc barrette xuyên hết L1-L3 vào L4', e:'✅ Đúng! X-X-X-T, tải lớn → điều kiện phức tạp nhất. Cọc nhồi lớn hoặc barrette xuyên qua 3 lớp xấu, ngàm sâu vào L4 đảm bảo SCT cọc đơn và nhóm.' },
        { t:'Móng nổi (floating foundation) giảm ứng suất tổng', e:'❌ Sai. Móng nổi chỉ bù bớt ứng suất, không đủ chịu tải lớn trên 3 lớp xấu; kém phù hợp hơn cọc.' }
      ]}
    }
  };

  var rec = DB[pattern] || DB['T-T-T-T'];
  var lev = rec[loadLevel] || rec['nho'];
  // Xáo thứ tự đáp án theo seed (mỗi sinh viên một thứ tự); không có seed thì giữ nguyên
  var order = [0, 1, 2, 3];
  if (seed != null) {
    var rs = seededRng(seed * 31 + (loadLevel === 'nho' ? 1 : loadLevel === 'tb' ? 2 : 3) * 7 + pattern.length);
    for (var i = 3; i > 0; i--) { var j = Math.floor(rs() * (i + 1)); var t = order[i]; order[i] = order[j]; order[j] = t; }
  }
  return { correct: order.indexOf(lev.correct), opts: order.map(function(k){ return { text:lev.opts[k].t, explain:lev.opts[k].e }; }) };
}

// ── Sinh số liệu CLO1 Dạng A (T-T-T-T guaranteed) ────────────
// seed offset 1001 → Dạng A (T-T-T-T)
function genC1A(stt) {
  var rng = seededRng(stt * 1009 + 1001);

  // Lớp 1: Sét hoặc Sét pha, Nửa cứng (B ∈ [0.03, 0.22])
  var A1  = 18 + Math.round(rng() * 12);   // 18-30 → A > 17: Sét
  var wP1 = 19 + Math.round(rng() * 8);    // 19-27
  var wL1 = wP1 + A1;
  var B1  = r2(0.04 + rng() * 0.18);       // 0.04-0.22 → Nửa cứng
  var w1  = Math.round(wP1 + B1 * A1);
  var h1  = r1(3.5 + rng() * 2.5);         // 3.5-6.0 m

  // Lớp 2: Sét, Nửa cứng (B ∈ [0.03, 0.24])
  var A2  = 17 + Math.round(rng() * 13);
  var wP2 = 20 + Math.round(rng() * 9);
  var wL2 = wP2 + A2;
  var B2  = r2(0.03 + rng() * 0.21);
  var w2  = Math.round(wP2 + B2 * A2);
  var h2  = r1(4.5 + rng() * 3.5);         // 4.5-8.0 m

  // Lớp 3: Cát, Chặt vừa ~ Chặt (NSPT ∈ [22, 42])
  var nspt3 = 22 + Math.round(rng() * 20);  // 22-42 → Chặt vừa/Chặt
  var h3    = r1(4.0 + rng() * 3.0);
  // Tên cát lớp 3 (chỉ cần NSPT, tên cho sẵn)
  var catNames3 = ['Cát hạt nhỏ', 'Cát hạt trung'];
  var catTen3 = catNames3[Math.floor(rng() * 2)];

  // Lớp 4: Cát, Chặt ~ Rất chặt (qc ∈ [15, 28])
  var qc4   = r1(15 + rng() * 13);          // 15-28 MPa → Chặt/Rất chặt
  var catNames4 = ['Cát hạt trung', 'Cát hạt thô'];
  var catTen4 = catNames4[Math.floor(rng() * 2)];

  // Tải trọng
  var nNho = [330, 360, 390, 420, 450][Math.floor(rng() * 5)];
  var nTb  = [1100, 1200, 1350, 1500][Math.floor(rng() * 4)];
  var nLon = [3200, 3400, 3600, 4000][Math.floor(rng() * 4)];

  var l1 = classifyDinh(w1, wL1, wP1);
  var l2 = classifyDinh(w2, wL2, wP2);
  var l3 = classifyNSPT(nspt3);
  var l4 = classifyQc(qc4);

  return {
    layers: [
      { idx:1, h:h1, w:w1, wL:wL1, wP:wP1, type:'dinh', tenDat:l1.ten, trangThai:l1.trangThai, tot:l1.tot, A:l1.A, B:l1.B, icon:l1.icon, cls:l1.cls },
      { idx:2, h:h2, w:w2, wL:wL2, wP:wP2, type:'dinh', tenDat:l2.ten, trangThai:l2.trangThai, tot:l2.tot, A:l2.A, B:l2.B, icon:l2.icon, cls:l2.cls },
      { idx:3, h:h3, nspt:nspt3,    type:'roi',  tenDat:catTen3, trangThai:l3.trangThai, tot:l3.tot, icon:l3.icon, cls:l3.cls },
      { idx:4, h:null, qc:qc4,       type:'roi',  tenDat:catTen4, trangThai:l4.trangThai, tot:l4.tot, icon:l4.icon, cls:l4.cls }
    ],
    loads: { nho: nNho, tb: nTb, lon: nLon },
    pattern: 'T-T-T-T'
  };
}

// ── Sinh số liệu CLO1 Dạng B (T-T-T-T, seed khác A) ──────────
// seed offset 2001 → Dạng B
function genC1B(stt) {
  var rng = seededRng(stt * 1009 + 2001);

  var A1  = 17 + Math.round(rng() * 13);
  var wP1 = 18 + Math.round(rng() * 9);
  var wL1 = wP1 + A1;
  var B1  = r2(0.05 + rng() * 0.20);
  var w1  = Math.round(wP1 + B1 * A1);
  var h1  = r1(3.5 + rng() * 2.5);

  var A2  = 18 + Math.round(rng() * 12);
  var wP2 = 19 + Math.round(rng() * 10);
  var wL2 = wP2 + A2;
  var B2  = r2(0.04 + rng() * 0.22);
  var w2  = Math.round(wP2 + B2 * A2);
  var h2  = r1(4.0 + rng() * 4.0);

  var nspt3 = 20 + Math.round(rng() * 22);
  var h3    = r1(3.5 + rng() * 3.5);
  var catNames3 = ['Cát hạt nhỏ', 'Cát hạt trung'];
  var catTen3 = catNames3[Math.floor(rng() * 2)];

  var qc4 = r1(14 + rng() * 14);
  var catNames4 = ['Cát hạt trung', 'Cát hạt thô'];
  var catTen4 = catNames4[Math.floor(rng() * 2)];

  var nNho = [350, 380, 400, 430, 460][Math.floor(rng() * 5)];
  var nTb  = [1050, 1200, 1400, 1550][Math.floor(rng() * 4)];
  var nLon = [3100, 3500, 3700, 4100][Math.floor(rng() * 4)];

  var l1 = classifyDinh(w1, wL1, wP1);
  var l2 = classifyDinh(w2, wL2, wP2);
  var l3 = classifyNSPT(nspt3);
  var l4 = classifyQc(qc4);

  return {
    layers: [
      { idx:1, h:h1, w:w1, wL:wL1, wP:wP1, type:'dinh', tenDat:l1.ten, trangThai:l1.trangThai, tot:l1.tot, A:l1.A, B:l1.B, icon:l1.icon, cls:l1.cls },
      { idx:2, h:h2, w:w2, wL:wL2, wP:wP2, type:'dinh', tenDat:l2.ten, trangThai:l2.trangThai, tot:l2.tot, A:l2.A, B:l2.B, icon:l2.icon, cls:l2.cls },
      { idx:3, h:h3, nspt:nspt3, type:'roi', tenDat:catTen3, trangThai:l3.trangThai, tot:l3.tot, icon:l3.icon, cls:l3.cls },
      { idx:4, h:null, qc:qc4, type:'roi', tenDat:catTen4, trangThai:l4.trangThai, tot:l4.tot, icon:l4.icon, cls:l4.cls }
    ],
    loads: { nho: nNho, tb: nTb, lon: nLon },
    pattern: 'T-T-T-T'
  };
}

// ── Sinh số liệu CLO1 Dạng C (pattern ngẫu nhiên, seed 3001) ─
// seed offset 3001 → Dạng C — pattern có thể có lớp xấu (X)
function genC1C(stt) {
  var rng = seededRng(stt * 1009 + 3001);

  // Lớp 1: đất dính, trạng thái ngẫu nhiên (có thể dẻo mềm/chảy)
  var A1  = 14 + Math.round(rng() * 16);    // 14-30
  var wP1 = 16 + Math.round(rng() * 10);
  var wL1 = wP1 + A1;
  var B1  = r2(0.05 + rng() * 0.90);        // 0.05-0.95 — bao gồm xấu
  var w1  = Math.round(wP1 + B1 * A1);
  var h1  = r1(2.5 + rng() * 4.0);

  var A2  = 15 + Math.round(rng() * 15);
  var wP2 = 17 + Math.round(rng() * 11);
  var wL2 = wP2 + A2;
  var B2  = r2(0.04 + rng() * 0.70);
  var w2  = Math.round(wP2 + B2 * A2);
  var h2  = r1(3.5 + rng() * 4.5);

  // Lớp 3: NSPT ngẫu nhiên (có thể rời = xấu)
  var nspt3 = 4 + Math.round(rng() * 40);   // 4-44
  var h3    = r1(3.0 + rng() * 4.0);
  var catNames3 = ['Cát hạt nhỏ', 'Cát hạt trung'];
  var catTen3 = catNames3[Math.floor(rng() * 2)];

  var qc4 = r1(10 + rng() * 18);            // 10-28 (luôn tốt L4)
  var catNames4 = ['Cát hạt trung', 'Cát hạt thô'];
  var catTen4 = catNames4[Math.floor(rng() * 2)];

  var nNho = [300 + Math.round(rng() * 200)];
  var nTb  = [900 + Math.round(rng() * 700)];
  var nLon = [2800 + Math.round(rng() * 1400)];

  var l1 = classifyDinh(w1, wL1, wP1);
  var l2 = classifyDinh(w2, wL2, wP2);
  var l3 = classifyNSPT(nspt3);
  var l4 = classifyQc(qc4);

  // Sơ đồ pattern
  var p = [l1.tot ? 'T' : 'X', l2.tot ? 'T' : 'X', l3.tot ? 'T' : 'X', 'T'].join('-');

  return {
    layers: [
      { idx:1, h:h1, w:w1, wL:wL1, wP:wP1, type:'dinh', tenDat:l1.ten, trangThai:l1.trangThai, tot:l1.tot, A:l1.A, B:l1.B, icon:l1.icon, cls:l1.cls },
      { idx:2, h:h2, w:w2, wL:wL2, wP:wP2, type:'dinh', tenDat:l2.ten, trangThai:l2.trangThai, tot:l2.tot, A:l2.A, B:l2.B, icon:l2.icon, cls:l2.cls },
      { idx:3, h:h3, nspt:nspt3, type:'roi', tenDat:catTen3, trangThai:l3.trangThai, tot:l3.tot, icon:l3.icon, cls:l3.cls },
      { idx:4, h:null, qc:qc4, type:'roi', tenDat:catTen4, trangThai:l4.trangThai, tot:l4.tot, icon:l4.icon, cls:l4.cls }
    ],
    loads: { nho: nNho[0], tb: nTb[0], lon: nLon[0] },
    pattern: p
  };
}

// ── Helper: tra phương án móng từ pattern + tải ───────────────
// Trả về { text, explain } cho từng cấp tải
function getFoundationAdvice(pattern, loadLevel) {
  // loadLevel: 'nho' | 'tb' | 'lon'
  var advice = {
    'T-T-T-T': {
      nho: { text:'Móng đơn / móng băng nông', explain:'4 lớp đất tốt → tải nhỏ dùng móng đơn/băng nông trên L1.' },
      tb:  { text:'Móng băng / móng bè',       explain:'T-T-T-T, tải trung bình → móng băng giao thoa hoặc bè.' },
      lon: { text:'Cọc ngắn (L < 20 m)',        explain:'T-T-T-T, tải lớn → cọc đóng/ép cắm vào cát chặt L3/L4.' }
    },
    'X-T-T-T': {
      nho: { text:'Xử lý nền L1 rồi đặt móng nông', explain:'L1 xấu, L2-L4 tốt → tải nhỏ xử lý L1 (đệm cát, cọc cát, CDM) rồi móng nông.' },
      tb:  { text:'Cọc ngắn xuyên qua L1',      explain:'L1 xấu → cọc xuyên L1 tựa vào L2 tốt.' },
      lon: { text:'Cọc dài xuyên qua L1-L2',    explain:'L1 xấu, tải lớn → cọc dài cắm vào L3/L4.' }
    },
    'T-X-T-T': {
      nho: { text:'Móng nông đặt trong L1', explain:'L1 tốt-L2 xấu → móng nông trong L1, chọn kích thước đáy để L2 đủ SCT.' },
      tb:  { text:'Cọc ngắn xuyên L1-L2',   explain:'L2 xấu → cọc xuyên L1 và L2 tựa vào L3.' },
      lon: { text:'Cọc dài cắm vào L3-L4',  explain:'Tải lớn → cọc xuyên L2 tựa vào cát chặt L3/L4.' }
    },
    'X-X-T-T': {
      nho: { text:'Cọc ngắn xuyên L1-L2 hoặc gia cố sâu', explain:'2 lớp đầu xấu → cọc ngắn hoặc gia cố sâu (cọc cát, CDM) dù tải nhỏ.' },
      tb:  { text:'Cọc xuyên qua L1-L2',     explain:'X-X-T-T → cọc xuyên 2 lớp xấu tựa vào L3/L4.' },
      lon: { text:'Cọc xuyên L1-L2, ngàm sâu L3/L4', explain:'Tải lớn + 2 lớp xấu → cọc dài xuyên hết L2 vào L3/L4.' }
    },
    'T-T-X-T': {
      nho: { text:'Móng nông đặt trong L1/L2', explain:'L3 xấu, tải nhỏ → móng nông trong L1/L2, chọn kích thước đáy để L3 đủ SCT.' },
      tb:  { text:'Cọc xuyên qua L3 xấu',      explain:'L3 xấu → cọc xuyên L3 tựa vào L4 tốt.' },
      lon: { text:'Cọc dài xuyên L3 vào L4',   explain:'L3 xấu, tải lớn → cọc cắm sâu vào L4.' }
    },
    'X-X-X-T': {
      nho: { text:'Cọc xuyên qua 3 lớp xấu',   explain:'3 lớp xấu → bắt buộc dùng cọc xuyên vào L4.' },
      tb:  { text:'Cọc xuyên L1-L3 vào L4',      explain:'X-X-X-T → cọc dài xuyên hết L1-L3 vào L4.' },
      lon: { text:'Cọc nhồi D ≥ 800 / barrette', explain:'3 lớp xấu + tải lớn → cọc khoan nhồi lớn.' }
    }
  };

  var pAdv = advice[pattern] || advice['T-T-T-T'];
  return pAdv[loadLevel] || { text:'Tham khảo GV', explain:'Xem bảng chọn phương án.' };
}

// ── Vẽ trụ địa chất SVG ───────────────────────────────────────
function drawSoilSVG(layers, containerId, showResult) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var SCALE = 22;  // px/m
  var CX = 70, CW = 110, TW = 310;
  var totalH = layers.reduce(function(s, l) {
    return s + (l.h != null ? l.h : 5);
  }, 0);
  var SVG_H = Math.max(totalH * SCALE + 100, 280);

  var s = '<svg viewBox="0 0 ' + TW + ' ' + SVG_H + '" xmlns="http://www.w3.org/2000/svg" '
        + 'style="width:100%;max-width:320px;display:block;margin:0 auto">';
  s += '<rect width="' + TW + '" height="' + SVG_H + '" fill="#F8FBFF" rx="8"/>';

  // Mặt đất
  var Y0 = 32;
  s += '<line x1="' + CX + '" y1="' + Y0 + '" x2="' + (CX+CW) + '" y2="' + Y0
     + '" stroke="#546E7A" stroke-width="2"/>';
  s += '<text x="' + (CX+CW/2) + '" y="22" text-anchor="middle" fill="#546E7A" '
     + 'font-size="9" font-weight="700">± 0.00 m</text>';

  var y = Y0, cumH = 0;
  // Màu theo loại và trạng thái
  var colors = {
    dinh_tot:  { fill:'#FFFDE7', stroke:'#F57F17', hatch:true  },
    dinh_xau:  { fill:'#E3F2FD', stroke:'#1565C0', hatch:true  },
    roi_tot:   { fill:'#E8F5E9', stroke:'#2E7D32', hatch:false },
    roi_xau:   { fill:'#FFEBEE', stroke:'#C62828', hatch:false }
  };

  layers.forEach(function(layer, i) {
    var lh  = layer.h != null ? layer.h : 5;
    var px  = lh * SCALE;
    var key = layer.type + '_' + (layer.tot ? 'tot' : 'xau');
    var c   = colors[key] || colors['roi_tot'];

    // Khối đất
    s += '<rect x="' + CX + '" y="' + y + '" width="' + CW + '" height="' + px
       + '" fill="' + c.fill + '" stroke="' + c.stroke + '" stroke-width="1.2"/>';

    // Họa tiết
    if (c.hatch) {
      // Đường chéo cho đất dính
      for (var d = -px; d < CW + px; d += 14) {
        var x1d = CX + Math.max(0, d);
        var y1d = y + Math.max(0, -d);
        var x2d = CX + Math.min(CW, d + px);
        var y2d = y + Math.min(px, px - d + (CW - Math.max(0, d)));
        if (x1d < CX+CW && y1d < y+px)
          s += '<line x1="' + r1(x1d) + '" y1="' + r1(y1d) + '" x2="' + r1(Math.min(x2d, CX+CW))
             + '" y2="' + r1(Math.max(y2d, y)) + '" stroke="' + c.stroke + '" stroke-width="0.5" opacity="0.35"/>';
      }
    } else {
      // Chấm cho đất rời
      for (var dx = CX+9; dx < CX+CW-4; dx += 13) {
        for (var dy = y+8; dy < y+px-4; dy += 11) {
          s += '<circle cx="' + dx + '" cy="' + dy + '" r="2" fill="' + c.stroke + '" opacity="0.45"/>';
        }
      }
    }

    // Số lớp bên trái
    s += '<text x="' + (CX-8) + '" y="' + (y + px/2 + 4) + '" text-anchor="middle" fill="#546E7A" '
       + 'font-size="10" font-weight="700">L' + (i+1) + '</text>';

    // Nhãn bên phải (chỉ hiển thị sau khi làm bước 1 nếu showResult)
    var rx = CX + CW + 6;
    var midY = y + px/2;
    var nameColor = layer.tot ? '#1B5E20' : '#B71C1C';
    var statusColor = layer.tot ? '#2E7D32' : '#C62828';
    if (showResult) {
      s += '<text x="' + rx + '" y="' + (midY-4) + '" fill="#0D47A1" font-size="9" font-weight="700">'
         + (layer.tenDat||'') + '</text>';
      s += '<text x="' + rx + '" y="' + (midY+7) + '" fill="' + statusColor + '" font-size="8.5">'
         + (layer.trangThai||'') + ' ' + (layer.icon||'') + '</text>';
    } else {
      s += '<text x="' + rx + '" y="' + midY + '" fill="#546E7A" font-size="8" font-style="italic">h = '
         + lh + ' m</text>';
    }

    // Marker độ sâu
    if (layer.h != null) {
      cumH += lh;
      s += '<line x1="' + (CX-18) + '" y1="' + (y+px) + '" x2="' + CX + '" y2="' + (y+px)
         + '" stroke="#90CAF9" stroke-width="1" stroke-dasharray="3,2"/>';
      s += '<text x="' + (CX-20) + '" y="' + (y+px+4) + '" text-anchor="end" fill="#546E7A" font-size="8">'
         + r1(cumH) + 'm</text>';
    }

    y += px;
  });

  // Ký hiệu ∞ ở đáy
  s += '<line x1="' + CX + '" y1="' + y + '" x2="' + (CX+CW) + '" y2="' + y
     + '" stroke="#2E7D32" stroke-width="1.2" stroke-dasharray="4,2"/>';
  s += '<text x="' + (CX+CW/2) + '" y="' + (y+14) + '" text-anchor="middle" fill="#2E7D32" font-size="11">∞</text>';

  s += '</svg>';
  container.innerHTML = s;
}
