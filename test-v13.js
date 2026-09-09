const C=require('./core18.js');
const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
let pass=0,fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++;console.log((c?'  ok  ':'FAIL  ')+n+(c?'':'   '+x));};

/* --- likées : la trace de mes réactions --- */
C.MY.liked={h3:'like',h4:'dislike'};
let r=C.reactedHands();
ok('les mains likées ET dislikées apparaissent', r.length===2, r.map(h=>h.id).join(','));
ok('triées de la plus récente à la plus ancienne', r[0].id==='h3'&&r[1].id==='h4');
C.MY.liked={};
ok('sans réaction : liste vide', C.reactedHands().length===0);

/* --- commentées : la trace de mes avis --- */
r=C.commentedHands('sacha');
ok('sacha a commenté h2 et h3', r.map(h=>h.id).sort().join(',')==='h2,h3', r.map(h=>h.id).join(','));
ok('mes propres mains sont exclues (les réponses chez moi ne sont pas une trace d\'étude)',
   !r.find(h=>h.author==='sacha'));
r=C.commentedHands('theo');
ok('theo a commenté h1, h2 et h4', r.map(h=>h.id).sort().join(',')==='h1,h2,h4', r.map(h=>h.id).join(','));
ok('lina : h2 et h6', C.commentedHands('lina').map(h=>h.id).sort().join(',')==='h2,h6');

/* --- interface --- */
ok('trois sections sur son propre profil',
   src.includes("['pub','Publiées")&&src.includes("['lik','Likées")&&src.includes("['com','Commentées"));
ok('compteurs dans les libellés',
   src.includes("+hands.length]")&&src.includes("+reactedHands().length]")&&src.includes("+commentedHands(id).length]"));
ok('les sections n\'apparaissent que sur SON profil', src.includes("(me?'<div class=\"rowbar\" id=\"p-tab\">"));
ok('section commentées : mon dernier avis est affiché sous la main',
   src.includes("mine[mine.length-1].street.toUpperCase()")&&src.includes("mine[mine.length-1].t"));
ok('états vides dédiés pour chaque section',
   src.includes('Aucune réaction')&&src.includes('Aucun commentaire'));
ok('bascule de section branchée', src.includes("profTab=b.dataset.v;render()"));
ok('la trace survit au rechargement (MY.liked déjà persisté)',
   src.includes("store.set('liked',MY.liked)")&&src.includes("Object.assign(MY.liked, store.get('liked')||{})"));

console.log('\n'+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
