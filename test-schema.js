/* Exécute le schéma Supabase sur un vrai Postgres (PGlite) avec un shim
   minimal de l'environnement Supabase, puis vérifie les comportements clés. */
const {PGlite}=require('@electric-sql/pglite');
const fs=require('fs');
let pass=0,fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++;console.log((c?'  ok  ':'FAIL  ')+n+(c?'':'   '+String(x).slice(0,90)));};

(async()=>{
const db=new PGlite();
// --- shim Supabase : schéma auth, auth.uid(), rôle applicatif ---
await db.exec(`
  create schema auth;
  create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
  create role authenticated nologin;
  grant usage on schema public, auth to authenticated;
  alter default privileges in schema public grant all on tables to authenticated;
`);
// --- le schéma tel quel ---
try{ await db.exec(fs.readFileSync(require('path').join(__dirname,'..','supabase-schema.sql'),'utf8')); ok('le schéma s\'exécute sans erreur', true); }
catch(e){ ok('le schéma s\'exécute sans erreur', false, e.message); process.exit(1); }

const U1='11111111-1111-1111-1111-111111111111';
const U2='22222222-2222-2222-2222-222222222222';
const U3='33333333-3333-3333-3333-333333333333';

// --- inscription : le déclencheur crée le profil ---
await db.query(`insert into auth.users values ($1,null,'{"handle":"sacha"}')`,[U1]);
let r=await db.query(`select handle from profiles where id=$1`,[U1]);
ok('inscription : profil créé avec le pseudo choisi', r.rows[0] && r.rows[0].handle==='sacha', JSON.stringify(r.rows));

// --- collision de pseudo : suffixe, pas d'échec ---
await db.query(`insert into auth.users values ($1,null,'{"handle":"SACHA"}')`,[U2]);
r=await db.query(`select handle from profiles where id=$1`,[U2]);
ok('pseudo pris (même en casse différente) : suffixé au lieu d\'échouer',
   r.rows[0] && r.rows[0].handle.toLowerCase().startsWith('sacha_'), r.rows[0] && r.rows[0].handle);

// --- pseudo invalide : remplacé par un pseudo neutre ---
await db.query(`insert into auth.users values ($1,null,'{"handle":"a b!!"}')`,[U3]);
r=await db.query(`select handle from profiles where id=$1`,[U3]);
ok('pseudo invalide : nettoyé (a b!! -> a_b__) plutôt que jeté', r.rows[0] && r.rows[0].handle==='a_b__', r.rows[0] && r.rows[0].handle);

// --- RLS : sans session, écrire est refusé ---
await db.exec(`set role authenticated`);
let refused=false;
try{ await db.query(`insert into hands(author_id,question,payload,pot_final,invested,result,won,end_reason)
     values ($1,'q','{}',10,5,5,true,'fold')`,[U1]); }catch(e){ refused=true; }
ok('RLS : publier sans être connecté est refusé', refused);

// --- RLS : connecté en U1, publier sous son identité passe ---
await db.exec(`set request.jwt.claim.sub = '${U1}'`);
await db.query(`insert into hands(author_id,question,payload,pot_final,invested,result,won,end_reason)
  values ($1,'Call river trop optimiste ?','{"cfg":{}}',81.5,40,41.5,true,'showdown')`,[U1]);
r=await db.query(`select count(*)::int n from hands`);
ok('RLS : publier connecté sous sa propre identité passe', r.rows[0].n===1);

// --- RLS : publier sous l'identité d'un autre est refusé ---
refused=false;
try{ await db.query(`insert into hands(author_id,question,payload,pot_final,invested,result,won,end_reason)
     values ($1,'usurpation','{}',10,5,5,true,'fold')`,[U2]); }catch(e){ refused=true; }
ok('RLS : publier sous l\'identité d\'un autre est refusé', refused);

// --- réactions : une seule par joueur et par main, kind contraint ---
r=await db.query(`select id from hands limit 1`); const H=r.rows[0].id;
await db.query(`insert into reactions values ($1,$2,'like')`,[H,U1]);
refused=false;
try{ await db.query(`insert into reactions values ($1,$2,'dislike')`,[H,U1]); }catch(e){ refused=true; }
ok('réactions : une seule par joueur et par main', refused);
refused=false;
try{
  await db.exec(`set request.jwt.claim.sub = '${U2}'`);
  await db.query(`insert into reactions values ($1,$2,'super')`,[H,U2]);
}catch(e){ refused=true; }
ok('réactions : seul like ou dislike est accepté', refused);

// --- commentaires : street contrainte ---
refused=false;
try{ await db.query(`insert into comments(hand_id,author_id,street,body) values ($1,$2,'preturn','x')`,[H,U2]); }
catch(e){ refused=true; }
ok('commentaires : street invalide refusée', refused);
await db.query(`insert into comments(hand_id,author_id,street,body) values ($1,$2,'river','Call standard.')`,[H,U2]);
r=await db.query(`select count(*)::int n from comments`);
ok('commentaires : ancré à une street valide, accepté', r.rows[0].n===1);

// --- abonnements : pas d'auto-abonnement, pas de doublon ---
await db.query(`insert into follows(follower_id,followed_id) values ($1,$2)`,[U2,U1]);
refused=false;
try{ await db.query(`insert into follows(follower_id,followed_id) values ($1,$1)`,[U2]); }catch(e){ refused=true; }
ok('abonnements : s\'abonner à soi-même est refusé', refused);
refused=false;
try{ await db.query(`insert into follows(follower_id,followed_id) values ($1,$2)`,[U2,U1]); }catch(e){ refused=true; }
ok('abonnements : doublon refusé', refused);

// --- OAuth : le pseudo est dérivé du compte Google/Apple ---
const G1='44444444-4444-4444-4444-444444444444';
const G2='55555555-5555-5555-5555-555555555555';
const G3='66666666-6666-6666-6666-666666666666';
await db.exec(`reset role`);
await db.query(`insert into auth.users values ($1,'sacha.delamarre@gmail.com','{"full_name":"Sacha Delamarre"}')`,[G1]);
r=await db.query(`select handle from profiles where id=$1`,[G1]);
ok('Google : pseudo dérivé du nom du compte', r.rows[0].handle==='Sacha_Delamarre', r.rows[0].handle);
await db.query(`insert into auth.users values ($1,'k.dupont@icloud.com','{}')`,[G2]);
r=await db.query(`select handle from profiles where id=$1`,[G2]);
ok('Apple sans nom : pseudo dérivé de l\'email', r.rows[0].handle==='k_dupont', r.rows[0].handle);
await db.query(`insert into auth.users values ($1,'\u5f20@qq.com','{"full_name":"\u5f20\u4f1f"}')`,[G3]);
r=await db.query(`select handle from profiles where id=$1`,[G3]);
ok('nom inutilisable : repli neutre, l\'inscription passe', /^joueur_/.test(r.rows[0].handle), r.rows[0].handle);
await db.exec(`set role authenticated`);

// --- suppression du compte : tout suit ---
await db.exec(`reset role`);
await db.query(`delete from auth.users where id=$1`,[U1]);
r=await db.query(`select (select count(*)::int from profiles where id=$1) p,
                         (select count(*)::int from hands) h`,[U1]);
ok('supprimer le compte supprime profil et mains (cascade)', r.rows[0].p===0 && r.rows[0].h===0, JSON.stringify(r.rows[0]));

// --- question bornée à 140 caractères ---
await db.exec(`set role authenticated`); await db.exec(`set request.jwt.claim.sub = '${U2}'`);
refused=false;
try{ await db.query(`insert into hands(author_id,question,payload,pot_final,invested,result,won,end_reason)
  values ($1,$2,'{}',10,5,5,true,'fold')`,[U2,'x'.repeat(141)]); }catch(e){ refused=true; }
ok('mains : question limitée à 140 caractères', refused);

console.log('\n'+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
})();
