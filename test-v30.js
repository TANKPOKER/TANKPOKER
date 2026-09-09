const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
let pass=0,fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++;console.log((c?'  ok  ':'FAIL  ')+n+(c?'':'   '+x));};

/* --- la bande colorée a entièrement disparu --- */
ok('plus aucun appel, définition, légende ni CSS de la bande',
   !src.includes('lineStrip')&&!src.includes('LEGEND')&&!/\.strip|\.leg\b/.test(src.split('<style>')[1].split('</style>')[0]));

/* --- table plus grande, sièges écartés --- */
ok('table : 390px de haut (était 330), tapis élargi (marges 5%, était 8/7)',
   src.includes('height:390px')&&src.includes('left:5%;right:5%;top:5%;bottom:5%'));
ok('sièges repoussés vers le bord : rayons 43/40 (était 39/36)',
   src.includes('seatXY(i,n,hs,43,40)'));
ok('mises, dealer et tapis suivent le nouvel écartement',
   src.includes('seatXY(i,n,hs,25,23)')&&src.includes('seatXY(i,n,hs,29,27)')&&src.includes('seatXY(i,n,hs,27,25)'));

/* --- barre d'onglets violet foncé --- */
ok('violet foncé dans les deux thèmes (variables dédiées)',
   src.includes('--tabbg:#1B1233')&&src.includes('--tabbg:#241947'));
ok('la barre utilise ces variables', src.includes('background:var(--tabbg);'));
ok('onglets inactifs en lavande, actif blanc sur voile clair',
   src.includes('color:var(--tabmut);')&&src.includes(".tab.on{color:#FFFFFF;border-top-color:var(--cyan);background:rgba(255,255,255,.07)}"));

/* --- noms blancs italiques --- */
ok('le cyan des noms a disparu, italique en place',
   src.includes('font-style:italic;')&&!src.includes('font-weight:800;color:var(--cyan)'));

console.log('\n'+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
