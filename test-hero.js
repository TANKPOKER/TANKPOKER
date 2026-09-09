const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
let pass=0,fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++;console.log((c?'  ok  ':'FAIL  ')+n+(c?'':'   '+x));};

/* --- héros identifiable sur la table (saisie ET replay : même tableHTML) --- */
ok('couronne au-dessus des cartes du héros, et de lui seul',
   src.includes("(p.hero?'<div class=\"youtag\">'+CROWN+'</div>':'')")
   &&src.includes("const CROWN='<svg"));
ok('plaque du héros : halo cyan + fond teinté',
   src.includes('box-shadow:0 0 0 1.5px var(--cyan),0 0 16px rgba(0,216,200,.35)')
   &&src.includes('background:linear-gradient(165deg,var(--cyan-i),var(--panel))'));
ok('position du héros en gras cyan', src.includes('.seat.hero .nm{color:var(--cyan);font-weight:800}'));

/* --- héros identifiable dans la feuille de lecture --- */
ok('couronne sur chaque action du héros, dans une colonne réservée',
   src.includes("'<span class=\"slot\">'+(a.hero?CROWN:'')+'</span>'")
   &&src.includes('.arow .slot{width:20px;flex:0 0 auto;'));
ok('ligne héros : bord cyan épaissi (3px) + fond teinté dégradé',
   src.includes('border-left-width:3px;border-left-color:var(--cyan);'));
ok('le replay hérite (tableHTML est partagé)',
   src.includes('body.innerHTML=tableHTML(s,'));

ok('plus aucun texte TOI : la couronne parle seule',
   !src.includes('>TOI<'));
ok('la ligne d\'action respire (gap 11px, padding 7px, était 9/6)',
   src.includes('gap:11px;padding:7px 0 7px 10px;'));

/* --- palette écartée --- */
ok('fond quasi noir (#0A0D11), panneaux nettement plus clairs',
   src.includes('--bg:#0A0D11')&&src.includes('--panel2:#232C38'));
ok('bord des fiches remonté (#465363 : 2.5x le fond, était 1.85x)',
   src.includes('--cardline:#465363'));
ok('mode clair : fond descendu (#E9EDF2), blanc des fiches détaché',
   src.includes('--bg:#E9EDF2'));
ok('la barre système suit les nouveaux fonds',
   src.includes('content="#0A0D11"')&&src.includes("'#E9EDF2':'#0A0D11'"));

console.log('\n'+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
