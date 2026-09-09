const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
let pass=0,fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++;console.log((c?'  ok  ':'FAIL  ')+n+(c?'':'   '+x));};

/* --- logo : la quinte flush royale à pique, entière --- */
ok('cinq cartes autour d\'un même pivot bas, recouvrement réel (pas 12\u00b0 d\'écart)',
   src.includes("[['10',-24],['J',-12],['Q',0],['K',12]]")
   && src.includes("rotate('+r+' 38 64)"));
ok('rang + pique dans le coin supérieur gauche de chaque carte',
   src.includes('x="30.2" y="10.4"')&&src.includes('translate(32.4 15.2) scale(0.26)'));
ok('l\'as ferme l\'éventail avec son grand pique central',
   src.includes('rotate(24 38 64)')&&src.includes('translate(38 20) scale(0.78)'));
ok('le pique est un path partagé (SPADE), pas un emoji',
   src.includes("const SPADE='M0 -6"));
ok('l\'éventail entier tient dans la fenêtre (rien de rogné)',
   src.includes('viewBox="1 1 74 40"')&&src.includes('.mk{width:48px;height:26px'));
ok('le bandeau de marque des vues a entièrement disparu', !src.includes('brandbar'));

/* --- la marque ramène à l'accueil --- */
ok('le logo est un bouton dans chaque en-tête', src.includes('class="hbrand" id="hb"'));
ok('cliquer ramène à l\'accueil', src.includes("if(route.v!=='home') tabTo('home');"));
ok('en pleine saisie : confirmation d\'abandon, pas de perte silencieuse',
   src.includes("if(route.v==='entry'&&S){ confirmQuit(); return; }"));
ok('accessible', src.includes('aria-label="retour'));

/* --- TANK lisible --- */
ok('TANK en couleur explicite : plus jamais noir sur sombre',
   src.includes('color:var(--text);font:inherit}')
   && /\.wm\{[^}]*color:var\(--text\)/s.test(src));

/* --- libellés de section lisibles --- */
ok('libellés : 12px en couleur intermédiaire, plus 10.5px éteints',
   src.includes('.lbl{font-family:var(--fd);font-size:12px;color:var(--muted)'));
ok('trait d\'accent devant chaque libellé de section',
   src.includes(".lbl::before{content:'';width:3px;height:12px"));

console.log('\n'+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
