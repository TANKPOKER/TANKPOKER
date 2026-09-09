const C=require('./core18.js');
const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
let pass=0,fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++;console.log((c?'  ok  ':'FAIL  ')+n+(c?'':'   '+x));};

/* --- publier sans titre --- */
ok('le titre n\'est plus requis : seul le gagnant bloque la publication',
   src.includes('b.disabled=!resDraft.winners.length;')&&!src.includes('!resDraft.q.trim()'));
ok('le libellé est TITRE DE LA MAIN, marqué optionnel',
   src.includes('TITRE DE LA MAIN')&&src.includes('optionnel')&&!src.includes('TA QUESTION À LA COMMUNAUTÉ'));
ok('titre vide : remplacé par le titre automatique à la publication',
   src.includes('resDraft.q.trim()||autoTitle(S.cfg,S.actions,S.board)'));
ok('le titre auto est montré en placeholder avant publication',
   src.includes("placeholder=\"'+autoTitle(S.cfg,S.actions,S.board)"));
ok('borné à 140 caractères (contrainte de la base)', src.includes(').slice(0,140)'));

/* --- titre automatique --- */
const mk=(over={})=>Object.assign({format:'cash',stakes:'NL200',tableSize:6,ante:0,stack:100,
  heroSeat:4,heroCards:['As','Ks'],live:false},over);
let s=C.newHand(mk());
C.skipCore(s,4); C.apply(s,'raise',2.5); C.apply(s,'raise',9);
C.skipCore(s,4); C.apply(s,'call');
s.board.push('Kh','7s','2d'); C.openStreet(s);
let t=C.autoTitle(s.cfg,s.actions,s.board);
ok('AKs CO en pot 3bet au flop', t==='AKs en CO \u2014 pot 3bet, au flop \u00b7 NL200', t);
s=C.newHand(mk({heroCards:['Ad','Kc']}));
t=C.autoTitle(s.cfg,s.actions,s.board);
ok('dépareillées : AKo, préflop, pot limpé', t.startsWith('AKo en CO \u2014 pot limpé, préflop'), t);
s=C.newHand(mk({heroCards:['7c','7d'],heroSeat:1,stakes:undefined}));
t=C.autoTitle(s.cfg,s.actions,s.board);
ok('paire : 77, sans limite affichée si absente', t==='77 en BB \u2014 pot limpé, préflop', t);
ok('jamais plus de 140 caractères', C.autoTitle(mk(),[],[]).length<=140);

/* --- limites par format --- */
ok('deux formats : cash et tournoi, l\'expresso a disparu',
   Object.keys(C.STAKES).join(',')==='cash,mtt' && !C.FORMAT_LABEL.spin);
ok('cash : limites NL et live', C.STAKES.cash.includes('NL200')&&C.STAKES.cash.includes('Live 2/5'));
ok('tournoi : buy-ins', C.STAKES.mtt.includes('100\u20ac'));
ok('plus aucune trace de spin/expresso dans la source',
   !/spin|expresso/i.test(src.split('<'+'script>')[1]));
/* --- stack ICM en tournoi --- */
ok('paliers courts en tournoi : 5 à 100 bb',
   src.includes('[5,10,15,20,25,30,40,60,100]'));
ok('paliers cash inchangés', src.includes('[20,40,60,100,150,200]'));
ok('champ stack exact, étiqueté ICM',
   src.includes("OU STACK EXACT (BB) \\u2014 POUR L\\'ICM")&&src.includes('id="f-stkx"'));
ok('valeur libre arrondie au demi-bb, minimum 2',
   src.includes('cfg.stack=Math.round(v*2)/2')&&src.includes('if(!isFinite(v)||v<2) return;'));
ok('saisir une valeur exacte désélectionne les paliers',
   src.includes("[...$('f-stk').children].forEach(c=>c.classList.remove('on'));"));
ok('choisir un palier vide le champ exact',
   src.includes("const x=$('f-stkx');if(x)x.value='';"));
ok('bascule de format : stack ramené à une valeur du format',
   src.includes("if(v==='mtt'&&cfg.stack>100) cfg.stack=40;")&&src.includes("if(v==='cash'&&cfg.stack<20) cfg.stack=100;"));
ok('changer de format réinitialise la limite sur une valeur du format',
   src.includes('cfg.stakes=STAKES[v][3]||STAKES[v][0]'));
ok('libellé adapté : LIMITE en cash, BUY-IN en tournoi',
   src.includes("'LIMITE'")&&src.includes("'BUY-IN'"));

/* --- la limite s'affiche --- */
ok('badge de limite sur les fiches', src.includes("'<span class=\"bdg\">'+h.cfg.stakes+'</span>'"));
ok('limite dans la feuille de main', src.includes('LIMITE</span><span class="v">\'+H.cfg.stakes'));
ok('limite dans l\'en-tête de saisie', src.includes("header((cfg.stakes?cfg.stakes+' \\u00b7 ':'')"));
ok('les 6 mains de démonstration ont une limite',
   C.DB.hands.every(h=>h.cfg.stakes&&h.cfg.stakes.length>0));
ok('la main live affiche Live 2/5', C.DB.hands.find(h=>h.id==='h4').cfg.stakes==='Live 2/5');

console.log('\n'+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
