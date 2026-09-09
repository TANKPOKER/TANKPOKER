const C=require('./core18.js');
const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
let pass=0,fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++;console.log((c?'  ok  ':'FAIL  ')+n+(c?'':'   '+x));};
const vals=o=>o.map(x=>x.v);

/* --- 1. publication : le bouton suit la frappe --- */
ok('l\'état du bouton est synchronisé à chaque frappe',
   src.includes('const syncPub=')&&src.includes('resDraft.q=e.target.value; syncPub();'));
ok('le bouton n\'est plus figé au rendu initial',
   !src.includes("id=\"pub\"'\n   +(!resDraft.winners.length"));
ok('syncPub appelé au rendu initial aussi', src.includes('syncPub();')&&src.split('syncPub()').length>=3);
ok('le clic est ignoré tant que le bouton est désactivé',
   src.includes("if(!$('pub').disabled) publish()"));
ok('choisir un gagnant re-rend et donc réactive le bouton', src.includes("bind('r-win'"));

/* --- 2. sizings : couverts par test-sizing.js (trois régimes + molette) --- */

/* --- 3. retour arrière permanent --- */
ok('bouton retour dans la barre d\'action', src.includes('id="ub"')&&src.includes('\\u21A9'));
ok('désactivé quand il n\'y a rien à annuler', src.includes("(hist.length?'':' disabled')"));
ok('branché sur undo', src.includes("const ub=$('ub'); if(ub) ub.onclick=undo;"));
ok('accessible (aria-label)', src.includes('aria-label="annuler la dernière action"'));

/* --- non-régression --- */
ok('6 mains de démonstration intactes', C.DB.hands.length===6);
ok('le passage de parole fonctionne toujours',
   (()=>{const t=C.newHand({format:'cash',tableSize:9,ante:0,stack:100,heroSeat:1,heroCards:['As','Ks']});
     C.skipCore(t,6); return t.seats[t.toAct].pos==='HJ';})());

console.log('\n'+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
