// ═══════════════════════════════════════════════════════════════
// BT NỀN MÓNG — clo3.js : CLO3 Móng cọc (mức C4) theo giáo trình NỀN MÓNG V08 (chương 4) + TCVN 10304
// Sinh đề + đáp án + lời giải + hình SVG cho 6 bài:
//   Ex1 SCT cọc đóng — bảng tra (Bảng 2, 3) · Ex2 SCT cọc — SPT · Ex3 SCT cọc — CPT
//   Ex4 Vật liệu cọc và lực ép · Ex5 Phản lực đầu cọc, kiểm tra Pmax · Ex6 Đài cọc: đâm thủng 2 phương và thép (công thức theo đề mẫu)
// Thuần JS (chạy cả trong trình duyệt lẫn Node): CLO3.gen(stt, exIdx, dangIdx, seededRng)
// Dạng bài theo "Đề NM CLO3 mức C4 (Khanh, T. Đông comment V01)"; số liệu sinh mới. Xem QUYET_DINH.md 2026-10-27 (CLO3).
// Bảng tra: TCVN 10304:2014 Bảng 2, Bảng 3, Phụ lục G Bảng G2 (cọc đóng, thành bê tông) [XM: đọc trực tiếp từ bản PDF].
// ═══════════════════════════════════════════════════════════════
(function (root) {
'use strict';

var K = { gk1: 1.4, gk2: 1.5, gk3: 1.25, gf: 1.1, gbt: 25, gcover: 0.25 };   // γk: bảng tra / SPT / CPT (V08 4.3.7); γf cọc; γbt; mép cọc → mép đài
var MAT = {
  B20: { Rb: 11500, Rbt: 900 }, B25: { Rb: 14500, Rbt: 1050 }, B30: { Rb: 17000, Rbt: 1150 },
  CB300: { Rs: 260000 }, CB400: { Rs: 350000 }
};
var BAR = { 14: 1.539, 16: 2.011, 18: 2.545, 20: 3.142, 22: 3.801, 25: 4.909 };   // cm² một thanh
var EX_LBL = ['SCT cọc — bảng tra', 'SCT cọc — SPT', 'SCT cọc — CPT', 'Vật liệu cọc và lực ép', 'Phản lực đầu cọc', 'Đài cọc: chọc thủng, thép'];

// ── tiện ích (giống clo2.js) ─────────────────────────────────
function f(v, d) { return v.toFixed(d).replace('.', ','); }
function nz(x) { return (Math.round(x * 100) / 100).toString().replace('.', ','); }   // số gọn, bỏ số 0 thừa
function rnd(v, d) { var m = Math.pow(10, d); return Math.round(v * m) / m; }
function pick(r, a) { return a[Math.floor(r() * a.length)]; }
function range(a, b, s) { var o = []; for (var x = a; x <= b + 1e-9; x += s) o.push(rnd(x, 4)); return o; }
function search(r, sampler, accept, tries) {
  var s, i;
  for (i = 0; i < (tries || 4000); i++) { s = sampler(r); if (accept(s)) { s._tries = i; return s; } }
  s._fail = true; return s;
}

// ── Bảng 2 TCVN 10304:2014: q_b (kPa) cọc đóng/ép; hàng theo độ sâu mũi cọc ──
var B2_D = [3, 4, 5, 7, 10, 15, 20, 25, 30, 35];
var B2 = {
  c00: [7500, 8300, 8800, 9700, 10500, 11700, 12600, 13400, 14200, 15000],   // cát sỏi cuội | đất dính IL = 0,0
  c01s: [6600, 6800, 7000, 7300, 7700, 8200, 8500, 9000, 9500, 10000],       // cát hạt to
  c01c: [4000, 5100, 6200, 6900, 7300, 7500, 8500, 9000, 9500, 10000],       // IL = 0,1
  c02: [3000, 3800, 4000, 4300, 5000, 5600, 6200, 6800, 7400, 8000],         // IL = 0,2
  c03s: [3100, 3200, 3400, 3700, 4000, 4400, 4800, 5200, 5600, 6000],        // cát hạt vừa
  c03c: [2000, 2500, 2800, 3300, 3500, 4000, 4500, 5200, 5600, 6000],        // IL = 0,3
  c04s: [2000, 2100, 2200, 2400, 2600, 2900, 3200, 3500, 3800, 4100],        // cát hạt nhỏ
  c04c: [1200, 1600, 2000, 2200, 2400, 2900, 3200, 3500, 3800, 4100],        // IL = 0,4
  c05: [1100, 1250, 1300, 1400, 1500, 1650, 1800, 1950, 2100, 2250],         // cát bụi | IL = 0,5
  c06: [600, 700, 800, 850, 900, 1000, 1100, 1200, 1300, 1400]               // IL = 0,6
};
var B2_CLAY = ['c00', 'c01c', 'c02', 'c03c', 'c04c', 'c05', 'c06'];
var B2_SAND = { gravel: 'c00', coarse: 'c01s', medium: 'c03s', fine: 'c04s', silt: 'c05' };
var SAND_NAME = { gravel: 'cát chứa sỏi cuội', coarse: 'cát hạt to', medium: 'cát hạt vừa', fine: 'cát hạt nhỏ', silt: 'cát bụi' };

// ── Bảng 3: f_i (kPa); cột: cát hạt to/vừa | hạt nhỏ | bụi (= cột IL ≤0,2 | 0,3 | 0,4), rồi IL 0,5…1,0 ──
var B3_D = [1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 25, 30];
var B3_R = [[35, 23, 15, 12, 8, 4, 4, 3, 2], [42, 30, 21, 17, 12, 7, 5, 4, 4], [48, 35, 25, 20, 14, 8, 7, 6, 5],
  [53, 38, 27, 22, 16, 9, 8, 7, 5], [56, 40, 29, 24, 17, 10, 8, 7, 6], [58, 42, 31, 25, 18, 10, 8, 7, 6],
  [62, 44, 33, 26, 19, 10, 8, 7, 6], [65, 46, 34, 27, 19, 10, 8, 7, 6], [72, 51, 38, 28, 20, 11, 8, 7, 6],
  [79, 56, 41, 30, 20, 12, 8, 7, 6], [86, 61, 44, 32, 20, 12, 8, 7, 6], [93, 66, 47, 34, 21, 12, 9, 8, 6]];

// ── Bảng G2 (cọc đóng, thành bê tông): nhóm đất theo q_c ──
var G2 = {
  dinh_chay: { lbl: 'đất dính chảy, bùn (q<sub>c</sub> < 2000 kPa)', kc: 0.5, al: 30, fmax: 15 },
  dinh_deo: { lbl: 'đất dính dẻo mềm – dẻo cứng (q<sub>c</sub> = 2000 ÷ 5000 kPa)', kc: 0.45, al: 40, fmax: 35 },
  dinh_cung: { lbl: 'đất dính nửa cứng đến cứng (q<sub>c</sub> > 5000 kPa)', kc: 0.55, al: 60, fmax: 35 },
  cat_chay: { lbl: 'cát chảy (q<sub>c</sub> ≤ 2500 kPa)', kc: 0.5, al: 80, fmax: 35 },
  cat_vua: { lbl: 'cát chặt vừa (q<sub>c</sub> = 2500 ÷ 10000 kPa)', kc: 0.5, al: 100, fmax: 80 },
  cat_chat: { lbl: 'cát chặt đến rất chặt (q<sub>c</sub> > 10000 kPa)', kc: 0.4, al: 150, fmax: 120 }
};

// nội suy tuyến tính theo độ sâu; trả thêm hai mốc để viết lời giải
function interp(D, V, x) {
  var i, t;
  if (x <= D[0]) return { v: V[0], d0: D[0], d1: D[0], v0: V[0], v1: V[0] };
  for (i = 0; i < D.length - 1; i++) {
    if (x <= D[i + 1] + 1e-9) { t = (x - D[i]) / (D[i + 1] - D[i]); return { v: V[i] + t * (V[i + 1] - V[i]), d0: D[i], d1: D[i + 1], v0: V[i], v1: V[i + 1] }; }
  }
  return { v: V[V.length - 1], d0: D[D.length - 1], d1: D[D.length - 1], v0: V[V.length - 1], v1: V[V.length - 1] };
}
function txtI(it, z) {
  if (Math.abs(z - it.d0) < 1e-9) return 'z = ' + nz(it.d0) + ' m → ' + nz(it.v0);
  if (Math.abs(z - it.d1) < 1e-9) return 'z = ' + nz(it.d1) + ' m → ' + nz(it.v1);
  return 'z = ' + nz(it.d0) + ' m → ' + nz(it.v0) + ' ; z = ' + nz(it.d1) + ' m → ' + nz(it.v1) + ' ⇒ nội suy z = ' + nz(z) + ' m: ' +
    nz(it.v0) + ' + (' + nz(z) + ' − ' + nz(it.d0) + ')/(' + nz(it.d1) + ' − ' + nz(it.d0) + ')·(' + nz(it.v1) + ' − ' + nz(it.v0) + ') = ' + f(it.v, 2);
}
function col(R, i) { return R.map(function (r) { return r[i]; }); }

// q_b theo Bảng 2: s = {kind:'clay', IL} (IL tròn 0,1) hoặc {kind:'sand', g}
function lookB2(z, s) {
  var key, lab, it;
  if (s.kind === 'sand') { key = B2_SAND[s.g]; lab = SAND_NAME[s.g]; }
  else { key = B2_CLAY[Math.round(s.IL * 10)]; lab = 'I<sub>L</sub> = ' + f(s.IL, 1); }
  it = interp(B2_D, B2[key], z);
  return { v: it.v, txt: 'Bảng 2 (' + lab + '): ' + txtI(it, z) };
}
// f_i theo Bảng 3
function lookB3(z, s) {
  var c, lab, it;
  if (s.kind === 'sand') { c = s.g === 'fine' ? 1 : (s.g === 'silt' ? 2 : 0); lab = SAND_NAME[s.g]; }
  else {
    if (s.IL > 1.0001) return { v: 0, txt: 'I<sub>L</sub> = ' + f(s.IL, 1) + ' > 1,0: nằm ngoài Bảng 3 → f = 0' };
    c = s.IL <= 0.2001 ? 0 : Math.round((s.IL - 0.2) * 10);
    lab = 'I<sub>L</sub> = ' + f(s.IL, 1) + (s.IL <= 0.2001 ? ' (cột ≤ 0,2)' : '');
  }
  it = interp(B3_D, col(B3_R, c), z);
  return { v: it.v, txt: 'Bảng 3 (' + lab + '): ' + txtI(it, z) };
}

// ── mô tả lớp đất ────────────────────────────────────────────
function soilTxt(s) {
  if (s.kind === 'sand') return s.name + (s.N != null ? ', N<sub>SPT</sub> = ' + s.N : '') + (s.qc != null ? ', q<sub>c</sub> = ' + f(s.qc, 1) + ' MPa' : '');
  return s.name + (s.IL != null ? ', I<sub>L</sub> = ' + f(s.IL, 1) : '') + (s.N != null ? ', N<sub>SPT</sub> = ' + s.N : '') + (s.qc != null ? ', q<sub>c</sub> = ' + f(s.qc, 1) + ' MPa' : '');
}
function soilSvgTxt(s) {
  var t = s.name;
  if (s.IL != null) t += ', IL = ' + f(s.IL, 1);
  if (s.N != null) t += ', N = ' + s.N;
  if (s.qc != null) t += ', qc = ' + f(s.qc, 1) + ' MPa';
  return t;
}

// ── hình SVG ─────────────────────────────────────────────────
function soilFig(d, g, soils) {
  var W = 450, H = 330, y0 = 18, sc = 255 / (g.Ha + 1.5), x0 = 70, x1 = 290;
  function y(z) { return y0 + z * sc; }
  var col = function (s, weak) { return weak ? '#E0E0E0' : (s.kind === 'sand' ? '#FFF59D' : '#FFE0B2'); };
  var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:460px;font-family:sans-serif;font-size:11px">';
  var zEnd = g.Ha + 1.5, t12 = d.t1 + d.t2;
  s += '<rect x="' + x0 + '" y="' + y(0) + '" width="' + (x1 - x0) + '" height="' + (y(d.t1) - y(0)) + '" fill="' + col(soils[0], true) + '" stroke="#78909C"/>';
  s += '<rect x="' + x0 + '" y="' + y(d.t1) + '" width="' + (x1 - x0) + '" height="' + (y(t12) - y(d.t1)) + '" fill="' + col(soils[1]) + '" stroke="#78909C"/>';
  s += '<rect x="' + x0 + '" y="' + y(t12) + '" width="' + (x1 - x0) + '" height="' + (y(zEnd) - y(t12)) + '" fill="' + col(soils[2]) + '" stroke="#78909C"/>';
  s += '<line x1="' + (x0 - 12) + '" y1="' + y(0) + '" x2="' + (x1 + 12) + '" y2="' + y(0) + '" stroke="#37474F" stroke-width="2"/>';
  // đài + cọc
  s += '<rect x="108" y="' + y(d.hm - 0.5) + '" width="70" height="' + (0.5 * sc) + '" fill="#546E7A"/>';
  s += '<rect x="130" y="' + y(d.hm) + '" width="26" height="' + ((g.Ha - d.hm) * sc) + '" fill="#90A4AE" stroke="#37474F"/>';
  s += '<line x1="124" y1="' + y(g.Hb) + '" x2="162" y2="' + y(g.Hb) + '" stroke="#C62828" stroke-width="1.6" stroke-dasharray="4 3"/>';
  // nhãn độ sâu bên trái
  [[d.hm, 'đáy đài ' + nz(d.hm)], [d.t1, nz(d.t1)], [t12, nz(t12)]].forEach(function (a) {
    s += '<line x1="' + (x0 - 8) + '" y1="' + y(a[0]) + '" x2="' + x0 + '" y2="' + y(a[0]) + '" stroke="#37474F"/><text x="' + (x0 - 10) + '" y="' + (y(a[0]) + 4) + '" text-anchor="end">' + a[1] + '</text>';
  });
  s += '<text x="' + (x0 - 10) + '" y="' + (y(0) - 4) + '" text-anchor="end">0 (mặt đất)</text>';
  // nhãn mũi cọc bên phải
  s += '<text x="' + (x1 + 6) + '" y="' + (y(g.Ha) + 4) + '" fill="#1B5E20" font-weight="700">▸ PA(a): mũi ' + nz(g.Ha) + ' m</text>';
  s += '<text x="' + (x1 + 6) + '" y="' + (y(g.Hb) + 4) + '" fill="#C62828" font-weight="700">▸ PA(b): mũi ' + nz(g.Hb) + ' m</text>';
  // tên lớp: đặt bên phải cọc, ngay dưới ranh giới trên của lớp
  var tops = [0, d.t1, t12];
  soils.forEach(function (so, i) {
    var lines = soilSvgTxt(so).split(', '), yy = y(tops[i]) + 14;
    lines.forEach(function (ln, k) { s += '<text x="190" y="' + (yy + k * 12) + '" fill="#263238" font-size="10">' + ln + '</text>'; });
    if (i < 2) s += '<text x="190" y="' + (yy + lines.length * 12) + '" fill="#607D8B" font-size="9">dày ' + nz(i === 0 ? d.t1 : d.t2) + ' m</text>';
  });
  return s + '</svg>';
}

// mặt bằng đài: piles [{x,y,i}], o={dp,lc,bc,Lx,Ly,col,tag}
function layoutFig(piles, o) {
  var pad = 36, Lx = o.Lx, Ly = o.Ly, sc = Math.min(260 / Lx, 190 / Ly), W = Lx * sc + 2 * pad, H = Ly * sc + 2 * pad;
  function X(x) { return pad + (x + Lx / 2) * sc; }
  function Y(y) { return pad + (Ly / 2 - y) * sc; }
  var s = '<svg viewBox="0 0 ' + W.toFixed(0) + ' ' + (H + 18).toFixed(0) + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:' + Math.min(W, 340).toFixed(0) + 'px;font-family:sans-serif;font-size:10px">';
  s += '<text x="' + (W / 2) + '" y="12" text-anchor="middle" font-weight="700" fill="#0D47A1">' + o.tag + '</text>';
  s += '<g transform="translate(0,14)">';
  s += '<rect x="' + X(-Lx / 2) + '" y="' + Y(Ly / 2) + '" width="' + (Lx * sc) + '" height="' + (Ly * sc) + '" fill="#ECEFF1" stroke="#455A64" stroke-width="1.5"/>';
  s += '<line x1="' + (X(-Lx / 2) - 14) + '" y1="' + Y(0) + '" x2="' + (X(Lx / 2) + 14) + '" y2="' + Y(0) + '" stroke="#C62828" stroke-dasharray="6 3"/><text x="' + (X(Lx / 2) + 4) + '" y="' + (Y(0) - 3) + '" fill="#C62828">x</text>';
  s += '<line x1="' + X(0) + '" y1="' + (Y(Ly / 2) - 14) + '" x2="' + X(0) + '" y2="' + (Y(-Ly / 2) + 14) + '" stroke="#C62828" stroke-dasharray="6 3"/><text x="' + (X(0) + 4) + '" y="' + (Y(Ly / 2) - 4) + '" fill="#C62828">y</text>';
  if (o.lc) s += '<rect x="' + X(-o.lc / 2) + '" y="' + Y(o.bc / 2) + '" width="' + (o.lc * sc) + '" height="' + (o.bc * sc) + '" fill="#B0BEC5" stroke="#263238"/><text x="' + X(0) + '" y="' + (Y(0) + 3) + '" text-anchor="middle" font-size="9" fill="#263238">cột</text>';
  piles.forEach(function (p) {
    s += '<rect x="' + X(p.x - o.dp / 2) + '" y="' + Y(p.y + o.dp / 2) + '" width="' + (o.dp * sc) + '" height="' + (o.dp * sc) + '" fill="#FFCC80" stroke="#E65100"/>';
    s += '<text x="' + X(p.x) + '" y="' + (Y(p.y) + 3) + '" text-anchor="middle" font-weight="700" fill="#BF360C">' + p.i + '</text>';
    s += '<text x="' + X(p.x) + '" y="' + (Y(p.y) + (p.y >= 0 ? -o.dp * sc / 2 - 3 : o.dp * sc / 2 + 10)) + '" text-anchor="middle" font-size="9" fill="#37474F">(' + nz(p.x) + '; ' + nz(p.y) + ')</text>';
  });
  return s + '</g></svg>';
}

// ── hình mặt cắt ─────────────────────────────────────────────
function dimH(x1, x2, y, txt) {   // kích thước ngang
  return '<line x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" stroke="#37474F" marker-start="url(#ar)" marker-end="url(#ar)"/>' +
    '<text x="' + ((x1 + x2) / 2) + '" y="' + (y - 4) + '" text-anchor="middle" fill="#263238">' + txt + '</text>';
}
function dimV(x, y1, y2, txt, right) {   // kích thước đứng; chữ bên trái, hoặc bên phải nếu right
  return '<line x1="' + x + '" y1="' + y1 + '" x2="' + x + '" y2="' + y2 + '" stroke="#37474F" marker-start="url(#ar)" marker-end="url(#ar)"/>' +
    '<text x="' + (right ? x + 5 : x - 5) + '" y="' + ((y1 + y2) / 2 + 4) + '" text-anchor="' + (right ? 'start' : 'end') + '" fill="#263238">' + txt + '</text>';
}
var SVG_DEFS = '<defs><marker id="ar" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 z" fill="#37474F"/></marker></defs>';

// Ex6: mặt cắt đài theo phương x, tháp đâm thủng 45°, c1, h, h0
function sectionFig6(d, o) {
  var W = 520, H = 330, sc = Math.min(300 / o.Ld, 110), cx = 260, yt = 96, h = d.h * sc, h0 = o.h0 * sc;
  function X(x) { return cx + x * sc; }
  var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:480px;font-family:sans-serif;font-size:11px">' + SVG_DEFS;
  s += '<text x="' + (W / 2) + '" y="14" text-anchor="middle" font-weight="700" fill="#0D47A1">Mặt cắt đài theo phương x</text>';
  s += '<rect x="' + X(-o.Ld / 2) + '" y="' + yt + '" width="' + (o.Ld * sc) + '" height="' + h + '" fill="#ECEFF1" stroke="#455A64" stroke-width="1.5"/>';
  s += '<rect x="' + X(-d.lc / 2) + '" y="' + (yt - 46) + '" width="' + (d.lc * sc) + '" height="46" fill="#B0BEC5" stroke="#263238"/><text x="' + X(0) + '" y="' + (yt - 20) + '" text-anchor="middle" fill="#263238">cột</text>';
  [-d.a, 0, d.a].forEach(function (x, i) {
    s += '<rect x="' + X(x - d.dp / 2) + '" y="' + (yt + h) + '" width="' + (d.dp * sc) + '" height="58" fill="#FFCC80" stroke="#E65100"/>';
    s += '<text x="' + X(x) + '" y="' + (yt + h + 34) + '" text-anchor="middle" font-weight="700" fill="#BF360C">' + (i === 2 ? '3,6' : (i === 0 ? '1,4' : '2,5')) + '</text>';
  });
  s += '<line x1="' + X(-d.lc / 2) + '" y1="' + yt + '" x2="' + (X(-d.lc / 2) - h0) + '" y2="' + (yt + h0) + '" stroke="#C62828" stroke-dasharray="5 3" stroke-width="1.4"/>';
  s += '<line x1="' + X(d.lc / 2) + '" y1="' + yt + '" x2="' + (X(d.lc / 2) + h0) + '" y2="' + (yt + h0) + '" stroke="#C62828" stroke-dasharray="5 3" stroke-width="1.4"/>';
  s += '<text x="' + (X(d.lc / 2) + h0 * 0.35) + '" y="' + (yt + h0 * 0.35 - 4) + '" fill="#C62828">tháp 45°</text>';
  s += '<line x1="' + X(-o.Ld / 2 + 0.05) + '" y1="' + (yt + h0) + '" x2="' + X(o.Ld / 2 - 0.05) + '" y2="' + (yt + h0) + '" stroke="#1565C0" stroke-width="2.5"/>';
  s += '<text x="' + X(o.Ld / 2 - 0.05) + '" y="' + (yt + h0 - 4) + '" text-anchor="end" fill="#1565C0">lưới thép (tâm cách đáy a)</text>';
  s += dimV(X(-o.Ld / 2) - 16, yt, yt + h, 'h = ' + f(d.h, 2));
  s += dimV(X(o.Ld / 2) + 16, yt, yt + h0, 'h₀ = ' + f(o.h0, 2), true);
  s += dimH(X(-d.lc / 2), X(d.lc / 2), yt - 56, 'l<tspan font-size="8" dy="2">c</tspan><tspan dy="-2"> = ' + nz(d.lc) + '</tspan>');
  s += dimH(X(d.lc / 2), X(d.a - d.dp / 2), yt + h + 76, 'c₁ = ' + f(o.c1r, 2));
  s += dimH(X(0), X(d.a), yt + h + 96, 'a = ' + nz(d.a));
  return s + '</svg>';
}

// Ex5: mặt cắt đài – cọc: tải, cọc và chiều dài làm việc
function sectionFig5(d) {
  var W = 470, H = 320, sc = 110, cx = 250, yt = 90, hd = 30, Lx = 2 * d.a2 + 0.6;
  function X(x) { return cx + x * sc; }
  var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:480px;font-family:sans-serif;font-size:11px">' + SVG_DEFS;
  s += '<text x="' + (W / 2) + '" y="14" text-anchor="middle" font-weight="700" fill="#0D47A1">Sơ đồ đài – cọc (nhìn theo phương x)</text>';
  s += '<rect x="' + X(-0.2) + '" y="' + (yt - 38) + '" width="' + (0.4 * sc) + '" height="38" fill="#B0BEC5" stroke="#263238"/>';
  s += '<line x1="' + X(0) + '" y1="' + (yt - 72) + '" x2="' + X(0) + '" y2="' + (yt - 40) + '" stroke="#C62828" stroke-width="2.5" marker-end="url(#ar)"/>';
  s += '<text x="' + (X(0) + 8) + '" y="' + (yt - 54) + '" fill="#C62828" font-weight="700">N<tspan font-size="8" dy="2">d1</tspan><tspan dy="-2"> = ' + d.N + ' kN</tspan></text>';
  s += '<path d="M ' + (X(0) - 46) + ' ' + (yt - 22) + ' A 24 24 0 0 1 ' + (X(0) - 22) + ' ' + (yt - 46) + '" fill="none" stroke="#6A1B9A" stroke-width="2" marker-end="url(#ar)"/>';
  s += '<text x="' + (X(0) - 52) + '" y="' + (yt - 50) + '" text-anchor="end" fill="#6A1B9A" font-weight="700">M<tspan font-size="8" dy="2">x</tspan><tspan dy="-2">, M</tspan><tspan font-size="8" dy="2">y</tspan></text>';
  s += '<rect x="' + X(-Lx / 2) + '" y="' + yt + '" width="' + (Lx * sc) + '" height="' + hd + '" fill="#ECEFF1" stroke="#455A64" stroke-width="1.5"/>';
  s += '<text x="' + (X(-Lx / 2) + 6) + '" y="' + (yt + 19) + '" fill="#546E7A">đài (tải đã gồm trọng lượng đài, đất)</text>';
  [-d.a2, 0, d.a2].forEach(function (x) {
    s += '<rect x="' + X(x - d.dp / 2) + '" y="' + (yt + hd) + '" width="' + (d.dp * sc) + '" height="120" fill="#FFCC80" stroke="#E65100"/>';
  });
  s += '<line x1="' + (X(-Lx / 2) - 8) + '" y1="' + (yt + hd) + '" x2="' + (X(-Lx / 2) + 16) + '" y2="' + (yt + hd) + '" stroke="#37474F"/>';
  s += dimV(X(-Lx / 2) - 14, yt + hd, yt + hd + 120, 'L = ' + d.L + ' m');
  s += '<text x="' + X(0) + '" y="' + (yt + hd + 138) + '" text-anchor="middle" fill="#607D8B" font-size="10">(cọc vẽ không theo tỉ lệ chiều dài)</text>';
  s += dimH(X(0), X(d.a2), yt + hd + 160, 'a₂ = ' + nz(d.a2) + ' (PA2)');
  s += '<text x="' + X(0) + '" y="' + (yt + hd + 186) + '" text-anchor="middle" fill="#37474F">cọc ' + f(d.dp * 100, 0) + ' × ' + f(d.dp * 100, 0) + ' cm · R<tspan font-size="8" dy="2">c,d</tspan><tspan dy="-2"> = ' + d.Rcd + ' kN</tspan></text>';
  return s + '</svg>';
}

// Ex4: tiết diện ngang cọc cho hai phương án vật liệu
function sectionFig4(d, o) {
  var sc = 230, W = 470, H = 250, s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:480px;font-family:sans-serif;font-size:11px">' + SVG_DEFS;
  s += '<text x="' + (W / 2) + '" y="14" text-anchor="middle" font-weight="700" fill="#0D47A1">Tiết diện ngang cọc ' + f(d.dp * 100, 0) + ' × ' + f(d.dp * 100, 0) + ' cm (4 thanh thép dọc ở góc)</text>';
  [d.c1, d.c2].forEach(function (c, k) {
    var x0 = 40 + k * 230, y0 = 40, w = d.dp * sc, cv = 0.035 * sc, r = Math.max(4, c.d / 1000 / 2 * sc * 1.6);
    s += '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + w + '" fill="#CFD8DC" stroke="#37474F" stroke-width="1.5"/>';
    s += '<rect x="' + (x0 + cv * 0.6) + '" y="' + (y0 + cv * 0.6) + '" width="' + (w - cv * 1.2) + '" height="' + (w - cv * 1.2) + '" fill="none" stroke="#1565C0" stroke-dasharray="3 2"/>';
    [[cv, cv], [w - cv, cv], [cv, w - cv], [w - cv, w - cv]].forEach(function (p) { s += '<circle cx="' + (x0 + p[0]) + '" cy="' + (y0 + p[1]) + '" r="' + r + '" fill="#C62828"/>'; });
    s += dimH(x0, x0 + w, y0 + w + 22, f(d.dp * 100, 0) + ' cm');
    s += '<text x="' + (x0 + w / 2) + '" y="' + (y0 + w + 42) + '" text-anchor="middle" font-weight="700" fill="#263238">PA' + (k + 1) + ': bê tông ' + c.B + '</text>';
    s += '<text x="' + (x0 + w / 2) + '" y="' + (y0 + w + 58) + '" text-anchor="middle" fill="#C62828">' + c.n + 'Ф' + c.d + ' · ' + c.st + '-V</text>';
  });
  return s + '</svg>';
}

// ── bảng tra hiển thị cho sinh viên ──────────────────────────
function tableHtml(title, head, rows, note) {
  var h = '<div class="fml"><div class="ftl">' + title + '</div><div class="tbl-scroll"><table class="atb"><tr>';
  head.forEach(function (c) { h += '<td>' + c + '</td>'; });
  h += '</tr>';
  rows.forEach(function (r) { h += '<tr>'; r.forEach(function (c) { h += '<td>' + c + '</td>'; }); h += '</tr>'; });
  return h + '</table></div>' + (note ? '<div class="tnote">' + note + '</div>' : '') + '</div>';
}
function tabB2() {
  var rows = B2_D.map(function (z, i) {
    function two(a, b) { return a === b ? a : a + ' / ' + b; }
    return [z, B2.c00[i], two(B2.c01s[i], B2.c01c[i]), B2.c02[i], two(B2.c03s[i], B2.c03c[i]), two(B2.c04s[i], B2.c04c[i]), B2.c05[i], B2.c06[i]];
  });
  return tableHtml('Bảng 2 — q<sub>b</sub> (kPa), cọc đóng/ép (TCVN 10304:2014). Mỗi ô: cát / đất dính',
    ['z mũi (m)', 'I<sub>L</sub>=0,0 · cát sỏi cuội', 'I<sub>L</sub>=0,1 · cát hạt to / dính', 'I<sub>L</sub>=0,2', 'I<sub>L</sub>=0,3 · cát hạt vừa / dính', 'I<sub>L</sub>=0,4 · cát hạt nhỏ / dính', 'I<sub>L</sub>=0,5 · cát bụi', 'I<sub>L</sub>=0,6'], rows,
    'Ô có một số: dùng chung cho cát và đất dính. Trung gian: nội suy tuyến tính. Chiều sâu tính từ mặt đất.');
}
function tabB3() {
  var rows = B3_D.map(function (z, i) { return [z].concat(B3_R[i]); });
  return tableHtml('Bảng 3 — f<sub>i</sub> (kPa), cọc đóng/ép (TCVN 10304:2014)',
    ['z giữa lớp (m)', 'I<sub>L</sub> ≤ 0,2 · cát hạt to/vừa', '0,3 · cát hạt nhỏ', '0,4 · cát bụi', '0,5', '0,6', '0,7', '0,8', '0,9', '1,0'], rows,
    'Chiều sâu z là điểm giữa đoạn cọc nằm trong lớp đất (tính từ mặt đất). I<sub>L</sub> > 1,0: ngoài bảng.');
}
function tabG2() {
  var rows = [['Đất dính chảy, bùn', '< 2000', '0,5', '30', '15'], ['Đất dính dẻo mềm – dẻo cứng', '2000 ÷ 5000', '0,45', '40', '35'], ['Đất dính nửa cứng – cứng', '> 5000', '0,55', '60', '35'],
    ['Cát chảy', '≤ 2500', '0,5', '80', '35'], ['Cát chặt vừa', '2500 ÷ 10000', '0,5', '100', '80'], ['Cát chặt đến rất chặt', '> 10000', '0,4', '150', '120']];
  return tableHtml('Bảng G2 — k<sub>c</sub>, α, f<sub>max</sub> cho cọc đóng, thành bê tông (TCVN 10304:2014, Phụ lục G.4)',
    ['Loại đất', 'q<sub>c</sub> (kPa)', 'k<sub>c</sub>', 'α', 'f<sub>max</sub> (kPa)'], rows,
    'Cát pha, sét pha, sét xếp vào nhóm đất dính; cát (hạt nhỏ, trung…) vào nhóm cát. Đã lấy giá trị không đóng ngoặc của bảng gốc (thiên về an toàn).');
}

// ═════════ hình học chung Ex1–3 (cọc đóng qua 3 lớp, hai phương án mũi cọc) ═════════
function sampGeom(r) {
  return { hm: pick(r, [1.5, 2.0]), t1: pick(r, range(6, 8.5, 0.5)), t2: pick(r, range(3, 6, 0.5)), p3: pick(r, [1.0, 1.5, 2.0]),
    dH: pick(r, [1.5, 2.0, 2.5, 3.0]), dp: pick(r, [0.25, 0.3, 0.35]) };
}
// SCT cọc thực tế 250–800 kN; hai phương án phải khác hiệu suất rõ rệt
function capOk(o) { return o.Rcd >= 250 && o.Rcd <= 800 && o.Rcd_b >= 150 && Math.abs(o.eta_a / o.eta_b - 1) > 0.05; }
function geomOk(d) { var g = geom(d); return g.l2b >= 1.5 && g.La >= 9 && g.La <= 16; }
function geom(d) {
  var g = {};
  g.Ha = d.t1 + d.t2 + d.p3; g.Hb = g.Ha - d.dH;
  g.l1 = d.t1 - d.hm; g.l2 = d.t2; g.l3 = d.p3; g.l2b = d.t2 + d.p3 - d.dH;
  g.z1 = (d.hm + d.t1) / 2; g.z2 = d.t1 + d.t2 / 2; g.z3 = d.t1 + d.t2 + d.p3 / 2; g.z2b = d.t1 + g.l2b / 2;
  g.La = g.Ha - d.hm; g.Lb = g.Hb - d.hm; g.A = d.dp * d.dp; g.u = 4 * d.dp;
  return g;
}
function pileTxt(d) { return '<b>' + f(d.dp * 100, 0) + ' × ' + f(d.dp * 100, 0) + ' cm</b> (u = ' + f(4 * d.dp, 2) + ' m; A<sub>p</sub> = ' + f(d.dp * d.dp, 4) + ' m²)'; }
function geomTxt(d, g) {
  return 'Móng cọc đài thấp, đáy đài cách mặt đất <b>h<sub>m</sub> = ' + nz(d.hm) + ' m</b>. Cọc BTCT tiết diện ' + pileTxt(d) + ', hạ bằng phương pháp đóng (búa), mũi cọc kín. Nền gồm 3 lớp (độ sâu tính từ mặt đất): ' +
    'lớp 1 dày <b>' + nz(d.t1) + ' m</b>, lớp 2 dày <b>' + nz(d.t2) + ' m</b>, lớp 3 rất dày. ';
}
function cmpItems(it, o, g, idB, naName) {
  // b: so sánh hiệu suất hai phương án
  var ea = o.eta_a, eb = o.eta_b, ia = ea > eb;
  it.push(mcq('b1', 'Phương án nào có hiệu suất SCT trên 1 m chiều dài làm việc (R<sub>c,d</sub>/L) lớn hơn?',
    ['PA(a): mũi hạ tới ' + nz(g.Ha) + ' m', 'PA(b): mũi hạ tới ' + nz(g.Hb) + ' m'], ia ? 0 : 1,
    'η<sub>a</sub> = ' + f(ea, 1) + ' ' + (ia ? '>' : '<') + ' η<sub>b</sub> = ' + f(eb, 1) + ' kN/m.'));
  it.push(num('b2', 'Tỉ số hiệu suất lớn/nhỏ = max(η<sub>a</sub>, η<sub>b</sub>)/min(η<sub>a</sub>, η<sub>b</sub>)', Math.max(ea, eb) / Math.min(ea, eb), '', 2, 0,
    f(Math.max(ea, eb), 1) + '/' + f(Math.min(ea, eb), 1) + ' = ' + f(Math.max(ea, eb) / Math.min(ea, eb), 2)));
  var rb = o.RB / o.Ru;
  it.push(mcq('b3', 'Trong R<sub>c,u</sub> của PA(a), thành phần nào chiếm tỷ trọng lớn hơn?', ['Sức kháng thân cọc R<sub>f</sub>', 'Sức kháng mũi R<sub>b</sub>'], rb > 0.5 ? 1 : 0,
    'R<sub>f</sub> = ' + f(o.RF, 1) + ' kN (' + f((1 - rb) * 100, 0) + ' %) ; R<sub>b</sub> = ' + f(o.RB, 1) + ' kN (' + f(rb * 100, 0) + ' %).'));
}

// ═════════ Ex1: SCT cọc — bảng tra ═════════
function calc1(d) {
  var g = geom(d), o = { g: g };
  var l2 = lookB3(g.z2, d.L2), l3 = lookB3(g.z3, d.L3), l2b = lookB3(g.z2b, d.L2);
  o.f2 = l2.v; o.f3 = l3.v; o.f2b = l2b.v; o.t2 = l2.txt; o.t3 = l3.txt; o.t2b = l2b.txt;
  o.RF = g.u * (o.f2 * g.l2 + o.f3 * g.l3);
  var qa = lookB2(g.Ha, d.L3); o.qb = qa.v; o.tqb = qa.txt;
  o.RB = o.qb * g.A; o.Ru = o.RF + o.RB; o.Rcd = o.Ru / K.gk1;
  var qb2 = lookB2(g.Hb, d.L2);
  o.Rcd_b = (g.u * o.f2b * g.l2b + qb2.v * g.A) / K.gk1; o.Rcdb_i = Math.round(o.Rcd_b); o.qb2 = qb2.v;
  o.eta_a = o.Rcd / g.La; o.eta_b = o.Rcdb_i / g.Lb;
  return o;
}
function gen1(r) {
  var d = search(r, function (r) {
    var x = sampGeom(r), k = r();
    x.L1 = { kind: 'clay', name: pick(r, ['Sét pha', 'Sét', 'Bùn sét pha']), IL: pick(r, [1.1, 1.2, 1.3]) };
    x.L2 = { kind: 'clay', name: pick(r, ['Cát pha', 'Sét pha']), IL: pick(r, [0.3, 0.4, 0.5, 0.6]) };
    if (k < 0.5) x.L3 = { kind: 'clay', name: 'Sét', IL: pick(r, [0.1, 0.2, 0.3]) };
    else { var gr = pick(r, ['fine', 'medium', 'coarse']); x.L3 = { kind: 'sand', name: 'Cát ' + SAND_NAME[gr].replace('cát ', '') + ', chặt vừa', g: gr }; }
    return x;
  }, function (d) {
    if (!geomOk(d)) return false;
    return capOk(calc1(d));
  });
  var o = calc1(d), g = o.g, it = [], u = g.u, A = g.A, na = 0;
  function N(q, ans, unit, dec, expl) { it.push(num('a' + (++na), q, ans, unit, dec, 0, expl)); }
  it.push(mcq('a' + (++na), 'Lớp 1 (' + d.L1.name.toLowerCase() + ', I<sub>L</sub> = ' + f(d.L1.IL, 1) + ') xử lý thế nào khi tính ma sát bên?',
    ['Không tính (f<sub>1</sub> = 0): I<sub>L</sub> > 1,0 nằm ngoài Bảng 3, đất rất yếu, thiên về an toàn', 'Tra Bảng 3 cột I<sub>L</sub> = 1,0 (f = 2 kPa)', 'Tính f theo cột I<sub>L</sub> ≤ 0,2 vì cọc xuyên qua'], 0,
    'Đất có I<sub>L</sub> > 1,0 không có trong Bảng 3 → quy ước f<sub>1</sub> = 0 (đề bài đã nêu). Đoạn cọc trong lớp 1 dài ' + nz(g.l1) + ' m nhưng không góp ma sát.'));
  N('Độ sâu trung bình z<sub>2</sub> của đoạn cọc nằm trong lớp 2 (tính từ mặt đất)', g.z2, 'm', 2,
    'Đoạn cọc trong lớp 2 từ ' + nz(d.t1) + ' m đến ' + nz(d.t1 + d.t2) + ' m (dài l<sub>2</sub> = ' + nz(g.l2) + ' m) → z<sub>2</sub> = ' + nz(d.t1) + ' + ' + nz(g.l2) + '/2 = ' + f(g.z2, 2) + ' m');
  N('Ma sát bên đơn vị f<sub>2</sub> của lớp 2 (' + soilTxt(d.L2) + ') — tra Bảng 3', o.f2, 'kPa', 1, o.t2 + ' → f<sub>2</sub> = ' + f(o.f2, 1) + ' kPa');
  N('Độ sâu trung bình z<sub>3</sub> của đoạn cọc nằm trong lớp 3', g.z3, 'm', 2,
    'Đoạn cọc trong lớp 3 từ ' + nz(d.t1 + d.t2) + ' m đến mũi ' + nz(g.Ha) + ' m (dài l<sub>3</sub> = ' + nz(g.l3) + ' m) → z<sub>3</sub> = ' + f(g.z3, 2) + ' m');
  N('Ma sát bên đơn vị f<sub>3</sub> của lớp 3 (' + soilTxt(d.L3) + ') — tra Bảng 3', o.f3, 'kPa', 1, o.t3 + ' → f<sub>3</sub> = ' + f(o.f3, 1) + ' kPa');
  N('Sức kháng thân cọc R<sub>f</sub> = u·Σf<sub>i</sub>·l<sub>i</sub>', o.RF, 'kN', 1,
    'R<sub>f</sub> = ' + f(u, 2) + '·(' + f(o.f2, 1) + '·' + nz(g.l2) + ' + ' + f(o.f3, 1) + '·' + nz(g.l3) + ') = ' + f(o.RF, 1));
  N('Sức kháng mũi đơn vị q<sub>b</sub> tại mũi cọc (z = ' + nz(g.Ha) + ' m, ' + soilTxt(d.L3) + ') — tra Bảng 2', o.qb, 'kPa', 0, o.tqb + ' → q<sub>b</sub> = ' + f(o.qb, 0) + ' kPa');
  N('Sức kháng mũi R<sub>b</sub> = q<sub>b</sub>·A<sub>p</sub>', o.RB, 'kN', 1, 'R<sub>b</sub> = ' + f(o.qb, 0) + '·' + f(A, 4) + ' = ' + f(o.RB, 1));
  N('Sức chịu tải giới hạn R<sub>c,u</sub> = R<sub>f</sub> + R<sub>b</sub>', o.Ru, 'kN', 1, 'R<sub>c,u</sub> = ' + f(o.RF, 1) + ' + ' + f(o.RB, 1) + ' = ' + f(o.Ru, 1));
  N('Sức chịu tải tính toán R<sub>c,d</sub> = R<sub>c,u</sub>/γ<sub>k</sub> (γ<sub>k</sub> = 1,4)', o.Rcd, 'kN', 1, 'R<sub>c,d</sub> = ' + f(o.Ru, 1) + '/1,4 = ' + f(o.Rcd, 1));
  N('Hiệu suất PA(a): η<sub>a</sub> = R<sub>c,d</sub>/L<sub>a</sub>, L<sub>a</sub> = H<sub>a</sub> − h<sub>m</sub>', o.eta_a, 'kN/m', 1,
    'L<sub>a</sub> = ' + nz(g.Ha) + ' − ' + nz(d.hm) + ' = ' + f(g.La, 1) + ' m ; η<sub>a</sub> = ' + f(o.Rcd, 1) + '/' + f(g.La, 1) + ' = ' + f(o.eta_a, 1));
  N('Hiệu suất PA(b): η<sub>b</sub> = R<sub>c,d,b</sub>/L<sub>b</sub> (R<sub>c,d,b</sub> cho trước)', o.eta_b, 'kN/m', 1,
    'L<sub>b</sub> = ' + nz(g.Hb) + ' − ' + nz(d.hm) + ' = ' + f(g.Lb, 1) + ' m ; η<sub>b</sub> = ' + o.Rcdb_i + '/' + f(g.Lb, 1) + ' = ' + f(o.eta_b, 1));
  cmpItems(it, o, g);
  var intro = geomTxt(d, g) + 'Lớp 1: <b>' + soilTxt(d.L1) + '</b>. Lớp 2: <b>' + soilTxt(d.L2) + '</b>. Lớp 3: <b>' + soilTxt(d.L3) + '</b>. ' +
    '<br>Dự báo sức chịu tải nén tính toán R<sub>c,d</sub> của cọc đơn <b>theo bảng tra (TCVN 10304, Bảng 2 và 3)</b> khi hạ mũi cọc tới <b>H<sub>a</sub> = ' + nz(g.Ha) + ' m</b> (PA a). ' +
    'Lấy γ<sub>c</sub> = 1, γ<sub>cq</sub> = γ<sub>cf</sub> = 1 (đóng bằng búa), γ<sub>k</sub> = 1,4. Quy ước: mỗi lớp là một lớp phân tố, z là độ sâu từ mặt đất đến điểm giữa đoạn cọc trong lớp. ' +
    '<br>Biết nếu hạ mũi cọc tới <b>H<sub>b</sub> = ' + nz(g.Hb) + ' m</b> (PA b) thì <b>R<sub>c,d,b</sub> = ' + o.Rcdb_i + ' kN</b>. So sánh hiệu suất SCT trên 1 m chiều dài làm việc của hai phương án.';
  return { d: d, o: o, items: it, intro: intro, formulas: F_TAB(), tables: [tabB2(), tabB3()], fig: soilFig(d, g, [d.L1, d.L2, d.L3]) };
}

// ═════════ Ex2: SCT cọc — SPT (V08 4.3.5, Bảng D.1, cọc đóng, mũi kín) ═════════
function spt(s) {
  var o = { N: s.N };
  if (s.kind === 'clay') { o.cu = 6.25 * s.N; o.f0 = 0.8 * o.cu; o.q0 = 6 * o.cu; }
  else { o.f0 = 2 * s.N; o.q0 = 300 * s.N; }
  o.f = Math.min(o.f0, 100); o.qb = Math.min(o.q0, 18000);
  return o;
}
function calc2(d) {
  var g = geom(d), o = { g: g };
  o.s2 = spt(d.L2); o.s3 = spt(d.L3);
  o.RF = g.u * (o.s2.f * g.l2 + o.s3.f * g.l3);
  o.RB = o.s3.qb * g.A; o.Ru = o.RF + o.RB; o.Rcd = o.Ru / K.gk2;
  o.Rcd_b = (g.u * o.s2.f * g.l2b + o.s2.qb * g.A) / K.gk2; o.Rcdb_i = Math.round(o.Rcd_b);
  o.eta_a = o.Rcd / g.La; o.eta_b = o.Rcdb_i / g.Lb;
  return o;
}
function gen2(r) {
  var d = search(r, function (r) {
    var x = sampGeom(r), k2 = r(), k3 = r();
    x.L1 = { kind: 'clay', name: pick(r, ['Sét pha', 'Sét', 'Bùn sét']), N: pick(r, [1, 2, 3]) };
    if (k2 < 0.35) x.L2 = { kind: 'clay', name: 'Cát pha', N: pick(r, range(8, 16, 1)) };
    else if (k2 < 0.7) x.L2 = { kind: 'clay', name: 'Sét pha', N: pick(r, range(8, 18, 1)) };
    else x.L2 = { kind: 'sand', name: 'Cát hạt nhỏ', N: pick(r, range(12, 22, 1)) };
    if (k3 < 0.5) x.L3 = { kind: 'clay', name: 'Sét', N: pick(r, range(20, 35, 1)) };
    else x.L3 = { kind: 'sand', name: 'Cát hạt trung', N: pick(r, range(22, 40, 1)) };
    return x;
  }, function (d) {
    if (!geomOk(d)) return false;
    return capOk(calc2(d));
  });
  var o = calc2(d), g = o.g, it = [], u = g.u, A = g.A, na = 0;
  function N(q, ans, unit, dec, expl) { it.push(num('a' + (++na), q, ans, unit, dec, 0, expl)); }
  it.push(mcq('a' + (++na), 'Lớp 1 (' + d.L1.name.toLowerCase() + ', N<sub>SPT</sub> = ' + d.L1.N + ' < 4) xử lý thế nào khi tính ma sát bên?',
    ['Bỏ qua ma sát bên (f<sub>1</sub> = 0): đất yếu, N < 4, thiên về an toàn', 'Tính như đất dính: f = 0,8c<sub>u</sub> với c<sub>u</sub> = 6,25N', 'Tính như đất rời: f = 2N'], 0,
    'Đề bài quy ước đất yếu (N < 4) bỏ qua ma sát bên: f<sub>1</sub> = 0.'));
  function layerItems(s, ps, k) {
    if (s.kind === 'clay') {
      N('Sức kháng cắt không thoát nước c<sub>u</sub> của lớp ' + k + ' (c<sub>u</sub> = 6,25·N<sub>SPT</sub>)', ps.cu, 'kPa', 2, 'c<sub>u</sub> = 6,25·' + s.N + ' = ' + f(ps.cu, 2) + ' kPa');
      N('Ma sát bên đơn vị f<sub>' + k + '</sub> = min(0,8c<sub>u</sub>; 100)', ps.f, 'kPa', 1, '0,8·' + f(ps.cu, 2) + ' = ' + f(ps.f0, 1) + (ps.f0 > 100 ? ' > 100 → lấy 100' : ' ≤ 100') + ' → f<sub>' + k + '</sub> = ' + f(ps.f, 1) + ' kPa');
    } else {
      N('Ma sát bên đơn vị f<sub>' + k + '</sub> của lớp ' + k + ' (đất rời) = min(2N<sub>SPT</sub>; 100)', ps.f, 'kPa', 1, '2·' + s.N + ' = ' + f(ps.f0, 1) + ' ≤ 100 → f<sub>' + k + '</sub> = ' + f(ps.f, 1) + ' kPa');
    }
  }
  layerItems(d.L2, o.s2, 2); layerItems(d.L3, o.s3, 3);
  N('Sức kháng thân cọc R<sub>f</sub> = u·Σf<sub>i</sub>·l<sub>i</sub> (l<sub>2</sub> = ' + nz(g.l2) + ' m, l<sub>3</sub> = ' + nz(g.l3) + ' m)', o.RF, 'kN', 1,
    'R<sub>f</sub> = ' + f(u, 2) + '·(' + f(o.s2.f, 1) + '·' + nz(g.l2) + ' + ' + f(o.s3.f, 1) + '·' + nz(g.l3) + ') = ' + f(o.RF, 1));
  if (d.L3.kind === 'clay') {
    N('Sức kháng mũi đơn vị q<sub>b</sub> = min(6c<sub>u</sub>; 18000) tại mũi (lớp 3)', o.s3.qb, 'kPa', 0, '6·' + f(o.s3.cu, 2) + ' = ' + f(o.s3.q0, 0) + (o.s3.q0 > 18000 ? ' > 18000 → 18000' : ' ≤ 18000') + ' kPa');
  } else {
    N('Sức kháng mũi đơn vị q<sub>b</sub> = min(300N<sub>SPT</sub>; 18000) tại mũi (lớp 3)', o.s3.qb, 'kPa', 0, '300·' + d.L3.N + ' = ' + f(o.s3.q0, 0) + (o.s3.q0 > 18000 ? ' > 18000 → 18000' : ' ≤ 18000') + ' kPa');
  }
  N('Sức kháng mũi R<sub>b</sub> = q<sub>b</sub>·A<sub>p</sub>', o.RB, 'kN', 1, 'R<sub>b</sub> = ' + f(o.s3.qb, 0) + '·' + f(A, 4) + ' = ' + f(o.RB, 1));
  N('Sức chịu tải giới hạn R<sub>c,u</sub> = R<sub>f</sub> + R<sub>b</sub>', o.Ru, 'kN', 1, 'R<sub>c,u</sub> = ' + f(o.RF, 1) + ' + ' + f(o.RB, 1) + ' = ' + f(o.Ru, 1));
  N('Sức chịu tải tính toán R<sub>c,d</sub> = R<sub>c,u</sub>/γ<sub>k</sub> (SPT: γ<sub>k</sub> = 1,5)', o.Rcd, 'kN', 1, 'R<sub>c,d</sub> = ' + f(o.Ru, 1) + '/1,5 = ' + f(o.Rcd, 1));
  N('Hiệu suất PA(a): η<sub>a</sub> = R<sub>c,d</sub>/L<sub>a</sub>, L<sub>a</sub> = H<sub>a</sub> − h<sub>m</sub>', o.eta_a, 'kN/m', 1,
    'L<sub>a</sub> = ' + nz(g.Ha) + ' − ' + nz(d.hm) + ' = ' + f(g.La, 1) + ' m ; η<sub>a</sub> = ' + f(o.Rcd, 1) + '/' + f(g.La, 1) + ' = ' + f(o.eta_a, 1));
  N('Hiệu suất PA(b): η<sub>b</sub> = R<sub>c,d,b</sub>/L<sub>b</sub> (R<sub>c,d,b</sub> cho trước)', o.eta_b, 'kN/m', 1,
    'L<sub>b</sub> = ' + nz(g.Hb) + ' − ' + nz(d.hm) + ' = ' + f(g.Lb, 1) + ' m ; η<sub>b</sub> = ' + o.Rcdb_i + '/' + f(g.Lb, 1) + ' = ' + f(o.eta_b, 1));
  cmpItems(it, o, g);
  var intro = geomTxt(d, g) + 'Lớp 1: <b>' + soilTxt(d.L1) + '</b>. Lớp 2: <b>' + soilTxt(d.L2) + '</b>. Lớp 3: <b>' + soilTxt(d.L3) + '</b>. ' +
    '<br>Dự báo R<sub>c,d</sub> của cọc đơn <b>theo kết quả SPT</b> (V08 4.3.5, Bảng D.1 cọc đóng) khi hạ mũi tới <b>H<sub>a</sub> = ' + nz(g.Ha) + ' m</b> (PA a). Cát pha, sét pha, sét tính là đất dính. ' +
    'Mỗi lớp là một lớp phân tố; N<sub>SPT</sub> của lớp lấy làm giá trị tính (kể cả N dưới mũi). Lấy γ<sub>c</sub> = γ<sub>R</sub> = 1, γ<sub>k</sub> = 1,5. ' +
    '<br>Biết nếu hạ mũi cọc tới <b>H<sub>b</sub> = ' + nz(g.Hb) + ' m</b> (PA b) thì <b>R<sub>c,d,b</sub> = ' + o.Rcdb_i + ' kN</b>. So sánh hiệu suất SCT trên 1 m chiều dài làm việc.';
  return { d: d, o: o, items: it, intro: intro, formulas: F_SPT(), tables: [], fig: soilFig(d, g, [d.L1, d.L2, d.L3]) };
}

// ═════════ Ex3: SCT cọc — CPT (TCVN 10304 Phụ lục G.4, Bảng G2) ═════════
function cptClass(s) {
  var q = s.qc * 1000;
  if (s.kind === 'clay') return q < 2000 ? 'dinh_chay' : (q <= 5000 ? 'dinh_deo' : 'dinh_cung');
  return q <= 2500 ? 'cat_chay' : (q <= 10000 ? 'cat_vua' : 'cat_chat');
}
function cpt(s) {
  var o = { q: s.qc * 1000, cls: cptClass(s) }, c = G2[o.cls];
  o.al = c.al; o.kc = c.kc; o.fmax = c.fmax; o.f0 = o.q / c.al; o.f = Math.min(o.f0, c.fmax); o.qb = c.kc * o.q; o.lbl = c.lbl;
  return o;
}
function calc3(d) {
  var g = geom(d), o = { g: g };
  o.s2 = cpt(d.L2); o.s3 = cpt(d.L3);
  o.RF = g.u * (o.s2.f * g.l2 + o.s3.f * g.l3);
  o.RB = o.s3.qb * g.A; o.Ru = o.RF + o.RB; o.Rcd = o.Ru / K.gk3;
  o.Rcd_b = (g.u * o.s2.f * g.l2b + o.s2.qb * g.A) / K.gk3; o.Rcdb_i = Math.round(o.Rcd_b);
  o.eta_a = o.Rcd / g.La; o.eta_b = o.Rcdb_i / g.Lb;
  return o;
}
function gen3(r) {
  var d = search(r, function (r) {
    var x = sampGeom(r), k2 = r(), k3 = r();
    x.L1 = { kind: 'clay', name: pick(r, ['Sét pha', 'Sét', 'Bùn sét']), qc: pick(r, [0.2, 0.3, 0.4]) };
    if (k2 < 0.35) x.L2 = { kind: 'clay', name: 'Cát pha', qc: pick(r, [2.5, 3, 3.5, 4, 4.5]) };
    else if (k2 < 0.7) x.L2 = { kind: 'clay', name: 'Sét pha', qc: pick(r, [2.5, 3, 3.5, 4, 4.5]) };
    else x.L2 = { kind: 'sand', name: 'Cát hạt nhỏ', qc: pick(r, [3, 4, 5, 6, 7, 8]) };
    if (k3 < 0.5) x.L3 = { kind: 'clay', name: 'Sét', qc: pick(r, [5.5, 6, 6.5, 7, 7.5, 8, 8.5]) };
    else x.L3 = { kind: 'sand', name: 'Cát hạt trung', qc: pick(r, [6, 7, 8, 9, 11, 12, 13]) };
    return x;
  }, function (d) {
    if (!geomOk(d)) return false;
    return capOk(calc3(d));
  });
  var o = calc3(d), g = o.g, it = [], u = g.u, A = g.A, na = 0;
  function N(q, ans, unit, dec, expl) { it.push(num('a' + (++na), q, ans, unit, dec, 0, expl)); }
  it.push(mcq('a' + (++na), 'Lớp 1 (' + d.L1.name.toLowerCase() + ', q<sub>c</sub> = ' + f(d.L1.qc, 1) + ' MPa < 0,5 MPa) xử lý thế nào khi tính ma sát bên?',
    ['Bỏ qua ma sát bên (f<sub>1</sub> = 0): đất yếu, thiên về an toàn', 'Tính f = q<sub>c</sub>/α như các lớp khác với α = 30', 'Tính f = f<sub>max</sub> = 15 kPa'], 0,
    'Đề bài quy ước đất yếu (q<sub>c</sub> < 0,5 MPa) bỏ qua ma sát bên: f<sub>1</sub> = 0.'));
  function layerItems(s, ps, k) {
    N('Hệ số α của lớp ' + k + ' (' + soilTxt(s) + ') — tra Bảng G2', ps.al, '', 0,
      'q<sub>c</sub> = ' + f(s.qc * 1000, 0) + ' kPa → ' + ps.lbl + ': α = ' + ps.al + ' ; f<sub>max</sub> = ' + ps.fmax + ' kPa ; k<sub>c</sub> = ' + f(ps.kc, 2));
    N('Ma sát bên đơn vị f<sub>' + k + '</sub> = min(q<sub>c</sub>/α; f<sub>max</sub>)', ps.f, 'kPa', 1,
      f(s.qc * 1000, 0) + '/' + ps.al + ' = ' + f(ps.f0, 1) + (ps.f0 > ps.fmax ? ' > f<sub>max</sub> = ' + ps.fmax + ' → lấy ' + ps.fmax : ' ≤ f<sub>max</sub> = ' + ps.fmax) + ' → f<sub>' + k + '</sub> = ' + f(ps.f, 1) + ' kPa (G.14)');
  }
  layerItems(d.L2, o.s2, 2); layerItems(d.L3, o.s3, 3);
  N('Sức kháng thân cọc R<sub>f</sub> = u·Σf<sub>i</sub>·l<sub>i</sub> (l<sub>2</sub> = ' + nz(g.l2) + ' m, l<sub>3</sub> = ' + nz(g.l3) + ' m)', o.RF, 'kN', 1,
    'R<sub>f</sub> = ' + f(u, 2) + '·(' + f(o.s2.f, 1) + '·' + nz(g.l2) + ' + ' + f(o.s3.f, 1) + '·' + nz(g.l3) + ') = ' + f(o.RF, 1));
  N('Hệ số k<sub>c</sub> tại mũi cọc (lớp 3, ' + o.s3.lbl + ') — tra Bảng G2', o.s3.kc, '', 2, 'Cọc đóng: k<sub>c</sub> = ' + f(o.s3.kc, 2));
  N('Sức kháng mũi đơn vị q<sub>b</sub> = k<sub>c</sub>·q<sub>c</sub> (q<sub>c</sub> = ' + f(d.L3.qc, 1) + ' MPa)', o.s3.qb, 'kPa', 0,
    'Cọc cắm ' + nz(g.l3) + ' m vào lớp 3 rất dày nên q<sub>c</sub> quanh mũi lấy bằng q<sub>c,3</sub> → q<sub>b</sub> = ' + f(o.s3.kc, 2) + '·' + f(o.s3.q, 0) + ' = ' + f(o.s3.qb, 0) + ' kPa (G.13)');
  N('Sức kháng mũi R<sub>b</sub> = q<sub>b</sub>·A<sub>p</sub>', o.RB, 'kN', 1, 'R<sub>b</sub> = ' + f(o.s3.qb, 0) + '·' + f(A, 4) + ' = ' + f(o.RB, 1));
  N('Sức chịu tải giới hạn R<sub>c,u</sub> = R<sub>f</sub> + R<sub>b</sub>', o.Ru, 'kN', 1, 'R<sub>c,u</sub> = ' + f(o.RF, 1) + ' + ' + f(o.RB, 1) + ' = ' + f(o.Ru, 1));
  N('Sức chịu tải tính toán R<sub>c,d</sub> = R<sub>c,u</sub>/γ<sub>k</sub> (CPT: γ<sub>k</sub> = 1,25)', o.Rcd, 'kN', 1, 'R<sub>c,d</sub> = ' + f(o.Ru, 1) + '/1,25 = ' + f(o.Rcd, 1));
  N('Hiệu suất PA(a): η<sub>a</sub> = R<sub>c,d</sub>/L<sub>a</sub>, L<sub>a</sub> = H<sub>a</sub> − h<sub>m</sub>', o.eta_a, 'kN/m', 1,
    'L<sub>a</sub> = ' + nz(g.Ha) + ' − ' + nz(d.hm) + ' = ' + f(g.La, 1) + ' m ; η<sub>a</sub> = ' + f(o.Rcd, 1) + '/' + f(g.La, 1) + ' = ' + f(o.eta_a, 1));
  N('Hiệu suất PA(b): η<sub>b</sub> = R<sub>c,d,b</sub>/L<sub>b</sub> (R<sub>c,d,b</sub> cho trước)', o.eta_b, 'kN/m', 1,
    'L<sub>b</sub> = ' + nz(g.Hb) + ' − ' + nz(d.hm) + ' = ' + f(g.Lb, 1) + ' m ; η<sub>b</sub> = ' + o.Rcdb_i + '/' + f(g.Lb, 1) + ' = ' + f(o.eta_b, 1));
  cmpItems(it, o, g);
  var intro = geomTxt(d, g) + 'Lớp 1: <b>' + soilTxt(d.L1) + '</b>. Lớp 2: <b>' + soilTxt(d.L2) + '</b>. Lớp 3: <b>' + soilTxt(d.L3) + '</b>. ' +
    '<br>Dự báo R<sub>c,d</sub> của cọc đơn <b>theo kết quả xuyên tĩnh CPT</b> (TCVN 10304, Phụ lục G.4) khi hạ mũi tới <b>H<sub>a</sub> = ' + nz(g.Ha) + ' m</b> (PA a). ' +
    'Cát pha, sét pha, sét là đất dính; cọc đóng, thành bê tông. Mỗi lớp là một lớp phân tố; coi q<sub>c</sub> quanh mũi bằng q<sub>c</sub> của lớp 3. Lấy γ<sub>c</sub> = γ<sub>R</sub> = 1, γ<sub>k</sub> = 1,25. ' +
    '<br>Biết nếu hạ mũi cọc tới <b>H<sub>b</sub> = ' + nz(g.Hb) + ' m</b> (PA b) thì <b>R<sub>c,d,b</sub> = ' + o.Rcdb_i + ' kN</b>. So sánh hiệu suất SCT trên 1 m chiều dài làm việc.';
  return { d: d, o: o, items: it, intro: intro, formulas: F_CPT(), tables: [tabG2()], fig: soilFig(d, g, [d.L1, d.L2, d.L3]) };
}

// ═════════ Ex4: Vật liệu cọc và lực ép ═════════
var CANDS = [
  { B: 'B20', n: 4, d: 14, st: 'CB300' }, { B: 'B20', n: 4, d: 16, st: 'CB300' }, { B: 'B25', n: 4, d: 14, st: 'CB300' }, { B: 'B25', n: 4, d: 16, st: 'CB400' },
  { B: 'B25', n: 4, d: 18, st: 'CB400' }, { B: 'B30', n: 4, d: 16, st: 'CB400' }, { B: 'B30', n: 4, d: 18, st: 'CB400' }, { B: 'B30', n: 4, d: 20, st: 'CB400' }
];
function candRcm(c, dp) {   // kN
  var As = c.n * BAR[c.d], Ac = dp * dp * 1e4 - As, m = MAT[c.B];
  return { As: As, Ac: Ac, Rcm: 1.0 * (m.Rb * Ac * 1e-4 + MAT[c.st].Rs * As * 1e-4) };
}
function calc4(d) {
  var o = {};
  o.Rd1 = d.Ru1 / K.gk1; o.Rd2 = d.Ru2 / K.gk2; o.Rd3 = d.Ru3 / K.gk3;
  o.Rd = Math.floor(Math.min(o.Rd1, o.Rd2, o.Rd3) / 10) * 10;
  o.kmin = d.roi ? 2.0 : 1.3; o.kmax = d.roi ? 3.0 : 2.0;
  o.Rmin = o.kmin * o.Rd; o.Rmax = o.kmax * o.Rd;
  o.c1 = candRcm(d.c1, d.dp); o.c2 = candRcm(d.c2, d.dp);
  o.v1 = o.c1.Rcm < o.Rmin ? 0 : (o.c1.Rcm <= o.Rmax ? 1 : 2);
  o.v2 = o.c2.Rcm < o.Rmin ? 0 : (o.c2.Rcm <= o.Rmax ? 1 : 2);
  var ok1 = o.v1 > 0, ok2 = o.v2 > 0;
  o.pick = (!ok1 && !ok2) ? 2 : (ok1 && ok2 ? (o.c1.Rcm <= o.c2.Rcm ? 0 : 1) : (ok1 ? 0 : 1));
  return o;
}
function candTxt(c, k) { return 'PA' + k + ': bê tông <b>' + c.B + '</b>, ' + c.n + 'Ф' + c.d + ' thép <b>' + c.st + '-V</b>'; }
function gen4(r) {
  var w = function () { var k = r(); return k < 0.3 ? 0 : (k < 0.65 ? 1 : 2); }, d, tryN;
  for (tryN = 0; tryN < 6; tryN++) {   // nếu tổ hợp kết luận mục tiêu khó, đổi mục tiêu rồi tìm lại
    var want1 = w(), want2 = w();
    d = search(r, function (r) {
      var Ru1 = pick(r, range(420, 1000, 5)), a = pick(r, [0.97, 1.0, 1.03, 1.08, 1.12, 1.18]), b = pick(r, [0.93, 0.98, 1.0, 1.05, 1.1, 1.2]);
      var c1 = pick(r, CANDS), c2 = pick(r, CANDS);
      return { dp: pick(r, [0.25, 0.3]), Ru1: Ru1, Ru2: Math.round(Ru1 * a / 5) * 5, Ru3: Math.round(Ru1 * b / 5) * 5, roi: r() < 0.5, c1: c1, c2: c2 };
    }, function (d) {
      if (d.c1 === d.c2) return false;
      var o = calc4(d);
      if (o.v1 !== want1 || o.v2 !== want2) return false;
      if (Math.abs(o.c1.Rcm - o.c2.Rcm) < 0.08 * o.c1.Rcm) return false;
      if (Math.min(d.Ru1 / K.gk1, d.Ru2 / K.gk2, d.Ru3 / K.gk3) % 10 < 1.5) return false;   // tránh sát mốc làm tròn
      if (Math.abs(o.c1.Rcm - o.Rmin) < 0.03 * o.Rmin || Math.abs(o.c1.Rcm - o.Rmax) < 0.03 * o.Rmax) return false;   // tránh sát biên khoảng
      if (Math.abs(o.c2.Rcm - o.Rmin) < 0.03 * o.Rmin || Math.abs(o.c2.Rcm - o.Rmax) < 0.03 * o.Rmax) return false;
      return true;
    }, 3000);
    if (!d._fail) break;
  }
  var o = calc4(d), it = [], na = 0, kmin = o.kmin, kmax = o.kmax;
  function N(q, ans, unit, dec, expl) { it.push(num('a' + (++na), q, ans, unit, dec, 0, expl)); }
  N('R<sub>c,d</sub> theo bảng tra (R<sub>c,u</sub> = ' + d.Ru1 + ' kN, γ<sub>k</sub> = 1,4)', o.Rd1, 'kN', 1, d.Ru1 + '/1,4 = ' + f(o.Rd1, 1));
  N('R<sub>c,d</sub> theo SPT (R<sub>c,u</sub> = ' + d.Ru2 + ' kN, γ<sub>k</sub> = 1,5)', o.Rd2, 'kN', 1, d.Ru2 + '/1,5 = ' + f(o.Rd2, 1));
  N('R<sub>c,d</sub> theo CPT (R<sub>c,u</sub> = ' + d.Ru3 + ' kN, γ<sub>k</sub> = 1,25)', o.Rd3, 'kN', 1, d.Ru3 + '/1,25 = ' + f(o.Rd3, 1));
  N('SCT theo đất nền R<sub>c,d</sub> chọn = giá trị nhỏ nhất, làm tròn xuống 10 kN', o.Rd, 'kN', 0,
    'min(' + f(o.Rd1, 1) + '; ' + f(o.Rd2, 1) + '; ' + f(o.Rd3, 1) + ') = ' + f(Math.min(o.Rd1, o.Rd2, o.Rd3), 1) + ' → làm tròn xuống: R<sub>c,d</sub> = ' + o.Rd + ' kN');
  N('Cận dưới yêu cầu R<sub>c,m,min</sub> = k<sub>min</sub>·R<sub>c,d</sub> (k<sub>min</sub> = ' + f(kmin, 1) + ')', o.Rmin, 'kN', 1, f(kmin, 1) + '·' + o.Rd + ' = ' + f(o.Rmin, 1));
  N('Cận trên khuyến nghị R<sub>c,m,max</sub> = k<sub>max</sub>·R<sub>c,d</sub> (k<sub>max</sub> = ' + f(kmax, 1) + ')', o.Rmax, 'kN', 1, f(kmax, 1) + '·' + o.Rd + ' = ' + f(o.Rmax, 1));
  var m1 = MAT[d.c1.B], s1 = MAT[d.c1.st], A = d.dp * d.dp * 1e4;
  N('PA1 — Diện tích thép dọc A<sub>s</sub> = ' + d.c1.n + 'Ф' + d.c1.d + ' (một thanh ' + f(BAR[d.c1.d], 3) + ' cm²)', o.c1.As, 'cm²', 2, 'A<sub>s</sub> = ' + d.c1.n + '·' + f(BAR[d.c1.d], 3) + ' = ' + f(o.c1.As, 2));
  N('PA1 — Diện tích bê tông A<sub>con</sub> = A − A<sub>s</sub> (A = ' + f(A, 0) + ' cm²)', o.c1.Ac, 'cm²', 2, 'A<sub>con</sub> = ' + f(A, 0) + ' − ' + f(o.c1.As, 2) + ' = ' + f(o.c1.Ac, 2));
  N('PA1 — R<sub>c,m</sub> = m·(R<sub>b</sub>·A<sub>con</sub> + R<sub>sc</sub>·A<sub>s</sub>), m = 1,0 (R<sub>b</sub> ' + d.c1.B + ' = ' + f(m1.Rb / 1000, 1) + ' MPa; R<sub>sc</sub> ' + d.c1.st + ' = ' + f(s1.Rs / 1000, 0) + ' MPa)', o.c1.Rcm, 'kN', 0,
    'R<sub>c,m</sub> = ' + f(m1.Rb, 0) + '·' + f(o.c1.Ac * 1e-4, 5) + ' + ' + f(s1.Rs, 0) + '·' + f(o.c1.As * 1e-4, 6) + ' = ' + f(o.c1.Rcm, 0) + ' kN');
  var m2 = MAT[d.c2.B], s2 = MAT[d.c2.st];
  N('PA2 — R<sub>c,m</sub> = m·(R<sub>b</sub>·A<sub>con</sub> + R<sub>sc</sub>·A<sub>s</sub>) (R<sub>b</sub> ' + d.c2.B + ' = ' + f(m2.Rb / 1000, 1) + ' MPa; R<sub>sc</sub> ' + d.c2.st + ' = ' + f(s2.Rs / 1000, 0) + ' MPa)', o.c2.Rcm, 'kN', 0,
    'A<sub>s</sub> = ' + d.c2.n + '·' + f(BAR[d.c2.d], 3) + ' = ' + f(o.c2.As, 2) + ' cm² ; A<sub>con</sub> = ' + f(A, 0) + ' − ' + f(o.c2.As, 2) + ' = ' + f(o.c2.Ac, 2) + ' cm² ; R<sub>c,m</sub> = ' + f(m2.Rb, 0) + '·' + f(o.c2.Ac * 1e-4, 5) + ' + ' + f(s2.Rs, 0) + '·' + f(o.c2.As * 1e-4, 6) + ' = ' + f(o.c2.Rcm, 0) + ' kN');
  var vo = ['Không đạt: R<sub>c,m</sub> < R<sub>c,m,min</sub>', 'Đạt, nằm trong khoảng khuyến nghị [R<sub>c,m,min</sub>; R<sub>c,m,max</sub>]', 'Đạt về an toàn nhưng dư (R<sub>c,m</sub> > R<sub>c,m,max</sub>), tốn vật liệu'];
  it.push(mcq('b1', 'Kết luận cho PA1 (R<sub>c,m</sub> = ' + f(o.c1.Rcm, 0) + ' kN)?', vo, o.v1, 'Khoảng yêu cầu [' + f(o.Rmin, 0) + '; ' + f(o.Rmax, 0) + '] kN, R<sub>c,m</sub> = ' + f(o.c1.Rcm, 0) + ' kN.'));
  it.push(mcq('b2', 'Kết luận cho PA2 (R<sub>c,m</sub> = ' + f(o.c2.Rcm, 0) + ' kN)?', vo, o.v2, 'Khoảng yêu cầu [' + f(o.Rmin, 0) + '; ' + f(o.Rmax, 0) + '] kN, R<sub>c,m</sub> = ' + f(o.c2.Rcm, 0) + ' kN.'));
  it.push(mcq('b3', 'Chọn phương án vật liệu cọc nào (đạt yêu cầu và tiết kiệm hơn)?', ['PA1', 'PA2', 'Không PA nào đạt, phải tăng cấp bê tông hoặc cốt thép'], o.pick,
    'Chỉ xét PA có R<sub>c,m</sub> ≥ R<sub>c,m,min</sub>; nếu cả hai đạt, chọn PA có R<sub>c,m</sub> nhỏ hơn (' + f(o.c1.Rcm, 0) + ' và ' + f(o.c2.Rcm, 0) + ' kN).'));
  var intro = 'Cọc BTCT đúc sẵn tiết diện <b>' + f(d.dp * 100, 0) + ' × ' + f(d.dp * 100, 0) + ' cm</b> hạ bằng phương pháp đóng/ép. Sức chịu tải giới hạn theo đất nền của cọc xác định bằng ba phương pháp: ' +
    'bảng tra <b>' + d.Ru1 + ' kN</b>, SPT <b>' + d.Ru2 + ' kN</b>, CPT <b>' + d.Ru3 + ' kN</b>. SCT huy động chủ yếu ở lớp đất <b>' + (d.roi ? 'rời' : 'dính') + '</b>. ' +
    'Để cọc không vỡ đầu khi thi công, sức chịu tải theo vật liệu phải đáp ứng R<sub>c,m</sub> = (' + f(kmin, 1) + ' ÷ ' + f(kmax, 1) + ')·R<sub>c,d</sub> (hệ số kinh nghiệm TCVN 9393/9394). ' +
    'Kiểm tra hai phương án vật liệu: ' + candTxt(d.c1, 1) + '; ' + candTxt(d.c2, 2) + '. Lấy m = 1,0; đạt khi R<sub>c,m</sub> ≥ R<sub>c,m,min</sub>.';
  return { d: d, o: o, items: it, intro: intro, formulas: F_VL(), tables: [], fig: '<div class="figrow">' + sectionFig4(d, o) + '</div>' };
}

// ═════════ Ex5: Phản lực đầu cọc, kiểm tra P_max ≤ R_c,d ═════════
function pilesGrid(xs, ys) {   // đánh số từ trên trái sang phải, từ hàng y lớn xuống
  var p = [], i = 0, sy = ys.slice().sort(function (a, b) { return b - a; }), sx = xs.slice().sort(function (a, b) { return a - b; });
  sy.forEach(function (y) { sx.forEach(function (x) { p.push({ x: x, y: y, i: ++i }); }); });
  return p;
}
function pileLoads(p, N, Mx, My) {
  var n = p.length, sx = 0, sy = 0;
  p.forEach(function (q) { sx += q.x * q.x; sy += q.y * q.y; });
  var P = p.map(function (q) { return N / n + My * q.x / sx + Mx * q.y / sy; });
  return { sx: sx, sy: sy, P: P, Pmax: Math.max.apply(null, P), Pmin: Math.min.apply(null, P) };
}
function calc5(d) {
  var o = {};
  o.Wk = K.gbt * d.dp * d.dp * d.L; o.Wd = K.gf * o.Wk;
  o.pa = pilesGrid([-d.a1, d.a1], [-d.b1, d.b1]); o.pb = pilesGrid([-d.a2, 0, d.a2], [-d.b2, d.b2]);
  o.A = pileLoads(o.pa, d.N, d.Mx, d.My); o.B = pileLoads(o.pb, d.N, d.Mx, d.My);
  o.PA = o.A.Pmax + o.Wd; o.PB = o.B.Pmax + o.Wd;
  return o;
}
function gen5(r) {
  var d = search(r, function (r) {
    var x = { dp: pick(r, [0.25, 0.3]), L: pick(r, [12, 15, 18, 20]), N: pick(r, range(1200, 2400, 100)), Mx: pick(r, range(20, 120, 10)), My: pick(r, range(60, 300, 20)),
      a1: pick(r, [0.6, 0.75, 0.9]), b1: pick(r, [0.6, 0.75]), a2: pick(r, [0.75, 0.9, 1.2]), b2: pick(r, [0.45, 0.6, 0.75]) };
    var o = calc5(x), wantFail = r() < 0.7, lo = o.PB * 1.05, hi = o.PA * 0.95;
    x.fail = wantFail;
    if (wantFail) { if (hi - lo < 15) x._bad = true; else x.Rcd = Math.round((lo + r() * (hi - lo)) / 5) * 5; }
    else x.Rcd = Math.round(o.PA * (1.05 + r() * 0.15) / 5) * 5;
    return x;
  }, function (d) {
    if (d._bad) return false;
    var o = calc5(d);
    if (o.A.Pmin <= 20 || o.B.Pmin <= 20) return false;
    if (2 * d.a1 < 3 * d.dp || d.a2 < 3 * d.dp || 2 * d.b1 < 3 * d.dp || 2 * d.b2 < 3 * d.dp) return false;   // khoảng cách cọc ≥ 3d
    if (d.fail) return o.PA > d.Rcd && o.PB <= d.Rcd;
    return o.PA <= d.Rcd && o.PB <= d.Rcd;
  });
  var o = calc5(d), it = [], na = 0;
  function N(q, ans, unit, dec, expl) { it.push(num('a' + (++na), q, ans, unit, dec, 0, expl)); }
  N('Trọng lượng tiêu chuẩn của cọc W<sub>p,k</sub> = γ<sub>bt</sub>·A<sub>p</sub>·L (γ<sub>bt</sub> = 25 kN/m³)', o.Wk, 'kN', 2, 'W<sub>p,k</sub> = 25·' + f(d.dp * d.dp, 4) + '·' + d.L + ' = ' + f(o.Wk, 2));
  N('Trọng lượng tính toán W<sub>p,d</sub> = γ<sub>f</sub>·W<sub>p,k</sub> (γ<sub>f</sub> = 1,1)', o.Wd, 'kN', 2, 'W<sub>p,d</sub> = 1,1·' + f(o.Wk, 2) + ' = ' + f(o.Wd, 2));
  function plan(name, p, ld, P, Pt, tag) {
    var imax = ld.P.indexOf(ld.Pmax), q = p[imax], n = p.length, sxs = [], sys = [];
    p.forEach(function (c) { sxs.push(nz(c.x) + '²'); sys.push(nz(c.y) + '²'); });
    N(tag + ' — Tổng bình phương tọa độ Σx<sub>i</sub>²', ld.sx, 'm²', 3, 'Σx<sub>i</sub>² = ' + sxs.join(' + ') + ' = ' + f(ld.sx, 3));
    N(tag + ' — Tổng bình phương tọa độ Σy<sub>i</sub>²', ld.sy, 'm²', 3, 'Σy<sub>i</sub>² = ' + sys.join(' + ') + ' = ' + f(ld.sy, 3));
    N(tag + ' — Phản lực lớn nhất P<sub>max</sub> (cọc số ' + q.i + ': x = ' + nz(q.x) + ', y = ' + nz(q.y) + ')', ld.Pmax, 'kN', 1,
      'P = N/n + M<sub>y</sub>x/Σx² + M<sub>x</sub>y/Σy² = ' + d.N + '/' + n + ' + ' + d.My + '·' + nz(q.x) + '/' + f(ld.sx, 3) + ' + ' + d.Mx + '·' + nz(q.y) + '/' + f(ld.sy, 3) + ' = ' + f(ld.Pmax, 1));
    N(tag + ' — Phản lực nhỏ nhất P<sub>min</sub> (kiểm tra cọc có bị nhổ không)', ld.Pmin, 'kN', 1, 'Cọc có (x; y) ngược dấu: P<sub>min</sub> = ' + f(ld.Pmin, 1) + ' kN' + (ld.Pmin > 0 ? ' > 0: mọi cọc chịu nén' : ' < 0: có cọc chịu nhổ'));
    N(tag + ' — Lực nén lớn nhất lên đầu cọc P<sub>tt,max</sub> = P<sub>max</sub> + W<sub>p,d</sub>', Pt, 'kN', 1, 'P<sub>tt,max</sub> = ' + f(ld.Pmax, 1) + ' + ' + f(o.Wd, 2) + ' = ' + f(Pt, 1));
  }
  plan('1', o.pa, o.A, null, o.PA, 'PA1 (4 cọc)');
  N('PA1 — Hệ số sử dụng U<sub>1</sub> = P<sub>tt,max</sub>/R<sub>c,d</sub>', o.PA / d.Rcd, '', 2, 'U<sub>1</sub> = ' + f(o.PA, 1) + '/' + d.Rcd + ' = ' + f(o.PA / d.Rcd, 2));
  plan('2', o.pb, o.B, null, o.PB, 'PA2 (6 cọc)');
  N('PA2 — Hệ số sử dụng U<sub>2</sub> = P<sub>tt,max</sub>/R<sub>c,d</sub>', o.PB / d.Rcd, '', 2, 'U<sub>2</sub> = ' + f(o.PB, 1) + '/' + d.Rcd + ' = ' + f(o.PB / d.Rcd, 2));
  var ok1 = o.PA <= d.Rcd, ok2 = o.PB <= d.Rcd;
  it.push(mcq('b1', 'PA1 (4 cọc) có đạt điều kiện P<sub>tt,max</sub> ≤ R<sub>c,d</sub> không?', ['Đạt', 'Không đạt'], ok1 ? 0 : 1, 'P<sub>tt,max</sub> = ' + f(o.PA, 1) + (ok1 ? ' ≤ ' : ' > ') + d.Rcd + ' kN.'));
  it.push(mcq('b2', 'PA2 (6 cọc) có đạt điều kiện P<sub>tt,max</sub> ≤ R<sub>c,d</sub> không?', ['Đạt', 'Không đạt'], ok2 ? 0 : 1, 'P<sub>tt,max</sub> = ' + f(o.PB, 1) + (ok2 ? ' ≤ ' : ' > ') + d.Rcd + ' kN.'));
  it.push(num('b3', 'Tăng từ 4 lên 6 cọc làm P<sub>max</sub> giảm bao nhiêu % (so với PA1)?', (o.A.Pmax - o.B.Pmax) / o.A.Pmax * 100, '%', 1, 0.5,
    '(' + f(o.A.Pmax, 1) + ' − ' + f(o.B.Pmax, 1) + ')/' + f(o.A.Pmax, 1) + ' = ' + f((o.A.Pmax - o.B.Pmax) / o.A.Pmax * 100, 1) + ' %'));
  it.push(mcq('b4', ok1 ? 'PA1 đã đạt. Kết luận hợp lý về phương án nào?' : 'PA1 không đạt. Giải pháp hợp lý nhất là?',
    ok1 ? ['Giữ PA1 (4 cọc); tăng cọc chỉ lãng phí', 'Bắt buộc dùng PA2 vì nhiều cọc hơn luôn tốt hơn', 'Giảm R<sub>c,d</sub> để an toàn hơn']
      : ['Dùng PA2 (6 cọc) hoặc tăng khoảng cách cọc/chiều dài cọc để giảm P<sub>max</sub>/tăng R<sub>c,d</sub>', 'Giảm γ<sub>k</sub> xuống 1,0 để cọc đủ khả năng', 'Bỏ qua trọng lượng cọc W<sub>p,d</sub> cho điều kiện đạt'], 0,
    ok1 ? 'U<sub>1</sub> = ' + f(o.PA / d.Rcd, 2) + ' ≤ 1 nên PA1 đủ; thêm cọc chỉ tăng chi phí.' : 'Tăng số cọc (PA2), tăng khoảng cách cọc để giảm ảnh hưởng của mô men, hoặc tăng chiều dài cọc để tăng R<sub>c,d</sub>.'));
  var intro = 'Móng cọc đài thấp. Tải trọng tính toán TTGH1 tại tâm đáy đài (đã gồm trọng lượng đài và đất): <b>N<sub>d1</sub> = ' + d.N + ' kN</b>; <b>M<sub>x</sub> = ' + d.Mx + ' kN·m</b> (làm tăng tải cọc phía y > 0); <b>M<sub>y</sub> = ' + d.My + ' kN·m</b> (làm tăng tải cọc phía x > 0). ' +
    'Cọc vuông <b>' + f(d.dp * 100, 0) + ' × ' + f(d.dp * 100, 0) + ' cm</b>, chiều dài làm việc <b>L = ' + d.L + ' m</b>, SCT nén tính toán theo đất nền <b>R<sub>c,d</sub> = ' + d.Rcd + ' kN</b>. ' +
    'Xét hai phương án bố trí cọc (hình bên dưới, tọa độ tính bằng m, gốc ở tâm nhóm cọc): PA1 gồm 4 cọc, PA2 gồm 6 cọc. Kiểm tra điều kiện cọc chịu nén lớn nhất trong giai đoạn sử dụng P<sub>tt,max</sub> = P<sub>max</sub> + γ<sub>f</sub>W<sub>p,k</sub> ≤ R<sub>c,d</sub> (γ<sub>n</sub> = 1,0).';
  var fig = '<div class="figrow">' + layoutFig(o.pa, { dp: d.dp, Lx: 2 * d.a1 + 0.9, Ly: 2 * d.b1 + 0.9, tag: 'PA1 — 4 cọc' }) + layoutFig(o.pb, { dp: d.dp, Lx: 2 * d.a2 + 0.9, Ly: 2 * d.b2 + 0.9, tag: 'PA2 — 6 cọc' }) + '</div><div class="figrow">' + sectionFig5(d) + '</div>';
  return { d: d, o: o, items: it, intro: intro, formulas: F_PL(), tables: [], fig: fig };
}

// ═════════ Ex6: Đài cọc — chọc thủng do cột và thép phương cạnh dài ═════════
function calc6(d) {
  var o = {};
  o.p = pilesGrid([-d.a, 0, d.a], [-d.b, d.b]);
  o.ld = pileLoads(o.p, d.N, d.Mx, d.My);
  o.P3 = o.ld.P[2]; o.P6 = o.ld.P[5];
  o.h0 = d.h - d.cv; o.m = MAT[d.conc];
  o.c1r = d.a - d.lc / 2 - d.dp / 2; o.c2r = d.b - d.bc / 2 - d.dp / 2;   // từ mép cột đến mép cọc
  o.c1 = Math.min(o.c1r, o.h0); o.c2 = Math.min(o.c2r, o.h0);
  o.al1 = o.h0 / o.c1; o.al2 = o.h0 / o.c2;
  o.Pdt = d.N;   // tổng phản lực các cọc (không kể trọng lượng đài, đất)
  o.Rdt = 2 * o.h0 * o.m.Rbt * (o.al1 * (d.bc + o.c2) + o.al2 * (d.lc + o.c1)); o.U = o.Pdt / o.Rdt;
  o.lng = d.a - d.lc / 2; o.M = (o.P3 + o.P6) * o.lng;
  o.Bd = 2 * d.b + d.dp + 2 * K.gcover; o.Ld = 2 * d.a + d.dp + 2 * K.gcover;
  o.Asr = o.M / (0.9 * MAT[d.steel].Rs * o.h0) * 1e4;
  o.Asb = d.n * BAR[d.ds]; o.rs = o.Asb / o.Asr;
  return o;
}
function gen6(r) {
  var wantP = r() < 0.5, wantS = r() < 0.5;
  var d = search(r, function (r) {
    return { a: pick(r, [1.0, 1.2]), b: pick(r, [0.6, 0.75]), dp: pick(r, [0.25, 0.3]), lc: pick(r, [0.5, 0.6]), bc: pick(r, [0.3, 0.4]),
      h: pick(r, [0.6, 0.7, 0.8, 0.9]), cv: 0.1, conc: pick(r, ['B20', 'B25', 'B30']), steel: 'CB400',
      N: pick(r, range(1800, 4200, 100)), Mx: pick(r, range(20, 100, 10)), My: pick(r, range(60, 240, 20)),
      n: pick(r, range(8, 36, 1)), ds: pick(r, [14, 16, 18, 20, 22, 25]) };
  }, function (d) {
    if (2 * d.b < 3 * d.dp) return false;
    var o = calc6(d);
    if (o.ld.Pmin <= 20 || o.c1r < 0.2 || o.c2r < 0.2) return false;
    if (!(wantP ? (o.U >= 0.65 && o.U <= 0.95) : (o.U >= 1.05 && o.U <= 1.5))) return false;
    return wantS ? (o.rs >= 1.05 && o.rs <= 1.3) : (o.rs >= 0.7 && o.rs <= 0.95);
  }, 12000);
  var o = calc6(d), it = [], na = 0, m = o.m;
  function N(q, ans, unit, dec, expl) { it.push(num('a' + (++na), q, ans, unit, dec, 0, expl)); }
  N('Tổng bình phương tọa độ Σx<sub>i</sub>²', o.ld.sx, 'm²', 3, 'Σx<sub>i</sub>² = 4·' + nz(d.a) + '² = ' + f(o.ld.sx, 3));
  N('Tổng bình phương tọa độ Σy<sub>i</sub>²', o.ld.sy, 'm²', 3, 'Σy<sub>i</sub>² = 6·' + nz(d.b) + '² = ' + f(o.ld.sy, 3));
  N('Phản lực cọc số 3 (x = ' + nz(d.a) + '; y = ' + nz(d.b) + ') — không kể trọng lượng đài và đất', o.P3, 'kN', 1,
    'P<sub>3</sub> = ' + d.N + '/6 + ' + d.My + '·' + nz(d.a) + '/' + f(o.ld.sx, 3) + ' + ' + d.Mx + '·' + nz(d.b) + '/' + f(o.ld.sy, 3) + ' = ' + f(o.P3, 1));
  N('Phản lực cọc số 6 (x = ' + nz(d.a) + '; y = ' + nz(-d.b) + ')', o.P6, 'kN', 1,
    'P<sub>6</sub> = ' + d.N + '/6 + ' + d.My + '·' + nz(d.a) + '/' + f(o.ld.sx, 3) + ' − ' + d.Mx + '·' + nz(d.b) + '/' + f(o.ld.sy, 3) + ' = ' + f(o.P6, 1));
  N('Chiều cao làm việc h<sub>0</sub> = h − a (h = ' + f(d.h * 100, 0) + ' cm, a = ' + f(d.cv * 100, 0) + ' cm)', o.h0, 'm', 2, 'h<sub>0</sub> = ' + nz(d.h) + ' − ' + nz(d.cv) + ' = ' + f(o.h0, 2) + ' m');
  N('c<sub>1</sub> (theo x): khoảng cách mép cột đến mép cọc; nếu lớn hơn h<sub>0</sub> thì lấy c<sub>1</sub> = h<sub>0</sub>', o.c1, 'm', 3,
    'c<sub>1</sub> = a − l<sub>c</sub>/2 − d<sub>p</sub>/2 = ' + nz(d.a) + ' − ' + nz(d.lc / 2) + ' − ' + nz(d.dp / 2) + ' = ' + f(o.c1r, 3) + ' m' + (o.c1r > o.h0 ? ' > h<sub>0</sub> → c<sub>1</sub> = ' + f(o.h0, 2) : ' ≤ h<sub>0</sub> → giữ ' + f(o.c1r, 3)));
  N('c<sub>2</sub> (theo y): tương tự, c<sub>2</sub> = b − b<sub>c</sub>/2 − d<sub>p</sub>/2, không vượt h<sub>0</sub>', o.c2, 'm', 3,
    'c<sub>2</sub> = ' + nz(d.b) + ' − ' + nz(d.bc / 2) + ' − ' + nz(d.dp / 2) + ' = ' + f(o.c2r, 3) + ' m' + (o.c2r > o.h0 ? ' > h<sub>0</sub> → c<sub>2</sub> = ' + f(o.h0, 2) : ' ≤ h<sub>0</sub> → giữ ' + f(o.c2r, 3)));
  N('Lực đâm thủng P<sub>đt</sub> = ΣP<sub>i</sub> của các cọc (không kể trọng lượng đài, đất)', o.Pdt, 'kN', 0, 'P<sub>đt</sub> = ΣP<sub>i</sub> = N<sub>0,d1</sub> = ' + d.N + ' kN (mô men triệt tiêu do đối xứng)');
  N('Khả năng chống đâm thủng R<sub>đt</sub> = 2h<sub>0</sub>R<sub>bt</sub>[(h<sub>0</sub>/c<sub>1</sub>)(b<sub>c</sub> + c<sub>2</sub>) + (h<sub>0</sub>/c<sub>2</sub>)(l<sub>c</sub> + c<sub>1</sub>)] (' + d.conc + ': R<sub>bt</sub> = ' + f(m.Rbt, 0) + ' kPa)', o.Rdt, 'kN', 0,
    'R<sub>đt</sub> = 2·' + f(o.h0, 2) + '·' + f(m.Rbt, 0) + '·[' + f(o.al1, 3) + '·(' + nz(d.bc) + ' + ' + f(o.c2, 3) + ') + ' + f(o.al2, 3) + '·(' + nz(d.lc) + ' + ' + f(o.c1, 3) + ')] = ' + f(o.Rdt, 0) + ' kN');
  var okP = o.Pdt <= o.Rdt;
  it.push(mcq('b1', 'Chiều cao đài h = ' + f(d.h * 100, 0) + ' cm có đủ chống đâm thủng (P<sub>đt</sub> ≤ R<sub>đt</sub>) không?', ['Đủ', 'Không đủ'], okP ? 0 : 1,
    'P<sub>đt</sub> = ' + f(o.Pdt, 0) + (okP ? ' ≤ ' : ' > ') + 'R<sub>đt</sub> = ' + f(o.Rdt, 0) + ' kN (U = ' + f(o.U, 2) + ').'));
  it.push(mcq('b2', 'Biện pháp hiệu quả nhất để tăng khả năng chống đâm thủng khi không xét cốt thép?',
    ['Tăng chiều cao đài h (tăng h<sub>0</sub>)', 'Tăng đường kính thép đáy đài', 'Giảm chiều rộng đài B'], 0,
    'Tăng h làm tăng trực tiếp h<sub>0</sub>, từ đó tăng R<sub>đt</sub>; cũng có thể nâng cấp bền bê tông hoặc mở rộng tiết diện cột (cổ cột). Thép đáy không nằm trong vế phải.'));
  N('Cánh tay đòn l<sub>ng</sub> từ tim cọc hàng x = ' + nz(d.a) + ' m đến mép cột (l<sub>ng</sub> = a − l<sub>c</sub>/2)', o.lng, 'm', 2, 'l<sub>ng</sub> = ' + nz(d.a) + ' − ' + nz(d.lc) + '/2 = ' + f(o.lng, 2));
  N('Mô men tại mép cột M = (P<sub>3</sub> + P<sub>6</sub>)·l<sub>ng</sub>', o.M, 'kN·m', 1, 'M = (' + f(o.P3, 1) + ' + ' + f(o.P6, 1) + ')·' + f(o.lng, 2) + ' = ' + f(o.M, 1));
  N('Diện tích thép yêu cầu A<sub>s</sub> = M/(0,9·R<sub>s</sub>·h<sub>0</sub>) (CB400-V: R<sub>s</sub> = 350 MPa)', o.Asr, 'cm²', 2,
    'A<sub>s</sub> = ' + f(o.M * 100, 0) + ' kN·cm/(0,9·35 kN/cm²·' + f(o.h0 * 100, 0) + ' cm) = ' + f(o.Asr, 2) + ' cm²');
  N('Diện tích thép bố trí ' + d.n + 'Ф' + d.ds + ' (một thanh ' + f(BAR[d.ds], 3) + ' cm²)', o.Asb, 'cm²', 2, 'A<sub>s,bt</sub> = ' + d.n + '·' + f(BAR[d.ds], 3) + ' = ' + f(o.Asb, 2));
  var okS = o.Asb >= o.Asr;
  it.push(mcq('b3', 'Lượng thép ' + d.n + 'Ф' + d.ds + ' bố trí theo phương cạnh dài có đủ không?', ['Đủ (A<sub>s,bt</sub> ≥ A<sub>s</sub>)', 'Không đủ (A<sub>s,bt</sub> < A<sub>s</sub>)'], okS ? 0 : 1,
    'A<sub>s,bt</sub> = ' + f(o.Asb, 2) + (okS ? ' ≥ ' : ' < ') + f(o.Asr, 2) + ' cm² (tỉ số ' + f(o.rs, 2) + ').'));
  var intro = 'Móng cọc đài thấp, đài chữ nhật chứa <b>6 cọc</b> vuông <b>' + f(d.dp * 100, 0) + ' × ' + f(d.dp * 100, 0) + ' cm</b> bố trí như hình (tọa độ m, gốc ở tâm nhóm cọc; mép cọc biên cách mép đài 0,25 m), dưới cột <b>' + nz(d.lc) + ' × ' + nz(d.bc) + ' m</b> (l<sub>c</sub> theo phương x). ' +
    'Chiều cao đài <b>h = ' + f(d.h * 100, 0) + ' cm</b>, lớp bảo vệ tính đến trọng tâm thép a = 10 cm; bê tông <b>' + d.conc + '</b>, thép <b>CB400-V</b>. ' +
    'Tải trọng tính toán TTGH1 tại cốt mặt đất: <b>N<sub>0,d1</sub> = ' + d.N + ' kN</b>; <b>M<sub>x</sub> = ' + d.Mx + ' kN·m</b>; <b>M<sub>y</sub> = ' + d.My + ' kN·m</b>. Không kể trọng lượng đài và đất. ' +
    '<br>(1) Kiểm tra chiều cao đài theo điều kiện chống đâm thủng 2 phương. (2) Tính cốt thép chịu lực phương cạnh dài (phương x) của đài và nhận xét lượng thép <b>' + d.n + 'Ф' + d.ds + '</b> bố trí.';
  var fig = '<div class="figrow">' + layoutFig(o.p, { dp: d.dp, lc: d.lc, bc: d.bc, Lx: o.Ld, Ly: o.Bd, tag: 'Mặt bằng đài ' + f(o.Ld, 2) + ' × ' + f(o.Bd, 2) + ' m' }) + '</div><div class="figrow">' + sectionFig6(d, o) + '</div>';
  return { d: d, o: o, items: it, intro: intro, formulas: F_DAI(), tables: [], fig: fig };
}

// ── khối công thức hiển thị ở dạng A/B ───────────────────────
function F_TAB() {
  return ['R<sub>c,u</sub> = γ<sub>c</sub>(γ<sub>cq</sub>q<sub>b</sub>A<sub>p</sub> + u·Σγ<sub>cf</sub>f<sub>i</sub>l<sub>i</sub>) (V08 4.4, TCVN 10304 CT 10); γ<sub>c</sub> = γ<sub>cq</sub> = γ<sub>cf</sub> = 1',
    'R<sub>c,d</sub> = R<sub>c,k</sub>/γ<sub>k</sub>, R<sub>c,k</sub> = R<sub>c,u</sub>; γ<sub>k</sub> = 1,4 (bảng tra)',
    'q<sub>b</sub> tra Bảng 2 theo độ sâu mũi và I<sub>L</sub> (hoặc loại cát); f<sub>i</sub> tra Bảng 3 theo độ sâu giữa lớp phân tố; nội suy tuyến tính',
    'Hiệu suất SCT: η = R<sub>c,d</sub>/L, L = chiều dài làm việc = độ sâu mũi − h<sub>m</sub>'];
}
function F_SPT() {
  return ['R<sub>c,u</sub> = q<sub>b</sub>A<sub>p</sub> + u·Σf<sub>i</sub>l<sub>i</sub> (V08 4.6, Bảng D.1, cọc đóng, mũi kín η = 1)',
    'Đất dính: c<sub>u</sub> = 6,25N ; f = 0,8c<sub>u</sub> ≤ 100 kPa ; q<sub>b</sub> = 6c<sub>u</sub> ≤ 18000 kPa',
    'Đất rời: f = 2N ≤ 100 kPa ; q<sub>b</sub> = 300N ≤ 18000 kPa (N: SPT của lớp)',
    'R<sub>c,d</sub> = R<sub>c,u</sub>/γ<sub>k</sub>, γ<sub>k</sub> = 1,5 (SPT)'];
}
function F_CPT() {
  return ['R<sub>c,u</sub> = q<sub>b</sub>A<sub>p</sub> + u·Σf<sub>i</sub>l<sub>i</sub> (TCVN 10304 G.12)',
    'f<sub>i</sub> = q<sub>c,i</sub>/α<sub>i</sub> ≤ f<sub>max</sub> (G.14) ; q<sub>b</sub> = k<sub>c</sub>·q<sub>c</sub> (G.13); α, k<sub>c</sub>, f<sub>max</sub> tra Bảng G2 theo nhóm đất và q<sub>c</sub>',
    'R<sub>c,d</sub> = R<sub>c,u</sub>/γ<sub>k</sub>, γ<sub>k</sub> = 1,25 (CPT)'];
}
function F_VL() {
  return ['R<sub>c,d</sub> (từng phương pháp) = R<sub>c,u</sub>/γ<sub>k</sub> ; γ<sub>k</sub> = 1,4 (bảng tra), 1,5 (SPT), 1,25 (CPT) (V08 4.3.7); R<sub>c,d</sub> chọn = giá trị nhỏ nhất, làm tròn xuống 10 kN',
    'Yêu cầu khi thi công đóng/ép: R<sub>c,m</sub> = (2,0 ÷ 3,0)R<sub>c,d</sub> nếu đất rời ; (1,3 ÷ 2,0)R<sub>c,d</sub> nếu đất dính',
    'R<sub>c,m</sub> = m·(R<sub>b</sub>·A<sub>con</sub> + R<sub>sc</sub>·A<sub>s</sub>), A<sub>con</sub> = A − A<sub>s</sub>, m = 1,0',
    'Bê tông: B20 R<sub>b</sub> = 11,5 ; B25 14,5 ; B30 17,0 MPa. Thép: CB300-V R<sub>sc</sub> = 260 ; CB400-V 350 MPa'];
}
function F_PL() {
  return ['P<sub>i</sub> = N<sub>d1</sub>/n + M<sub>y</sub>·x<sub>i</sub>/Σx<sub>j</sub>² + M<sub>x</sub>·y<sub>i</sub>/Σy<sub>j</sub>² (V08 4.17)',
    'W<sub>p,k</sub> = γ<sub>bt</sub>·A<sub>p</sub>·L, γ<sub>bt</sub> = 25 kN/m³ ; W<sub>p,d</sub> = γ<sub>f</sub>·W<sub>p,k</sub>, γ<sub>f</sub> = 1,1',
    'Điều kiện: P<sub>tt,max</sub> = P<sub>max</sub> + W<sub>p,d</sub> ≤ R<sub>c,d</sub> ; P<sub>min</sub> ≥ 0 (cọc không bị nhổ)'];
}
function F_DAI() {
  return ['P<sub>i</sub> = N<sub>0</sub>/n + M<sub>y</sub>x<sub>i</sub>/Σx² + M<sub>x</sub>y<sub>i</sub>/Σy² (không kể trọng lượng đài và đất khi kiểm tra đài)',
    'Đâm thủng 2 phương: P<sub>đt</sub> = ΣP<sub>i</sub> ; R<sub>đt</sub> = 2h<sub>0</sub>R<sub>bt</sub>[(h<sub>0</sub>/c<sub>1</sub>)(b<sub>c</sub> + c<sub>2</sub>) + (h<sub>0</sub>/c<sub>2</sub>)(l<sub>c</sub> + c<sub>1</sub>)] ; c<sub>1</sub>, c<sub>2</sub> = khoảng cách mép cột đến mép cọc, lấy ≤ h<sub>0</sub> ; điều kiện P<sub>đt</sub> ≤ R<sub>đt</sub>',
    'Thép phương cạnh dài: M = ΣP<sub>j</sub>·l<sub>ng</sub> (l<sub>ng</sub> từ tim cọc đến mép cột) ; A<sub>s</sub> = M/(0,9R<sub>s</sub>h<sub>0</sub>)',
    'B20: R<sub>bt</sub> = 900 ; B25: 1050 ; B30: 1150 (kPa). CB400-V: R<sub>s</sub> = 350 MPa'];
}

// ── dựng item (giống clo2.js) ────────────────────────────────
function num(id, q, ans, unit, dec, tol, expl) { return { id: id, type: 'num', q: q, ans: rnd(ans, dec + 2), unit: unit, dec: dec, tol: tol || 0, expl: expl }; }
function mcq(id, q, opts, ci, expl) { return { id: id, type: 'mcq', q: q, opts: opts, ci: ci, expl: expl }; }

function numOpts(it, r) {
  var a = it.ans, d = it.dec, out = [], fac = [0.8, 1.25, 0.65, 1.45, 0.9, 1.12], k;
  var seen = {}; seen[f(a, d)] = 1;
  function add(v) { var s = f(v, d); if (!seen[s] && v >= 0) { seen[s] = 1; out.push(v); } }
  if (d === 0 && Math.abs(a) < 30) { [a - 1, a + 1, a + 2, a - 2, a + 3].forEach(add); }
  else for (k = 0; k < fac.length && out.length < 3; k++) add(a * fac[k]);
  out = out.slice(0, 3);
  var o = out.map(function (v) { return { v: v, ok: false }; }); o.push({ v: a, ok: true });
  for (var i = o.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = o[i]; o[i] = o[j]; o[j] = t; }
  return o;
}

var GEN = [gen1, gen2, gen3, gen4, gen5, gen6];
function gen(stt, exIdx, dangIdx, seededRng) {
  var r = seededRng(stt * 1009 + exIdx * 100 + dangIdx);
  var S = GEN[exIdx](r, stt);
  S.ex = exIdx; S.title = EX_LBL[exIdx];
  return S;
}

root.CLO3 = { gen: gen, K: K, MAT: MAT, BAR: BAR, EX_LBL: EX_LBL, numOpts: numOpts, f: f, lookB2: lookB2, lookB3: lookB3, cpt: cpt, spt: spt,
  calc: [calc1, calc2, calc3, calc4, calc5, calc6], pilesGrid: pilesGrid, pileLoads: pileLoads };
if (typeof module !== 'undefined' && module.exports) module.exports = root.CLO3;
})(typeof window !== 'undefined' ? window : globalThis);
