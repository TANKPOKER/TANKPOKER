const C=require('./core18.js');
const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
let pass=0,fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++;console.log((c?'  ok  ':'FAIL  ')+n+(c?'':'   '+x));};

/* --- la marque partout --- */
ok('l\'en-tête contient logo + logotype dans le bouton retour-accueil',
   src.includes("'+MARK+WORDMARK+'</button>'"));
const headers=(src.match(/header\(/g)||[]).length;
ok('toutes les vues passent par le même en-tête (8 vues + définition)', headers>=9, headers);
ok('le titre de section accompagne la marque, il ne la remplace pas',
   src.includes('.hdr .sect{') && !src.includes('.hdr .ttl{'));
ok('la marque apparaît aussi pendant la saisie',
   src.includes("header('Nouvelle main'") && src.includes("header('Résultat'"));

/* --- typographie : trois rôles distincts --- */
ok('Plus Jakarta Sans chargée pour la marque, les actions et le texte',
   src.includes('family=Plus+Jakarta+Sans'));
ok('IBM Plex Mono conservée pour les nombres',
   src.includes('family=IBM+Plex+Mono'));
ok('IBM Plex Mono chargée pour les nombres', src.includes('IBM+Plex+Mono'));
ok('Inter a disparu', !src.includes('Inter:wght'));
ok('rôle display défini (var --fd)',
   src.includes("--fd:'Plus Jakarta Sans'"));
ok('rôle mono défini', src.includes("--fm:'IBM Plex Mono'"));
['.wm{','.ap{','.act{','.tab{','.lbl{','.btn{'].forEach(sel=>{
  const i=src.indexOf(sel); const block=src.slice(i,src.indexOf('}',i));
  ok('display sur '+sel.slice(0,-1), i>=0 && block.includes('var(--fd)'), sel);
});
['.arow .amt{','.stat .v{','.res .v{','.seat .stk{'].forEach(sel=>{
  const i=src.indexOf(sel); const block=src.slice(i,src.indexOf('}',i));
  ok('mono sur '+sel.slice(0,-1), i>=0 && block.includes('var(--fm)'), sel);
});

/* --- réactions visibles --- */
ok('chaque fiche du fil porte like, dislike et réagir',
   src.includes('data-like=') && src.includes('data-dis=') && src.includes('data-cm='));
const feedCard=src.includes(`'<div class="hc" data-h="'`);
const activityCard=src.match(/'<button class="hc"[^`]*?data-h="'\+e\.hand\.id/);
ok('fiches du fil en div (boutons imbriqués), activité en button (aucun bouton dedans)',
   feedCard && !!activityCard);
ok('les boutons de fiche n\'ouvrent pas la main (stopPropagation)',
   (src.match(/e\.stopPropagation\(\)/g)||[]).length>=3);
ok('liker depuis le fil préserve la position de lecture',
   src.includes('function reactKeepScroll') && src.includes('body.scrollTop=st'));
ok('vue main : barre like/dislike/commenter fixe en bas',
   src.includes("$('lk').onclick") && src.includes("$('cmb').onclick") && src.includes("foot.innerHTML='<div class=\"hcact\""));
ok('commenter amène au champ et lui donne le focus',
   src.includes("scrollIntoView({block:'center'});el.focus()"));
ok('le bouton réagir du fil ouvre la main sur le champ commentaire',
   src.includes("go('hand',{id:b.dataset.cm,cm:true})") && src.includes('if(route.cm)'));
ok('l\'état liké est visible (bouton rempli)',
   src.includes('.ra.like.on{background:var(--call)') && src.includes('.ra.dis.on{background:var(--raise)'));

/* --- non-régression --- */
ok('6 mains, gagnants intacts', C.DB.hands.length===6 && C.DB.hands.every(h=>h.winners.length));
ok('classements intacts', C.ranked(C.DB.hands,'année','controversées',C.NOW)[0].id==='h2');

console.log('\n'+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
