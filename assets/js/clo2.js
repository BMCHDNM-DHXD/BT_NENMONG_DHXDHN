// ═══════════════════════════════════════════════════════════════
// BT NỀN MÓNG — clo2.js : CLO2 Móng nông theo giáo trình NỀN MÓNG V08 (chương 2)
// Sinh đề + đáp án + lời giải cho 6 bài:
//   Ex1 SCT móng băng · Ex2 SCT móng đơn lệch tâm · Ex3 SCT lớp yếu/đệm cát
//   Ex4 Lún TTGH2 · Ex5 Chọc thủng · Ex6 Thép đáy móng
// Thuần JS (chạy cả trong trình duyệt lẫn Node): CLO2.gen(stt, exIdx, dangIdx, seededRng)
// Công thức: V08 (2.4) (2.14)–(2.20) (2.38) (2.51)–(2.55) (2.68)–(2.77) (2.93)–(2.94). Xem QUYET_DINH.md 2026-10-27.
// ═══════════════════════════════════════════════════════════════
(function (root) {
'use strict';

var K = {
  gn: 1.15,            // cấp hậu quả C2
  gc: 0.9,             // đất dính, V08 d.849
  gf1: 1.1, gf2: 1.0,  // hệ số tin cậy tải TTGH1 / TTGH2
  gtb: 20,             // kN/m³
  tan8: Math.tan(8 * Math.PI / 180),
  beta: 0.8, Sgh: 0.08, // m
  hiRatio: 0.4, stop: 0.2,
  PI: Math.PI
};
var MAT = {
  B20: { Rb: 11500, Rbt: 900 }, B25: { Rb: 14500, Rbt: 1050 },
  CB300: { Rs: 260000 }, CB400: { Rs: 350000 }
};
var EX_LBL = ['SCT móng băng', 'SCT móng đơn lệch tâm', 'SCT lớp yếu / đệm cát', 'Lún (TTGH2)', 'Chọc thủng', 'Thép đáy móng'];

// ── tiện ích ─────────────────────────────────────────────────
function f(v, d) { return v.toFixed(d).replace('.', ','); }
function rnd(v, d) { var m = Math.pow(10, d); return Math.round(v * m) / m; }
function pick(r, a) { return a[Math.floor(r() * a.length)]; }
function range(a, b, s) { var o = []; for (var x = a; x <= b + 1e-9; x += s) o.push(rnd(x, 4)); return o; }
// lấy mẫu có điều kiện; hết lượt thì trả mẫu cuối (kiểm thử sẽ báo)
function search(r, sampler, accept, tries) {
  var s, i;
  for (i = 0; i < (tries || 3000); i++) { s = sampler(r); if (accept(s)) { s._tries = i; return s; } }
  s._fail = true; return s;
}
function nearInt(x, tol) { return Math.abs(x - Math.round(x)) < tol; }

// ── hệ số sức chịu tải V08 (2.16)–(2.18), φ độ ───────────────
function Nfac(phi) {
  var p = phi * K.PI / 180, t = Math.tan(p);
  var Nq = Math.pow(Math.tan(K.PI / 4 + p / 2), 2) * Math.exp(K.PI * t);
  return { Nq: Nq, Nc: (Nq - 1) / t, Ng: 1.5 * (Nq - 1) * t };
}
// hệ số hình dạng (2.19), eta = B'/L' ≤ 1
function Xi(eta) { return { g: 1 - 0.25 * eta, q: 1 + 1.5 * eta, c: 1 + 0.3 * eta }; }
// hệ số ứng suất α dưới tâm móng băng (Flamant), zb = z/b
function alphaStrip(zb) {
  if (zb <= 0) return 1;
  var x = 1 / (2 * zb);
  return (2 / K.PI) * (Math.atan(x) + x / (1 + x * x));
}

// ═════════ Ex1: SCT móng băng ═════════
function calc1(d) {
  var o = {}, N = Nfac(d.phi);
  o.Nd = d.N0 + K.gf1 * K.gtb * d.hm * d.b;
  o.e = d.M / o.Nd; o.Bp = d.b - 2 * o.e;
  o.N = N;
  o.tg = N.Ng * o.Bp * d.g; o.tq = N.Nq * d.hm * d.g; o.tc = N.Nc * d.c;
  o.R = o.Bp * (o.tg + o.tq + o.tc);
  o.U = K.gn * o.Nd / (K.gc * o.R);
  var s = o.tg + o.tq + o.tc;
  o.sh = { g: o.tg / s, q: o.tq / s, c: o.tc / s };
  return o;
}
function gen1(r) {
  var wantOK = r() < 0.5;
  var d = search(r, function (r) {
    return { phi: pick(r, [15, 18, 20, 22, 25, 28]), c: pick(r, [5, 6, 8, 10, 12, 15, 18]),
      g: pick(r, [17, 17.5, 18, 18.5, 19]), hm: pick(r, [1.0, 1.2, 1.4, 1.6, 1.8]),
      N0: pick(r, range(150, 400, 10)), M: pick(r, range(5, 40, 5)), b: pick(r, range(1.0, 2.6, 0.1)) };
  }, function (d) {
    var o = calc1(d);
    if (o.e > d.b / 6) return false;
    var s = [o.sh.g, o.sh.q, o.sh.c].sort(function (a, b) { return b - a; });
    if (s[0] - s[1] < 0.05) return false;
    return wantOK ? (o.U >= 0.68 && o.U <= 0.96) : (o.U >= 1.05 && o.U <= 1.3);
  });
  var o = calc1(d), it = [], N = o.N;
  it.push(num('a1', 'Tải trọng tính toán tại đáy móng N<sub>d1</sub>', o.Nd, 'kN/m', 1, 0,
    'N<sub>d1</sub> = N<sub>0</sub> + γ<sub>f</sub>·γ<sub>tb</sub>·h<sub>m</sub>·b = ' + f(d.N0, 0) + ' + 1,1·20·' + f(d.hm, 1) + '·' + f(d.b, 1) + ' = ' + f(o.Nd, 1)));
  it.push(num('a2', 'Độ lệch tâm e = M/N<sub>d1</sub>', o.e, 'm', 3, 0,
    'e = ' + f(d.M, 0) + '/' + f(o.Nd, 1) + ' = ' + f(o.e, 3) + ' m (≤ b/6 = ' + f(d.b / 6, 3) + ' m: toàn đáy chịu nén)'));
  it.push(num('a3', 'Bề rộng hiệu dụng B′ = b − 2e', o.Bp, 'm', 2, 0, 'B′ = ' + f(d.b, 1) + ' − 2·' + f(o.e, 3) + ' = ' + f(o.Bp, 2) + ' m (V08 2.14)'));
  it.push(num('a4', 'Hệ số N<sub>q</sub> (φ = ' + d.phi + '°)', N.Nq, '', 2, 0, 'N<sub>q</sub> = tan²(45° + φ/2)·e<sup>π·tanφ</sup> = ' + f(N.Nq, 2) + ' (2.16)'));
  it.push(num('a5', 'Hệ số N<sub>c</sub>', N.Nc, '', 2, 0, 'N<sub>c</sub> = (N<sub>q</sub> − 1)·cotφ = ' + f(N.Nc, 2) + ' (2.17)'));
  it.push(num('a6', 'Hệ số N<sub>γ</sub>', N.Ng, '', 2, 0, 'N<sub>γ</sub> = 1,5·(N<sub>q</sub> − 1)·tanφ = ' + f(N.Ng, 2) + ' (2.18)'));
  it.push(num('a7', 'Sức chịu tải tính toán R<sub>d</sub> (trên 1 m dài, ξ = 1)', o.R, 'kN/m', 1, 0.03,
    'R<sub>d</sub> = B′·(N<sub>γ</sub>·B′·γ + N<sub>q</sub>·h<sub>m</sub>·γ + N<sub>c</sub>·c) = ' + f(o.Bp, 2) + '·(' + f(o.tg, 1) + ' + ' + f(o.tq, 1) + ' + ' + f(o.tc, 1) + ') = ' + f(o.R, 1) + ' (2.15)'));
  it.push(num('a8', 'Hệ số sử dụng U = γ<sub>n</sub>·N<sub>d1</sub>/(γ<sub>c</sub>·R<sub>d</sub>)', o.U, '', 2, 0.03,
    'U = 1,15·' + f(o.Nd, 1) + '/(0,9·' + f(o.R, 1) + ') = ' + f(o.U, 2) + ' (2.4)'));
  var ok = o.U <= 1;
  it.push(mcq('b1', 'Kết luận về điều kiện sức chịu tải của nền (TTGH1)?',
    ['Đạt: γ<sub>n</sub>N<sub>d1</sub> ≤ γ<sub>c</sub>R<sub>d</sub>', 'Không đạt: γ<sub>n</sub>N<sub>d1</sub> > γ<sub>c</sub>R<sub>d</sub>'], ok ? 0 : 1,
    'U = ' + f(o.U, 2) + (ok ? ' ≤ 1 → đạt.' : ' > 1 → không đạt, phải tăng b hoặc h<sub>m</sub>.')));
  var names = ['thành phần bề rộng (N<sub>γ</sub>)', 'thành phần độ sâu chôn móng (N<sub>q</sub>)', 'thành phần lực dính (N<sub>c</sub>)'];
  var sh = [o.sh.g, o.sh.q, o.sh.c], mi = sh.indexOf(Math.max.apply(null, sh));
  it.push(mcq('b2', 'Thành phần nào đóng góp nhiều nhất vào R<sub>d</sub>?', names, mi,
    'Đóng góp: N<sub>γ</sub> ' + f(sh[0] * 100, 0) + ' % · N<sub>q</sub> ' + f(sh[1] * 100, 0) + ' % · N<sub>c</sub> ' + f(sh[2] * 100, 0) + ' %.'));
  it.push(num('b3', 'Tỉ lệ đóng góp của thành phần N<sub>q</sub> (độ sâu chôn móng) vào R<sub>d</sub>', o.sh.q * 100, '%', 0, 2,
    'N<sub>q</sub>·h<sub>m</sub>·γ / (tổng) = ' + f(o.tq, 1) + '/' + f(o.tg + o.tq + o.tc, 1) + ' = ' + f(o.sh.q * 100, 0) + ' %'));
  it.push(num('b4', 'Mô men M làm bề rộng móng giảm bao nhiêu % (so với b)?', 2 * o.e / d.b * 100, '%', 1, 0.5,
    '2e/b = ' + f(2 * o.e, 3) + '/' + f(d.b, 1) + ' = ' + f(2 * o.e / d.b * 100, 1) + ' %'));
  var intro = 'Móng băng BTCT dưới tường, bề rộng <b>b = ' + f(d.b, 1) + ' m</b>, chôn sâu <b>h<sub>m</sub> = ' + f(d.hm, 1) + ' m</b>. Công trình cấp hậu quả C2. ' +
    'Tải trọng tính toán TTGH1 tại cốt mặt đất: <b>N<sub>0,d1</sub> = ' + f(d.N0, 0) + ' kN/m</b>; <b>M<sub>0,d1</sub> = ' + f(d.M, 0) + ' kN·m/m</b>. ' +
    'Nền đất đồng nhất: γ = ' + f(d.g, 1) + ' kN/m³, φ = ' + d.phi + '°, c = ' + f(d.c, 0) + ' kPa. Lấy γ<sub>f</sub> = 1,1; γ<sub>tb</sub> = 20 kN/m³; γ<sub>n</sub> = 1,15; γ<sub>c</sub> = 0,9 (đất dính). Kiểm tra sức chịu tải của nền theo TTGH1.';
  return { d: d, o: o, items: it, intro: intro, formulas: F_SCT(false) };
}

// ═════════ Ex2: SCT móng đơn lệch tâm ═════════
function calc2(d) {
  var o = {}, N = Nfac(d.phi);
  o.N = N;
  o.Nd = d.N0 + K.gf1 * K.gtb * d.hm * d.B * d.L;
  o.eB = d.Mx / o.Nd; o.eL = d.My / o.Nd;
  o.Bp = d.B - 2 * o.eB; o.Lp = d.L - 2 * o.eL;
  o.Be = Math.min(o.Bp, o.Lp); o.Le = Math.max(o.Bp, o.Lp);
  o.eta = o.Be / o.Le; o.xi = Xi(o.eta);
  o.tg = N.Ng * o.xi.g * o.Be * d.g; o.tq = N.Nq * o.xi.q * d.hm * d.g; o.tc = N.Nc * o.xi.c * d.c;
  o.R = o.Be * o.Le * (o.tg + o.tq + o.tc);
  o.U = K.gn * o.Nd / (K.gc * o.R);
  return o;
}
function gen2(r) {
  var wantOK = r() < 0.5, ratio = pick(r, [1.2, 1.3, 1.5, 1.6, 1.8]);
  var d = search(r, function (r) {
    var B = pick(r, range(1.2, 2.6, 0.1));
    return { phi: pick(r, [15, 18, 20, 22, 25, 28]), c: pick(r, [5, 8, 10, 12, 15, 18]), g: pick(r, [17, 17.5, 18, 18.5, 19]),
      hm: pick(r, [1.0, 1.2, 1.4, 1.6, 1.8]), N0: pick(r, range(500, 1200, 50)), B: B, L: rnd(Math.round(B * ratio * 10) / 10, 1),
      My: pick(r, range(30, 150, 10)), Mx: pick(r, range(10, 80, 10)) };
  }, function (d) {
    if (d.L < d.B) return false;
    var o = calc2(d);
    if (o.eB > d.B / 6 || o.eL > d.L / 6 || Math.abs(o.eB * 2 / d.B - o.eL * 2 / d.L) < 0.01) return false;
    return wantOK ? (o.U >= 0.7 && o.U <= 0.96) : (o.U >= 1.05 && o.U <= 1.35);
  });
  var o = calc2(d), it = [], N = o.N;
  it.push(num('a1', 'Tải trọng tại đáy móng N<sub>d1</sub>', o.Nd, 'kN', 1, 0,
    'N<sub>d1</sub> = N<sub>0</sub> + γ<sub>f</sub>·γ<sub>tb</sub>·h<sub>m</sub>·B·L = ' + f(d.N0, 0) + ' + 1,1·20·' + f(d.hm, 1) + '·' + f(d.B, 1) + '·' + f(d.L, 1) + ' = ' + f(o.Nd, 1)));
  it.push(num('a2', 'Độ lệch tâm e<sub>B</sub> = M<sub>x</sub>/N<sub>d1</sub> (theo cạnh B)', o.eB, 'm', 3, 0, 'e<sub>B</sub> = ' + f(d.Mx, 0) + '/' + f(o.Nd, 1) + ' = ' + f(o.eB, 3)));
  it.push(num('a3', 'Độ lệch tâm e<sub>L</sub> = M<sub>y</sub>/N<sub>d1</sub> (theo cạnh L)', o.eL, 'm', 3, 0, 'e<sub>L</sub> = ' + f(d.My, 0) + '/' + f(o.Nd, 1) + ' = ' + f(o.eL, 3)));
  it.push(num('a4', 'B′ = B − 2e<sub>B</sub> và L′ = L − 2e<sub>L</sub>: nhập giá trị <b>B<sub>eff</sub> = min(B′, L′)</b>', o.Be, 'm', 2, 0,
    'B′ = ' + f(o.Bp, 2) + ' ; L′ = ' + f(o.Lp, 2) + ' → B<sub>eff</sub> = min = ' + f(o.Be, 2) + ' (2.14, 2.20)'));
  it.push(num('a5', 'L<sub>eff</sub> = max(B′, L′)', o.Le, 'm', 2, 0, 'L<sub>eff</sub> = ' + f(o.Le, 2)));
  it.push(num('a6', 'N<sub>q</sub> (φ = ' + d.phi + '°)', N.Nq, '', 2, 0, 'N<sub>q</sub> = ' + f(N.Nq, 2)));
  it.push(num('a7', 'N<sub>c</sub>', N.Nc, '', 2, 0, 'N<sub>c</sub> = ' + f(N.Nc, 2)));
  it.push(num('a8', 'N<sub>γ</sub>', N.Ng, '', 2, 0, 'N<sub>γ</sub> = ' + f(N.Ng, 2)));
  it.push(num('a9', 'Hệ số hình dạng ξ<sub>γ</sub> = 1 − 0,25·B<sub>eff</sub>/L<sub>eff</sub>', o.xi.g, '', 3, 0, 'ξ<sub>γ</sub> = 1 − 0,25·' + f(o.eta, 3) + ' = ' + f(o.xi.g, 3) + ' (2.19)'));
  it.push(num('a10', 'ξ<sub>q</sub> = 1 + 1,5·B<sub>eff</sub>/L<sub>eff</sub>', o.xi.q, '', 3, 0, 'ξ<sub>q</sub> = ' + f(o.xi.q, 3)));
  it.push(num('a11', 'ξ<sub>c</sub> = 1 + 0,3·B<sub>eff</sub>/L<sub>eff</sub>', o.xi.c, '', 3, 0, 'ξ<sub>c</sub> = ' + f(o.xi.c, 3)));
  it.push(num('a12', 'Sức chịu tải tính toán R<sub>d</sub>', o.R, 'kN', 0, 0.03,
    'R<sub>d</sub> = B<sub>eff</sub>·L<sub>eff</sub>·(N<sub>γ</sub>ξ<sub>γ</sub>B<sub>eff</sub>γ + N<sub>q</sub>ξ<sub>q</sub>γh<sub>m</sub> + N<sub>c</sub>ξ<sub>c</sub>c) = ' + f(o.Be * o.Le, 3) + '·(' + f(o.tg, 1) + ' + ' + f(o.tq, 1) + ' + ' + f(o.tc, 1) + ') = ' + f(o.R, 0) + ' (2.15)'));
  it.push(num('a13', 'Hệ số sử dụng U = γ<sub>n</sub>N<sub>d1</sub>/(γ<sub>c</sub>R<sub>d</sub>)', o.U, '', 2, 0.03, 'U = 1,15·' + f(o.Nd, 1) + '/(0,9·' + f(o.R, 0) + ') = ' + f(o.U, 2)));
  var ok = o.U <= 1;
  it.push(mcq('b1', 'Kết luận về sức chịu tải của nền (TTGH1)?', ['Đạt', 'Không đạt'], ok ? 0 : 1, 'U = ' + f(o.U, 2) + (ok ? ' ≤ 1: đạt.' : ' > 1: không đạt.')));
  var rb = 2 * o.eB / d.B, rl = 2 * o.eL / d.L;
  it.push(mcq('b2', 'Mô men theo phương nào làm giảm kích thước đáy nhiều hơn (tính theo %)?',
    ['Theo cạnh B (M<sub>x</sub>): ' + '2e<sub>B</sub>/B', 'Theo cạnh L (M<sub>y</sub>): ' + '2e<sub>L</sub>/L'], rb > rl ? 0 : 1,
    '2e<sub>B</sub>/B = ' + f(rb * 100, 1) + ' % ; 2e<sub>L</sub>/L = ' + f(rl * 100, 1) + ' %.'));
  var intro = 'Móng đơn BTCT, đáy <b>B × L = ' + f(d.B, 1) + ' × ' + f(d.L, 1) + ' m</b> (L theo phương mô men M<sub>y</sub>), chôn sâu <b>h<sub>m</sub> = ' + f(d.hm, 1) + ' m</b>. Cấp hậu quả C2. ' +
    'Tải trọng TTGH1 tại cốt mặt đất: <b>N<sub>0,d1</sub> = ' + f(d.N0, 0) + ' kN</b>, <b>M<sub>y</sub> = ' + f(d.My, 0) + ' kN·m</b>, <b>M<sub>x</sub> = ' + f(d.Mx, 0) + ' kN·m</b>. ' +
    'Nền đồng nhất: γ = ' + f(d.g, 1) + ' kN/m³, φ = ' + d.phi + '°, c = ' + f(d.c, 0) + ' kPa. γ<sub>f</sub> = 1,1; γ<sub>tb</sub> = 20; γ<sub>n</sub> = 1,15; γ<sub>c</sub> = 0,9. Kiểm tra sức chịu tải của nền (TTGH1) có kể lệch tâm.';
  return { d: d, o: o, items: it, intro: intro, formulas: F_SCT(true) };
}

// ═════════ Ex3: SCT lớp yếu / đệm cát (khối quy ước θ = 8°) ═════════
function calc3(d) {
  var o = {}, N = Nfac(d.phi2);
  o.N = N;
  o.Nd = d.N0 + K.gf1 * K.gtb * d.hm * d.B * d.L;
  o.eB = d.Mx / o.Nd; o.eL = d.My / o.Nd;
  o.Bp = d.B - 2 * o.eB; o.Lp = d.L - 2 * o.eL;
  o.Be = Math.min(o.Bp, o.Lp); o.Le = Math.max(o.Bp, o.Lp);
  o.B2 = o.Be + 2 * d.H * K.tan8; o.L2 = o.Le + 2 * d.H * K.tan8;
  o.A2 = o.B2 * o.L2;
  o.Ndw = d.N0 + K.gf1 * (K.gtb * d.hm + d.gu * d.H) * o.A2;
  o.eta = o.B2 / o.L2; o.xi = Xi(o.eta);
  o.q2 = d.g0 * d.hm + d.gu * d.H;
  o.tg = N.Ng * o.xi.g * o.B2 * d.g2; o.tq = N.Nq * o.xi.q * o.q2; o.tc = N.Nc * o.xi.c * d.c2;
  o.R = o.A2 * (o.tg + o.tq + o.tc);
  o.U = K.gn * o.Ndw / (K.gc * o.R);
  return o;
}
function gen3(r, stt) {
  var cat = (stt % 2 === 0), wantOK = r() < 0.5, ratio = pick(r, [1.3, 1.5, 1.8]);
  var d = search(r, function (r) {
    var B = pick(r, range(1.0, 2.2, 0.1)), g0 = pick(r, [17, 17.5, 18, 18.5, 19]);
    var x = { cat: cat, B: B, L: rnd(Math.round(B * ratio * 10) / 10, 1), hm: pick(r, [1.0, 1.2, 1.4]),
      N0: pick(r, range(500, 1100, 50)), My: pick(r, range(30, 100, 10)), Mx: pick(r, range(10, 50, 10)),
      g0: g0, phi2: pick(r, [6, 8, 9, 10, 12]), c2: pick(r, [4, 5, 8, 10]), g2: pick(r, [16, 16.5, 17, 17.5]) };
    if (cat) { x.H = pick(r, range(1.2, 2.4, 0.2)); x.gu = pick(r, [18, 18.5, 19]); x.h1 = null; }
    else { x.H = pick(r, range(1.2, 2.4, 0.2)); x.gu = g0; x.h1 = rnd(x.hm + x.H, 1); }
    return x;
  }, function (d) {
    var o = calc3(d), dd = JSON.parse(JSON.stringify(d));
    if (d.L < d.B || o.eB > d.B / 6 || o.eL > d.L / 6) return false;
    if (!(wantOK ? (o.U >= 0.72 && o.U <= 0.97) : (o.U >= 1.05 && o.U <= 1.4))) return false;
    dd.H += 0.4;   // H tăng 0,4 m, giữ hm
    var U2 = calc3(dd).U;
    return Math.abs(U2 - o.U) / o.U > 0.03;
  });
  var o = calc3(d), it = [], N = o.N;
  var dd = JSON.parse(JSON.stringify(d)); dd.H += 0.4; var U2 = calc3(dd).U;
  it.push(num('a1', 'Tải tại đáy móng N<sub>d1</sub> = N<sub>0</sub> + γ<sub>f</sub>γ<sub>tb</sub>h<sub>m</sub>BL', o.Nd, 'kN', 1, 0,
    'N<sub>d1</sub> = ' + f(d.N0, 0) + ' + 1,1·20·' + f(d.hm, 1) + '·' + f(d.B, 1) + '·' + f(d.L, 1) + ' = ' + f(o.Nd, 1)));
  it.push(num('a2', 'B<sub>eff</sub> = min(B − 2e<sub>B</sub>, L − 2e<sub>L</sub>) với e = M/N<sub>d1</sub>', o.Be, 'm', 2, 0,
    'e<sub>B</sub> = ' + f(o.eB, 3) + ', e<sub>L</sub> = ' + f(o.eL, 3) + ' → B′ = ' + f(o.Bp, 2) + ', L′ = ' + f(o.Lp, 2) + ' → B<sub>eff</sub> = ' + f(o.Be, 2)));
  it.push(num('a3', 'L<sub>eff</sub> = max(B′, L′)', o.Le, 'm', 2, 0, 'L<sub>eff</sub> = ' + f(o.Le, 2)));
  it.push(num('a4', 'Kích thước khối quy ước B″ = B<sub>eff</sub> + 2H·tan8°', o.B2, 'm', 2, 0, 'B″ = ' + f(o.Be, 2) + ' + 2·' + f(d.H, 1) + '·0,1405 = ' + f(o.B2, 2) + ' (V08, góc phân tán 8°)'));
  it.push(num('a5', 'L″ = L<sub>eff</sub> + 2H·tan8°', o.L2, 'm', 2, 0, 'L″ = ' + f(o.Le, 2) + ' + 2·' + f(d.H, 1) + '·0,1405 = ' + f(o.L2, 2)));
  it.push(num('a6', 'Tải tại đỉnh lớp yếu N<sub>d,yếu</sub> = N<sub>0</sub> + γ<sub>f</sub>·(γ<sub>tb</sub>h<sub>m</sub> + γ<sub>u</sub>H)·B″L″', o.Ndw, 'kN', 0, 0.02,
    'N<sub>d,yếu</sub> = ' + f(d.N0, 0) + ' + 1,1·(20·' + f(d.hm, 1) + ' + ' + f(d.gu, 1) + '·' + f(d.H, 1) + ')·' + f(o.A2, 3) + ' = ' + f(o.Ndw, 0)));
  it.push(num('a7', 'Áp lực phủ q<sub>2</sub> = γ<sub>0</sub>·h<sub>m</sub> + γ<sub>u</sub>·H', o.q2, 'kPa', 1, 0, 'q<sub>2</sub> = ' + f(d.g0, 1) + '·' + f(d.hm, 1) + ' + ' + f(d.gu, 1) + '·' + f(d.H, 1) + ' = ' + f(o.q2, 1)));
  it.push(num('a8', 'N<sub>q</sub> (lớp yếu, φ<sub>2</sub> = ' + d.phi2 + '°)', N.Nq, '', 2, 0, 'N<sub>q</sub> = ' + f(N.Nq, 2)));
  it.push(num('a9', 'N<sub>c</sub> (lớp yếu)', N.Nc, '', 2, 0, 'N<sub>c</sub> = ' + f(N.Nc, 2)));
  it.push(num('a10', 'N<sub>γ</sub> (lớp yếu)', N.Ng, '', 2, 0, 'N<sub>γ</sub> = ' + f(N.Ng, 2)));
  it.push(num('a11', 'ξ<sub>q</sub> = 1 + 1,5·B″/L″', o.xi.q, '', 3, 0, 'η = ' + f(o.eta, 3) + ' → ξ<sub>q</sub> = ' + f(o.xi.q, 3) + ' ; ξ<sub>γ</sub> = ' + f(o.xi.g, 3) + ' ; ξ<sub>c</sub> = ' + f(o.xi.c, 3)));
  it.push(num('a12', 'R<sub>d</sub> của lớp yếu = B″L″(N<sub>γ</sub>ξ<sub>γ</sub>B″γ<sub>2</sub> + N<sub>q</sub>ξ<sub>q</sub>q<sub>2</sub> + N<sub>c</sub>ξ<sub>c</sub>c<sub>2</sub>)', o.R, 'kN', 0, 0.03,
    'R<sub>d</sub> = ' + f(o.A2, 3) + '·(' + f(o.tg, 1) + ' + ' + f(o.tq, 1) + ' + ' + f(o.tc, 1) + ') = ' + f(o.R, 0) + ' (V08 2.38)'));
  it.push(num('a13', 'U = γ<sub>n</sub>N<sub>d,yếu</sub>/(γ<sub>c</sub>R<sub>d</sub>)', o.U, '', 2, 0.03, 'U = 1,15·' + f(o.Ndw, 0) + '/(0,9·' + f(o.R, 0) + ') = ' + f(o.U, 2)));
  var ok = o.U <= 1;
  it.push(mcq('b1', 'Kết luận về sức chịu tải của lớp yếu?', ['Đạt', 'Không đạt'], ok ? 0 : 1, 'U = ' + f(o.U, 2) + (ok ? ' ≤ 1: đạt.' : ' > 1: không đạt.')));
  var dir = U2 < o.U ? 0 : 1;
  it.push(mcq('b2', 'Nếu ' + (d.cat ? 'tăng chiều dày đệm cát thêm 0,4 m' : 'lớp 1 (tốt) dày thêm 0,4 m (lớp yếu nằm sâu hơn, H tăng 0,4 m)') + ', hệ số U thay đổi thế nào?',
    ['U giảm', 'U tăng'], dir, 'Tính lại với H + 0,4 m: U = ' + f(U2, 2) + (dir === 0 ? ' < ' : ' > ') + f(o.U, 2) + '.'));
  var intro = 'Móng đơn BTCT, đáy <b>B × L = ' + f(d.B, 1) + ' × ' + f(d.L, 1) + ' m</b>, <b>h<sub>m</sub> = ' + f(d.hm, 1) + ' m</b>. Cấp hậu quả C2. ' +
    'Tải TTGH1 tại cốt mặt đất: <b>N<sub>0,d1</sub> = ' + f(d.N0, 0) + ' kN</b>, <b>M<sub>y</sub> = ' + f(d.My, 0) + ' kN·m</b>, <b>M<sub>x</sub> = ' + f(d.Mx, 0) + ' kN·m</b>. ';
  if (d.cat) intro += 'Lớp đất trên (từ mặt đất xuống): γ = ' + f(d.g0, 1) + ' kN/m³. Thay lớp đất dưới đáy móng bằng <b>đệm cát dày ' + f(d.H, 1) + ' m</b> (γ<sub>đ</sub> = ' + f(d.gu, 1) + ' kN/m³), dưới đệm là <b>lớp yếu</b>: ';
  else intro += 'Lớp 1 (tốt) dày <b>' + f(d.h1, 1) + ' m</b> tính từ mặt đất, γ = ' + f(d.g0, 1) + ' kN/m³; dưới là <b>lớp 2 yếu</b>: ';
  intro += 'γ<sub>2</sub> = ' + f(d.g2, 1) + ' kN/m³, φ<sub>2</sub> = ' + d.phi2 + '°, c<sub>2</sub> = ' + f(d.c2, 0) + ' kPa. ' +
    'Kiểm tra sức chịu tải của lớp yếu (TTGH1) theo móng khối quy ước, góc phân tán 8° (H = ' + f(d.H, 1) + ' m từ đáy móng đến đỉnh lớp yếu). γ<sub>f</sub> = 1,1; γ<sub>tb</sub> = 20; γ<sub>n</sub> = 1,15; γ<sub>c</sub> = 0,9; kể lệch tâm như móng đơn.';
  return { d: d, o: o, items: it, intro: intro, formulas: F_SCT3() };
}

// ═════════ Ex4: Lún TTGH2 (móng băng, cộng lún từng lớp) ═════════
function calc4(d) {
  var o = {};
  o.p = d.N0 / d.b + K.gf2 * K.gtb * d.hm;
  o.zg0 = d.g0 * d.hm; o.p0 = o.p - o.zg0;
  var h = K.hiRatio * d.b, kA = d.kA, zg = o.zg0, zpPrev = o.p0, S = 0, SA = 0, SB = 0, rows = [], n = 0;
  for (var i = 1; i <= 40; i++) {
    var inA = i <= kA, gam = inA ? d.gA : d.gB, E = inA ? d.EA : d.EB;
    zg += gam * h;
    var zp = alphaStrip(0.4 * i) * o.p0, si = K.beta * ((zpPrev + zp) / 2) * h / E;
    rows.push({ i: i, z: i * h, zg: zg, zp: zp, h: h, E: E, si: si, A: inA });
    S += si; if (inA) SA += si; else SB += si;
    n = i; zpPrev = zp;
    if (zp <= K.stop * zg) break;
  }
  o.rows = rows; o.n = n; o.S = S; o.SA = SA; o.SB = SB; o.h = h;
  o.zp1 = rows[0].zp; o.S1 = rows[0].si; o.Hc = n * h;
  return o;
}
function gen4(r) {
  var wantOK = r() < 0.5;
  var d = search(r, function (r) {
    var b = pick(r, range(1.0, 2.4, 0.2));
    return { b: b, hm: pick(r, [1.0, 1.2, 1.4, 1.6]), N0: pick(r, range(150, 450, 10)), g0: pick(r, [17, 17.5, 18, 18.5, 19]),
      kA: pick(r, [2, 3, 4]), gA: pick(r, [17, 17.5, 18, 18.5, 19]), gB: pick(r, [18, 18.5, 19, 19.5]),
      EA: pick(r, [5000, 6000, 8000, 10000, 12000]), EB: pick(r, [8000, 10000, 12000, 15000, 20000]) };
  }, function (d) {
    var o = calc4(d), q = o.S / K.Sgh;
    if (o.rows[o.rows.length - 1].zp > K.stop * o.rows[o.rows.length - 1].zg + 1e-9) return false;
    if (o.n < 4 || o.n > 12 || o.SB <= 0) return false;
    if (Math.abs(o.SA - o.SB) / o.S < 0.15) return false;
    return wantOK ? (q >= 0.55 && q <= 0.95) : (q >= 1.05 && q <= 1.5);
  });
  var o = calc4(d), it = [], R = o.rows;
  it.push(num('a1', 'Áp lực trung bình dưới đáy móng p<sub>tb</sub> = N<sub>0</sub>/b + γ<sub>tb</sub>·h<sub>m</sub> (γ<sub>f</sub> = 1,0)', o.p, 'kPa', 1, 0,
    'p = ' + f(d.N0, 0) + '/' + f(d.b, 1) + ' + 20·' + f(d.hm, 1) + ' = ' + f(o.p, 1)));
  it.push(num('a2', 'Áp lực gây lún p<sub>0</sub> = p − σ<sub>zg,0</sub>, σ<sub>zg,0</sub> = γ<sub>1</sub>·h<sub>m</sub>', o.p0, 'kPa', 1, 0,
    'σ<sub>zg,0</sub> = ' + f(d.g0, 1) + '·' + f(d.hm, 1) + ' = ' + f(o.zg0, 1) + ' ; p<sub>0</sub> = ' + f(o.p, 1) + ' − ' + f(o.zg0, 1) + ' = ' + f(o.p0, 1) + ' (2.51)'));
  it.push(num('a3', 'Chiều dày mỗi lớp phân tố h<sub>i</sub> = 0,4b', o.h, 'm', 2, 0, 'h<sub>i</sub> = 0,4·' + f(d.b, 1) + ' = ' + f(o.h, 2) + ' m'));
  it.push(num('a4', 'Ứng suất gây lún tại mặt dưới lớp 1 (z = 0,4b): σ<sub>zp</sub> = α·p<sub>0</sub>', o.zp1, 'kPa', 1, 0.02 * o.zp1,
    'α(z/b = 0,4) = ' + f(alphaStrip(0.4), 3) + ' → σ<sub>zp</sub> = ' + f(o.zp1, 1) + ' (2.52)'));
  it.push(num('a5', 'Độ lún lớp 1: s<sub>1</sub> = β·σ<sub>zp,tb</sub>·h<sub>1</sub>/E<sub>1</sub>, β = 0,8 (σ<sub>zp,tb</sub> = trung bình hai mặt lớp)', o.S1 * 100, 'cm', 2, 0.03 * o.S1 * 100,
    's<sub>1</sub> = 0,8·(' + f(o.p0, 1) + ' + ' + f(o.zp1, 1) + ')/2·' + f(o.h, 2) + '/' + f(d.EA, 0) + ' = ' + f(o.S1 * 100, 2) + ' cm (2.54)'));
  it.push(num('a6', 'Số lớp phân tố n tới ranh giới tắt lún (σ<sub>zp</sub> ≤ 0,2σ<sub>zg</sub>)', o.n, 'lớp', 0, 0,
    'Lớp thứ ' + o.n + ': σ<sub>zp</sub> = ' + f(R[o.n - 1].zp, 1) + ' ≤ 0,2·' + f(R[o.n - 1].zg, 1) + ' = ' + f(0.2 * R[o.n - 1].zg, 1) + ' (2.53); lớp trước chưa thỏa.'));
  it.push(num('a7', 'Tổng độ lún S = β·Σσ<sub>zp,i</sub>·h<sub>i</sub>/E<sub>i</sub>', o.S * 100, 'cm', 2, 0.03 * o.S * 100,
    'S = ' + f(o.S * 100, 2) + ' cm (cộng ' + o.n + ' lớp; xem bảng lời giải) (2.55)'));
  var ok = o.S <= K.Sgh;
  it.push(mcq('b1', 'So với S<sub>gh</sub> = 8 cm, điều kiện biến dạng (TTGH2)?', ['Đạt: S ≤ S<sub>gh</sub>', 'Không đạt: S > S<sub>gh</sub>'], ok ? 0 : 1,
    'S = ' + f(o.S * 100, 2) + ' cm ' + (ok ? '≤' : '>') + ' 8 cm.'));
  it.push(mcq('b2', 'Lớp đất nào gây phần lún lớn hơn (tổng s<sub>i</sub> của các lớp phân tố thuộc lớp đó)?',
    ['Lớp A (ngay dưới đáy móng, E = ' + f(d.EA / 1000, 0) + ' MPa)', 'Lớp B (bên dưới, E = ' + f(d.EB / 1000, 0) + ' MPa)'], o.SA > o.SB ? 0 : 1,
    'Lớp A: ' + f(o.SA * 100, 2) + ' cm; lớp B: ' + f(o.SB * 100, 2) + ' cm.'));
  it.push(num('b3', 'Chiều sâu vùng chịu nén H<sub>c</sub> = n·h<sub>i</sub> (kể từ đáy móng)', o.Hc, 'm', 2, 0, 'H<sub>c</sub> = ' + o.n + '·' + f(o.h, 2) + ' = ' + f(o.Hc, 2) + ' m'));
  var intro = 'Móng băng bề rộng <b>b = ' + f(d.b, 1) + ' m</b>, chôn sâu <b>h<sub>m</sub> = ' + f(d.hm, 1) + ' m</b>. Tải trọng TTGH2 tại cốt mặt đất: <b>N<sub>0,d2</sub> = ' + f(d.N0, 0) + ' kN/m</b>. ' +
    'Đất trên đáy móng: γ<sub>1</sub> = ' + f(d.g0, 1) + ' kN/m³. Dưới đáy móng: <b>lớp A</b> dày ' + f(d.kA * K.hiRatio * d.b, 2) + ' m (γ = ' + f(d.gA, 1) + ' kN/m³, E = ' + f(d.EA / 1000, 0) + ' MPa); <b>lớp B</b> rất dày (γ = ' + f(d.gB, 1) + ' kN/m³, E = ' + f(d.EB / 1000, 0) + ' MPa). Không có nước ngầm. ' +
    'Tính độ lún của móng theo phương pháp cộng lún từng lớp (V08 2.4.4): chia lớp h<sub>i</sub> = 0,4b, β = 0,8, dừng khi σ<sub>zp</sub> ≤ 0,2σ<sub>zg</sub>. Giới hạn S<sub>gh</sub> = 8 cm.';
  return { d: d, o: o, items: it, intro: intro, formulas: F_LUN(), table: alphaTable() };
}
function alphaTable() { var t = []; for (var i = 1; i <= 12; i++) t.push([f(0.4 * i, 1), f(alphaStrip(0.4 * i), 3)]); return t; }

// ═════════ Ex5: Chọc thủng ═════════
function calc5(d) {
  var o = {};
  o.h0 = d.h - d.ab - d.ds;
  o.p = d.N0 / (d.B * d.L);
  o.lp = d.lc + 2 * o.h0; o.bp = d.bc + 2 * o.h0;
  o.F = d.N0 - o.p * o.lp * o.bp;
  o.u = 2 * (d.lc + d.bc) + 4 * o.h0;
  o.Rbt = MAT[d.conc].Rbt;
  o.Fb = o.Rbt * o.u * o.h0;
  o.U = o.F / o.Fb;
  o.inside = o.lp < d.L && o.bp < d.B;
  // h0 nhỏ nhất để F ≤ Fb,u (chia đôi)
  var lo = 0.05, hi = 1.5, m, k, F, Fb;
  for (k = 0; k < 60; k++) {
    m = (lo + hi) / 2;
    F = d.N0 - o.p * (d.lc + 2 * m) * (d.bc + 2 * m); Fb = o.Rbt * (2 * (d.lc + d.bc) + 4 * m) * m;
    if (F <= Fb) hi = m; else lo = m;
  }
  o.h0min = hi; o.hmin = (o.h0min + d.ab + d.ds) / 0.05;
  return o;
}
function gen5(r) {
  var wantOK = r() < 0.5;
  var d = search(r, function (r) {
    var B = pick(r, range(1.4, 2.6, 0.1)), cs = [0.3, 0.4, 0.5], lc = pick(r, cs), bc = pick(r, cs.filter(function (x) { return x <= lc; }));
    return { B: B, L: rnd(Math.round(B * pick(r, [1.0, 1.2, 1.3, 1.5]) * 10) / 10, 1), lc: lc, bc: bc, N0: pick(r, range(500, 1600, 50)),
      h: pick(r, range(0.35, 0.7, 0.05)), ab: 0.04, ds: pick(r, [0.012, 0.014, 0.016]), conc: pick(r, ['B20', 'B25']) };
  }, function (d) {
    if (d.L < d.B) return false;
    var o = calc5(d);
    if (!o.inside || o.F <= 0 || o.h0 < 0.2) return false;
    if (nearInt(o.hmin, 0.12) || d.lc + 2 * o.h0min >= d.L || d.bc + 2 * o.h0min >= d.B) return false;
    return wantOK ? (o.U >= 0.55 && o.U <= 0.95) : (o.U >= 1.05 && o.U <= 1.5);
  });
  var o = calc5(d), it = [], hmin = Math.ceil(o.hmin - 1e-9) * 0.05;
  it.push(num('a1', 'Chiều cao làm việc trung bình h<sub>0</sub> = h − a<sub>b</sub> − d<sub>s</sub>', o.h0, 'm', 3, 0,
    'h<sub>0x</sub> = h − a<sub>b</sub> − d<sub>s</sub>/2 ; h<sub>0y</sub> = h<sub>0x</sub> − d<sub>s</sub> ; h<sub>0</sub> = ½(h<sub>0x</sub> + h<sub>0y</sub>) = ' + f(d.h, 2) + ' − ' + f(d.ab, 3) + ' − ' + f(d.ds, 3) + ' = ' + f(o.h0, 3) + ' (2.73, 2.74)'));
  it.push(num('a2', 'Phản lực nền thuần p = N<sub>0</sub>/(B·L)', o.p, 'kPa', 1, 0, 'p = ' + f(d.N0, 0) + '/(' + f(d.B, 1) + '·' + f(d.L, 1) + ') = ' + f(o.p, 1) + ' (2.68, không kể trọng lượng móng)'));
  it.push(num('a3', 'Lực chọc thủng F = N<sub>0</sub> − p·(l<sub>c</sub> + 2h<sub>0</sub>)(b<sub>c</sub> + 2h<sub>0</sub>)', o.F, 'kN', 1, 0.02 * o.F,
    'Đáy tháp: ' + f(o.lp, 3) + ' × ' + f(o.bp, 3) + ' m (nằm gọn trong đáy móng) → F = ' + f(d.N0, 0) + ' − ' + f(o.p, 1) + '·' + f(o.lp * o.bp, 3) + ' = ' + f(o.F, 1) + ' (2.77)'));
  it.push(num('a4', 'Chu vi tháp chọc thủng u = 2(l<sub>c</sub> + b<sub>c</sub>) + 4h<sub>0</sub>', o.u, 'm', 3, 0, 'u = 2·(' + f(d.lc, 1) + ' + ' + f(d.bc, 1) + ') + 4·' + f(o.h0, 3) + ' = ' + f(o.u, 3) + ' (2.76)'));
  it.push(num('a5', 'Khả năng chống chọc thủng F<sub>b,u</sub> = R<sub>bt</sub>·u·h<sub>0</sub>', o.Fb, 'kN', 1, 0.02 * o.Fb,
    'F<sub>b,u</sub> = ' + f(o.Rbt, 0) + '·' + f(o.u, 3) + '·' + f(o.h0, 3) + ' = ' + f(o.Fb, 1) + ' (2.75)'));
  it.push(num('a6', 'Hệ số sử dụng U = F/F<sub>b,u</sub>', o.U, '', 2, 0.03, 'U = ' + f(o.F, 1) + '/' + f(o.Fb, 1) + ' = ' + f(o.U, 2)));
  var ok = o.U <= 1;
  it.push(mcq('b1', 'Kết luận về điều kiện chọc thủng?', ['Đạt: F ≤ F<sub>b,u</sub>', 'Không đạt: F > F<sub>b,u</sub>'], ok ? 0 : 1, 'U = ' + f(o.U, 2) + (ok ? ' ≤ 1: đạt.' : ' > 1: không đạt, tăng h hoặc cấp bê tông.')));
  var mo = o.U <= 2 / 3;
  it.push(mcq('b2', 'Nếu cột còn truyền thêm một mô men (chỉ một phương), có thể bỏ qua kiểm tra chọc thủng do mô men không?',
    ['Có: vì F ≤ (2/3)·F<sub>b,u</sub>, điều kiện mô men tự thỏa', 'Không: F > (2/3)·F<sub>b,u</sub>, phải kiểm tra thêm do mô men'], mo ? 0 : 1,
    'U = ' + f(o.U, 2) + (mo ? ' ≤ 0,67' : ' > 0,67') + ' (V08 d.2119: chỉ một nửa mô men kể vào chọc thủng; quy tắc này áp cho mô men một phương).'));
  it.push(num('b3', 'Chiều cao làm việc nhỏ nhất h<sub>0,min</sub> để F ≤ F<sub>b,u</sub> (giữ N<sub>0</sub>, p, vật liệu)', o.h0min, 'm', 3, 0.03 * o.h0min,
    'Giải phương trình F(h<sub>0</sub>) = F<sub>b,u</sub>(h<sub>0</sub>) (bậc hai theo h<sub>0</sub>; có thể thử dần) → h<sub>0,min</sub> ≈ ' + f(o.h0min, 3) + ' m'));
  it.push(num('b4', 'Chiều cao móng h tối thiểu (làm tròn lên bội 0,05 m)', hmin, 'm', 2, 0,
    'h = h<sub>0,min</sub> + a<sub>b</sub> + d<sub>s</sub> = ' + f(o.h0min + d.ab + d.ds, 3) + ' → làm tròn lên ' + f(hmin, 2) + ' m'));
  var intro = 'Móng đơn BTCT <b>B × L = ' + f(d.B, 1) + ' × ' + f(d.L, 1) + ' m</b>, cột <b>l<sub>c</sub> × b<sub>c</sub> = ' + f(d.lc, 1) + ' × ' + f(d.bc, 1) + ' m</b> (l<sub>c</sub> song song L). ' +
    'Lực dọc tính toán chân cột <b>N<sub>0</sub> = ' + f(d.N0, 0) + ' kN</b> (đúng tâm). Chiều cao móng <b>h = ' + f(d.h * 1000, 0) + ' mm</b>, lớp bảo vệ a<sub>b</sub> = 40 mm (tới mặt thanh thép), thép d<sub>s</sub> = ' + f(d.ds * 1000, 0) + ' mm. ' +
    'Bê tông ' + d.conc + ' (R<sub>bt</sub> = ' + f(o.Rbt / 1000, 2) + ' MPa). Kiểm tra điều kiện chọc thủng của cột lên móng.';
  return { d: d, o: o, items: it, intro: intro, formulas: F_CHOC() };
}

// ═════════ Ex6: Thép đáy móng (phương cạnh dài L) ═════════
function calc6(d) {
  var o = {}, m = MAT[d.conc], s = MAT[d.steel];
  o.h0 = d.h - d.ab - d.ds / 2;
  o.lx = (d.L - d.lc) / 2;
  o.pavg = d.N0 / (d.B * d.L);
  if (d.My > 0) {
    o.pmax = o.pavg + 6 * d.My / (d.B * d.L * d.L); o.pmin = o.pavg - 6 * d.My / (d.B * d.L * d.L);
    o.p1 = o.pmin + (o.pmax - o.pmin) * (d.L - o.lx) / d.L;
    o.M = d.B * o.lx * o.lx * (o.pmax / 3 + o.p1 / 6);
    o.Mu = o.pavg * d.B * o.lx * o.lx / 2;
  } else { o.M = o.pavg * d.B * o.lx * o.lx / 2; o.Mu = o.M; }
  o.am = o.M / (m.Rb * d.B * o.h0 * o.h0);
  o.xi = 1 - Math.sqrt(1 - 2 * o.am);
  o.As = m.Rb * d.B * o.xi * o.h0 / s.Rs * 1e4;              // cm²
  o.mu = o.As / (d.B * 1e4 * o.h0) * 100;                     // %
  o.as = Math.PI * d.ds * d.ds / 4 * 1e4;                    // cm²/thanh
  o.nraw = o.As / o.as; o.n = Math.ceil(o.nraw - 1e-9);
  o.a = (d.B - 0.1) / (o.n - 1) * 1000;                       // mm
  o.alim = Math.min(1500 * d.h, 400);
  return o;
}
function gen6(r, stt) {
  var ecc = (r() < 0.6), Rs;
  var d = search(r, function (r) {
    var B = pick(r, range(1.4, 2.6, 0.1)), cs = [0.3, 0.4, 0.5], lc = pick(r, cs);
    var L = rnd(Math.round(B * pick(r, [1.0, 1.2, 1.3, 1.5]) * 10) / 10, 1);
    var N0 = pick(r, range(500, 1400, 50));
    return { B: B, L: L, lc: lc, bc: pick(r, cs.filter(function (x) { return x <= lc; })), N0: N0,
      My: ecc ? 5 * Math.round(N0 * L * pick(r, [0.03, 0.05, 0.07, 0.09]) / 5) : 0,
      h: pick(r, range(0.4, 0.7, 0.05)), ab: 0.05, ds: pick(r, [0.012, 0.014, 0.016]),
      conc: pick(r, ['B20', 'B25']), steel: pick(r, ['CB300', 'CB400']) };
  }, function (d) {
    if (d.L < d.B) return false;
    var o = calc6(d);
    if (o.lx <= 0.3 || o.am > 0.25 || o.mu < 0.12 || o.mu > 0.6 || o.n < 4 || o.n > 20) return false;
    if (d.My > 0 && (o.pmin < 10 || d.My * 6 / (d.B * d.L * d.L) / o.pavg > 0.9)) return false;
    if (d.My > 0 && Math.abs(o.M - o.Mu) / o.Mu < 0.05) return false;
    return !nearInt(o.nraw, 0.06);
  });
  var o = calc6(d), it = [], m = MAT[d.conc];
  var hd = d.My > 0 ? 'p<sub>max,min</sub> = N<sub>0</sub>/(BL) ± 6M<sub>y</sub>/(BL²)' : '';
  if (d.My > 0) {
    it.push(num('a1', 'Áp lực nền thuần lớn nhất p<sub>max</sub> = N<sub>0</sub>/(B·L) + 6M<sub>y</sub>/(B·L²)', o.pmax, 'kPa', 1, 0,
      'p<sub>tb</sub> = ' + f(d.N0, 0) + '/(' + f(d.B, 1) + '·' + f(d.L, 1) + ') = ' + f(o.pavg, 1) + ' ; p<sub>max</sub> = ' + f(o.pmax, 1) + ' ; p<sub>min</sub> = ' + f(o.pmin, 1) + ' (2.70)'));
    it.push(num('a2', 'Áp lực nền tại mép cột p<sub>1</sub> (nội suy tuyến tính từ p<sub>min</sub> đến p<sub>max</sub>)', o.p1, 'kPa', 1, 0.01 * o.p1,
      'p<sub>1</sub> = p<sub>min</sub> + (p<sub>max</sub> − p<sub>min</sub>)·(L − l<sub>x</sub>)/L = ' + f(o.p1, 1) + ' (l<sub>x</sub> = ' + f(o.lx, 2) + ' m)'));
  }
  it.push(num('a3', 'Mô men tại mép cột theo phương cạnh dài M' + (d.My > 0 ? ' = B·l<sub>x</sub>²·(p<sub>max</sub>/3 + p<sub>1</sub>/6)' : ' = p·B·l<sub>x</sub>²/2'), o.M, 'kN·m', 1, 0.02 * o.M,
    'l<sub>x</sub> = (L − l<sub>c</sub>)/2 = ' + f(o.lx, 2) + ' m → M = ' + f(o.M, 1) + (d.My > 0 ? ' (2.93)' : ' (V08 M.19)')));
  it.push(num('a4', 'Chiều cao làm việc h<sub>0</sub> = h − a<sub>b</sub> − d<sub>s</sub>/2', o.h0, 'm', 3, 0, 'h<sub>0</sub> = ' + f(d.h, 2) + ' − ' + f(d.ab, 3) + ' − ' + f(d.ds / 2, 3) + ' = ' + f(o.h0, 3) + ' (2.73)'));
  it.push(num('a5', 'α<sub>m</sub> = M/(R<sub>b</sub>·B·h<sub>0</sub>²)', o.am, '', 4, 0.03 * o.am, 'α<sub>m</sub> = ' + f(o.M, 1) + '/(' + f(m.Rb, 0) + '·' + f(d.B, 1) + '·' + f(o.h0, 3) + '²) = ' + f(o.am, 4)));
  it.push(num('a6', 'ξ = 1 − √(1 − 2α<sub>m</sub>)', o.xi, '', 4, 0.03 * o.xi, 'ξ = ' + f(o.xi, 4)));
  it.push(num('a7', 'Diện tích thép yêu cầu A<sub>s</sub> = R<sub>b</sub>·B·ξ·h<sub>0</sub>/R<sub>s</sub>', o.As, 'cm²', 2, 0.03 * o.As,
    'A<sub>s</sub> = ' + f(m.Rb, 0) + '·' + f(d.B, 1) + '·' + f(o.xi, 4) + '·' + f(o.h0, 3) + '/' + f(MAT[d.steel].Rs, 0) + ' = ' + f(o.As, 2) + ' cm² (2.94)'));
  it.push(num('a8', 'Hàm lượng thép μ = A<sub>s</sub>/(B·h<sub>0</sub>) (%)', o.mu, '%', 3, 0.03 * o.mu, 'μ = ' + f(o.mu, 3) + ' % ≥ 0,1 %: thỏa μ<sub>min</sub>'));
  it.push(num('a9', 'Số thanh Ф' + f(d.ds * 1000, 0) + ' tối thiểu n (a<sub>s</sub> = ' + f(o.as, 3) + ' cm²)', o.n, 'thanh', 0, 0, 'n = ⌈' + f(o.As, 2) + '/' + f(o.as, 3) + '⌉ = ⌈' + f(o.nraw, 2) + '⌉ = ' + o.n));
  it.push(num('a10', 'Khoảng cách thanh a = (B − 0,1)/(n − 1)', o.a, 'mm', 0, 0.02 * o.a, 'a = (' + f(d.B, 1) + ' − 0,1)/(' + o.n + ' − 1) = ' + f(o.a, 0) + ' mm (2 đầu cách mép 50 mm)'));
  var aok = o.a <= o.alim;
  it.push(mcq('b1', 'Khoảng cách thanh có thỏa a ≤ min(1,5h; 400 mm) không?', ['Thỏa', 'Không thỏa'], aok ? 0 : 1,
    'min(1,5·' + f(d.h * 1000, 0) + '; 400) = ' + f(o.alim, 0) + ' mm; a = ' + f(o.a, 0) + ' mm → ' + (aok ? 'thỏa.' : 'không thỏa, tăng số thanh.')));
  if (d.My > 0) {
    it.push(mcq('b2', 'Nếu bỏ qua mô men và dùng p<sub>tb</sub> đều để tính M thì kết quả?',
      ['Đánh giá thấp M (thiên về không an toàn)', 'Đánh giá cao M (thiên về an toàn)'], o.Mu < o.M ? 0 : 1,
      'M<sub>đều</sub> = ' + f(o.Mu, 1) + (o.Mu < o.M ? ' < ' : ' > ') + 'M = ' + f(o.M, 1) + ' kN·m.'));
  }
  var intro = 'Móng đơn BTCT <b>B × L = ' + f(d.B, 1) + ' × ' + f(d.L, 1) + ' m</b>, cột <b>l<sub>c</sub> × b<sub>c</sub> = ' + f(d.lc, 1) + ' × ' + f(d.bc, 1) + ' m</b> (l<sub>c</sub> song song L). ' +
    'Tải trọng tính toán chân cột: <b>N<sub>0</sub> = ' + f(d.N0, 0) + ' kN</b>' + (d.My > 0 ? ', <b>M<sub>y</sub> = ' + f(d.My, 0) + ' kN·m</b> (lệch tâm theo phương L)' : ' (đúng tâm)') +
    '. Chiều cao móng <b>h = ' + f(d.h * 1000, 0) + ' mm</b>, a<sub>b</sub> = 50 mm, thép Ф' + f(d.ds * 1000, 0) + '. Bê tông ' + d.conc + ' (R<sub>b</sub> = ' + f(m.Rb / 1000, 1) + ' MPa), thép ' + d.steel + ' (R<sub>s</sub> = ' + f(MAT[d.steel].Rs / 1000, 0) + ' MPa). ' +
    'Tính cốt thép chịu lực đặt theo phương cạnh dài L (chỉ dùng phản lực nền thuần, không kể trọng lượng móng).';
  return { d: d, o: o, items: it, intro: intro, formulas: F_THEP(d.My > 0) };
}

// ── khối công thức hiển thị ở dạng A ─────────────────────────
function F_SCT(ecc) {
  var a = ['Điều kiện: γ<sub>n</sub>·N<sub>d1</sub> ≤ γ<sub>c</sub>·R<sub>d</sub> (2.4); U = γ<sub>n</sub>N<sub>d1</sub>/(γ<sub>c</sub>R<sub>d</sub>)',
    'N<sub>d1</sub> = N<sub>0,d1</sub> + γ<sub>f</sub>·γ<sub>tb</sub>·h<sub>m</sub>·(b hoặc B·L)',
    'e = M/N<sub>d1</sub> ; B′ = B − 2e<sub>B</sub> ; L′ = L − 2e<sub>L</sub> (2.14)' + (ecc ? ' ; B<sub>eff</sub> = min(B′,L′), L<sub>eff</sub> = max(B′,L′) (2.20)' : ''),
    'N<sub>q</sub> = tan²(45° + φ/2)·e<sup>π·tanφ</sup> ; N<sub>c</sub> = (N<sub>q</sub> − 1)·cotφ ; N<sub>γ</sub> = 1,5(N<sub>q</sub> − 1)tanφ (2.16–2.18)',
    ecc ? 'ξ<sub>γ</sub> = 1 − 0,25η ; ξ<sub>q</sub> = 1 + 1,5η ; ξ<sub>c</sub> = 1 + 0,3η, η = B<sub>eff</sub>/L<sub>eff</sub> (2.19)' : 'Móng băng: ξ<sub>γ</sub> = ξ<sub>q</sub> = ξ<sub>c</sub> = 1',
    ecc ? 'R<sub>d</sub> = B<sub>eff</sub>·L<sub>eff</sub>·(N<sub>γ</sub>ξ<sub>γ</sub>B<sub>eff</sub>γ + N<sub>q</sub>ξ<sub>q</sub>γh<sub>m</sub> + N<sub>c</sub>ξ<sub>c</sub>c) (2.15)' : 'R<sub>d</sub> = B′·(N<sub>γ</sub>·B′·γ + N<sub>q</sub>·γ·h<sub>m</sub> + N<sub>c</sub>·c) trên 1 m dài (2.15)'];
  return a;
}
function F_SCT3() {
  return ['B″ = B<sub>eff</sub> + 2H·tan8° ; L″ = L<sub>eff</sub> + 2H·tan8° (H: từ đáy móng đến đỉnh lớp yếu)',
    'N<sub>d,yếu</sub> = N<sub>0</sub> + γ<sub>f</sub>·(γ<sub>tb</sub>h<sub>m</sub> + γ<sub>u</sub>H)·B″L″ ; q<sub>2</sub> = γ<sub>0</sub>h<sub>m</sub> + γ<sub>u</sub>H',
    'R<sub>d</sub> = B″L″·(N<sub>γ</sub>ξ<sub>γ</sub>B″γ<sub>2</sub> + N<sub>q</sub>ξ<sub>q</sub>q<sub>2</sub> + N<sub>c</sub>ξ<sub>c</sub>c<sub>2</sub>), hệ số theo φ<sub>2</sub>, ξ theo η = B″/L″ (2.38)',
    'U = γ<sub>n</sub>N<sub>d,yếu</sub>/(γ<sub>c</sub>R<sub>d</sub>) ; N<sub>γ</sub>, N<sub>q</sub>, N<sub>c</sub> và ξ như (2.16–2.19)'];
}
function F_LUN() {
  return ['p = N<sub>0</sub>/b + γ<sub>tb</sub>h<sub>m</sub> (γ<sub>f</sub> = 1,0) ; σ<sub>zg,0</sub> = γ<sub>1</sub>h<sub>m</sub> ; p<sub>0</sub> = p − σ<sub>zg,0</sub> (2.51)',
    'h<sub>i</sub> = 0,4b ; σ<sub>zp</sub>(z) = α·p<sub>0</sub> (2.52) ; α tra bảng bên dưới theo z/b, hoặc α = (2/π)[arctan(1/m) + m/(1+m²)], m = 2z/b',
    'σ<sub>zg</sub>(z) = σ<sub>zg,0</sub> + Σγ<sub>k</sub>h<sub>k</sub> (2.48) ; dừng ở lớp có σ<sub>zp</sub> ≤ 0,2σ<sub>zg</sub> (2.53)',
    's<sub>i</sub> = β·σ<sub>zp,i</sub>·h<sub>i</sub>/E<sub>i</sub>, σ<sub>zp,i</sub> = trung bình hai mặt lớp, β = 0,8 (2.54) ; S = Σs<sub>i</sub> (2.55), cộng đến hết lớp đầu tiên có mặt dưới thỏa σ<sub>zp</sub> ≤ 0,2σ<sub>zg</sub>'];
}
function F_CHOC() {
  return ['h<sub>0</sub> = h − a<sub>b</sub> − d<sub>s</sub> (2.73, 2.74) ; p = N<sub>0</sub>/(B·L) (2.68)',
    'F = N<sub>0</sub> − p·(l<sub>c</sub> + 2h<sub>0</sub>)(b<sub>c</sub> + 2h<sub>0</sub>) (2.77)',
    'u = 2(l<sub>c</sub> + b<sub>c</sub>) + 4h<sub>0</sub> (2.76) ; F<sub>b,u</sub> = R<sub>bt</sub>·u·h<sub>0</sub> ; điều kiện F ≤ F<sub>b,u</sub> (2.75)',
    'Mô men một phương: nếu F ≤ (2/3)F<sub>b,u</sub> thì điều kiện mô men tự thỏa'];
}
function F_THEP(ecc) {
  return ['l<sub>x</sub> = (L − l<sub>c</sub>)/2 ; h<sub>0</sub> = h − a<sub>b</sub> − d<sub>s</sub>/2 (2.73)',
    ecc ? 'p<sub>max,min</sub> = N<sub>0</sub>/(BL) ± 6M<sub>y</sub>/(BL²) (2.70) ; M = B·l<sub>x</sub>²(p<sub>max</sub>/3 + p<sub>1</sub>/6) (2.93)' : 'M = p·B·l<sub>x</sub>²/2, p = N<sub>0</sub>/(BL)',
    'α<sub>m</sub> = M/(R<sub>b</sub>Bh<sub>0</sub>²) ; ξ = 1 − √(1 − 2α<sub>m</sub>) ; A<sub>s</sub> = R<sub>b</sub>Bξh<sub>0</sub>/R<sub>s</sub> (2.94)',
    'μ = A<sub>s</sub>/(Bh<sub>0</sub>) ≥ 0,1 % ; a ≤ min(1,5h; 400 mm) ; a = (B − 0,1)/(n − 1)'];
}

// ── dựng item ────────────────────────────────────────────────
function num(id, q, ans, unit, dec, tol, expl) { return { id: id, type: 'num', q: q, ans: rnd(ans, dec + 2), unit: unit, dec: dec, tol: tol || 0, expl: expl }; }
function mcq(id, q, opts, ci, expl) { return { id: id, type: 'mcq', q: q, opts: opts, ci: ci, expl: expl }; }

// phương án nhiễu cho câu số khi làm ở dạng C (3 số khác nhau, không trùng đáp án sau khi làm tròn)
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
  S.items.forEach(function (it) {   // hệ số sức chịu tải tính từ công thức, không tra Bảng 4 của V08
    if (it.type === 'num' && /^(Hệ số )?N<sub>[qcγ]<\/sub>/.test(it.q)) it.q += ' <i>— tính theo (2.16)–(2.18), không tra bảng</i>';
  });
  return S;
}

root.CLO2 = { gen: gen, K: K, MAT: MAT, EX_LBL: EX_LBL, Nfac: Nfac, Xi: Xi, alphaStrip: alphaStrip, numOpts: numOpts, f: f,
  calc: [calc1, calc2, calc3, calc4, calc5, calc6] };
if (typeof module !== 'undefined' && module.exports) module.exports = root.CLO2;
})(typeof window !== 'undefined' ? window : globalThis);
