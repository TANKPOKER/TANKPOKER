const C=require('./core18.js');
const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
let pass=0,fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++;console.log((c?'  ok  ':'FAIL  ')+n+(c?'':'   '+x));};
const mk=o=>Object.assign({format:'cash',stakes:'NL200',tableSize:6,ante:0,stack:100,
  heroSeat:4,heroCards:['As','Ks'],live:false},o);
const V=so=>so.opts.map(o=>o.v), L=so=>so.opts.map(o=>o.l);

/* --- régime 1 : ouverture préflop, en big blinds --- */
let s=C.newHand(mk());
let so=C.sizingOptions(s);
ok('pot non ouvert : mode open', so.mode==='open');
ok('cash : 2 / 2.3 / 2.5 / 3 bb (tailles GTO Wizard)',
   V(so).slice(0,4).join(',')==='2,2.3,2.5,3', V(so).join(','));
ok('libellés en bb, plus aucun pourcentage', L(so).slice(0,4).every(l=>l.endsWith('bb')), L(so).join(','));
ok('TAPIS ferme la rangée', so.opts[so.opts.length-1].l==='TAPIS');
s=C.newHand(mk({format:'mtt',stakes:'100\u20ac'}));
so=C.sizingOptions(s);
ok('MTT : 2 / 2.2 / 2.5 / 3 bb', V(so).slice(0,4).join(',')==='2,2.2,2.5,3', V(so).join(','));

/* --- régime 2 : face à une relance, en multiples --- */
s=C.newHand(mk({heroSeat:1}));
C.skipCore(s,5); C.apply(s,'raise',2.5); C.apply(s,'fold');   // BTN ouvre 2.5, BB parle
so=C.sizingOptions(s);
ok('face à un open : mode 3bet', so.mode==='3bet');
ok('3x / 3.5x / 4x / 5x de l\'ouverture : 7.5 / 8.75 / 10 / 12.5',
   V(so).slice(0,4).join(',')==='7.5,8.75,10,12.5', V(so).join(','));
ok('libellés en multiples', L(so).slice(0,4).join(',')==='3x,3.5x,4x,5x');
C.apply(s,'raise',9);                                          // BB 3-bet 9, retour BTN
so=C.sizingOptions(s);
ok('face à un 3-bet : mode 4bet', so.mode==='4bet');
ok('2.2x / 2.5x / 3x du 3-bet : 19.8 / 22.5 / 27',
   V(so).slice(0,3).join(',')==='19.8,22.5,27', V(so).join(','));

/* --- régime 3 : postflop, en % du pot --- */
s=C.newHand(mk());
C.skipCore(s,4); C.apply(s,'raise',2.5); C.apply(s,'call'); C.apply(s,'fold'); C.apply(s,'fold');
s.board.push('Kh','7s','2d'); C.openStreet(s);                 // pot 6.5
so=C.sizingOptions(s);
ok('postflop sans mise : mode bet', so.mode==='bet');
ok('25/33/50/75 : 1.63 / 2.15 / 3.25 / 4.88',
   V(so).slice(0,4).join(',')==='1.63,2.15,3.25,4.88', V(so).join(','));
ok('POT = 6.5, OVB (150%) = 9.75',
   so.opts.find(o=>o.l==='POT').v===6.5 && so.opts.find(o=>o.l==='OVB').v===9.75, V(so).join(','));
C.apply(s,'bet',4);                                            // CO mise 4, BTN parle
so=C.sizingOptions(s);
ok('face à une mise : mode raise en % pot', so.mode==='raise');
ok('relance 50% pot = payer 4 + 7.25 = 11.25',
   Math.abs(so.opts.find(o=>o.l==='50%').v-11.25)<1e-9, V(so).join(','));
ok('relance POT = 18.5', Math.abs(so.opts.find(o=>o.l==='POT').v-18.5)<1e-9);
ok('jamais sous le min-raise légal (25% remonté à 8)',
   Math.abs(so.opts[0].v-8)<1e-9, so.opts[0].v);

/* --- molette --- */
ok('molette présente sous les puces', src.includes('type="range" id="wh"'));
ok('préflop : molette en bb bornée min-raise / tapis',
   src.includes('data-kind="bb"')&&src.includes("min=\"'+so.minTo+'\" max=\"'+so.max"));
ok('postflop : molette de 10% à 250% du pot', src.includes('min="10" max="250" step="5"'));
ok('la valeur affichée est toujours en bb', src.includes("fmt(pendingAmt)+' bb'"));
ok('bouger la molette désélectionne les puces',
   src.includes('pendingSize=null;')&&src.includes("foot.querySelectorAll('.sz').forEach(x=>x.classList.remove('on'));"));
s=C.newHand(mk());
so=C.sizingOptions(s);
ok('wheelValue préflop : borné au min (2) et au tapis (100)',
   C.wheelValue(so,0.5)===2 && C.wheelValue(so,999)===100);
C.skipCore(s,4); C.apply(s,'raise',2.5); C.apply(s,'call'); C.apply(s,'fold'); C.apply(s,'fold');
s.board.push('Kh','7s','2d'); C.openStreet(s);
so=C.sizingOptions(s);
ok('wheelValue postflop : 66% de 6.5 = 4.29', Math.abs(C.wheelValue(so,66)-4.29)<1e-9, C.wheelValue(so,66));

/* --- stack court : doublons fusionnés --- */
s=C.newHand(mk({stack:6}));
so=C.sizingOptions(s);
ok('stack court : valeurs uniques, TAPIS en dernier',
   new Set(V(so)).size===so.opts.length && so.opts[so.opts.length-1].l==='TAPIS', V(so).join(','));

console.log('\n'+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
