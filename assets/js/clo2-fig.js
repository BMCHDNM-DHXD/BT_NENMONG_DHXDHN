// ═══════════════════════════════════════════════════════════════
// BT NỀN MÓNG — clo2-fig.js : hình minh họa SVG cho 6 bài CLO2, vẽ theo số liệu từng sinh viên
// CLO2.fig(S) → chuỗi <svg>. Không vẽ đại lượng là đáp án (B', B″, H_c, h0, p_max…).
// Phụ thuộc: clo2.js (CLO2.K, CLO2.f)
// ═══════════════════════════════════════════════════════════════
(function (root) {
'use strict';
var C = root.CLO2, f = C.f, tan8 = C.K.tan8;
var INK = '#0D47A1', RED = '#C62828', GREY = '#546E7A';
var COL = { soil: '#F1E6D3', sand: '#F3E3A0', weak: '#BFD0C8', deep: '#DCCDB8', conc: '#D5DBDF' };

function open(w, h) {
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="fig" xmlns="http://www.w3.org/2000/svg" role="img" font-family="Plus Jakarta Sans,Arial,sans-serif" font-size="11">' +
    '<defs><marker id="mb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="' + INK + '"/></marker>' +
    '<marker id="mr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="' + RED + '"/></marker></defs>' +
    '<rect width="' + w + '" height="' + h + '" fill="#fff"/>';
}
// chữ có chỉ số dưới dạng X_{abc}
function tx(x, y, s, o) {
  o = o || {};
  var parts = String(s).split(/_\{([^}]*)\}/), out = '', prevSub = false;
  parts.forEach(function (p, i) {
    if (i % 2 === 1) { out += '<tspan dy="3" font-size="8">' + p + '</tspan>'; prevSub = true; }
    else if (p) { out += prevSub ? '<tspan dy="-3">' + p + '</tspan>' : p; prevSub = false; }
  });
  return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + (o.a || 'start') + '" fill="' + (o.c || '#263238') + '"' +
    (o.b ? ' font-weight="700"' : '') + (o.sz ? ' font-size="' + o.sz + '"' : '') + '>' + out + '</text>';
}
function ln(x1, y1, x2, y2, o) {
  o = o || {};
  return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + (o.c || INK) + '" stroke-width="' + (o.w || 1) + '"' +
    (o.d ? ' stroke-dasharray="' + o.d + '"' : '') + (o.m ? ' marker-end="url(#' + o.m + ')"' : '') + (o.m2 ? ' marker-start="url(#' + o.m2 + ')"' : '') + '/>';
}
function rc(x, y, w, h, fill, o) {
  o = o || {};
  return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + fill + '" stroke="' + (o.s || 'none') + '" stroke-width="' + (o.w || 1) + '"' + (o.d ? ' stroke-dasharray="' + o.d + '"' : '') + '/>';
}
function load(x, y1, y2) { return ln(x, y1, x, y2, { c: RED, w: 2, m: 'mr' }); }
function mom(cx, cy, r) {
  return '<path d="M' + (cx - r) + ' ' + cy + ' A' + r + ' ' + r + ' 0 0 1 ' + (cx + r) + ' ' + cy + '" fill="none" stroke="' + RED + '" stroke-width="2" marker-end="url(#mr)"/>';
}
function dH(x1, x2, y, s, o) {
  o = o || {};
  return ln(x1, y, x2, y, { m: 'mb', m2: 'mb' }) + ln(x1, y - 4, x1, y + 4) + ln(x2, y - 4, x2, y + 4) + tx((x1 + x2) / 2, y + (o.below ? 13 : -4), s, { a: 'middle', c: INK });
}
function dV(x, y1, y2, s, o) {
  o = o || {};
  return ln(x, y1, x, y2, { m: 'mb', m2: 'mb' }) + ln(x - 4, y1, x + 4, y1) + ln(x - 4, y2, x + 4, y2) + tx(x + (o.left ? -6 : 6), (y1 + y2) / 2 + 4, s, { a: o.left ? 'end' : 'start', c: INK });
}
function footing(cx, base, w, th, colW, top) {
  return rc(cx - colW / 2, top, colW, base - th - top, COL.conc, { s: '#455A64' }) + rc(cx - w / 2, base - th, w, th, COL.conc, { s: '#455A64', w: 1.5 });
}
function ground(x1, x2, gy) { return ln(x1, gy, x2, gy, { c: '#5D4037', w: 2 }); }

// ── Ex1 ──
function fig1(S) {
  var d = S.d, W = 520, H = 290, cx = 215, gy = 100, sy = 50, ps = 75;
  var bw = d.b * ps, by = gy + d.hm * sy, th = 26, h = open(W, H);
  h += rc(30, gy, 460, H - 20 - gy, COL.soil) + ground(30, 490, gy);
  h += footing(cx, by, bw, th, 24, 52);
  h += load(cx, 8, 48) + tx(cx - 10, 24, 'N_{0,d1} = ' + f(d.N0, 0) + ' kN/m', { a: 'end', c: RED, b: 1 });
  h += mom(cx + 52, 44, 16) + tx(cx + 74, 30, 'M_{0,d1} = ' + f(d.M, 0) + ' kN·m/m', { c: RED, b: 1 });
  h += dH(cx - bw / 2, cx + bw / 2, by + 30, 'b = ' + f(d.b, 1) + ' m', { below: 1 });
  h += dV(cx - bw / 2 - 34, gy, by, 'h_{m} = ' + f(d.hm, 1) + ' m', { left: 1 });
  h += tx(36, gy - 6, 'Mặt đất', { c: '#5D4037' });
  h += tx(300, 190, 'Nền đất đồng nhất', { b: 1 }) + tx(300, 208, 'γ = ' + f(d.g, 1) + ' kN/m³') + tx(300, 224, 'φ = ' + d.phi + '° · c = ' + f(d.c, 0) + ' kPa');
  h += tx(36, 266, 'Mặt cắt ngang móng băng (tải trên 1 m dài)', { c: GREY, sz: 10 });
  return h + '</svg>';
}

// ── Ex2: mặt cắt theo L + mặt bằng ──
function fig2(S) {
  var d = S.d, W = 520, H = 280, ps = 40, gy = 78, sy = 34, th = 24;
  var cx = 125, Lp = d.L * ps, by = gy + d.hm * sy, h = open(W, H);
  h += rc(15, gy, 235, H - 40 - gy, COL.soil) + ground(15, 250, gy);
  h += footing(cx, by, Lp, th, 20, 50);
  h += load(cx, 6, 46) + tx(cx - 8, 22, 'N_{0,d1} = ' + f(d.N0, 0) + ' kN', { a: 'end', c: RED, b: 1 });
  h += mom(cx + 40, 40, 14) + tx(cx + 58, 28, 'M_{y} = ' + f(d.My, 0) + ' kN·m', { c: RED, b: 1 });
  h += dH(cx - Lp / 2, cx + Lp / 2, by + 28, 'L = ' + f(d.L, 1) + ' m', { below: 1 });
  h += dV(cx - Lp / 2 - 12, gy, by, 'h_{m}=' + f(d.hm, 1), { left: 1 });
  h += tx(20, H - 20, 'Mặt cắt dọc theo L', { c: GREY, sz: 10 });
  // mặt bằng
  var px = 385, py = 120, Bp = d.B * ps;
  h += rc(px - Lp / 2, py - Bp / 2, Lp, Bp, '#ECEFF1', { s: INK, w: 1.5 }) + rc(px - 8, py - 8, 16, 16, COL.conc, { s: '#455A64' });
  h += dH(px - Lp / 2, px + Lp / 2, py - Bp / 2 - 10, 'L = ' + f(d.L, 1) + ' m');
  h += dV(px + Lp / 2 + 12, py - Bp / 2, py + Bp / 2, 'B = ' + f(d.B, 1) + ' m');
  h += ln(px - 30, py, px + 30, py, { c: RED, d: '4 3' }) + ln(px, py - 30, px, py + 30, { c: RED, d: '4 3' });
  h += tx(px, py + Bp / 2 + 30, 'M_{x} = ' + f(d.Mx, 0) + ' kN·m (lệch theo B)', { a: 'middle', c: RED, b: 1 });
  h += tx(px, py + Bp / 2 + 46, 'M_{y} = ' + f(d.My, 0) + ' kN·m (lệch theo L)', { a: 'middle', c: RED, b: 1 });
  h += tx(px, H - 12, 'Mặt bằng đáy móng', { a: 'middle', c: GREY, sz: 10 });
  h += tx(20, H - 6, 'γ = ' + f(d.g, 1) + ' kN/m³ · φ = ' + d.phi + '° · c = ' + f(d.c, 0) + ' kPa', { c: '#4E342E', sz: 10 });
  return h + '</svg>';
}

// ── Ex3: lớp yếu / đệm cát ──
function fig3(S) {
  var d = S.d, W = 520, H = 350, cx = 175, gy = 72, sy = 40, ps = 55, th = 24;
  var bw = d.B * ps, by = gy + d.hm * sy, yw = by + d.H * sy, h = open(W, H);
  if (d.cat) {
    h += rc(25, gy, 300, by - gy, COL.soil) + rc(25, by, 300, yw - by, COL.sand) + rc(25, yw, 300, H - 30 - yw, COL.weak);
  } else {
    h += rc(25, gy, 300, yw - gy, COL.soil) + rc(25, yw, 300, H - 30 - yw, COL.weak);
  }
  h += ground(25, 325, gy) + ln(25, yw, 325, yw, { c: '#6D4C41', w: 1.2 });
  h += footing(cx, by, bw, th, 22, 40);
  h += load(cx, 6, 36) + tx(cx - 8, 20, 'N_{0,d1} = ' + f(d.N0, 0) + ' kN', { a: 'end', c: RED, b: 1 });
  h += mom(cx + 40, 34, 13) + tx(cx + 57, 22, 'M_{y}=' + f(d.My, 0) + ' · M_{x}=' + f(d.Mx, 0) + ' kN·m', { c: RED, b: 1, sz: 10 });
  var dx = d.H * tan8 * ps;
  h += ln(cx - bw / 2, by, cx - bw / 2 - dx, yw, { c: GREY, d: '5 3' }) + ln(cx + bw / 2, by, cx + bw / 2 + dx, yw, { c: GREY, d: '5 3' });
  h += tx(cx + bw / 2 + dx + 6, by + d.H * sy / 2, '8°', { c: GREY });
  h += dH(cx - bw / 2, cx + bw / 2, by + 16, 'B×L = ' + f(d.B, 1) + '×' + f(d.L, 1), { below: 0 });
  h += dV(cx - bw / 2 - 40, gy, by, 'h_{m}=' + f(d.hm, 1), { left: 1 });
  h += dV(cx + bw / 2 + 50, by, yw, 'H = ' + f(d.H, 1) + ' m');
  if (!d.cat) h += dV(32, gy, yw, 'h_{1}=' + f(d.h1, 1));
  h += dH(cx - bw / 2 - dx, cx + bw / 2 + dx, yw + 22, 'khối quy ước B″ × L″', { below: 1 });
  // chú thích lớp
  var lx = 335;
  if (d.cat) {
    h += tx(lx, gy + (by - gy) / 2 + 4, 'Đất trên: γ = ' + f(d.g0, 1), { sz: 10 });
    h += tx(lx, by + 14, 'Đệm cát: dày ' + f(d.H, 1) + ' m', { b: 1, sz: 10 }) + tx(lx, by + 28, 'γ_{đ} = ' + f(d.gu, 1) + ' kN/m³', { sz: 10 });
  } else {
    h += tx(lx, gy + 16, 'Lớp 1 (tốt): dày ' + f(d.h1, 1) + ' m', { b: 1, sz: 10 }) + tx(lx, gy + 30, 'γ = ' + f(d.g0, 1) + ' kN/m³', { sz: 10 });
  }
  h += tx(lx, yw + 16, 'Lớp yếu', { b: 1, sz: 10 }) + tx(lx, yw + 30, 'γ_{2} = ' + f(d.g2, 1) + ' kN/m³', { sz: 10 }) + tx(lx, yw + 44, 'φ_{2} = ' + d.phi2 + '° · c_{2} = ' + f(d.c2, 0) + ' kPa', { sz: 10 });
  h += tx(30, gy - 5, 'Mặt đất', { c: '#5D4037', sz: 10 }) + tx(30, H - 8, 'Mặt cắt (H: từ đáy móng đến đỉnh lớp yếu)', { c: GREY, sz: 10 });
  return h + '</svg>';
}

// ── Ex4: lún ──
function fig4(S) {
  var d = S.d, W = 520, H = 330, cx = 165, gy = 62, ps = 55, th = 24;
  var hA = d.kA * 0.4 * d.b, sc = Math.min(42, 235 / (d.hm + hA + 1.4));
  var bw = d.b * ps, by = gy + d.hm * sc, yA = by + hA * sc, yb = Math.min(H - 24, yA + 1.4 * sc), h = open(W, H);
  h += rc(25, gy, 290, by - gy, COL.soil) + rc(25, by, 290, yA - by, COL.sand) + rc(25, yA, 290, yb - yA, COL.deep);
  h += ground(25, 315, gy) + ln(25, yA, 315, yA, { c: '#6D4C41', w: 1.2 });
  h += footing(cx, by, bw, th, 22, 36);
  h += load(cx, 4, 32) + tx(cx - 8, 20, 'N_{0,d2} = ' + f(d.N0, 0) + ' kN/m', { a: 'end', c: RED, b: 1 });
  h += dH(cx - bw / 2, cx + bw / 2, by + 16, 'b = ' + f(d.b, 1) + ' m');
  h += dV(cx - bw / 2 - 36, gy, by, 'h_{m}=' + f(d.hm, 1), { left: 1 });
  h += dV(cx + bw / 2 + 36, by, yA, 'h_{A}=' + f(hA, 2));
  // ví dụ chia lớp phân tố 0,4b (3 lớp đầu)
  for (var i = 1; i <= 3; i++) { var yy = by + i * 0.4 * d.b * sc; if (yy < yb - 2) h += ln(cx - bw / 2 - 12, yy, cx + bw / 2 + 12, yy, { c: GREY, d: '3 3' }); }
  h += tx(cx - bw / 2 - 14, by + 0.2 * d.b * sc + 3, 'h_{i} = 0,4b', { a: 'end', c: GREY, sz: 9 });
  var lx = 325;
  h += tx(lx, gy + (by - gy) / 2 + 4, 'Đất trên đáy móng: γ_{1} = ' + f(d.g0, 1), { sz: 10 });
  h += tx(lx, by + 14, 'Lớp A: γ = ' + f(d.gA, 1) + ' kN/m³', { b: 1, sz: 10 }) + tx(lx, by + 28, 'E = ' + f(d.EA / 1000, 0) + ' MPa', { sz: 10 });
  h += tx(lx, yA + 16, 'Lớp B (rất dày): γ = ' + f(d.gB, 1), { b: 1, sz: 10 }) + tx(lx, yA + 30, 'E = ' + f(d.EB / 1000, 0) + ' MPa · không có nước ngầm', { sz: 10 });
  h += tx(30, gy - 5, 'Mặt đất', { c: '#5D4037', sz: 10 }) + tx(30, H - 6, 'Móng băng, tải TTGH2', { c: GREY, sz: 10 });
  return h + '</svg>';
}

// ── Ex5: mặt bằng + mặt cắt chọc thủng ──
function fig5(S) {
  var d = S.d, o = S.o, W = 520, H = 285, s = 36;
  var h = open(W, H), px = 120, py = 130, Lp = d.L * s, Bp = d.B * s;
  h += rc(px - Lp / 2, py - Bp / 2, Lp, Bp, '#ECEFF1', { s: INK, w: 1.5 });
  var pl = (d.lc + 2 * o.h0) * s, pb = (d.bc + 2 * o.h0) * s;
  h += rc(px - pl / 2, py - pb / 2, pl, pb, 'none', { s: RED, w: 1.5, d: '5 3' });
  h += rc(px - d.lc * s / 2, py - d.bc * s / 2, d.lc * s, d.bc * s, '#90A4AE', { s: '#37474F' });
  h += dH(px - Lp / 2, px + Lp / 2, py - Bp / 2 - 12, 'L = ' + f(d.L, 1) + ' m');
  h += dV(px + Lp / 2 + 14, py - Bp / 2, py + Bp / 2, 'B = ' + f(d.B, 1) + ' m');
  h += tx(px, py + Bp / 2 + 20, 'cột l_{c}×b_{c} = ' + f(d.lc, 1) + '×' + f(d.bc, 1) + ' m', { a: 'middle', b: 1, sz: 10 });
  h += tx(px, py + Bp / 2 + 36, 'đáy tháp chọc thủng (nét đứt)', { a: 'middle', c: RED, sz: 10 });
  h += tx(px, H - 8, 'Mặt bằng', { a: 'middle', c: GREY, sz: 10 });
  // mặt cắt, tỉ lệ 1:1 để góc 45° đúng
  var q = 54, cx = 385, top = 140, Lq = d.L * q, hq = d.h * q, lcq = d.lc * q;
  h += rc(cx - Lq / 2, top, Lq, hq, COL.conc, { s: '#455A64', w: 1.5 });
  h += rc(cx - lcq / 2, 70, lcq, top - 70, COL.conc, { s: '#455A64' });
  h += load(cx, 8, 66) + tx(cx + 10, 26, 'N_{0} = ' + f(d.N0, 0) + ' kN (đúng tâm)', { c: RED, b: 1 });
  h += ln(cx - lcq / 2, top, cx - lcq / 2 - 0.5 * d.h * q, top + 0.5 * d.h * q, { c: RED, d: '5 3' });
  h += ln(cx + lcq / 2, top, cx + lcq / 2 + 0.5 * d.h * q, top + 0.5 * d.h * q, { c: RED, d: '5 3' });
  h += tx(cx + lcq / 2 + 0.5 * d.h * q + 4, top + 0.5 * d.h * q, '45°', { c: RED });
  h += dV(cx + Lq / 2 + 14, top, top + hq, 'h = ' + f(d.h * 1000, 0) + ' mm');
  h += dH(cx - Lq / 2, cx + Lq / 2, top + hq + 22, 'L = ' + f(d.L, 1) + ' m', { below: 1 });
  h += tx(cx, top + hq + 56, 'a_{b} = 40 mm · d_{s} = ' + f(d.ds * 1000, 0) + ' mm · ' + d.conc, { a: 'middle', sz: 10 });
  h += tx(cx, H - 8, 'Mặt cắt dọc theo L (h_{0}: chiều cao làm việc)', { a: 'middle', c: GREY, sz: 10 });
  return h + '</svg>';
}

// ── Ex6: mặt cắt + biểu đồ phản lực nền + mặt cắt tính mô men ──
function fig6(S) {
  var d = S.d, o = S.o, W = 520, H = 300, s = 50, cx = 260, top = 130;
  var Lp = d.L * s, hq = d.h * s, lcq = d.lc * s, xl = cx - Lp / 2, xr = cx + Lp / 2, yb = top + hq;
  var h = open(W, H), ecc = d.My > 0;
  h += rc(cx - lcq / 2, 66, lcq, top - 66, COL.conc, { s: '#455A64' }) + rc(xl, top, Lp, hq, COL.conc, { s: '#455A64', w: 1.5 });
  h += ln(xl + 6, yb - 6, xr - 6, yb - 6, { c: '#37474F', w: 3 });
  h += load(cx, 8, 62) + tx(cx - 10, 24, 'N_{0} = ' + f(d.N0, 0) + ' kN', { a: 'end', c: RED, b: 1 });
  if (ecc) h += mom(cx + 46, 40, 15) + tx(cx + 66, 30, 'M_{y} = ' + f(d.My, 0) + ' kN·m', { c: RED, b: 1 });
  // biểu đồ phản lực nền (hướng lên, vẽ dưới đáy móng): p_max về phía mép lx
  var hmax = 58, hmin = ecc ? Math.max(8, hmax * o.pmin / o.pmax) : hmax;
  h += '<polygon points="' + xl + ',' + yb + ' ' + xr + ',' + yb + ' ' + xr + ',' + (yb + hmax) + ' ' + xl + ',' + (yb + hmin) + '" fill="#BBDEFB" stroke="' + INK + '"/>';
  h += tx(xr + 6, yb + hmax, ecc ? 'p_{max}' : 'p', { c: INK, b: 1 });
  if (ecc) h += tx(xl - 6, yb + hmin, 'p_{min}', { a: 'end', c: INK, b: 1 });
  h += tx(cx, yb + 24, 'phản lực nền thuần', { a: 'middle', c: INK, sz: 10 });
  // mặt cắt tại mép cột bên p_max
  var xc = cx + lcq / 2;
  h += ln(xc, 60, xc, yb + hmax + 10, { c: RED, d: '5 3', w: 1.5 }) + tx(xc + 4, 78, 'mặt cắt tại mép cột', { c: RED, sz: 10 });
  h += dH(xc, xr, yb + hmax + 24, 'l_{x} = (L − l_{c})/2', { below: 1 });
  h += dH(xl, xr, yb + hmax + 48, 'L = ' + f(d.L, 1) + ' m · B = ' + f(d.B, 1) + ' m · l_{c} = ' + f(d.lc, 1) + ' m', { below: 1 });
  h += dV(xl - 16, top, yb, 'h=' + f(d.h * 1000, 0), { left: 1 });
  h += tx(20, H - 6, d.conc + ' · ' + d.steel + ' · Ф' + f(d.ds * 1000, 0) + ' · a_{b} = 50 mm', { sz: 10 });
  h += tx(W - 10, H - 6, 'Thép đặt theo phương L', { a: 'end', c: GREY, sz: 10 });
  return h + '</svg>';
}

var FIG = [fig1, fig2, fig3, fig4, fig5, fig6];
C.fig = function (S) { return FIG[S.ex](S); };
})(typeof window !== 'undefined' ? window : globalThis);
