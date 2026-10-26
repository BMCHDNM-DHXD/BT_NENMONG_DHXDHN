// Kiểm CLO3: node tests/clo3_check.js [maxStt]   — 200 STT × 6 bài × 3 dạng
const fs = require('fs'), path = require('path');
const eng = fs.readFileSync(path.join(__dirname, '../assets/js/engine.js'), 'utf8');
const m = eng.match(/function seededRng[\s\S]*?\r?\n}\r?\n/);
const seededRng = new Function(m[0] + '; return seededRng;')();
const C = require('../assets/js/clo3.js');
const max = parseInt(process.argv[2]) || 200;
let n = 0, bad = 0, log = [];
const stat = {};
function err(t) { bad++; if (log.length < 30) log.push(t); }
function near(a, b, tol, tag) { if (Math.abs(a - b) > tol) err('đối chiếu lệch ' + tag + ': ' + a + ' ≠ ' + b); }

for (let stt = 1; stt <= max; stt++) for (let ex = 0; ex < 6; ex++) for (let d = 1; d <= 3; d++) {
  const S = C.gen(stt, ex, d, seededRng); n++;
  const tag = [stt, ex, d].join('/');
  if (S.d._fail) err('không tìm được đề ' + tag);
  const txt = JSON.stringify(S.items) + S.intro + S.formulas.join('') + (S.fig || '') + (S.tables || []).join('');
  if (/NaN|undefined|Infinity/.test(txt)) err('NaN/undefined ' + tag);
  const ids = new Set();
  S.items.forEach(it => {
    if (ids.has(it.id)) err('trùng id ' + tag + it.id); ids.add(it.id);
    if (it.type === 'num' && !isFinite(it.ans)) err('ans ' + tag + it.id);
    if (it.type === 'mcq' && (it.ci < 0 || it.ci >= it.opts.length)) err('mcq ' + tag + it.id);
    if (it.type === 'num') { const o = C.numOpts(it, seededRng(1)); if (o.length !== 4 || new Set(o.map(x => C.f(x.v, it.dec))).size !== 4) err('numOpts ' + tag + it.id + ' ans=' + it.ans); }
  });
  const key = 'ex' + ex; const s = stat[key] = stat[key] || { n: 0, items: 0 };
  s.n++; s.items = Math.max(s.items, S.items.length);
  const o = S.o;
  if (ex <= 2) {
    s.etaA = (s.etaA || 0) + (o.eta_a > o.eta_b ? 1 : 0);
    s.Rcd = s.Rcd || [9e9, 0]; s.Rcd = [Math.min(s.Rcd[0], o.Rcd), Math.max(s.Rcd[1], o.Rcd)];
    s.La = s.La || [99, 0]; s.La = [Math.min(s.La[0], o.g.La), Math.max(s.La[1], o.g.La)];
    s.Rb = (s.Rb || 0) + (o.RB / o.Ru > 0.5 ? 1 : 0);
    if (o.Rcd_b <= 0 || o.Rcdb_i <= 0) err('Rcd_b ≤ 0 ' + tag);
  }
  if (ex === 3) { s.v1 = s.v1 || [0, 0, 0]; s.v1[o.v1]++; s.v2 = s.v2 || [0, 0, 0]; s.v2[o.v2]++; s.pick = s.pick || [0, 0, 0]; s.pick[o.pick]++; s.roi = (s.roi || 0) + (S.d.roi ? 1 : 0); }
  if (ex === 4) { s.fail = (s.fail || 0) + (o.PA > S.d.Rcd ? 1 : 0); s.failB = (s.failB || 0) + (o.PB > S.d.Rcd ? 1 : 0); }
  if (ex === 5) {
    s.punchOK = (s.punchOK || 0) + (o.U <= 1 ? 1 : 0); s.steelOK = (s.steelOK || 0) + (o.rs >= 1 ? 1 : 0);
  }
}

// ── đối chiếu ví dụ trong "Đề NM CLO3 mức C4 (Khanh)" ──
const g0 = { hm: 1.5, t1: 7.5, t2: 5, p3: 1, dH: 2, dp: 0.25 };
const e1 = C.calc[0](Object.assign({ L1: { kind: 'clay', IL: 1.2 }, L2: { kind: 'clay', IL: 0.4 }, L3: { kind: 'clay', IL: 0.2 } }, g0));
console.log('Câu 1 (bảng tra): f2=' + e1.f2.toFixed(1) + ' (34) f3=' + e1.f3.toFixed(1) + ' (69,2) qb=' + e1.qb + ' (5420) Ru=' + e1.Ru.toFixed(2) + ' (577,95) Rcd=' + e1.Rcd.toFixed(1) + ' (412)');
near(e1.f2, 34, 0.01, 'f2 Câu1'); near(e1.f3, 69.2, 0.01, 'f3 Câu1'); near(e1.qb, 5420, 0.01, 'qb Câu1'); near(e1.Ru, 577.95, 0.01, 'Ru Câu1');
const e2 = C.calc[1](Object.assign({ L1: { kind: 'clay', N: 2 }, L2: { kind: 'clay', N: 15 }, L3: { kind: 'clay', N: 30 } }, g0));
console.log('Câu 2 (SPT): f2=' + e2.s2.f + ' (75) f3=' + e2.s3.f + ' (100) qb=' + e2.s3.qb + ' (1125) Ru=' + e2.Ru.toFixed(2) + ' (545,31) Rcd=' + e2.Rcd.toFixed(1) + ' (363)');
near(e2.Ru, 545.3125, 0.01, 'Ru Câu2');
const e3 = C.calc[2](Object.assign({ L1: { kind: 'clay', qc: 0.4 }, L2: { kind: 'clay', qc: 4 }, L3: { kind: 'clay', qc: 7.5 } }, g0));
console.log('Câu 3 (CPT): f2=' + e3.s2.f + ' (35) f3=' + e3.s3.f + ' (35) qb=' + e3.s3.qb + ' (4125) Ru=' + e3.Ru.toFixed(2) + ' (467,81) Rcd=' + e3.Rcd.toFixed(1) + ' (374)');
near(e3.Ru, 467.8125, 0.01, 'Ru Câu3');
const p6 = C.pilesGrid([-0.75, 0, 0.75], [-0.45, 0.45]), l6 = C.pileLoads(p6, 1600, 20, 80);
console.log('Câu 5 (6 cọc): Σx²=' + l6.sx.toFixed(3) + ' (2,25) Σy²=' + l6.sy.toFixed(3) + ' (1,215) Pmax=' + l6.Pmax.toFixed(2) + ' (300,75)');
near(l6.Pmax, 300.75, 0.01, 'Pmax Câu5');
const p7 = C.pilesGrid([-1.2, 0, 1.2], [-0.75, 0.75]), l7 = C.pileLoads(p7, 1600, 20, 80);
console.log('Câu 7: Σx²=' + l7.sx.toFixed(2) + ' (5,76) Σy²=' + l7.sy.toFixed(3) + ' (3,375) P3=' + l7.P[2].toFixed(2) + ' (287,78) P6=' + l7.P[5].toFixed(2) + ' (278,89)');
near(l7.P[2], 287.78, 0.01, 'P3 Câu7'); near(l7.P[5], 278.89, 0.01, 'P6 Câu7');
const e6 = C.calc[5]({ a: 1.2, b: 0.75, dp: 0.3, lc: 0.6, bc: 0.4, h: 0.7, cv: 0.1, conc: 'B25', steel: 'CB400', N: 3600, Mx: 0, My: 0, n: 12, ds: 16 });
console.log('Câu 6: c1=' + e6.c1.toFixed(2) + ' (0,6) c2=' + e6.c2.toFixed(2) + ' (0,4) Rđt=' + e6.Rdt.toFixed(0) + ' (3276) Pđt=' + e6.Pdt);
near(e6.Rdt, 3276, 0.5, 'Rdt Câu6');
const e7 = C.calc[5]({ a: 1.2, b: 0.75, dp: 0.3, lc: 0.6, bc: 0.4, h: 0.7, cv: 0.1, conc: 'B25', steel: 'CB400', N: 1600, Mx: 20, My: 80, n: 12, ds: 16 });
console.log('Câu 7: M=' + e7.M.toFixed(0) + ' (510) As=' + e7.Asr.toFixed(2) + ' (26,98) Asbt=' + e7.Asb.toFixed(2) + ' (24,12)');
near(e7.Asr, 26.98, 0.1, 'As Câu7'); near(e7.Asb, 24.13, 0.05, 'Asbt Câu7');
console.log(n + ' đề, ' + bad + ' lỗi'); log.forEach(l => console.log(' ', l)); console.log(JSON.stringify(stat));
process.exit(bad ? 1 : 0);
