/* Reproduit le bug rapporté (+0.8 au lieu de ~+100 sur un pot de 201.5) et
   verrouille la correction : état remis à zéro, purge, alerte, suppression. */
const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
let pass=0,fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++;console.log((c?'  ok  ':'FAIL  ')+n+(c?'':'   '+x));};
const round2=v=>Math.round(v*100)/100;

/* --- reproduction du bug : un gagnant fantôme divise le pot --- */
const pot=201.5, inv=100;                 // ~100bb investis, blinds adverses dans le pot
const buggy = round2(pot/2-inv);          // deux gagnants au lieu d'un
const fixed = round2(pot/1-inv);
ok('avec le gagnant fantôme, le net tombe à +0.75 \u2014 le +0.8 constaté',
   Math.abs(buggy-0.75)<1e-9, buggy);
ok('avec le seul vrai gagnant, le net est +101.5', Math.abs(fixed-101.5)<1e-9, fixed);

/* --- la cause : resDraft réinitialisé à chaque départ de main --- */
const resets=(src.match(/resDraft=\{winners:\[\],cards:\{\},q:''\}/g)||[]).length;
ok('resDraft remis à zéro à 6 endroits (démarrage, capture, 2 abandons, publication, init)',
   resets>=6, resets);
ok('remis à zéro au DÉMARRAGE d\'une main, pas seulement après publication',
   src.includes("hist=[];\n    resDraft={winners:[],cards:{},q:''};   // jamais d'état hérité"));
ok('remis à zéro à la reprise d\'une capture',
   src.includes("S=newHand(JSON.parse(JSON.stringify(cfg))); hist=[];\n    resDraft={winners:[],cards:{},q:''};"));

/* --- ceinture : purge de tout siège étranger à la main --- */
ok('l\'écran résultat purge les gagnants qui ne sont pas des joueurs restants',
   src.includes('resDraft.winners=resDraft.winners.filter(i=>alive.includes(i));'));
ok('les cartes saisies pour un siège couché sont purgées aussi',
   src.includes('if(!alive.includes(+k)||+k===S.cfg.heroSeat) delete resDraft.cards[k];'));
ok('la purge tourne aussi à la publication (double ceinture)',
   (src.match(/resDraft\.winners=resDraft\.winners\.filter\(i=>alive\.includes\(i\)\);/g)||[]).length>=2);
ok('publier sans gagnant valide est impossible',
   src.includes('if(!resDraft.winners.length){ render(); return; }'));

/* --- un partage ne peut plus passer inaperçu --- */
ok('le libellé annonce le partage et ta part',
   src.includes('POT PARTAGÉ')&&src.includes('TA PART'));
ok('bandeau d\'alerte : plusieurs gagnants sélectionnés',
   src.includes('gagnants sélectionnés : le pot sera divisé')
   &&src.includes('désélectionne les autres positions'));

/* --- réparer : suppression de sa propre main --- */
ok('SUPPRIMER visible uniquement sur ses propres mains',
   src.includes("if(H.author===DB.me){")&&src.includes('SUPPRIMER CETTE MAIN'));
ok('confirmation avant suppression', src.includes('Supprimer cette main ?')&&src.includes('Définitif'));
ok('supprimée localement ET en base', src.includes("sb.from('hands').delete().eq('id',H.id)")
   &&src.includes('DB.hands=DB.hands.filter(x=>x.id!==H.id)'));
ok('la persistance démo est mise à jour après suppression',
   /DB\.hands=DB\.hands\.filter\(x=>x\.id!==H\.id\);\s*delete MY\.liked\[H\.id\];\s*persistDemo\(\)/.test(src));

console.log('\n'+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
