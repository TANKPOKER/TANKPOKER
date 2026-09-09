const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const sql=fs.readFileSync(require('path').join(__dirname,'..','supabase-schema.sql'),'utf8');
let pass=0,fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++;console.log((c?'  ok  ':'FAIL  ')+n+(c?'':'   '+x));};

/* --- boutons --- */
ok('bouton Continuer avec Google, avec son G officiel en SVG',
   src.includes('Continuer avec Google')&&src.includes('#EA4335')&&src.includes('#34A853'));
ok('Apple retiré : Google + lien email seulement (choix produit)',
   !src.includes('Continuer avec Apple')&&!src.includes('M788 341'));
ok('séparateur « ou par email » : l\'email reste possible',
   src.includes('ou par email')&&src.includes('class="orsep"'));
ok('le bouton Google est branché', src.includes("doOAuth('google')"));

/* --- flux --- */
ok('signInWithOAuth avec retour vers le site',
   src.includes('sb.auth.signInWithOAuth({provider,')
   &&src.includes('redirectTo:(location.origin+location.pathname)'));
ok('échec fournisseur : message affiché, pas de page morte',
   src.includes("auth.err='Connexion '+provider+' indisponible"));
ok('le retour de session recharge tout (déjà via onAuthStateChange)',
   src.includes('onAuthStateChange'));

/* --- pseudo : dérivé puis modifiable --- */
ok('le trigger dérive le pseudo du nom Google/Apple puis de l\'email',
   sql.includes("raw_user_meta_data->>'full_name'")&&sql.includes("split_part(coalesce(new.email,''), '@', 1)"));
ok('champ PSEUDO dans Modifier le profil',
   src.includes('id="e-h"')&&src.includes('p.handle.replace'));
ok('pseudo validé (3-20, lettres/chiffres/_) avant envoi',
   src.includes("/^[A-Za-z0-9_]{3,20}$/.test(h)"));
ok('collision locale détectée, insensible à la casse',
   src.includes('x.handle.toLowerCase()===h.toLowerCase()'));
ok('collision en base (index unique) : signalée, rien d\'écrasé',
   src.includes(".update({handle:h,name:p.name")&&src.includes("if(r.error){"));

/* --- guide --- */
const md=fs.readFileSync(require('path').join(__dirname,'..','docs','mise-en-ligne.md'),'utf8');
ok('guide : configuration Google documentée', md.includes('OAuth client ID')&&md.includes('auth/v1/callback'));
ok('guide : le coût Apple (99$/an) est annoncé, pas caché',
   md.includes('99')&&md.includes('Apple Developer'));

console.log('\n'+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
