// Kiểm sinh đề CLO1: node tests/clo1_check.js (hoặc .\tests\run_node.ps1 tests\clo1_check.js)
var fs = require('fs'), path = require('path');
global.window = global; global.document = { getElementById: function(){ return null; }, querySelectorAll: function(){ return []; } };
global.localStorage = { getItem: function(){ return null; }, setItem: function(){} };
eval(fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'engine.js'), 'utf8') + '\nglobal.genC1ByPattern=genC1ByPattern;global.getFoundationMCQ=getFoundationMCQ;');
var pos = [0,0,0,0], err = 0, n = 0, mx = { nho:[1e9,0], tb:[1e9,0], lon:[1e9,0] }, dm = 0;
function bad(m){ err++; if (err < 15) console.log('LỖI', m); }
for (var stt = 1; stt <= 200; stt++) for (var p = 1; p <= 6; p++) for (var d = 1; d <= 3; d++) {
  var D = genC1ByPattern(stt, p, d), pat = D.pattern.split('-'); n++;
  [0,1].forEach(function(i){
    var L = D.layers[i], want = pat[i] === 'T';
    if (L.tot !== want) bad('stt'+stt+' p'+p+' L'+(i+1)+' tot='+L.tot+' B='+L.B);
    if (want && L.B > 0.5) bad('B tốt >0.5');
    if (!want && L.B <= 0.75) bad('B xấu ≤0.75: '+L.B);
    if (L.trangThai === 'Dẻo mềm') dm++;
  });
  if ((D.layers[2].tot ? 'T' : 'X') !== pat[2]) bad('L3 lệch pattern');
  ['nho','tb','lon'].forEach(function(k){
    var v = D.loads[k]; mx[k][0] = Math.min(mx[k][0], v); mx[k][1] = Math.max(mx[k][1], v);
    var m = getFoundationMCQ(D.pattern, k, D.seed); pos[m.correct]++;
    if (!m.opts || m.opts.length !== 4 || m.correct < 0 || m.correct > 3 || m.opts[m.correct].explain.indexOf('✅') !== 0) bad('MCQ '+D.pattern+k);
    if (m.opts.filter(function(o){ return o.explain.indexOf('✅') === 0; }).length !== 1) bad('không đúng 1 đáp án '+D.pattern+k);
  });
  if (D.pattern === 'T-X-T-T' && D.layers[0].h < 4) bad('T-X-T-T h1 < 4');
  if (D.pattern === 'T-T-X-T' && (D.layers[0].h + D.layers[1].h > 10.5 || D.layers[2].nspt > 6)) bad('T-T-X-T L1+L2/NSPT3');
  if (D.loads.nho >= 400 || D.loads.tb < 400 || D.loads.tb > 1000 || D.loads.lon <= 1000) bad('tải ngoài ngưỡng');
}
console.log('đề:', n, '· lỗi:', err, '· dẻo mềm:', dm, '· tải', JSON.stringify(mx), '· vị trí đáp án đúng A–D:', pos.join('/'));
