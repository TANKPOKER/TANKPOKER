
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


module.exports={newHand,apply,pot,legal,sidePots,openStreet,toCall,activeSeats,canActCount,canSkipTo,skipCore,STREETS};