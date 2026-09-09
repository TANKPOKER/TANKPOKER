const E = require('./engine.js');
let pass=0, fail=0;
const ok=(name,cond,extra='')=>{ cond?pass++:fail++; console.log((cond?'  ok  ':'FAIL  ')+name+(cond?'':'   '+extra)); };
const mk=(n,stack=100,hero=2)=>E.newHand({format:'cash',tableSize:n,ante:0,stack,heroSeat:hero,heroCards:['As','Ks'],live:true});

// 1. blindes et premier à parler
let s=mk(6);
ok('6-max : pot initial 1.5bb', Math.abs(E.pot(s)-1.5)<1e-9, E.pot(s));
ok('6-max : UTG parle en premier', s.seats[s.toAct].pos==='UTG', s.seats[s.toAct].pos);
s=mk(2);
ok('HU : le BTN/SB parle en premier', s.toAct===0, s.toAct);

// 2. option de la grosse blinde
s=mk(6);
['UTG','HJ','CO','BTN'].forEach(()=>E.apply(s,'fold'));
E.apply(s,'call');                      // SB complète
ok('option BB : la BB revient à la parole', s.seats[s.toAct].pos==='BB', s.seats[s.toAct] && s.seats[s.toAct].pos);
ok('option BB : le check est légal', E.legal(s).check===true);
E.apply(s,'check');
ok('street fermée après le check de la BB', s.street==='flop' && s.toAct===null, s.street);

// 3. le short all-in ne rouvre pas l'enchère
s=mk(3,100);  s.seats[2].stack=8;       // BTN a 8bb
E.apply(s,'raise',3);                   // BTN... non : ordre = SB,BB,BTN -> toAct=2 (BTN)
ok('BTN relance à 3', s.actions[0].pos==='BTN');
E.apply(s,'raise',9);                   // SB 3-bet à 9
E.apply(s,'raise',12);                  // BB 4-bet à 12
const before=s.minRaise;
E.apply(s,'call');                      // BTN tapis pour 8 < 12 -> call all-in
ok('tapis court : BTN est all-in', s.seats[2].allIn===true);
ok('tapis court : minRaise inchangé', Math.abs(s.minRaise-before)<1e-9, s.minRaise+' vs '+before);

// 4. pot correct sur 3 streets
s=mk(6);
['UTG','HJ'].forEach(()=>E.apply(s,'fold'));
E.apply(s,'raise',2.5);                 // CO
E.apply(s,'raise',8);                   // BTN
E.apply(s,'fold'); E.apply(s,'fold');   // SB, BB
E.apply(s,'call');                      // CO
ok('préflop : pot = 17.5bb', Math.abs(E.pot(s)-17.5)<1e-9, E.pot(s));
s.board.push('Kh','7s','2d'); E.openStreet(s);
ok('flop : premier à parler = CO (hors position la plus à gauche)', s.seats[s.toAct].pos==='CO', s.seats[s.toAct].pos);
E.apply(s,'bet',10); E.apply(s,'call');
ok('flop : pot = 37.5bb', Math.abs(E.pot(s)-37.5)<1e-9, E.pot(s));
s.board.push('Qc'); E.openStreet(s);
E.apply(s,'check'); E.apply(s,'check');
ok('turn : pot inchangé après deux checks', Math.abs(E.pot(s)-37.5)<1e-9, E.pot(s));
ok('turn fermé -> river', s.street==='river', s.street);

// 5. fin par fold
s=mk(6);
['UTG','HJ','CO','BTN','SB'].forEach(()=>E.apply(s,'fold'));
ok('tout le monde fold : main terminée', s.over===true && s.endReason==='fold', s.endReason);
ok('tout le monde fold : BB gagne 1.5bb', Math.abs(s.potClosed-1.5)<1e-9, s.potClosed);

// 6. pots annexes à trois
s=mk(3,100); s.seats[0].stack=20-s.seats[0].committed; s.seats[1].stack=50-s.seats[1].committed;
E.apply(s,'raise',100);                 // BTN tapis 100
E.apply(s,'call');                      // SB call 20 (tapis)
E.apply(s,'call');                      // BB call 50 (tapis)
const sp=E.sidePots(s);
ok('pots annexes : 3 niveaux', sp.length===3, JSON.stringify(sp));
ok('pot principal = 60bb', Math.abs(sp[0].amount-60)<1e-9, sp[0] && sp[0].amount);
ok('pot annexe 1 = 60bb', Math.abs(sp[1].amount-60)<1e-9, sp[1] && sp[1].amount);
ok('pot annexe 2 = 50bb (rendu au BTN)', Math.abs(sp[2].amount-50)<1e-9, sp[2] && sp[2].amount);
const total=sp.reduce((a,p)=>a+p.amount,0);
ok('somme des pots = mises totales', Math.abs(total-170)<1e-9, total);

// 7. aucune mise ne dépasse le stack
s=mk(6,35);
E.apply(s,'raise',500);
ok('mise plafonnée au stack', Math.abs(s.actions[0].amount-35)<1e-9, s.actions[0].amount);

console.log('\n'+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
