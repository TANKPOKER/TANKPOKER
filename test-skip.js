const E=require('./engine.js');
let pass=0,fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++;console.log((c?'  ok  ':'FAIL  ')+n+(c?'':'   '+x));};
const mk=(n,stack,hero)=>E.newHand({format:'cash',tableSize:n,ante:0,stack:stack||100,heroSeat:hero===undefined?1:hero,heroCards:['As','Ks']});
const pos=(s,i)=>s.seats[i].pos;

/* 1. le cas de ta demande : 9-max, héros BB, on touche HJ */
let s=mk(9,100,1);                       // ordre : SB BB UTG UTG+1 UTG+2 LJ HJ CO BTN
ok('avant : UTG à la parole', pos(s,s.toAct)==='UTG');
ok('HJ est atteignable', E.canSkipTo(s,6)===true);
E.skipCore(s,6);
ok('après : HJ à la parole', pos(s,s.toAct)==='HJ', pos(s,s.toAct));
ok('4 folds automatiques (UTG, UTG+1, UTG+2, LJ)',
   s.actions.length===4 && s.actions.every(a=>a.type==='fold'), s.actions.length);
ok('le pot n\'a pas bougé', Math.abs(E.pot(s)-1.5)<1e-9, E.pot(s));

/* 2. toucher un joueur qui a déjà parlé : refusé */
s=mk(6,100,1);
E.apply(s,'raise',2.5);                  // UTG ouvre
ok('UTG a parlé et n\'est plus atteignable', E.canSkipTo(s,2)===false);
const before=s.actions.length;
ok('skipCore refuse sans rien modifier', E.skipCore(s,2)===false && s.actions.length===before);

/* 3. face à une relance, un joueur qui a déjà payé redevient atteignable */
s=mk(6,100,4);
E.apply(s,'raise',2.5);                  // UTG
E.apply(s,'fold');                       // HJ
E.apply(s,'call');                       // CO (héros)
E.apply(s,'raise',12);                   // BTN 3-bet
ok('SB à la parole', pos(s,s.toAct)==='SB');
ok('UTG (a payé moins que 12) est atteignable', E.canSkipTo(s,2)===true);
E.skipCore(s,2);
ok('SB et BB se couchent, retour à UTG',
   pos(s,s.toAct)==='UTG' && s.actions.slice(-2).every(a=>a.type==='fold'));

/* 4. postflop sans mise : les intermédiaires checkent, ils ne se couchent pas */
s=mk(6,100,1);
E.skipCore(s,5);                         // fold jusqu'au BTN
E.apply(s,'call'); E.apply(s,'fold');    // BTN limp, SB fold
E.apply(s,'check');                      // BB option
s.board.push('Kh','7s','2d'); E.openStreet(s);
ok('flop : BB à la parole', pos(s,s.toAct)==='BB');
E.skipCore(s,5);                         // toucher BTN
const flopActs=s.actions.filter(a=>a.street==='flop');
ok('la BB checke automatiquement, elle ne se couche pas',
   flopActs.length===1 && flopActs[0].type==='check' && s.seats[1].active, JSON.stringify(flopActs));
ok('BTN à la parole', pos(s,s.toAct)==='BTN');

/* 5. postflop face à une mise : les intermédiaires se couchent */
E.apply(s,'bet',2);                      // BTN mise... la BB a déjà checké
ok('BB doit répondre à la mise', pos(s,s.toAct)==='BB');

/* 6. toucher son propre siège quand tout le monde se couche avant : la main se termine */
s=mk(6,100,1);
E.skipCore(s,1);                         // héros BB touche son siège
ok('tout le monde s\'est couché, la main est finie', s.over===true && s.endReason==='fold');
ok('la BB ramasse les blindes', Math.abs(s.potClosed-1.5)<1e-9, s.potClosed);

/* 7. jamais d'état illégal : chaque action du raccourci passe par apply */
s=mk(9,40,8);
E.skipCore(s,8);                         // fold jusqu'au BTN héros
ok('BTN à la parole après 6 folds', pos(s,s.toAct)==='BTN' && s.actions.length===6);
E.apply(s,'raise',2.2); E.apply(s,'fold');
ok('BB encore à parler : le raccourci n\'a pas sauté son option', pos(s,s.toAct)==='BB');

/* 8. cibles invalides */
s=mk(6,100,1);
ok('siège déjà à la parole : refusé', E.canSkipTo(s,s.toAct)===false);
E.apply(s,'fold');
ok('siège couché : refusé', E.canSkipTo(s,2)===false);
s.seats[4].allIn=true;
ok('siège all-in : refusé', E.canSkipTo(s,4)===false);

console.log('\n'+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
