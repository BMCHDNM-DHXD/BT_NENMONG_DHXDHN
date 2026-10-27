// Kiểm CLO2: node tests/clo2_check.js [maxStt]   — 200 STT × 6 bài × 3 dạng
const fs = require('fs'), path = require('path');
const eng = fs.readFileSync(path.join(__dirname, '../assets/js/engine.js'), 'utf8');
const m = eng.match(/function seededRng[\s\S]*?\r?\n}\r?\n/);
const seededRng = new Function(m[0] + '; return seededRng;')();
const C = require('../assets/js/clo2.js');
require('../assets/js/clo2-fig.js');
const max = parseInt(process.argv[2]) || 200;
let n = 0, bad = 0, log = [];
const stat = {};
function err(t) { bad++; if (log.length < 25) log.push(t); }
for (let stt = 1; stt <= max; stt++) for (let ex = 0; ex < 6; ex++) for (let d = 1; d <= 3; d++) {
  const S = C.gen(stt, ex, d, seededRng); n++;
  const tag = [stt, ex, d].join('/');
  if (S.d._fail) err('không tìm được đề ' + tag);
  const fig = C.fig(S);
  if (/NaN|undefined|Infinity/.test(fig)) err('SVG hỏng ' + tag);
  const txt = JSON.stringify(S.items) + S.intro + S.formulas.join('');
  if (/NaN|undefined|Infinity/.test(txt)) err('NaN/undefined ' + tag);
  S.items.forEach(it => {
    if (it.type === 'num' && !isFinite(it.ans)) err('ans ' + tag + it.id);
    if (it.type === 'mcq' && (it.ci < 0 || it.ci >= it.opts.length)) err('mcq ' + tag + it.id);
    if (it.type === 'num') { const o = C.numOpts(it, seededRng(1)); if (o.length !== 4 || new Set(o.map(x => C.f(x.v, it.dec))).size !== 4) err('numOpts ' + tag + it.id); }
  });
  const U = S.o.U; const key = 'ex' + ex;
  stat[key] = stat[key] || { ok: 0, no: 0, minU: 9, maxU: 0 };
  if (U !== undefined) { (U <= 1 ? stat[key].ok++ : stat[key].no++); stat[key].minU = Math.min(stat[key].minU, U); stat[key].maxU = Math.max(stat[key].maxU, U); }
  if (ex === 3) { const q = S.o.S / C.K.Sgh; (q <= 1 ? stat[key].ok++ : stat[key].no++); }
}
// đối chiếu Ver2 I-C1: b=1,5 hm=1,2 N0=260 M=10 γ=17 φ=22 c=6
const o1 = C.calc[0]({ phi: 22, c: 6, g: 17, hm: 1.2, N0: 260, M: 10, b: 1.5 });
console.log('Ver2 I-C1: Nd=' + o1.Nd.toFixed(1) + ' (299,6) B\'=' + o1.Bp.toFixed(2) + ' (1,43) Nq/Nc/Ng=' + [o1.N.Nq, o1.N.Nc, o1.N.Ng].map(x => x.toFixed(2)) + ' (Ver2: 8,1/17,19/4,08) R=' + o1.R.toFixed(1) + ' (524,6) U=' + o1.U.toFixed(2) + ' (0,73)');
console.log('Ver2 VI-C1: h0=0,30 → F=' + (()=>{const o=C.calc[4]({B:1.5,L:1.5,lc:.3,bc:.3,N0:650,h:.35,ab:.04,ds:.02,conc:'B20'});return o.F.toFixed(1)+' U='+o.U.toFixed(2)+' h0='+o.h0.toFixed(3)})()+' (Ver2: F=416,0 Fb=648 U=0,64 với h0=0,30)');
console.log('α băng z/b=0,2/0,4: ' + C.alphaStrip(0.2).toFixed(3) + ' / ' + C.alphaStrip(0.4).toFixed(3) + ' (Ver2 0,977/0,881)');
console.log(n + ' đề, ' + bad + ' lỗi'); log.forEach(l => console.log(' ', l)); console.log(JSON.stringify(stat));
process.exit(bad ? 1 : 0);
