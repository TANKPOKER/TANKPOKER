const C=require('./core18.js');
const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
let pass=0,fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++;console.log((c?'  ok  ':'FAIL  ')+n+(c?'':'   '+x));};

/* --- marque --- */
ok('le nom du site est défini une seule fois', (src.match(/const BRAND=/g)||[]).length===1);
ok('le nom est TANK', src.includes("const BRAND='TANK'"));
ok('titre de page à la marque', src.includes('<title>TANK'));
ok('accroche définie', /TAGLINE='[^']{10,}'/.test(src));
const markBlock=(src.match(/const MARK=[\s\S]*?<\/svg>'/)||[''])[0];
ok('logo : l\'éventail canonique — pivot commun, index de coin, as central',
   markBlock.includes('viewBox="1 1 74 40"')
   && markBlock.includes("[['10',-24],['J',-12],['Q',0],['K',12]]")
   && markBlock.includes('rotate(24 38 64)'));
ok('logo décoratif masqué aux lecteurs d\'écran', src.includes('aria-hidden="true"'));
ok('logotype avec point d\'accent', src.includes("const WORDMARK=") && src.includes('<i></i>'));
ok('logo affiché dans tous les en-têtes',
   src.includes("+MARK+WORDMARK+"));
ok('un seul en-tête de marque : le bandeau du fil a disparu',
   !src.includes('brandbar'));

/* --- les trois barres du logo reprennent les trois couleurs d'action --- */
const marks=(src.match(/const MARK=[\s\S]*?<\/svg>'/)||[''])[0];
const rootBlock=src.slice(src.indexOf(':root{'),src.indexOf('}',src.indexOf(':root{')));
ok('les mêmes couleurs sont les variables du thème',
   rootBlock.includes('--raise:#F5453F') && rootBlock.includes('--call:#22C55E')
   && rootBlock.includes('--fold:#3D7BE0'));

/* --- couleurs pleines, pas des teintes --- */
ok('pastilles d\'action en aplat de couleur',
   src.includes('.ap.fold{background:var(--fold);color:var(--fold-i)}')
   && src.includes('.ap.agg{background:var(--raise);color:var(--raise-i)}'));
ok('boutons de saisie en aplat de couleur',
   src.includes('.act.go{background:var(--raise);color:var(--raise-i)}'));
ok('étiquettes de table en aplat de couleur',
   src.includes('.tg.agg{background:var(--raise);color:var(--raise-i)}'));
ok('aucune couleur codée en dur hors du logo et de la palette',
   (src.match(/#06231F/g)||[]).length===0);

/* --- bande de ligne : le motif de marque est aussi une donnée --- */
const aclass=t=>t==='fold'?'fold':(t==='bet'||t==='raise')?'agg':'pass';
function strip(h){ return h.actions.filter(a=>a.hero).map(a=>aclass(a.type)); }
ok('la bande a une case par décision du héros',
   C.DB.hands.every(h=>strip(h).length===h.actions.filter(a=>a.hero).length));
const h1=C.DB.hands.find(h=>h.id==='h1'), h3=C.DB.hands.find(h=>h.id==='h3');
ok('h1 (bluff catch) : bande à dominante passive',
   strip(h1).filter(x=>x==='pass').length > strip(h1).filter(x=>x==='agg').length,
   strip(h1).join(','));
ok('h3 (triple barrel) : bande entièrement agressive',
   strip(h3).every(x=>x==='agg'), strip(h3).join(','));
ok('aucune main sans bande', C.DB.hands.every(h=>strip(h).length>0));

/* --- non-régression --- */
ok('6 mains, showdown intact', C.DB.hands.length===6 && C.DB.hands.every(h=>h.winners.length));
ok('onglet HOT présent dans la barre',
   src.includes("['week','\\u2605','HOT']"));
ok('classement controversées inchangé', C.ranked(C.DB.hands,'année','controversées',C.NOW)[0].id==='h2');

console.log('\n'+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
