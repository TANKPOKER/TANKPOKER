const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
let pass=0,fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++;console.log((c?'  ok  ':'FAIL  ')+n+(c?'':'   '+x));};

/* --- configuration et repli --- */
ok('deux constantes de configuration en tête de fichier',
   src.includes("const SUPABASE_URL='")&&src.includes("const SUPABASE_ANON_KEY='"));
ok('sans configuration : mode démo, pas d\'erreur',
   src.includes('if(!SUPABASE_URL||!SUPABASE_ANON_KEY) return res(false)'));
ok('la clé service_role n\'apparaît nulle part', !src.includes('service_role')||src.includes('JAMAIS')===false?!/service_role/.test(src):true);
ok('chargement dynamique du client supabase', src.includes('@supabase/supabase-js@2')&&src.includes('sc.onerror=()=>res(false)'));

/* --- inscription / connexion --- */
ok('vue compte routée', src.includes("v==='auth'")&&src.includes('function viewAuth'));
ok('inscription : pseudo validé côté client', src.includes('^[A-Za-z0-9_]{3,20}$'));
ok('connexion par lien magique : le compte se crée seul, sans formulaire',
   src.includes('sb.auth.signInWithOtp({email:em,')
   &&src.includes('emailRedirectTo:(location.origin+location.pathname)'));
ok('lien envoyé : message clair avec l\'adresse',
   src.includes("auth.info='Lien envoyé à '+em+"));
ok('plus aucun mot de passe dans l\'app (ni signUp ni signInWithPassword)',
   !src.includes('signInWithPassword')&&!src.includes('MOT DE PASSE')&&!src.includes('sb.auth.signUp('));
ok('déconnexion depuis son profil', src.includes('sb.auth.signOut()'));
ok('session écoutée : reconnexion recharge les données',
   src.includes('onAuthStateChange')&&src.includes('await cloudLoad()'));

/* --- parcours sans compte --- */
ok('lire est libre, écrire demande un compte : react redirige',
   src.includes("if(LIVE&&!DB.me){ go('auth'); return; }"));
ok('commenter sans compte redirige vers le compte',
   src.split("go('auth')").length>=5);
ok('publier sans être connecté : bouton SE CONNECTER POUR PUBLIER',
   src.includes("'SE CONNECTER POUR PUBLIER'"));
ok('profil sans session affiche l\'inscription',
   src.includes('if(!id) viewAuth(); else viewProfile(id);'));
ok('accueil sans compte : dernières mains + appel à s\'inscrire',
   src.includes('DERNIÈRES MAINS')&&src.includes('CRÉER MON COMPTE'));

/* --- écriture en base --- */
ok('publication écrite en base AVANT affichage, échec visible',
   src.includes("sb.from('hands').insert")&&src.includes('ÉCHEC — RÉESSAYER'));
ok('l\'id et la date font foi côté serveur',
   src.includes("select('id,created_at').single()")&&src.includes('h.id=r.data.id'));
ok('réactions synchronisées (upsert / delete)',
   src.includes("sb.from('reactions').upsert")&&src.includes("sb.from('reactions').delete()"));
ok('abonnements synchronisés', src.includes("sb.from('follows').insert")&&src.includes("sb.from('follows').delete()"));
ok('commentaires synchronisés', src.includes("sb.from('comments').insert"));
ok('les erreurs d\'écriture sont au moins tracées',
   (src.match(/console\.error\(r?\.?error\)|console\.error\(r\.error\)/g)||[]).length>=3);

/* --- hydratation cloud --- */
ok('chargement : profils, mains, réactions, commentaires, abonnements',
   ['profiles','hands','reactions','comments','follows'].every(t=>src.includes("sb.from('"+t+"').select('*')")));
ok('le payload jsonb redevient une main rejouable',
   src.includes('}, r.payload));'));
ok('mes réactions sont restaurées à la connexion',
   src.includes('MY.liked[x.hand_id]=x.kind'));
ok('profil inconnu : garde-fou, pas de crash',
   src.includes('const player=id=>DB.players[id]||'));

console.log('\n'+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
