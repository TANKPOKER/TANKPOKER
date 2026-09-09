const C=require('./core18.js');
const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
let pass=0,fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++;console.log((c?'  ok  ':'FAIL  ')+n+(c?'':'   '+x));};

/* --- 1. persistance et hors-ligne --- */
ok('stockage : localStorage détecté, repli mémoire sinon',
   src.includes("localStorage.setItem(t,'1')")&&src.includes('persistent:false'));
ok('le repli mémoire fonctionne (environnement de test sans navigateur)',
   (()=>{ C.store.set('x',{a:1}); return C.store.get('x').a===1 && (C.store.del('x'),C.store.get('x')===null); })());
ok('brouillon sauvé à chaque action de saisie', src.includes("store.set('draft',{S:S,memo:captureMemo})"));
ok('brouillon effacé à la publication et à l\'abandon', (src.match(/store\.del\('draft'\)/g)||[]).length>=3);
ok('reprise du brouillon depuis l\'accueil', src.includes('REPRENDRE')&&src.includes("route={v:S.over?'result':'entry'}"));
ok('capture rapide : cartes + board optionnel, terminable à tout moment',
   src.includes('CAPTURE 5s')&&src.includes("'Board si tu l\\'as vu \\u2014 sinon TERMINER'")&&src.includes('},0);'));
ok('captures listées à l\'accueil avec reprise et suppression',
   src.includes('À FINIR')&&src.includes('data-cap=')&&src.includes('data-capdel='));
ok('le board capturé est rappelé pendant la complétion', src.includes('CAPTURE \\u2014 BOARD NOTÉ'));
ok('en démo, likes, abonnements et mains publiées survivent au rechargement',
   src.includes('function persistDemo')&&src.includes("store.get('localHands')")&&src.includes('restoreLocal();'));

/* --- 2. liens profonds --- */
ok('chaque main a une adresse', C.urlFor({v:'hand',id:'abc'})==='#/main/abc');
ok('chaque profil a une adresse', C.urlFor({v:'profile',id:'p1'})==='#/joueur/p1');
ok('les onglets ont une adresse', C.urlFor({v:'week'})==='#/hot'&&C.urlFor({v:'activity'})==='#/notifs');
ok('le hash est lu au démarrage et à chaque changement',
   src.includes('parseHash();\nrender();')&&src.includes("addEventListener('hashchange'"));
ok('l\'URL suit la navigation sans casser l\'historique', src.includes('history.replaceState'));
ok('bouton PARTAGER : lien copié, repli prompt',
   src.includes('navigator.clipboard.writeText(link)')&&src.includes("prompt('Lien de la main :',link)"));
ok('lien mort : message propre, pas de crash', src.includes("Cette main n\\'existe pas"));

/* --- 3. activité --- */
const ev=C.myEvents();   // DB.me='sacha' en démo
ok('les commentaires reçus deviennent des événements (2 sur h1)', ev.length===2, ev.length);
ok('mes propres commentaires ne me notifient pas', ev.every(e=>e.by!=='sacha'));
ok('événements triés du plus récent au plus ancien', ev.every((e,i)=>i===0||ev[i-1].at>=e.at));
ok('événements uniquement sur MES mains', ev.every(e=>e.hand.author==='sacha'));
ok('onglet NOTIFS avec pastille de non-lus',
   src.includes("'NOTIFS'+(n?' ('+n+')':'')")&&src.includes('function unseenCount'));
ok('ouvrir l\'activité marque tout comme lu', src.includes("store.set('seenAt',Date.now())"));
ok('en ligne, les réactions brutes de mes mains sont chargées',
   src.includes('rawReactions:raw[r.id]||[]'));

/* --- 4. tags automatiques et filtres --- */
const mk=o=>Object.assign({format:'cash',stakes:'NL200',tableSize:6,ante:0,stack:100,
  heroSeat:4,heroCards:['As','Ks'],live:false},o);
let s=C.newHand(mk({heroSeat:1}));
C.apply(s,'raise',2.5); C.apply(s,'fold'); C.apply(s,'call'); C.apply(s,'fold'); C.apply(s,'fold');
C.apply(s,'raise',12);
let t=C.autoTags(s.cfg,s.actions,s.board);
ok('squeeze détecté (relance après open + call)', t.includes('squeeze'), t.join(','));
ok('3bet pot détecté', t.includes('3bet pot'), t.join(','));
s=C.newHand(mk());
C.skipCore(s,4); C.apply(s,'raise',2.5); C.apply(s,'call'); C.apply(s,'fold'); C.apply(s,'fold');
s.board.push('Kh','7s','2d'); C.openStreet(s);
C.apply(s,'bet',9);
t=C.autoTags(s.cfg,s.actions,s.board);
ok('overbet détecté (mise 9 dans un pot de 6.5)', t.includes('overbet'), t.join(','));
s=C.newHand(mk({tableSize:2,heroSeat:0,stakes:'Live 2/5'}));
t=C.autoTags(s.cfg,s.actions,s.board);
ok('HU et live détectés', t.includes('HU')&&t.includes('live'), t.join(','));
ok('jamais plus de 4 tags', C.autoTags(mk({tableSize:2,format:'mtt',stakes:'Live 2/5'}),[],[]).length<=4);
ok('les tags générés partent à la publication', src.includes('tags:autoTags(S.cfg,S.actions,S.board)'));
/* filtres */
const cash=C.DB.hands.filter(h=>h.cfg.format==='cash');
const nl500=C.DB.hands.filter(h=>h.cfg.stakes==='NL500');
ok('filtre format : ne garde que le cash', cash.length===5&&cash.every(h=>h.cfg.format==='cash'));
ok('filtre limite : NL500 = les 2 mains de Theo', nl500.length===2&&nl500.every(h=>h.author==='theo'));
ok('les deux filtres sont dans les tendances',
   src.includes("id=\"w-fmt\"")&&src.includes('toutes limites')&&src.includes('function filteredHands'));
ok('filtres vides : message dédié', src.includes('Rien avec ces filtres'));

/* --- 5. profil éditable --- */
ok('bouton MODIFIER LE PROFIL sur son propre profil', src.includes('MODIFIER LE PROFIL'));
ok('nom, limites et bio éditables', src.includes("id=\"e-nm\"")&&src.includes("id=\"e-st\"")&&src.includes("id=\"e-bio\""));
ok('en ligne : mise à jour en base (pseudo compris) ; en démo : persisté localement',
   src.includes(".update({handle:h,name:p.name,stakes:p.stakes,bio:p.bio})")&&src.includes("store.set('profileEdit'"));
ok('bio bornée à 280 (contrainte de la base)', src.includes('maxlength="280"'));

console.log('\n'+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
