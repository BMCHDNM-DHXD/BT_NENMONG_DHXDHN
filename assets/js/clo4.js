// ═══════════════════════════════════════════════════════════════
// BT NỀN MÓNG — clo4.js  v0.2
// CLO4 · Cấu tạo nền móng. Đề dạng "hình có 2 chỗ sai", sinh từ STT, chấm tự động.
// Bài ex1..ex6 của mỗi dạng = nhóm: 1 Móng đơn · 2 Móng băng · 3 Cọc BTCT đúc sẵn
//                                  4 Móng trên đệm cát · 5 Đài cọc · 6 Tổng hợp (nhóm ngẫu nhiên theo STT)
// Phần sinh đề (gen, violations) không dùng DOM → kiểm bằng tests/clo4_check.html.
// Quy tắc: tài liệu tập huấn CLO4 (23/10/2026) + các mục "Chờ quyết" đã chốt 25/10/2026 (QUYET_DINH.md).
// ═══════════════════════════════════════════════════════════════
(function (root) {
'use strict';

var CIRC = ['①', '②', '③', '④', '⑤', '⑥'];
var GROUP_ORDER = ['don', 'bang', 'coc', 'dem', 'dai'];
var GROUP_NAME = {
  don: 'Móng đơn BTCT dưới cột', bang: 'Móng băng dưới dầm BTCT', coc: 'Cọc BTCT đúc sẵn',
  dem: 'Móng đơn trên đệm cát', dai: 'Đài cọc (liên kết ngàm)'
};
var EX_LBL = ['Móng đơn', 'Móng băng', 'Cọc đúc sẵn', 'Đệm cát', 'Đài cọc', 'Tổng hợp'];

var GROUP_ITEMS = {
  don:  ['conc', 'lot', 'abv', 'steelpos', 'steeld', 'base'],
  bang: ['conc', 'lot', 'abv', 'steeldir', 'steeld', 'base'],
  dem:  ['conc', 'lot', 'abv', 'steelpos', 'steeld', 'dem'],
  dai:  ['conc', 'lot', 'pile_s', 'delta', 'embed', 'steelpos'],
  coc:  ['conc', 'steelL', 'stirHead', 'stirLen', 'tip']
};
var ITEM_NAME = {
  conc: 'Bê tông', lot: 'Bê tông lót', abv: 'Lớp bảo vệ đáy', steelpos: 'Vị trí lưới thép',
  steeld: 'Đường kính và bước thép', base: 'Kích thước bản đế', steeldir: 'Phương thép chịu lực',
  dem: 'Bề rộng đáy đệm', pile_s: 'Khoảng cách giữa các cọc', delta: 'Khoảng cách mép cọc biên đến mép đài',
  embed: 'Liên kết cọc – đài', steelL: 'Cốt thép dọc của cọc', stirHead: 'Cốt đai đầu và mũi cọc',
  stirLen: 'Chiều dài đoạn đai dày', tip: 'Mũi cọc'
};

// Quy tắc dùng chung (kể cả mục "Chờ quyết" đã chốt)
var RULE = {
  concMin: 15, lotT: 100, lotGradeMin: 7.5, abvLot: 40, abvNoLot: 70,
  sMax: 400, sOverH: 1.5, dMin: 10, tMin: 150, vatH: 300,
  thetaDeg: 8, pileD: 14, pileMu: 0.8, denseK: 3, deltaMin: 250, embedMin: 100, anchorK: 20,
  sFric: 3, sEnd: 1.5
};
var TAN8 = Math.tan(RULE.thetaDeg * Math.PI / 180);

function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
function fmtB(g) { return 'B' + String(g).replace('.', ','); }
function f2(x) { return String(x).replace('.', ','); }
function ceil50(x) { return Math.ceil(x / 50) * 50; }

// ═════════ Kiểm vi phạm từng mục ═════════
var V = {
  conc: function (S) { return S.conc < RULE.concMin; },
  lot: function (S) {
    return S.haveLot && (S.lot.t < RULE.lotT || S.lot.grade < RULE.lotGradeMin || !S.lot.wider || S.lot.grade > S.conc);
  },
  abv: function (S) { return S.abv < (S.haveLot ? RULE.abvLot : RULE.abvNoLot); },
  steelpos: function (S) { return S.steelUp; },
  steeldir: function (S) { return S.swap; },
  steeld: function (S) { return S.d < RULE.dMin || S.s > Math.min(RULE.sMax, RULE.sOverH * (S.h || 1000)); },
  base: function (S) { return S.t < RULE.tMin || (S.h > RULE.vatH && !S.vat); },
  dem: function (S) { return S.Bd < S.b + 2 * S.hd * TAN8 - 1e-9; },
  pile_s: function (S) { return S.ps < (S.pileType === 'friction' ? RULE.sFric : RULE.sEnd) * S.pd - 1e-9; },
  delta: function (S) { return S.delta < Math.max(RULE.deltaMin, S.pd / 2); },
  embed: function (S) { return S.embed < RULE.embedMin || S.anchor < RULE.anchorK * S.dsteel; },
  steelL: function (S) { return S.dl < RULE.pileD || S.mu < RULE.pileMu; },
  stirHead: function (S) { return S.sd >= S.sb; },
  stirLen: function (S) { return S.Ld < RULE.denseK * S.pa; },
  tip: function (S) { return S.soil === 'cuoi' && S.tip === 'bt'; }
};
function violations(S) { return GROUP_ITEMS[S.g].filter(function (k) { return V[k](S); }); }

// ═════════ Sinh đề ═════════
// Phần chung cho nhóm móng (đơn, băng, đệm, đài): bê tông, lót, lớp bảo vệ, thép
function genCommon(r, S, bad, o) {
  S.var_ = S.var_ || {};
  S.conc = bad('conc') ? pick(r, [10, 12.5]) : pick(r, [20, 25, 30]);
  var abvNoLotBad = o.hasAbv && bad('abv') && !bad('lot') && !o.lotRequired && r() < 0.5;
  S.haveLot = (o.lotRequired || bad('lot')) ? true : (abvNoLotBad ? false : (o.hasAbv && bad('abv') ? true : r() < 0.7));
  S.lot = null;
  if (S.haveLot) {
    S.lot = { t: pick(r, [100, 120, 150]), grade: S.conc >= 15 ? pick(r, [7.5, 10]) : 7.5, wider: true };
    if (bad('lot')) {
      var kind = pick(r, ['mong', 'hep', 'cao']);
      S.var_.lot = kind;
      if (kind === 'mong') S.lot.t = pick(r, [50, 60, 80]);
      else if (kind === 'hep') S.lot.wider = false;
      else S.lot.grade = S.conc + 5;
    }
  }
  if (o.hasAbv && bad('abv')) {
    if (S.haveLot) { S.abv = pick(r, [15, 20, 25, 30, 35]); S.var_.abv = 'withlot'; }
    else { S.abv = pick(r, [40, 50, 60]); S.var_.abv = 'nolot'; }
  } else S.abv = S.haveLot ? pick(r, [40, 45, 50, 60]) : pick(r, [70, 75]);
  S.steelUp = bad('steelpos'); S.swap = bad('steeldir');
  S.d = pick(r, [12, 14, 16, 18]); S.s = pick(r, [150, 200, 250, 300]);
  if (bad('steeld')) {
    if (r() < 0.5) { S.d = 8; S.var_.steeld = 'd'; } else { S.s = pick(r, [450, 500]); S.var_.steeld = 's'; }
  }
}

function genBaseDims(r, S, bad) {   // bản đế: h, t, vát (móng đơn, móng băng)
  S.h = pick(r, [350, 400, 450, 500, 550, 600]);
  S.vat = true; S.t = pick(r, [150, 200, 250]);
  if (bad('base')) {
    if (r() < 0.5) { S.t = pick(r, [100, 110, 120]); S.var_.base = 'mep'; }
    else { S.vat = false; S.t = S.h; S.var_.base = 'novat'; }
  }
  if (S.t > S.h - 50 && S.vat) S.t = 150;
}

var GEN = {
  don: function (r, S, bad) {
    S.B = pick(r, [1.6, 1.8, 2.0, 2.2, 2.4]); S.colB = pick(r, [300, 350, 400, 450]);
    S.L = Math.round(S.B * pick(r, [1.2, 1.3, 1.5]) * 10) / 10; S.colL = S.colB + pick(r, [0, 100]);
    genBaseDims(r, S, bad);
    genCommon(r, S, bad, { hasAbv: true });
  },
  bang: function (r, S, bad) {
    S.B = pick(r, [1.2, 1.4, 1.6, 1.8]); S.beamB = pick(r, [250, 300, 350]);
    genBaseDims(r, S, bad);
    genCommon(r, S, bad, { hasAbv: true });
  },
  dem: function (r, S, bad) {
    S.b = pick(r, [1300, 1500, 1800, 2000]); S.hd = pick(r, [500, 800, 1000, 1200]);
    S.L = Math.round((S.b / 1000) * pick(r, [1.2, 1.5]) * 10) / 10;
    S.h = pick(r, [400, 450, 500]); S.t = 200; S.vat = true;     // bản đế luôn đúng (không là mục kiểm tra)
    var need = S.b + 2 * S.hd * TAN8;
    if (bad('dem')) { S.Bd = r() < 0.5 ? S.b : S.b + 100; S.var_.dem = 'x'; }
    else S.Bd = ceil50(need) + pick(r, [0, 50, 100, 200]);
    genCommon(r, S, bad, { hasAbv: true });
  },
  dai: function (r, S, bad) {
    S.pd = pick(r, [300, 350, 400]); S.pileType = r() < 0.5 ? 'friction' : 'end';
    var k = S.pileType === 'friction' ? RULE.sFric : RULE.sEnd;
    if (bad('pile_s')) {
      S.ps = Math.round(k * S.pd * pick(r, [0.7, 0.8, 0.85]) / 50) * 50;
      if (S.ps >= k * S.pd) S.ps = Math.floor((k * S.pd - 1) / 50) * 50;
    } else {
      S.ps = Math.round(k * S.pd * pick(r, [1, 1.1, 1.2]) / 50) * 50;
      if (S.ps < k * S.pd) S.ps = Math.ceil(k * S.pd / 50) * 50;
    }
    S.delta = bad('delta') ? pick(r, [100, 150, 200]) : pick(r, [250, 300, 350]);
    S.dsteel = pick(r, [16, 18, 20]);
    S.embed = pick(r, [100, 150]); S.anchor = RULE.anchorK * S.dsteel + pick(r, [0, 40, 80]);
    if (bad('embed')) {
      if (r() < 0.5) { S.embed = 50; S.var_.embed = 'embed'; }
      else { S.anchor = Math.round(S.dsteel * pick(r, [10, 12, 15]) / 10) * 10; S.var_.embed = 'anchor'; }
    }
    S.hdai = pick(r, [700, 800, 1000]);
    genCommon(r, S, bad, { hasAbv: false, lotRequired: true });
    S.h = S.hdai;
  },
  coc: function (r, S, bad) {
    S.pa = pick(r, [250, 300, 350, 400]);
    S.conc = bad('conc') ? pick(r, [10, 12.5]) : pick(r, [25, 30, 35]);
    var ok = [], low = [];
    [4, 6, 8].forEach(function (n) { [14, 16, 18, 20, 22, 25].forEach(function (d) {
      var mu = n * Math.PI * d * d / 4 / (S.pa * S.pa) * 100;
      if (mu >= RULE.pileMu + 0.05 && mu <= 4) ok.push([n, d, mu]);
      if (mu < RULE.pileMu - 0.1) low.push([n, d, mu]);
    }); });
    var c;
    if (bad('steelL')) {
      if (low.length && r() < 0.5) { c = pick(r, low); S.var_.steelL = 'mu'; }
      else { var n = pick(r, [4, 6, 8]), d = pick(r, [10, 12]); c = [n, d, n * Math.PI * d * d / 4 / (S.pa * S.pa) * 100]; S.var_.steelL = 'd'; }
    } else c = pick(r, ok);
    S.nl = c[0]; S.dl = c[1]; S.mu = Math.round(c[2] * 100) / 100;
    var sbOpts = [100, 125, 150].filter(function (x) { return x <= S.pa / 2; });
    S.sb = pick(r, sbOpts); S.sd = bad('stirHead') ? S.sb : pick(r, [50, 75].filter(function (x) { return x < S.sb; }));
    if (bad('stirLen')) {
      S.Ld = Math.round(S.pa * pick(r, [1, 1.5, 2]) / 50) * 50;
      if (S.Ld >= RULE.denseK * S.pa) S.Ld = Math.floor((RULE.denseK * S.pa - 1) / 50) * 50;
    } else {
      S.Ld = Math.round(S.pa * pick(r, [3, 3.5, 4]) / 50) * 50;
      if (S.Ld < RULE.denseK * S.pa) S.Ld = Math.ceil(RULE.denseK * S.pa / 50) * 50;
    }
    S.soil = r() < 0.5 ? 'set' : 'cuoi';
    if (bad('tip')) { S.soil = 'cuoi'; S.tip = 'bt'; }
    else S.tip = S.soil === 'cuoi' ? 'thep' : pick(r, ['bt', 'thep']);
  }
};

// gen(stt, exIdx 0..5, dangIdx 1..3, seededRng)
function gen(stt, exIdx, dangIdx, seededRng) {
  var r = seededRng(stt * 1009 + exIdx * 100 + dangIdx);
  var g = exIdx < 5 ? GROUP_ORDER[exIdx] : GROUP_ORDER[(stt + dangIdx) % 5];
  var items = GROUP_ITEMS[g];
  var a = pick(r, items), rest = items.filter(function (k) { return k !== a; }), b = pick(r, rest);
  var errs = [a, b];
  var S = { g: g, stt: stt, ex: exIdx, dang: dangIdx, errs: errs, var_: {} };
  GEN[g](r, S, function (k) { return errs.indexOf(k) >= 0; });
  return S;
}

// ═════════ Mô tả từng mục ═════════
function itemText(S, k) {
  var nm = S.g === 'dai' ? 'đài' : 'móng';
  switch (k) {
    case 'conc': return (S.g === 'coc' ? 'Bê tông cọc: ' : S.g === 'dai' ? 'Bê tông đài: ' : 'Bê tông móng: ') + '<b>' + fmtB(S.conc) + '</b>';
    case 'lot':
      if (!S.haveLot) return 'Bê tông lót: <b>không có</b> (móng đặt trực tiếp trên nền đất)';
      return 'Bê tông lót: dày <b>' + S.lot.t + ' mm</b>, <b>' + fmtB(S.lot.grade) + '</b>, ' +
        (S.lot.wider ? 'rộng hơn đáy ' + nm + ' mỗi bên <b>100 mm</b>' : '<b>nhỏ hơn</b> đáy ' + nm + ', thụt vào mỗi bên <b>100 mm</b>');
    case 'abv': return 'Lớp bê tông bảo vệ cốt thép đáy: a<sub>bv</sub> = <b>' + S.abv + ' mm</b>';
    case 'steelpos': return 'Lưới thép chịu lực (hai phương) đặt ở phía <b>' + (S.steelUp ? 'trên' : 'dưới') + '</b> ' + (S.g === 'dai' ? 'đài' : 'bản đế');
    case 'steeldir': return S.swap
      ? 'Thép chịu lực đặt theo phương <b>dọc</b> (dọc băng), thép phân bố đặt theo phương <b>ngang</b>'
      : 'Thép chịu lực đặt theo phương <b>ngang</b> (phương b), thép phân bố đặt theo phương <b>dọc</b>, nằm trên thép chịu lực';
    case 'steeld': return 'Thép chịu lực: <b>φ' + S.d + ' a' + S.s + '</b> (d = ' + S.d + ' mm, bước s = ' + S.s + ' mm)';
    case 'base': return 'Bản đế: h = <b>' + S.h + ' mm</b>, chiều dày mép t = <b>' + S.t + ' mm</b>, ' + (S.vat ? 'bản đế <b>vát</b>' : 'bản đế <b>không vát</b> (một bậc)');
    case 'dem': return 'Đệm cát đầm chặt, thay toàn bộ lớp đất yếu: h<sub>đ</sub> = <b>' + S.hd + ' mm</b>, bề rộng đáy đệm B<sub>đ</sub> = <b>' + S.Bd + ' mm</b> (bề rộng móng b = ' + S.b + ' mm, góc lan truyền θ = ' + RULE.thetaDeg + '°)';
    case 'pile_s': return 'Khoảng cách giữa trục các cọc (cọc <b>' + (S.pileType === 'friction' ? 'ma sát' : 'chống') + '</b>, cạnh cọc d = ' + S.pd + ' mm): s = <b>' + S.ps + ' mm</b>';
    case 'delta': return 'Khoảng cách từ mép ngoài cọc biên đến mép đài: δ = <b>' + S.delta + ' mm</b>';
    case 'embed': return 'Liên kết ngàm: đầu cọc ngập vào đài <b>' + S.embed + ' mm</b>; đoạn nối (neo) thép dọc cọc φ' + S.dsteel + ' vào đài <b>' + S.anchor + ' mm</b>';
    case 'steelL': return 'Cốt thép dọc: <b>' + S.nl + 'φ' + S.dl + '</b> (hàm lượng μ = <b>' + f2(S.mu) + ' %</b> diện tích tiết diện), kéo dài suốt chiều dài cọc';
    case 'stirHead': return 'Cốt đai: thân cọc <b>φ6 a' + S.sb + '</b>; vùng đầu và mũi cọc <b>φ6 a' + S.sd + '</b>';
    case 'stirLen': return 'Đoạn đai dày ở đầu và ở mũi cọc dài <b>' + S.Ld + ' mm</b> (cạnh cọc a = ' + S.pa + ' mm)';
    case 'tip': return 'Cọc xuyên ' + (S.soil === 'set' ? '<b>lớp sét đồng nhất</b>' : '<b>lớp sỏi cuội xen kẹp</b>') + '; mũi cọc: <b>' + (S.tip === 'bt' ? 'bê tông nhọn' : 'bọc thép') + '</b>';
  }
}

var OPT = {
  conc: ['Đúng, giữ nguyên', 'Sai — cấp bê tông phải ≥ B15', 'Sai — cấp bê tông phải ≥ B25', 'Sai — cấp bê tông chỉ cần ≥ B7,5'],
  lot: ['Đúng, giữ nguyên', 'Sai — bê tông lót phải dày ≥ 100 mm', 'Sai — bê tông lót phải rộng hơn đáy móng', 'Sai — cấp bê tông lót phải thấp hơn cấp bê tông móng (≥ B7,5)'],
  abv: ['Đúng, giữ nguyên', 'Sai — khi có bê tông lót, a<sub>bv</sub> ≥ 40 mm', 'Sai — khi không có bê tông lót, a<sub>bv</sub> ≥ 70 mm', 'Sai — a<sub>bv</sub> phải ≥ 100 mm'],
  steelpos: ['Đúng, giữ nguyên', 'Sai — lưới thép chịu lực phải đặt ở phía dưới', 'Sai — lưới thép phải đặt ở giữa chiều cao', 'Sai — chỉ cần đặt thép theo một phương'],
  steeldir: ['Đúng, giữ nguyên', 'Sai — thép chịu lực phải đặt theo phương ngang, thép phân bố đặt dọc phía trên', 'Sai — thép chịu lực phải đặt theo phương dọc, thép phân bố đặt ngang', 'Sai — hai phương đều là thép chịu lực, đặt cùng một lớp'],
  steeld: ['Đúng, giữ nguyên', 'Sai — đường kính thép d ≥ 10 mm', 'Sai — khoảng cách trục thép ≤ 400 mm và ≤ 1,5h', 'Sai — đường kính thép phải ≥ 16 mm'],
  base: ['Đúng, giữ nguyên', 'Sai — chiều dày mép bản đế t ≥ 150 mm', 'Sai — khi h > 300 mm bản đế phải vát', 'Sai — mép bản đế phải mỏng dần đến 0'],
  dem: ['Đúng, giữ nguyên', 'Sai — đệm phải mở rộng ra ngoài mép móng: B<sub>đ</sub> ≥ b + 2h<sub>đ</sub>·tanθ', 'Sai — đệm chỉ cần rộng bằng đáy móng (B<sub>đ</sub> = b)', 'Sai — đệm phải rộng gấp đôi đáy móng (B<sub>đ</sub> = 2b)'],
  pile_s: ['Đúng, giữ nguyên', 'Sai — khoảng cách trục cọc ma sát phải ≥ 3d', 'Sai — khoảng cách trục cọc chống phải ≥ 1,5d', 'Sai — khoảng cách trục cọc phải ≥ 6d'],
  delta: ['Đúng, giữ nguyên', 'Sai — δ phải ≥ 250 mm (và ≥ ½ cạnh cọc)', 'Sai — δ phải ≥ 500 mm', 'Sai — δ có thể bằng 0 (mép cọc trùng mép đài)'],
  embed: ['Đúng, giữ nguyên', 'Sai — đầu cọc phải ngập vào đài ≥ 100 mm', 'Sai — đoạn nối (neo) thép cọc vào đài phải ≥ 20d', 'Sai — đầu cọc phải ngập vào đài ≥ 500 mm'],
  steelL: ['Đúng, giữ nguyên', 'Sai — đường kính thép dọc phải ≥ 14 mm', 'Sai — hàm lượng thép dọc phải ≥ 0,8 % diện tích tiết diện', 'Sai — chỉ cần 2 thanh thép dọc ở hai góc'],
  stirHead: ['Đúng, giữ nguyên', 'Sai — cốt đai ở đầu và mũi cọc phải dày hơn thân cọc', 'Sai — cốt đai ở đầu cọc phải thưa hơn thân cọc', 'Sai — không cần cốt đai ở đầu cọc'],
  stirLen: ['Đúng, giữ nguyên', 'Sai — đoạn đai dày phải dài ≥ 3 lần cạnh nhỏ của cọc', 'Sai — đoạn đai dày chỉ cần ≥ 1 lần cạnh nhỏ của cọc', 'Sai — đai dày phải bố trí suốt chiều dài cọc'],
  tip: ['Đúng, giữ nguyên', 'Sai — cọc xuyên sỏi cuội, đá phải dùng mũi bọc thép (hoặc gang đúc)', 'Sai — mũi cọc phải luôn nhọn bằng bê tông', 'Sai — mũi cọc phải luôn phẳng']
};
function correctOpt(S, k) {
  if (violations(S).indexOf(k) < 0) return 0;
  var v = S.var_[k];
  switch (k) {
    case 'lot': return v === 'mong' ? 1 : (v === 'hep' ? 2 : 3);
    case 'abv': return v === 'withlot' ? 1 : 2;
    case 'steeld': return v === 'd' ? 1 : 2;
    case 'base': return v === 'mep' ? 1 : 2;
    case 'pile_s': return S.pileType === 'friction' ? 1 : 2;
    case 'embed': return v === 'embed' ? 1 : 2;
    case 'steelL': return v === 'd' ? 1 : 2;
    default: return 1;
  }
}
var BASIS = {
  conc: 'TCVN 5574:2018 Điều 6.1.1.6 (kết cấu BTCT ≥ B15); cọc: TCVN 10304 Điều 6.8.',
  lot: 'TCVN 9362 Điều 4.23 (lót dày ≥ 100 mm, ≥ B7,5). Lót rộng hơn đáy móng và cấp lót không cao hơn cấp bê tông móng: quy ước tổ môn.',
  abv: 'TCVN 5574:2018 Điều 10.3.1.2, Bảng 19 (≥ 40 mm khi có lót); TCVN 9362 Điều 4.23 chú thích 2 (không lót ≥ 70 mm).',
  steelpos: 'TCVN 5574:2018 Điều 10.4.1, 10.4.8; bản chịu uốn do phản lực nền, đáy chịu kéo.',
  steeldir: 'Eurocode (Calavera [8]) và V11 (cấu tạo) mục móng băng: phương ngang là phương chịu uốn của bản móng. Quy ước tổ môn.',
  steeld: 'TCVN 5574:2018 Điều 10.3.3.3 (s ≤ 1,5h và ≤ 400 mm). d ≥ 10 mm: quy ước tổ môn.',
  base: 'Quy ước tổ môn: mép t ≥ 150 mm; bản đế vát khi h > 300 mm.',
  dem: 'V10 mục 2.4.3.6 (phương pháp phân tán ứng suất, θ ≤ 8°): B_đ = b + 2h_đ·tan8°. Quy ước tổ môn.',
  pile_s: 'TCVN 10304 Điều 8.13 (cọc ma sát ≥ 3d, cọc chống ≥ 1,5d).',
  delta: 'Quy ước tổ môn: δ ≥ ½ cạnh cọc và ≥ 250 mm (trị số của TCVN 10304:2014; bản 2025 chỉ nêu có xét dung sai thi công cọc).',
  embed: 'TCVN 10304 Điều 8.8, 8.9; TCVN 5574 Điều 10.3.5 (neo). Ngập ≥ 100 mm và neo ≥ 20d: quy ước tổ môn.',
  steelL: 'TCXD 205:1998 mục 3.3.3b (hết hiệu lực, tham khảo): d ≥ 14 mm, μ ≥ 0,8 %. Tổ môn chốt dùng.',
  stirHead: 'TCXD 205:1998 mục 3.3.3b (hết hiệu lực, tham khảo): đai đầu và mũi cọc dày hơn thân. Tổ môn chốt dùng.',
  stirLen: 'TCXD 205:1998 mục 3.3.3b (hết hiệu lực, tham khảo): đoạn đai dày ≥ 3 lần cạnh nhỏ. Tổ môn chốt dùng.',
  tip: 'TCXD 205:1998 mục 3.3.3c (tham khảo); TCVN 10304 Điều 6.3e: mũi bọc thép khi xuyên đá, sỏi cuội.'
};
var CONSEQ = {
  conc: 'Bê tông yếu, liên kết với cốt thép và khả năng bảo vệ cốt thép kém.',
  lot: 'Đất ẩm lẫn vào bê tông móng, mất nước xi măng; thép khó định vị, lớp bảo vệ thực tế không đều.',
  abv: 'Thép nằm sát đáy, gần đất ẩm nên dễ bị ăn mòn, giảm tuổi thọ của móng.',
  steelpos: 'Đáy bản chịu kéo do phản lực nền nhưng không có thép chịu kéo ở đáy nên đáy bản dễ nứt.',
  steeldir: 'Thép chịu lực đặt sai phương chịu uốn của bản móng nên bản dễ nứt, không đủ khả năng chịu uốn.',
  steeld: 'Thép quá thưa hoặc quá nhỏ nên bản dễ nứt giữa các thanh, cốt thép làm việc kém.',
  dem: 'Đệm không mở rộng đủ thì tải truyền xuống lớp đất yếu bên dưới trong phạm vi hẹp, áp lực lên nền yếu tăng, dễ lún quá mức hoặc mất ổn định.',
  pile_s: 'Các cọc đặt quá gần nhau nên vùng ứng suất chồng lấn, sức chịu tải của nhóm cọc giảm và lún tăng.',
  delta: 'Cọc biên sát mép đài, phần bê tông đài ngoài cọc quá ít nên dễ nứt, vỡ mép đài, nhất là khi cọc lệch vị trí lúc thi công.',
  embed: 'Liên kết cọc với đài kém, không truyền được mô men và lực ngang; đài dễ bị chọc thủng hoặc tách khỏi cọc.',
  steelL: 'Cọc không đủ khả năng chịu uốn, kéo khi cẩu lắp, vận chuyển, hạ cọc nên dễ nứt, gãy.',
  stirHead: 'Đầu và mũi cọc chịu ứng suất tập trung khi đóng, ép nhưng đai không đủ dày nên bê tông dễ nứt, vỡ.',
  stirLen: 'Vùng bê tông chịu ứng suất lớn ở đầu, mũi cọc không được đai bó đủ chiều dài nên vẫn dễ nứt, vỡ.',
  tip: 'Mũi bê tông xuyên sỏi cuội, đá dễ bị vỡ, cọc không đóng hoặc ép tới độ sâu thiết kế.'
};
// base (kích thước bản đế) là yêu cầu cấu tạo thuần: không hỏi hậu quả
function consKeys(S) { return GROUP_ITEMS[S.g].filter(function (k) { return CONSEQ[k] && k !== 'base'; }); }
function consequenceKey(S) {
  var e = S.errs.filter(function (k) { return k !== 'base'; });
  return e.length ? e[0] : null;
}

// ═════════ Ý a: ngưỡng cấu tạo (điền số / trắc nghiệm) ═════════
function mk(id, q, ans, opts, unit, basis, pre) { return { id: id, q: q, ans: ans, opts: opts, unit: unit, basis: basis, pre: pre }; }
function A_FOOT() {
  return [
    mk('a1', 'Cấp bê tông móng tối thiểu: B…', 15, [7.5, 10, 15, 25], '', BASIS.conc, 'B'),
    mk('a2', 'Chiều dày tối thiểu của lớp bê tông lót (mm)', 100, [50, 100, 150, 200], ' mm', BASIS.lot),
    mk('a3', 'Lớp bảo vệ cốt thép đáy tối thiểu khi CÓ bê tông lót (mm)', 40, [15, 25, 40, 50], ' mm', BASIS.abv),
    mk('a4', 'Lớp bảo vệ cốt thép đáy tối thiểu khi KHÔNG có bê tông lót (mm)', 70, [40, 50, 70, 100], ' mm', BASIS.abv),
    mk('a5', 'Khoảng cách trục tối đa giữa các thanh thép chịu lực (mm)', 400, [300, 400, 500, 600], ' mm', BASIS.steeld),
    mk('a6', 'Chiều dày mép bản đế tối thiểu (mm)', 150, [100, 150, 200, 250], ' mm', BASIS.base),
    mk('a7', 'Đường kính thép chịu lực tối thiểu (mm)', 10, [6, 8, 10, 12], ' mm', BASIS.steeld)
  ];
}
function A_Q(S) {
  switch (S.g) {
    case 'don': case 'bang': return A_FOOT();
    case 'dem': return [
      mk('a1', 'Cấp bê tông móng tối thiểu: B…', 15, [7.5, 10, 15, 25], '', BASIS.conc, 'B'),
      mk('a2', 'Chiều dày tối thiểu của lớp bê tông lót (mm)', 100, [50, 100, 150, 200], ' mm', BASIS.lot),
      mk('a3', 'Lớp bảo vệ cốt thép đáy tối thiểu khi CÓ bê tông lót (mm)', 40, [15, 25, 40, 50], ' mm', BASIS.abv),
      mk('a4', 'Khoảng cách trục tối đa giữa các thanh thép chịu lực (mm)', 400, [300, 400, 500, 600], ' mm', BASIS.steeld),
      mk('a5', 'Góc lan truyền tải trong đệm cát dùng để tính bề rộng đáy đệm (độ)', 8, [4, 8, 12, 15], '°', BASIS.dem)
    ];
    case 'dai': return [
      mk('a1', 'Cấp bê tông đài tối thiểu: B…', 15, [7.5, 10, 15, 25], '', BASIS.conc, 'B'),
      mk('a2', 'Chiều dày tối thiểu của lớp bê tông lót (mm)', 100, [50, 100, 150, 200], ' mm', BASIS.lot),
      mk('a3', 'Khoảng cách trục cọc MA SÁT tối thiểu: … × d', 3, [1.5, 2, 3, 6], 'd', BASIS.pile_s),
      mk('a4', 'Khoảng cách trục cọc CHỐNG tối thiểu: … × d', 1.5, [1, 1.5, 3, 4], 'd', BASIS.pile_s),
      mk('a5', 'Khoảng cách tối thiểu từ mép cọc biên đến mép đài (mm)', 250, [100, 150, 250, 500], ' mm', BASIS.delta),
      mk('a6', 'Đầu cọc ngập vào đài tối thiểu (mm)', 100, [50, 100, 200, 500], ' mm', BASIS.embed),
      mk('a7', 'Đoạn nối (neo) thép cọc vào đài tối thiểu: … × d', 20, [10, 15, 20, 40], 'd', BASIS.embed)
    ];
    case 'coc': return [
      mk('a1', 'Cấp bê tông cọc tối thiểu (không ứng suất trước): B…', 15, [7.5, 10, 15, 25], '', BASIS.conc, 'B'),
      mk('a2', 'Đường kính thép dọc tối thiểu của cọc (mm)', 14, [10, 12, 14, 20], ' mm', BASIS.steelL),
      mk('a3', 'Hàm lượng thép dọc tối thiểu của cọc (% diện tích tiết diện)', 0.8, [0.2, 0.4, 0.8, 2], ' %', BASIS.steelL),
      mk('a4', 'Chiều dài đoạn đai dày ở đầu và mũi cọc tối thiểu: … × cạnh nhỏ', 3, [1, 2, 3, 6], ' lần', BASIS.stirLen),
      mk('a5', 'Tiết diện cọc đóng, ép BTCT không quá … m', 0.8, [0.4, 0.6, 0.8, 1.0], ' m', 'TCVN 10304 Điều 6.3.')
    ];
  }
}
function refRows(S) {
  var R = RULE;
  var concRow = ['Bê tông ' + (S.g === 'coc' ? 'cọc' : S.g === 'dai' ? 'đài' : 'móng'), '≥ B' + R.concMin, 'TCVN 5574 Đ.6.1.1.6'];
  var lotRow = ['Bê tông lót', 'dày ≥ ' + R.lotT + ' mm, ≥ B7,5; rộng hơn đáy; cấp không cao hơn bê tông móng', 'TCVN 9362 Đ.4.23; quy ước tổ môn'];
  var abvRow = ['Lớp bảo vệ đáy', '≥ ' + R.abvLot + ' mm (có lót); ≥ ' + R.abvNoLot + ' mm (không lót)', 'TCVN 5574 Bảng 19; 9362 Đ.4.23'];
  var posRow = ['Lưới thép', 'hai phương, đặt phía dưới', 'TCVN 5574 Đ.10.4.1, 10.4.8'];
  var dsRow = ['Thép chịu lực', 'd ≥ ' + R.dMin + ' mm; s ≤ 1,5h và ≤ ' + R.sMax + ' mm', '5574 Đ.10.3.3.3; d: quy ước tổ môn'];
  var baseRow = ['Bản đế', 'mép t ≥ ' + R.tMin + ' mm; vát khi h > ' + R.vatH + ' mm', 'quy ước tổ môn'];
  switch (S.g) {
    case 'don': return [concRow, lotRow, abvRow, posRow, dsRow, baseRow];
    case 'bang': return [concRow, lotRow, abvRow, ['Thép chịu lực', 'đặt theo phương ngang (phương b), thép phân bố đặt dọc phía trên', 'Eurocode (Calavera); V11; quy ước tổ môn'], dsRow, baseRow];
    case 'dem': return [concRow, lotRow, abvRow, posRow, dsRow, ['Đệm cát', 'mở rộng ra ngoài mép móng: B_đ ≥ b + 2h_đ·tan8°', 'V10 mục 2.4.3.6; quy ước tổ môn']];
    case 'dai': return [concRow, lotRow, ['Khoảng cách trục cọc', 'cọc ma sát ≥ 3d; cọc chống ≥ 1,5d', 'TCVN 10304 Đ.8.13'],
      ['Mép cọc biên → mép đài', '≥ 250 mm và ≥ ½ cạnh cọc', 'quy ước tổ môn'],
      ['Liên kết ngàm', 'đầu cọc ngập ≥ 100 mm; neo thép cọc ≥ 20d', 'TCVN 10304 Đ.8.8, 8.9; quy ước tổ môn'], posRow];
    case 'coc': return [concRow, ['Cốt thép dọc', 'd ≥ 14 mm; hàm lượng ≥ 0,8 %; liên tục suốt chiều dài', 'TCXD 205:1998 (tham khảo)'],
      ['Cốt đai đầu và mũi', 'dày hơn thân cọc', 'TCXD 205:1998 (tham khảo)'],
      ['Đoạn đai dày', 'dài ≥ 3 lần cạnh nhỏ, tính từ hai đầu cọc', 'TCXD 205:1998 (tham khảo)'],
      ['Mũi cọc', 'bọc thép khi xuyên đá, sỏi cuội; sét đồng nhất thì không bắt buộc nhọn', 'TCXD 205:1998; TCVN 10304 Đ.6.3e']];
  }
}
function intro(S) {
  switch (S.g) {
    case 'don': return 'Hình là mặt cắt một <b>móng đơn bê tông cốt thép dưới cột</b> (cột ' + S.colB + '×' + S.colL + ' mm, đáy móng ' + S.B + '×' + S.L + ' m).';
    case 'bang': return 'Hình là mặt cắt ngang một đoạn <b>móng băng bê tông cốt thép dưới dầm BTCT</b> (dầm b = ' + S.beamB + ' mm, bề rộng băng ' + S.B + ' m; chỉ xét tải đứng).';
    case 'dem': return 'Hình là mặt cắt một <b>móng đơn BTCT đặt trên đệm cát</b> thay toàn bộ lớp đất yếu (đáy móng b = ' + S.b + ' mm).';
    case 'dai': return 'Hình là mặt cắt một <b>đài cọc BTCT</b> (đài bốn cọc, cắt qua hai cọc), liên kết ngàm giữa cọc và đài; cạnh cọc d = ' + S.pd + ' mm.';
    case 'coc': return 'Hình là mặt cắt dọc và mặt cắt ngang một <b>cọc BTCT đúc sẵn tiết diện vuông</b> cạnh a = ' + S.pa + ' mm (đầu cọc ở trên, mũi cọc ở dưới, thân cọc vẽ rút gọn).';
  }
}

// ═════════ SVG ═════════
function svgOpen(h) {
  return '<svg viewBox="0 0 680 ' + h + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:680px;height:auto;background:#fff;border:1px solid #BBDEFB;border-radius:10px" font-family="Plus Jakarta Sans,sans-serif">' +
    '<defs><pattern id="soil" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 10L10 0" stroke="#A1887F" stroke-width="1"/></pattern>' +
    '<pattern id="sand" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.8" fill="#C9A227"/><circle cx="5" cy="5" r="0.8" fill="#C9A227"/></pattern>' +
    '<marker id="ar" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse"><path d="M0 0L6 3L0 6z" fill="#37474F"/></marker></defs>';
}
function dimV(o, x, y1, y2) {
  o.push('<line x1="' + x + '" y1="' + y1 + '" x2="' + x + '" y2="' + y2 + '" stroke="#37474F" marker-start="url(#ar)" marker-end="url(#ar)"/>');
}
function dimH(o, y, x1, x2, txt) {
  o.push('<line x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" stroke="#37474F" marker-start="url(#ar)" marker-end="url(#ar)"/>');
  if (txt) o.push('<text x="' + ((x1 + x2) / 2) + '" y="' + (y - 5) + '" font-size="12" text-anchor="middle" fill="#37474F">' + txt + '</text>');
}
function mark(o, n, mx, my, tx, ty, label) {
  o.push('<line x1="' + mx + '" y1="' + my + '" x2="' + tx + '" y2="' + ty + '" stroke="#1565C0" stroke-width="1.2"/>');
  o.push('<circle cx="' + mx + '" cy="' + my + '" r="12" fill="#1565C0"/><text x="' + mx + '" y="' + (my + 5) + '" font-size="14" font-weight="700" fill="#fff" text-anchor="middle">' + n + '</text>');
  if (label) o.push('<text x="' + (mx + 18) + '" y="' + (my + 5) + '" font-size="12" fill="#0D47A1" font-weight="600">' + label + '</text>');
}
function caption(o, H, txt) { o.push('<text x="340" y="' + (H - 8) + '" font-size="11" text-anchor="middle" fill="#546E7A">' + txt + '</text>'); }
function poly(pts, fill, stroke, sw) {
  return '<polygon points="' + pts.map(function (p) { return p.join(','); }).join(' ') + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + sw + '"/>';
}

function drawFooting(S) {     // đơn, băng, đệm
  var dem = S.g === 'dem', bang = S.g === 'bang';
  var H = dem ? 470 : 400, sc = dem ? 0.2 : 0.26, cx = 250, W = 300, x0 = cx - W / 2, x1 = cx + W / 2;
  var yb = dem ? 215 : 250;
  var hp = S.h * sc, tp = S.t * sc, ytop = yb - hp, ap = S.abv * sc;
  var lotT = S.haveLot ? S.lot.t * sc : 0, lx = S.haveLot ? (S.lot.wider ? 26 : -26) : 0;
  var colW = bang ? 90 : 70, colH = dem ? 50 : 70;
  var o = [svgOpen(H)];
  var ys = yb + lotT, cushB = 0, cushBot = ys;
  if (dem) {
    var k = W / S.b, Bdp = S.Bd * k, hdp = S.hd * 0.12;
    cushBot = ys + hdp;
    o.push('<rect x="20" y="' + ys + '" width="480" height="' + (hdp + 40) + '" fill="url(#soil)" stroke="#8D6E63"/>');
    o.push('<text x="400" y="' + (cushBot + 30) + '" font-size="11" fill="#6D4C41">Đất yếu → đất tốt</text>');
    o.push(poly([[x0 - lx, ys], [x1 + lx, ys], [cx + Bdp / 2, cushBot], [cx - Bdp / 2, cushBot]], 'url(#sand)', '#8D6E63', 1.5));
    cushB = Bdp;
  } else {
    o.push('<rect x="40" y="' + ys + '" width="420" height="70" fill="url(#soil)" stroke="#8D6E63"/>');
    o.push('<text x="400" y="' + (ys + 60) + '" font-size="11" fill="#6D4C41">Đất nền</text>');
  }
  if (S.haveLot) o.push('<rect x="' + (x0 - lx) + '" y="' + yb + '" width="' + (W + 2 * lx) + '" height="' + lotT + '" fill="#CFD8DC" stroke="#455A64"/>');
  var pts = S.vat
    ? [[x0, yb], [x1, yb], [x1, yb - tp], [cx + colW / 2, ytop], [cx - colW / 2, ytop], [x0, yb - tp]]
    : [[x0, yb], [x1, yb], [x1, ytop], [x0, ytop]];
  o.push(poly(pts, '#ECEFF1', '#263238', 2));
  o.push('<rect x="' + (cx - colW / 2) + '" y="' + (ytop - colH) + '" width="' + colW + '" height="' + colH + '" fill="#ECEFF1" stroke="#263238" stroke-width="2"/>');
  if (bang) o.push('<text x="' + cx + '" y="' + (ytop - colH / 2 + 4) + '" font-size="12" text-anchor="middle" fill="#546E7A">dầm BTCT</text>');
  var my = S.steelUp ? (yb - tp + 10) : (yb - ap);
  var n = Math.max(3, Math.min(9, Math.round(W / (S.s * sc)))), i;
  if (bang && S.swap) {      // sai: thép dọc (chấm) sát đáy, thép ngang (đường) nằm trên
    for (i = 0; i <= n; i++) o.push('<circle cx="' + (x0 + 14 + i * (W - 28) / n) + '" cy="' + (my + 2) + '" r="2.8" fill="#C62828"/>');
    o.push('<line x1="' + (x0 + 8) + '" y1="' + (my - 7) + '" x2="' + (x1 - 8) + '" y2="' + (my - 7) + '" stroke="#EF6C00" stroke-width="2.5"/>');
  } else if (bang) {         // đúng: thép ngang (đường) ở đáy, thép dọc phân bố (chấm) nằm trên
    o.push('<line x1="' + (x0 + 8) + '" y1="' + my + '" x2="' + (x1 - 8) + '" y2="' + my + '" stroke="#C62828" stroke-width="3"/>');
    for (i = 0; i <= n; i++) o.push('<circle cx="' + (x0 + 14 + i * (W - 28) / n) + '" cy="' + (my - 6) + '" r="2.4" fill="#EF6C00"/>');
  } else {
    o.push('<line x1="' + (x0 + 8) + '" y1="' + my + '" x2="' + (x1 - 8) + '" y2="' + my + '" stroke="#C62828" stroke-width="3"/>');
    for (i = 0; i <= n; i++) o.push('<circle cx="' + (x0 + 14 + i * (W - 28) / n) + '" cy="' + (my + 5) + '" r="2.6" fill="#C62828"/>');
  }
  dimV(o, x0 - 22, ytop, yb); o.push('<text x="' + (x0 - 28) + '" y="' + ((ytop + yb) / 2) + '" font-size="12" text-anchor="end" fill="#37474F">h = ' + S.h + '</text>');
  dimV(o, x1 + 22, yb - tp, yb); o.push('<text x="' + (x1 + 28) + '" y="' + (yb - tp / 2 + 4) + '" font-size="12" fill="#37474F">t = ' + S.t + '</text>');
  dimV(o, x0 + 24, yb - ap, yb);
  o.push('<text x="' + (x0 - 26) + '" y="' + (yb - 3) + '" font-size="11" text-anchor="end" fill="#37474F">a_bv = ' + S.abv + '</text>');
  if (S.haveLot) o.push('<text x="' + (x1 + lx + 6) + '" y="' + (yb + lotT / 2 + 4) + '" font-size="11" fill="#37474F">lót ' + S.lot.t + '</text>');
  var slopeMidY = S.vat ? (yb - tp + ytop) / 2 : ytop;
  mark(o, 1, 560, 70, x1 - 40, yb - tp * 0.5 - 4, fmtB(S.conc));
  mark(o, 2, 560, dem ? 190 : 330, x1 + lx - 4, yb + lotT * 0.5, S.haveLot ? fmtB(S.lot.grade) : 'không lót');
  mark(o, 3, 70, dem ? 270 : 335, x0 + 14, yb - ap * 0.5, '');
  mark(o, 4, 560, dem ? 130 : 190, x1 - 30, my, bang ? (S.swap ? 'chịu lực dọc' : 'chịu lực ngang') : (S.steelUp ? 'thép trên' : 'thép dưới'));
  mark(o, 5, 150, 30, x0 + 14 + (W - 28) / n, my + 5, 'φ' + S.d + ' a' + S.s);
  if (dem) {
    dimH(o, cushBot + 14, cx - cushB / 2, cx + cushB / 2, 'B_đ = ' + S.Bd);
    dimV(o, cx + cushB / 2 + 18, ys, cushBot); o.push('<text x="' + (cx + cushB / 2 + 24) + '" y="' + ((ys + cushBot) / 2 + 4) + '" font-size="12" fill="#37474F">h_đ = ' + S.hd + '</text>');
    o.push('<text x="' + (cx - cushB / 2 + 6) + '" y="' + (cushBot - 8) + '" font-size="11" fill="#6D4C41">θ = ' + RULE.thetaDeg + '°</text>');
    mark(o, 6, 560, 330, cx + cushB / 2 - 6, cushBot - 4, 'B_đ');
    caption(o, H, 'Mặt cắt móng đơn BTCT trên đệm cát · đáy móng b = ' + S.b + ' mm');
  } else {
    mark(o, 6, 380, 30, S.vat ? (cx + colW / 2 + (x1 - cx - colW / 2) * 0.5) : (x1 - 4), slopeMidY, '');
    caption(o, H, bang ? 'Mặt cắt ngang móng băng dưới dầm · bề rộng băng ' + S.B + ' m' : 'Mặt cắt móng đơn dưới cột ' + S.colB + '×' + S.colL + ' · đáy móng ' + S.B + '×' + S.L + ' m');
  }
  o.push('</svg>');
  return o.join('');
}

function drawCap(S) {          // đài cọc
  var H = 455, sc = 0.17, yb = 260, o = [svgOpen(H)];
  var hp = S.h * sc, ytop = yb - hp, pw = S.pd * sc, sp = S.ps * sc, dl = S.delta * sc;
  var Wd = sp + pw + 2 * dl, cx = 300, x0 = cx - Wd / 2, x1 = cx + Wd / 2;
  var lotT = S.haveLot ? S.lot.t * sc : 0, lx = S.haveLot ? (S.lot.wider ? 20 : -20) : 0;
  var pl = x0 + dl + pw / 2, pr = pl + sp;
  o.push('<rect x="20" y="' + (yb + lotT) + '" width="480" height="150" fill="url(#soil)" stroke="#8D6E63"/>');
  if (S.haveLot) o.push('<rect x="' + (x0 - lx) + '" y="' + yb + '" width="' + (Wd + 2 * lx) + '" height="' + lotT + '" fill="#CFD8DC" stroke="#455A64"/>');
  [pl, pr].forEach(function (px) {
    o.push('<rect x="' + (px - pw / 2) + '" y="' + (yb - S.embed * sc) + '" width="' + pw + '" height="' + (lotT + 110 + S.embed * sc) + '" fill="#E0E0E0" stroke="#263238" stroke-width="1.5"/>');
  });
  o.push('<rect x="' + x0 + '" y="' + ytop + '" width="' + Wd + '" height="' + hp + '" fill="#ECEFF1" fill-opacity="0.85" stroke="#263238" stroke-width="2"/>');
  [pl, pr].forEach(function (px) {
    o.push('<rect x="' + (px - pw / 2) + '" y="' + (yb - S.embed * sc) + '" width="' + pw + '" height="' + (S.embed * sc) + '" fill="#CFD8DC" stroke="#263238" stroke-dasharray="4 3"/>');
    var top = yb - S.embed * sc - S.anchor * sc;
    [px - pw / 2 + 8, px + pw / 2 - 8].forEach(function (bx) { o.push('<line x1="' + bx + '" y1="' + top + '" x2="' + bx + '" y2="' + (yb + 40) + '" stroke="#C62828" stroke-width="2.2"/>'); });
  });
  var my2 = S.steelUp ? ytop + 14 : yb - 12;
  o.push('<line x1="' + (x0 + 6) + '" y1="' + my2 + '" x2="' + (x1 - 6) + '" y2="' + my2 + '" stroke="#EF6C00" stroke-width="3"/>');
  o.push('<rect x="' + (cx - 30) + '" y="' + (ytop - 55) + '" width="60" height="55" fill="#ECEFF1" stroke="#263238" stroke-width="2"/>');
  dimH(o, yb + lotT + 100, pl, pr, 's = ' + S.ps);
  dimH(o, yb + lotT + 125, x0, pl - pw / 2, '');
  o.push('<text x="' + (x0 + 2) + '" y="' + (yb + lotT + 143) + '" font-size="11" fill="#37474F">δ = ' + S.delta + '</text>');
  dimV(o, x0 - 18, ytop, yb); o.push('<text x="' + (x0 - 24) + '" y="' + ((ytop + yb) / 2) + '" font-size="12" text-anchor="end" fill="#37474F">h = ' + S.h + '</text>');
  o.push('<text x="' + (pl + pw / 2 + 4) + '" y="' + (yb - S.embed * sc / 2 + 4) + '" font-size="10" fill="#37474F">' + S.embed + '</text>');
  o.push('<text x="' + (pl - pw / 2 - 4) + '" y="' + (yb - S.embed * sc - S.anchor * sc / 2 + 4) + '" font-size="10" text-anchor="end" fill="#C62828">neo ' + S.anchor + '</text>');
  if (S.haveLot) o.push('<text x="' + (x1 + lx + 6) + '" y="' + (yb + lotT / 2 + 4) + '" font-size="11" fill="#37474F">lót ' + S.lot.t + '</text>');
  mark(o, 1, 560, 70, x1 - 30, ytop + hp * 0.35, fmtB(S.conc));
  mark(o, 2, 560, 210, x1 + lx - 3, yb + lotT * 0.5, S.haveLot ? fmtB(S.lot.grade) : '');
  mark(o, 3, 560, 330, (pl + pr) / 2 + 20, yb + lotT + 100, S.pileType === 'friction' ? 'cọc ma sát' : 'cọc chống');
  mark(o, 4, 70, 380, x0 + dl / 2, yb + lotT + 125, '');
  mark(o, 5, 150, 30, pl - pw / 2 + 8, yb - S.embed * sc - S.anchor * sc / 2, '');
  mark(o, 6, 380, 30, x1 - 40, my2, S.steelUp ? 'thép trên' : 'thép dưới');
  caption(o, H, 'Mặt cắt đài cọc BTCT (qua hai cọc) · cạnh cọc d = ' + S.pd + ' mm');
  o.push('</svg>');
  return o.join('');
}

function drawPile(S) {         // cọc BTCT đúc sẵn
  var H = 430, ws = 0.25, ls = 0.12, o = [svgOpen(H)];
  var w = S.pa * ws, cx = 200, x0 = cx - w / 2, x1 = cx + w / 2, y0 = 40, yb = 340;
  var dens = S.Ld * ls, sbp = S.sb * ls, sdp = S.sd * ls;
  o.push('<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + (yb - y0) + '" fill="#ECEFF1" stroke="#263238" stroke-width="2"/>');
  o.push(poly([[x0, yb], [x1, yb], [cx, yb + 55]], '#ECEFF1', '#263238', 2));
  if (S.tip === 'thep') o.push(poly([[cx - w * 0.22, yb + 30], [cx + w * 0.22, yb + 30], [cx, yb + 55]], '#455A64', '#263238', 1.5));
  [x0 + 7, x1 - 7].forEach(function (bx) { o.push('<line x1="' + bx + '" y1="' + (y0 + 4) + '" x2="' + bx + '" y2="' + (yb - 4) + '" stroke="#C62828" stroke-width="2.4"/>'); });
  function stir(y) { o.push('<line x1="' + (x0 + 4) + '" y1="' + y + '" x2="' + (x1 - 4) + '" y2="' + y + '" stroke="#EF6C00" stroke-width="1.3"/>'); }
  var y;
  for (y = y0 + 6; y < y0 + dens; y += sdp) stir(y);
  for (y = y0 + dens + sbp * 0.5; y < yb - dens; y += sbp) stir(y);
  for (y = yb - 6; y > yb - dens; y -= sdp) stir(y);
  o.push('<path d="M' + (x0 - 6) + ' ' + (yb / 2 + 25) + 'l' + (w + 12) + ' -8m-' + (w + 12) + ' 6l' + (w + 12) + ' -8" stroke="#263238" fill="none"/>');
  dimV(o, x0 - 28, y0, y0 + dens); o.push('<text x="' + (x0 - 34) + '" y="' + (y0 + dens / 2 + 4) + '" font-size="12" text-anchor="end" fill="#37474F">' + S.Ld + '</text>');
  dimH(o, y0 - 14, x0, x1, 'a = ' + S.pa);
  o.push('<rect x="270" y="270" width="190" height="100" rx="6" fill="' + (S.soil === 'cuoi' ? '#FFF3E0' : '#EFEBE9') + '" stroke="#8D6E63"/>');
  o.push('<text x="282" y="292" font-size="12" font-weight="600" fill="#6D4C41">Địa tầng cọc xuyên qua:</text>');
  o.push('<text x="282" y="312" font-size="12" fill="#6D4C41">' + (S.soil === 'set' ? 'sét đồng nhất' : 'sỏi cuội xen kẹp') + '</text>');
  var cs = 110, ccx = 570, ccy = 140;
  o.push('<rect x="' + (ccx - cs / 2) + '" y="' + (ccy - cs / 2) + '" width="' + cs + '" height="' + cs + '" fill="#ECEFF1" stroke="#263238" stroke-width="2"/>');
  o.push('<rect x="' + (ccx - cs / 2 + 7) + '" y="' + (ccy - cs / 2 + 7) + '" width="' + (cs - 14) + '" height="' + (cs - 14) + '" fill="none" stroke="#EF6C00" stroke-width="1.3"/>');
  var half = cs / 2 - 11, bars;
  if (S.nl === 4) bars = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  else if (S.nl === 6) bars = [[-1, -1], [0, -1], [1, -1], [-1, 1], [0, 1], [1, 1]];
  else bars = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
  bars.forEach(function (b) { o.push('<circle cx="' + (ccx + b[0] * half) + '" cy="' + (ccy + b[1] * half) + '" r="4" fill="#C62828"/>'); });
  o.push('<text x="' + ccx + '" y="' + (ccy + cs / 2 + 20) + '" font-size="12" text-anchor="middle" fill="#37474F">Mặt cắt ngang: ' + S.nl + 'φ' + S.dl + '</text>');
  mark(o, 1, 330, 60, x1 - 6, y0 + 40, fmtB(S.conc));
  mark(o, 2, 330, 120, x1 - 7, y0 + 110, S.nl + 'φ' + S.dl);
  mark(o, 3, 330, 180, x1 - 4, y0 + 8, 'φ6 a' + S.sd + ' / a' + S.sb);
  mark(o, 4, 70, 140, x0 - 10, y0 + dens / 2, '');
  mark(o, 5, 140, 395, cx, yb + 40, S.tip === 'bt' ? 'mũi bê tông' : 'mũi bọc thép');
  caption(o, H, 'Cọc BTCT đúc sẵn · mặt cắt dọc (thân rút gọn) và mặt cắt ngang');
  o.push('</svg>');
  return o.join('');
}
function drawSVG(S) { return S.g === 'dai' ? drawCap(S) : S.g === 'coc' ? drawPile(S) : drawFooting(S); }

var API = {
  CIRC: CIRC, GROUP_ORDER: GROUP_ORDER, GROUP_NAME: GROUP_NAME, EX_LBL: EX_LBL, GROUP_ITEMS: GROUP_ITEMS, ITEM_NAME: ITEM_NAME,
  RULE: RULE, OPT: OPT, BASIS: BASIS, CONSEQ: CONSEQ,
  gen: gen, violations: violations, itemText: itemText, correctOpt: correctOpt, consKeys: consKeys,
  consequenceKey: consequenceKey, A_Q: A_Q, refRows: refRows, intro: intro, drawSVG: drawSVG, fmtB: fmtB,
  items: function (S) { return GROUP_ITEMS[S.g]; }
};
if (typeof module !== 'undefined' && module.exports) module.exports = API;
else root.CLO4 = API;

})(typeof window !== 'undefined' ? window : this);
