
/* ============================================================
   1. MOTEUR — pur, couvert par tests
   ============================================================ */
const RANKS=['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
const SUITS=[['s','\u2660'],['h','\u2665'],['d','\u2666'],['c','\u2663']];
const SEAT_ORDER={2:['SB','BB'],3:['SB','BB','BTN'],4:['SB','BB','CO','BTN'],
  5:['SB','BB','HJ','CO','BTN'],6:['SB','BB','UTG','HJ','CO','BTN'],
  7:['SB','BB','UTG','LJ','HJ','CO','BTN'],8:['SB','BB','UTG','UTG+1','LJ','HJ','CO','BTN'],
  9:['SB','BB','UTG','UTG+1','UTG+2','LJ','HJ','CO','BTN']};
const STREETS=['preflop','flop','turn','river'];
const NEED={flop:3,turn:1,river:1};
const round2=v=>Math.round(v*100)/100;
const fmt=v=>(Math.round(v*10)/10).toString();

function newHand(cfg){
  const order=SEAT_ORDER[cfg.tableSize];
  const s={cfg,seats:order.map((pos,i)=>({pos,active:true,allIn:false,stack:cfg.stack,committed:0,
      total:0,hasActed:false,hero:i===cfg.heroSeat,cards:i===cfg.heroSeat?cfg.heroCards.slice():null})),
    street:'preflop',board:[],actions:[],potClosed:0,currentBet:0,minRaise:1,toAct:null,
    over:false,endReason:null};
  s.potClosed=cfg.ante*cfg.tableSize;
  commitTo(s,0,0.5);
  if(cfg.tableSize>1) commitTo(s,1,1);
  s.currentBet=1; s.minRaise=1;
  s.toAct=cfg.tableSize===2?0:2;
  return s;
}
function commitTo(s,i,target){
  const p=s.seats[i], add=Math.min(Math.max(0,target-p.committed),p.stack);
  p.stack-=add; p.committed+=add; p.total+=add;
  if(p.stack<=0.0001){ p.stack=0; p.allIn=true; }
}
const pot=s=>s.potClosed+s.seats.reduce((a,p)=>a+p.committed,0);
const toCall=s=>{const p=s.seats[s.toAct];return Math.min(s.currentBet-p.committed,p.stack);};
const activeSeats=s=>s.seats.filter(p=>p.active);
const canActCount=s=>s.seats.filter(p=>p.active&&!p.allIn).length;
function legal(s){
  if(s.over||s.toAct===null||s.toAct<0) return {};
  const p=s.seats[s.toAct], c=toCall(s);
  return {fold:c>0,check:c===0,call:c>0,bet:s.currentBet===0&&p.stack>0,raise:s.currentBet>0&&p.stack>c};
}
function apply(s,type,amount){
  const i=s.toAct,p=s.seats[i];
  const rec={street:s.street,seat:i,pos:p.pos,type,potBefore:round2(pot(s)),
    note:'',reasons:[],notePrivate:false,hero:p.hero};
  if(type==='fold') p.active=false;
  else if(type==='check'){}
  else if(type==='call') commitTo(s,i,s.currentBet);
  else{
    const target=Math.min(amount,p.committed+p.stack), inc=target-s.currentBet;
    if(inc>=s.minRaise-0.0001) s.minRaise=inc;
    s.currentBet=Math.max(s.currentBet,target);
    commitTo(s,i,target);
  }
  p.hasActed=true;
  rec.amount=round2(p.committed); rec.allIn=p.allIn;
  s.actions.push(rec); advance(s); return rec;
}
function nextToAct(s){
  const n=s.seats.length;
  for(let k=1;k<=n;k++){
    const i=(s.toAct+k)%n,p=s.seats[i];
    if(p.active&&!p.allIn&&(!p.hasActed||p.committed<s.currentBet-0.0001)) return i;
  }
  return null;
}
function advance(s){
  if(activeSeats(s).length<=1){ closeStreet(s); return; }
  const nx=nextToAct(s);
  if(nx!==null){ s.toAct=nx; return; }
  closeStreet(s);
}
function closeStreet(s){
  s.potClosed=round2(pot(s));
  s.seats.forEach(p=>{p.committed=0;p.hasActed=false;});
  s.currentBet=0; s.minRaise=1;
  if(activeSeats(s).length<=1){ s.over=true;s.endReason='fold';s.toAct=null;return; }
  if(s.street==='river'){ s.over=true;s.endReason='showdown';s.toAct=null;return; }
  s.street=STREETS[STREETS.indexOf(s.street)+1];
  s.toAct=null;
}
function openStreet(s){
  if(canActCount(s)<=1){
    if(s.street==='river'){ s.over=true;s.endReason='showdown';return; }
    s.street=STREETS[STREETS.indexOf(s.street)+1];
    return;
  }
  // Postflop la parole ouvre à gauche du bouton : siège 0 (SB) en table pleine,
  // mais la BB en heads-up, où le SB EST le bouton.
  const start=s.seats.length===2?1:0, n=s.seats.length;
  for(let k=0;k<n;k++){
    const i=(start+k)%n;
    if(s.seats[i].active&&!s.seats[i].allIn){ s.toAct=i; return; }
  }
  s.toAct=null;
}
/* Passer la parole : l'utilisateur touche le prochain joueur qui agit vraiment,
   et chaque joueur intermédiaire prend l'action passive par défaut — fold s'il
   fait face à une mise, check sinon. Chaque action passe par apply(), donc le
   raccourci ne peut produire que des états légaux. */
function canSkipTo(s,i){
  const p=s.seats[i];
  return !s.over && s.toAct!==null && s.toAct>=0 && i!==s.toAct
    && p.active && !p.allIn
    && !(p.hasActed && p.committed>=s.currentBet-0.0001);  // déjà parlé, rien à ajouter
}
function skipCore(s,target){
  if(!canSkipTo(s,target)) return false;
  let guard=s.seats.length;
  while(s.toAct!==null && s.toAct!==target && !s.over && guard-->0){
    apply(s, toCall(s)>0 ? 'fold' : 'check');
  }
  return true;
}
function sidePots(s){
  const inv=s.seats.map((p,i)=>({i,t:p.total,active:p.active})).filter(x=>x.t>0);
  const levels=[...new Set(inv.map(x=>x.t))].sort((a,b)=>a-b);
  const out=[]; let prev=0;
  for(const L of levels){
    const cnt=inv.filter(x=>x.t>=L-0.0001).length, amt=round2((L-prev)*cnt);
    const elig=inv.filter(x=>x.t>=L-0.0001&&x.active).map(x=>s.seats[x.i].pos);
    if(amt>0) out.push({amount:amt,eligible:elig});
    prev=L;
  }
  return out;
}

/* ============================================================
   2. CLASSEMENTS — pur, testable
   ============================================================ */
/* Borne basse de Wilson : 3 likes sur 3 ne doit pas battre 180 sur 200. */
function wilson(pos,n){
  if(!n) return 0;
  const z=1.96,p=pos/n;
  return (p+z*z/(2*n)-z*Math.sqrt((p*(1-p)+z*z/(4*n))/n))/(1+z*z/n);
}
/* Controverse : entropie du partage like/dislike, pondérée par le volume.
   Une main à 60/55 est plus intéressante qu'une main à 3/2. */
function controversy(h){
  const n=h.likes+h.dislikes;
  if(n<3) return 0;
  const p=h.likes/n;
  if(p<=0||p>=1) return 0;
  const ent=-(p*Math.log2(p)+(1-p)*Math.log2(1-p));
  return ent*Math.log10(1+n);
}
/* Décroissance : fenêtre semaine seulement, demi-vie 72 h. */
function hotScore(h,now){
  return wilson(h.likes,h.likes+h.dislikes)*Math.pow(0.5,((now-h.createdAt)/36e5)/72);
}
const WINDOWS={semaine:7,mois:30,année:365};
function ranked(hands,win,mode,now){
  const cut=now-WINDOWS[win]*864e5;
  const pool=hands.filter(h=>h.createdAt>=cut);
  const key=mode==='controversées'?controversy
    :mode==='commentées'?(h=>h.comments.length)
    :win==='semaine'?(h=>hotScore(h,now)):(h=>wilson(h.likes,h.likes+h.dislikes));
  return pool.map(h=>({h,k:key(h)})).sort((a,b)=>b.k-a.k||b.h.createdAt-a.h.createdAt).map(x=>x.h);
}

/* ============================================================
   3. DONNÉES
   ============================================================ */
/* ============================================================
   COMPTES RÉELS — configuration Supabase
   1. Crée un projet sur supabase.com (gratuit)
   2. Exécute supabase-schema.sql dans l'éditeur SQL
   3. Colle ici l'URL du projet et la clé « anon public »
      (Settings > API). La clé anon est faite pour être publiée
      côté client : la sécurité vient des règles RLS du schéma.
   Sans ces deux valeurs, le site tourne en mode démo local.
   ============================================================ */
const SUPABASE_URL='';
const SUPABASE_ANON_KEY='';

let sb=null, LIVE=false, session=null;
let BOOTING=!!(SUPABASE_URL&&SUPABASE_ANON_KEY);   // config présente : on charge



/* le site se charge hors ligne une fois installé, si sw.js est déployé à côté
   du fichier ; sans sw.js, tout marche à l'identique en ligne */
try{ if('serviceWorker' in navigator&&location.protocol.startsWith('http'))
  navigator.serviceWorker.register('./sw.js').catch(()=>{}); }catch(e){}

const DB={me:'sacha',players:{},hands:[]};
const DAY=864e5, NOW=Date.now();
function addPlayer(id,name,stakes,bio,following){
  DB.players[id]={id,handle:id,name,stakes,bio,following:following||[]};
}
addPlayer('sacha','Sacha','NL200 / MTT 100\u20ac','Reg cash 6-max. Je review tout ce qui me coûte plus de 40bb.',['marie','theo']);
addPlayer('marie','Marie','MTT 50-200\u20ac','Spécialiste bulle et short stack. Je poste surtout des spots ICM.');
addPlayer('theo','Theo','NL500 HU','Heads-up deep. Les gros pots sans showdown, c\'est mon sujet.');
addPlayer('lina','Lina','NL100 / live 2-5','Live deux fois par semaine. Je note au casino, je review le lendemain.');

function build(id,author,cfg,script,meta){
  const s=newHand(cfg);
  script.forEach(st=>{
    if(st[0]==='board'){ s.board.push(...st[1]); openStreet(s); return; }
    const rec=apply(s,st[0],st[1]);
    if(st[2]) rec.reasons=st[2];
    if(st[3]) rec.note=st[3];
  });
  const invested=s.seats[cfg.heroSeat].total;
  const alive=s.seats.map((p,i)=>p.active?i:-1).filter(i=>i>=0);
  // Un showdown n'a pas de gagnant déductible : il doit être saisi.
  if(s.endReason==='showdown'&&!meta.winners) throw new Error(id+' : showdown sans gagnant');
  const winners=s.endReason==='fold'?alive:meta.winners;
  const won=winners.includes(cfg.heroSeat);
  const share=round2(s.potClosed/winners.length);
  DB.hands.push({id,author,cfg,board:s.board.slice(),actions:s.actions,potFinal:s.potClosed,
    endReason:s.endReason,invested:round2(invested),won,alive,winners,
    showdown:meta.showdown||null,
    result:round2(won?share-invested:-invested),question:meta.q,
    createdAt:NOW-meta.ago*DAY,likes:meta.likes||0,dislikes:meta.dislikes||0,
    comments:meta.comments||[],tags:meta.tags||[]});
}

build('h1','sacha',{format:'cash',stakes:'NL200',tableSize:6,ante:0,stack:100,heroSeat:4,heroCards:['As','Ks'],live:false},
  [['fold'],['fold'],['raise',2.5],['raise',9],['fold'],['fold'],['call'],
   ['board',['Kh','7s','2d']],
   ['check',null,['pot control'],'Sa range de 3bet me domine sur ce board, je ne veux pas jouer un pot de 100bb.'],
   ['bet',9],['call'],['board',['Qc']],['check'],['check'],['board',['3h']],['check'],['bet',22],
   ['call',null,['il ne folde jamais'],'Il mise trois streets avec toutes ses valeurs et il bluffe la river trop souvent ici.']],
  {q:'Call river avec top paire meilleur kicker en pot 3bet, trop optimiste ?',ago:1.2,
   likes:64,dislikes:9,winners:[4],showdown:{5:['Jc','Jd']},tags:['3bet pot','bluff catch'],
   comments:[{by:'theo',street:'river',t:'Son sizing river est trop gros pour de la valeur fine. Call standard.'},
             {by:'marie',street:'flop',t:'Le check flop me gêne plus que le call river honnêtement.'}]});

build('h2','marie',{format:'mtt',stakes:'100\u20ac',tableSize:9,ante:0.12,stack:22,heroSeat:1,heroCards:['Ad','Ts'],live:false},
  [['fold'],['fold'],['fold'],['fold'],['fold'],['fold'],['raise',2.2],['fold'],
   ['raise',22,['spot ICM'],'22bb sur la bulle, son ouverture BTN est large mais un shove non payé reste rentable.'],
   ['call'],['board',['Kd','9s','4c']],['board',['Jh']],['board',['6s']]],
  {q:'Shove 22bb ATo depuis la BB sur la bulle, ou fold et attendre ?',ago:2.4,
   likes:88,dislikes:71,winners:[8],showdown:{8:['Kc','Qd']},tags:['bulle','ICM','shove'],
   comments:[{by:'sacha',street:'preflop',t:'Sur la bulle je fold. Le gain de tapis ne paie pas le risque de sortir.'},
             {by:'lina',street:'preflop',t:'Ça dépend totalement des stacks derrière, tu ne les donnes pas.'},
             {by:'theo',street:'preflop',t:'Shove clair si le BTN ouvre 45%.'}]});

build('h3','theo',{format:'cash',stakes:'NL500',tableSize:2,ante:0,stack:200,heroSeat:1,heroCards:['9h','8h'],live:false},
  [['raise',2.5],['raise',10],['call'],['board',['Jh','6h','2c']],
   ['bet',11,['avantage de range'],'Tirage couleur max plus deux overcards à sa range de call.'],
   ['call'],['board',['4s']],['bet',34],['call'],['board',['Kd']],
   ['bet',96,['blocage'],'Le roi est la meilleure carte du deck pour moi : il complète ma range de valeur et pas la sienne.'],
   ['fold']],
  {q:'Triple barrel bluff en HU deep, le sizing river est-il trop gros ?',ago:4.1,
   likes:52,dislikes:6,tags:['HU','bluff','deep'],
   comments:[{by:'sacha',street:'river',t:'Le sizing river est exactement ce qui fait folder ses paires. Rien à changer.'}]});

build('h4','lina',{format:'cash',stakes:'Live 2/5',tableSize:8,ante:0,stack:150,heroSeat:6,heroCards:['Qc','Qd'],live:true},
  [['fold'],['fold'],['fold'],['raise',3],['raise',9],['fold'],['fold'],['fold'],['call'],
   ['board',['Ah','9c','4d']],['check'],['bet',7],
   ['call',null,['read physique'],'Il a compté ses jetons avant de miser, il ne fait jamais ça avec un as.'],
   ['board',['2s']],['check'],['check'],['board',['7h']],['check'],['bet',26],['call']],
  {q:'Live 2-5, je paie trois streets avec QQ sur un board à as. Trop collant ?',ago:6.5,
   likes:41,dislikes:38,winners:[5],showdown:{5:['Ac','Kd']},tags:['live','bluff catch'],
   comments:[{by:'marie',street:'river',t:'Le read physique ne suffit pas pour payer trois barrels.'},
             {by:'theo',street:'flop',t:'Le call flop est correct, la river est indéfendable.'}]});

build('h5','sacha',{format:'cash',stakes:'NL200',tableSize:6,ante:0,stack:100,heroSeat:1,heroCards:['7c','7d'],live:false},
  [['fold'],['raise',2.5],['fold'],['fold'],['fold'],
   ['raise',9,['protection'],'Squeeze depuis la BB, sa range d\'open HJ folde beaucoup face à une relance.'],
   ['fold']],
  {q:'Squeeze BB avec 77 face à un open HJ, rentable en pratique ?',ago:11,
   likes:29,dislikes:4,tags:['squeeze'],comments:[]});

build('h6','theo',{format:'cash',stakes:'NL500',tableSize:2,ante:0,stack:120,heroSeat:0,heroCards:['Ks','Qs'],live:false},
  [['raise',3],['raise',12],['raise',33],['call'],['board',['Kc','8d','3s']],['check'],['bet',24],
   ['raise',120],['call'],['board',['7c']],['board',['2h']]],
  {q:'4bet pot HU, tapis au flop avec top paire. Trop agressif ?',ago:26,
   likes:96,dislikes:14,winners:[0],showdown:{1:['Kd','Jc']},tags:['4bet pot','HU'],
   comments:[{by:'lina',street:'flop',t:'Le tapis transforme ta main en bluff. Call et laisse-le miser.'},
             {by:'marie',street:'flop',t:'Contre un joueur qui cbet 100% je pousse aussi.'}]});

const MY={liked:{}};

/* Stockage local : localStorage quand il existe (site déployé), repli mémoire
   sinon (aperçu sandboxé). Rien ne casse, la persistance est un bonus. */
function applyTheme(t){
  document.body.classList.toggle('light',t==='light');
  const m=document.querySelector('meta[name="theme-color"]');
  if(m) m.content=(t==='light'?'#E9EDF2':'#0A0D11');
  store.set('theme',t);
}
const store=(()=>{ 
  try{
    const t='__tank_t'; localStorage.setItem(t,'1'); localStorage.removeItem(t);
    return {persistent:true,
      get:k=>{try{const v=localStorage.getItem('tank.'+k);return v?JSON.parse(v):null}catch(e){return null}},
      set:(k,v)=>{try{localStorage.setItem('tank.'+k,JSON.stringify(v))}catch(e){}},
      del:k=>{try{localStorage.removeItem('tank.'+k)}catch(e){}}};
  }catch(e){
    const mem={};
    return {persistent:false,
      get:k=>(k in mem?mem[k]:null), set:(k,v)=>{mem[k]=v;}, del:k=>{delete mem[k];}};
  }
})();
let captures=store.get('captures')||[];   // captures rapides « à finir »
let captureMemo=null;                     // capture en cours de complétion

/* En mode démo, ce que TU fais survit au rechargement de la page. */
function restoreLocal(){
  (store.get('localHands')||[]).forEach(h=>{ if(!DB.hands.find(x=>x.id===h.id)) DB.hands.push(h); });
  Object.assign(MY.liked, store.get('liked')||{});
  const fl=store.get('following'); if(fl&&DB.players[DB.me]) DB.players[DB.me].following=fl;
  const pe=store.get('profileEdit'); if(pe&&DB.players[DB.me]) Object.assign(DB.players[DB.me],pe);
  DB.hands.forEach(h=>h.comments.forEach((c,i)=>{ if(!c.at) c.at=h.createdAt+(i+1)*36e3*100; }));
}
function persistDemo(){
  if(LIVE) return;
  store.set('liked',MY.liked);
  if(DB.players[DB.me]) store.set('following',DB.players[DB.me].following);
  store.set('localHands',DB.hands.filter(h=>String(h.id).startsWith('u')));
}

/* Limites proposées à la saisie, par format. Libellé libre stocké tel quel. */
const STAKES={
  cash:['NL10','NL25','NL50','NL100','NL200','NL500','Live 1/2','Live 2/5','Live 5/10'],
  mtt:['5\u20ac','10\u20ac','25\u20ac','50\u20ac','100\u20ac','250\u20ac','500\u20ac+']
};
const FORMAT_LABEL={cash:'Cash game',mtt:'Tournoi'};

/* Titre par défaut, fabriqué depuis la main : cartes, position, type de pot.
   L'auteur écrit son titre s'il veut ; personne n'est bloqué par un champ vide. */
function autoTitle(cfg,actions,board){
  const c=cfg.heroCards;
  const cards=c[0][0]+c[1][0]+(c[0][0]===c[1][0]?'':(c[0][1]===c[1][1]?'s':'o'));
  const pos=SEAT_ORDER[cfg.tableSize][cfg.heroSeat];
  const pre=actions.filter(a=>a.street==='preflop'&&a.type==='raise').length;
  const potType=pre>=3?'pot 4bet':pre===2?'pot 3bet':pre===1?'pot relancé':'pot limpé';
  const street=board.length>=5?'à la river':board.length===4?'au turn'
    :board.length===3?'au flop':'préflop';
  return (cards+' en '+pos+' \u2014 '+potType+', '+street
    +(cfg.stakes?' \u00b7 '+cfg.stakes:'')).slice(0,140);
}


const PCT=[[25,'25%'],[33,'33%'],[50,'50%'],[75,'75%'],[100,'POT'],[150,'OVB']];
function sizingOptions(s){
  const lg=legal(s); if(!(lg.bet||lg.raise)) return null;
  const p=s.seats[s.toAct], P=pot(s), c=lg.raise?toCall(s):0;
  const max=round2(p.committed+p.stack);
  const minTo=lg.bet?Math.min(1,max):Math.min(round2(s.currentBet+s.minRaise),max);
  let mode,opts;
  if(s.street==='preflop'){
    const nR=s.actions.filter(a=>a.street==='preflop'&&a.type==='raise').length;
    if(nR===0){
      mode='open';
      const set=s.cfg.format==='mtt'?[2,2.2,2.5,3]:[2,2.3,2.5,3];
      opts=set.map(v=>({l:v+'bb',v:round2(v)}));
    }else if(nR===1){
      mode='3bet';
      opts=[3,3.5,4,5].map(k=>({l:k+'x',v:round2(s.currentBet*k)}));
    }else{
      mode='4bet';
      opts=[2.2,2.5,3].map(k=>({l:k+'x',v:round2(s.currentBet*k)}));
    }
  }else{
    mode=lg.bet?'bet':'raise';
    opts=PCT.map(([k,l])=>({l,
      v: lg.bet?round2(P*k/100):round2(p.committed+c+(P+c)*k/100)}));
  }
  opts=opts.map(o=>({l:o.l,v:Math.min(Math.max(o.v,minTo),max)}));
  const seen=new Set(), out=[];
  opts.forEach(o=>{ if(!seen.has(o.v)){ seen.add(o.v); out.push(o); } });
  if(!seen.has(max)) out.push({l:'TAPIS',v:max});
  else out[out.length-1].l='TAPIS';
  return {mode,opts:out,minTo,max,P,c,committed:p.committed,isBet:!!lg.bet,
          preflop:s.street==='preflop'};
}
function wheelValue(so,raw){
  if(so.preflop) return Math.min(Math.max(round2(raw),so.minTo),so.max);
  const v=so.isBet?so.P*raw/100:so.committed+so.c+(so.P+so.c)*raw/100;
  return Math.min(Math.max(round2(v),so.minTo),so.max);
}
function autoTags(cfg,actions,board){
  const t=[];
  const preR=actions.filter(a=>a.street==='preflop'&&a.type==='raise').length;
  if(preR===2) t.push('3bet pot'); else if(preR>=3) t.push('4bet pot');
  let seenR=false,seenC=false;
  for(const a of actions){
    if(a.street!=='preflop') break;
    if(a.type==='raise'){ if(seenR&&seenC){ t.push('squeeze'); break; } seenR=true; }
    else if(a.type==='call'&&seenR) seenC=true;
  }
  if(actions.some(a=>a.street!=='preflop'&&a.type==='bet'&&a.amount>a.potBefore+0.0001))
    t.push('overbet');
  if(actions.some(a=>a.allIn&&a.street==='preflop')) t.push('tapis préflop');
  if(cfg.tableSize===2) t.push('HU');
  if(cfg.format==='mtt') t.push('tournoi');
  if((cfg.stakes||'').toLowerCase().startsWith('live')) t.push('live');
  return [...new Set(t)].slice(0,4);
}
function myEvents(){
  if(!DB.me) return [];
  const ev=[];
  DB.hands.filter(h=>h.author===DB.me).forEach(h=>{
    h.comments.forEach(c=>{ if(c.by!==DB.me)
      ev.push({kind:'comment',hand:h,by:c.by,at:c.at||h.createdAt,body:c.t,street:c.street}); });
    (h.rawReactions||[]).forEach(r=>{ if(r.by!==DB.me)
      ev.push({kind:r.kind,hand:h,by:r.by,at:r.at}); });
  });
  return ev.sort((a,b)=>b.at-a.at);
}
const HASH_OF={home:'feed',week:'hot',activity:'notifs',profile:'profil',setup:'saisir'};
const VIEW_OF={feed:'home',hot:'week',notifs:'activity',profil:'profile',saisir:'setup'};
function urlFor(r){
  if(r.v==='hand'&&r.id) return '#/main/'+r.id;
  if(r.v==='profile'&&r.id) return '#/joueur/'+r.id;
  return '#/'+(HASH_OF[r.v]||'fil');
}
function reactedHands(){
  return DB.hands.filter(h=>MY.liked[h.id])
    .sort((a,b)=>b.createdAt-a.createdAt);
}
function commentedHands(id){
  return DB.hands
    .map(h=>({h,last:Math.max(0,...h.comments.filter(c=>c.by===id).map(c=>c.at||0))}))
    .filter(x=>x.h.comments.some(c=>c.by===id)&&x.h.author!==id)
    .sort((a,b)=>b.last-a.last||b.h.createdAt-a.h.createdAt)
    .map(x=>x.h);
}
module.exports={newHand,apply,pot,legal,sidePots,openStreet,toCall,activeSeats,canSkipTo,skipCore,wilson,controversy,hotScore,ranked,DB,MY,STAKES,FORMAT_LABEL,autoTitle,autoTags,myEvents,urlFor,store,reactedHands,commentedHands,wheelValue,WINDOWS,NOW,SEAT_ORDER,STREETS,NEED,round2,PCT,sizingOptions};