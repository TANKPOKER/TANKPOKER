const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
let pass=0,fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++;console.log((c?'  ok  ':'FAIL  ')+n+(c?'':'   '+x));};

/* --- tapis façon salle de poker --- */
ok('tapis vert riche en dégradé radial (plus le disque noir informe)',
   src.includes('#2E9D63')&&src.includes('#1E7A47')&&src.includes('#125234'));
ok('rail sombre autour du tapis + profondeur',
   src.includes('border:9px solid #202B38')&&src.includes('inset 0 0 60px rgba(0,0,0,.4)'));
ok('ligne de mise intérieure', src.includes(".felt::before{content:'';position:absolute;inset:11%;"));
ok('filigrane pique au centre du tapis', src.includes('class="wmark"')&&src.includes('rgba(255,255,255,.07)'));

/* --- lisible quel que soit le thème : la table est un objet --- */
ok('dos de cartes rouges bordés de blanc (référence Winamax)',
   src.includes('#C8332D 0 3px,#A5221D')&&src.includes('border:1.5px solid #F4E9E1'));
ok('plaques sombres en dur, textes clairs — identiques dans les deux thèmes',
   src.includes('background:rgba(13,19,26,.92)')&&src.includes('color:#D7E0EA}'));
ok('pot : UNE seule règle, chiffre blanc mono 15px gras avec relief',
   (src.match(/\.potline b\{/g)||[]).length===1
   &&src.includes('font-size:15px;font-weight:700;color:#FFFFFF;'));
ok('street sous les sièges du haut : plus de collision en 9-max',
   src.includes('top:26.5%;'));
ok('mises : jeton rouge liseré blanc + montant blanc',
   src.includes('radial-gradient(circle at 35% 30%,#FF7A6E,#C8332D 60%,#8E1712)')
   &&src.includes('border:2px dashed rgba(255,255,255,.85)'));

ok('les cartes ne recouvrent plus la position (hauteur naturelle, léger recul)',
   src.includes('.seat .hand{display:flex;gap:2px;justify-content:center;height:auto;'));
ok('siège à la parole : sombre en dur + anneau cyan, insensible au thème',
   src.includes('.seat.act .plate{background:#0D141C;border-color:#00D8C8;'));
ok('stacks lisibles : blanc 13.5px gras',
   src.includes('font-size:13.5px;font-weight:700;line-height:1.2;color:#EDF4FA'));

console.log('\n'+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
