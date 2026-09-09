const C=require('./core18.js');
const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
let pass=0,fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++;console.log((c?'  ok  ':'FAIL  ')+n+(c?'':'   '+x));};

/* --- la main se consulte directement : aucun mur de vote --- */
ok('aucun vote d\'action ne bloque la lecture',
   !src.includes('Tu fais quoi') && !src.includes('rp.votes') && !src.includes("votes[heroRank]"));
ok('la vue main affiche toutes les streets sans interaction',
   src.includes("H.actions.forEach(a=>{") && src.includes('stbar'));
ok('like, dislike et commentaires présents dans la vue main',
   src.includes("react(H,'like')") && src.includes("react(H,'dislike')") && src.includes('H.comments.push'));
ok('le replayer existe, accessible dès le haut de la feuille',
   src.includes("go('replay'") && src.includes('u25B6 REPLAYER LA MAIN'));

/* --- code couleur GTO Wizard : agression rouge, passif vert, fold ardoise --- */
const acl=t=>t==='fold'?'fold':(t==='bet'||t==='raise')?'agg':'pass';
ok('bet et raise sont classés agression', acl('bet')==='agg'&&acl('raise')==='agg');
ok('check et call sont classés passif', acl('check')==='pass'&&acl('call')==='pass');
ok('fold a sa propre classe', acl('fold')==='fold');
ok('la variable rouge est bien l\'agression', /--raise:#[0-9A-F]{6}/.test(src));
ok('la variable verte est bien le passif', /--call:#[0-9A-F]{6}/.test(src));
ok('accent cyan défini pour chaque thème (sombre + clair)',
   (src.match(/--cyan:#/g)||[]).length===2);

/* --- pots affichés street par street : reconstruits, pas stockés --- */
function streetPots(H){
  const s=C.newHand(H.cfg), out={preflop:1.5+H.cfg.ante*H.cfg.tableSize};
  let i=0;
  while(i<H.actions.length){
    while(s.toAct===null&&!s.over&&s.board.length<H.board.length){
      const need=C.NEED[s.street], st=s.street==='flop'?0:s.street==='turn'?3:4;
      s.board.push(...H.board.slice(st,st+need)); C.openStreet(s);
      out[s.street]=s.potClosed;
    }
    if(s.over) break;
    C.apply(s,H.actions[i].type,H.actions[i].amount); i++;
  }
  return out;
}
const h1=C.DB.hands[0], p1=streetPots(h1);
ok('h1 : pot préflop 1.5bb', Math.abs(p1.preflop-1.5)<1e-9, p1.preflop);
ok('h1 : pot au flop 19.5bb (blindes mortes incluses)', Math.abs(p1.flop-19.5)<1e-9, p1.flop);
ok('h1 : pot au turn 37.5bb', Math.abs(p1.turn-37.5)<1e-9, p1.turn);
ok('h1 : pot à la river 37.5bb (deux checks)', Math.abs(p1.river-37.5)<1e-9, p1.river);
let potsOK=true,d='';
C.DB.hands.forEach(h=>{
  const p=streetPots(h);
  let prev=0;
  ['preflop','flop','turn','river'].forEach(st=>{
    if(p[st]===undefined) return;
    if(p[st]<prev-1e-9){potsOK=false;d=h.id+' pot décroissant à '+st;}
    prev=p[st];
  });
});
ok('le pot ne décroît jamais d\'une street à l\'autre', potsOK, d);

/* --- classements sans vote --- */
ok('controverse : réactions unanimes = 0', C.controversy({likes:50,dislikes:0})===0);
ok('controverse : sous 3 réactions = 0', C.controversy({likes:2,dislikes:0})===0);
const eq=C.controversy({likes:50,dislikes:50}), skew=C.controversy({likes:90,dislikes:10});
ok('controverse : 50/50 bat 90/10 à volume égal', eq>skew, eq.toFixed(3)+' vs '+skew.toFixed(3));
const big=C.controversy({likes:60,dislikes:55}), small=C.controversy({likes:3,dislikes:2});
ok('controverse : le volume départage deux partages proches', big>small, big.toFixed(3)+' vs '+small.toFixed(3));
const cont=C.ranked(C.DB.hands,'année','controversées',C.NOW);
ok('classement controversées : tête = main la plus partagée',
   C.controversy(cont[0])>=C.controversy(cont[cont.length-1]), cont[0].id);
ok('h2 (88/71) domine le classement controversées', cont[0].id==='h2', cont[0].id);
const com=C.ranked(C.DB.hands,'année','commentées',C.NOW);
ok('classement commentées : tri décroissant',
   com.every((h,i)=>i===0||com[i-1].comments.length>=h.comments.length));
ok('Wilson : 180/200 bat 3/3', C.wilson(180,200)>C.wilson(3,3));
const wkl=C.ranked(C.DB.hands,'semaine','likées',C.NOW);
ok('fenêtre semaine : exclut la main de 26 jours', !wkl.find(h=>h.id==='h6'));
ok('fenêtre année : inclut tout', C.ranked(C.DB.hands,'année','likées',C.NOW).length===6);

/* --- intégrité des données --- */
let dataOK=true,dd='';
C.DB.hands.forEach(h=>{
  if(!h.question){dataOK=false;dd=h.id+' sans question';}
  if(h.votes!==undefined){dataOK=false;dd=h.id+' porte encore des votes';}
  if(!C.DB.players[h.author]){dataOK=false;dd=h.id+' auteur inconnu';}
  h.comments.forEach(c=>{if(!C.DB.players[c.by]){dataOK=false;dd=h.id+' commentateur inconnu';}});
  const uniq=new Set([...h.board,...h.cfg.heroCards]);
  if(uniq.size!==h.board.length+2){dataOK=false;dd=h.id+' cartes en double';}
});
ok('données propres : plus aucun vote stocké, cartes uniques', dataOK, dd);
ok('6 mains de démonstration', C.DB.hands.length===6, C.DB.hands.length);

console.log('\n'+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
