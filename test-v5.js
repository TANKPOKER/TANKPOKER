const C=require('./core18.js');
const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
let pass=0,fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++;console.log((c?'  ok  ':'FAIL  ')+n+(c?'':'   '+x));};

/* --- showdown : données --- */
const byId=id=>C.DB.hands.find(h=>h.id===id);
let sdOK=true,d='';
C.DB.hands.forEach(h=>{
  if(!h.winners||!h.winners.length){sdOK=false;d=h.id+' sans gagnant';}
  if(!h.alive||!h.alive.length){sdOK=false;d=h.id+' sans joueurs restants';}
  h.winners.forEach(w=>{ if(!h.alive.includes(w)){sdOK=false;d=h.id+' gagnant couché : '+w;} });
  if(h.endReason==='fold'&&h.alive.length!==1){sdOK=false;d=h.id+' fin par fold à '+h.alive.length+' joueurs';}
  if(h.endReason==='showdown'&&h.alive.length<2){sdOK=false;d=h.id+' showdown à un joueur';}
});
ok('chaque main a des gagnants valides parmi les joueurs restants', sdOK, d);

let cardOK=true,cd='';
C.DB.hands.forEach(h=>{
  const all=[...h.board,...h.cfg.heroCards];
  if(h.showdown) Object.values(h.showdown).forEach(cs=>all.push(...cs));
  if(new Set(all).size!==all.length){cardOK=false;cd=h.id+' carte en double';}
  if(h.showdown) Object.keys(h.showdown).forEach(k=>{
    if(!h.alive.includes(+k)){cardOK=false;cd=h.id+' cartes montrées par un joueur couché';}
    if(h.showdown[k].length!==2){cardOK=false;cd=h.id+' main de vilain incomplète';}
  });
});
ok('cartes de showdown : uniques, à 2, et par des joueurs encore en jeu', cardOK, cd);

/* --- cohérence résultat / gagnant --- */
let resOK=true,rd='';
C.DB.hands.forEach(h=>{
  const won=h.winners.includes(h.cfg.heroSeat);
  if(won!==h.won){resOK=false;rd=h.id+' won incohérent';}
  const expect=C.round2(won?h.potFinal/h.winners.length-h.invested:-h.invested);
  if(Math.abs(expect-h.result)>1e-9){resOK=false;rd=h.id+' résultat '+h.result+' au lieu de '+expect;}
  if(!won&&h.result>=0){resOK=false;rd=h.id+' perdant avec résultat positif';}
});
ok('résultat net cohérent avec le gagnant déclaré', resOK, rd);
ok('h1 : le héros gagne au showdown', byId('h1').won && byId('h1').endReason==='showdown');
ok('h1 : le vilain montre ses cartes', !!byId('h1').showdown[5], JSON.stringify(byId('h1').showdown));
ok('h2 : le héros perd au showdown', !byId('h2').won && byId('h2').result===-22, byId('h2').result);
ok('h3 : fin par fold, un seul joueur restant',
   byId('h3').endReason==='fold' && byId('h3').alive.length===1);
ok('h3 : le héros remporte le pot sans showdown', byId('h3').winners[0]===byId('h3').cfg.heroSeat);

/* --- showdown : affichage --- */
ok('la vue main appelle le bloc showdown', src.includes('h+=showdownHTML(H);'));
ok('le rejeu révèle les cartes à la dernière étape',
   src.includes('done?H.showdown:null, done?H.winners:null'));
ok('la table sait révéler des cartes et marquer le gagnant',
   src.includes('function tableHTML(s,lastBySeat,toActIdx,reveal,winners)') && src.includes("' win'"));
ok('fin sans showdown : mention explicite', src.includes('sans showdown'));
ok('la saisie propose les cartes montrées et le gagnant',
   src.includes('CARTES MONTRÉES (OPTIONNEL)') && src.includes('QUI REMPORTE LE POT ?'));
ok('le partage de pot est possible', src.includes('en cas de partage du pot')
   && src.includes('S.potClosed/resDraft.winners.length'));
ok('publier exige un gagnant (le titre, lui, est optionnel)',
   src.includes('b.disabled=!resDraft.winners.length;'));
ok('les cartes déjà montrées ne peuvent pas être resaisies',
   src.includes('Object.values(resDraft.cards||{}).forEach'));

/* --- onglet renommé --- */
ok('l\'onglet ne s\'appelle plus SEMAINE', !src.includes("'SEMAINE'"));
ok('l\'onglet s\'appelle HOT (vocabulaire appli, demande de Sacha)',
   src.includes("['week','\\u2605','HOT']"));
ok('le titre de la page ne présume plus la fenêtre',
   src.includes("header('Hot')"));
ok('les trois fenêtres restent disponibles',
   Object.keys(C.WINDOWS).join(',')==='semaine,mois,année');

/* --- non-régression --- */
ok('classement controversées inchangé', C.ranked(C.DB.hands,'année','controversées',C.NOW)[0].id==='h2');
ok('6 mains', C.DB.hands.length===6, C.DB.hands.length);

console.log('\n'+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
