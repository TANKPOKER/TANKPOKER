const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
let pass=0,fail=0;

const ok=(n,c,x='')=>{c?pass++:fail++;console.log((c?'  ok  ':'FAIL  ')+n+(c?'':'   '+x));};

/* --- zoom typographique (réf. web design fournies) --- */
ok('titre de fiche éditorial : 18px, graisse 800, interlettrage serré',
   src.includes('.hc .q{font-family:var(--fd);font-size:18px;font-weight:800;'));
ok('avatar 32px (était 22)', src.includes('.av{width:32px;height:32px;'));
ok('résultat en pilule mono 15px', src.includes('.bdg.big{font-family:var(--fm);font-size:15px;')
   &&src.includes('class="bdg big '));

/* --- cartes à jouer agrandies --- */
ok('cartes héros +26% (34x47)', src.includes('.c-sm{width:34px;height:47px;font-size:17px}'));
ok('cartes de fiche +43% (30x41)', src.includes('.c-xs{width:30px;height:41px;font-size:15px}'));
ok('board +41% (24x33)', src.includes('.c-xxs{width:24px;height:33px;font-size:12.5px}'));

/* --- panneaux et respiration --- */
ok('dégradé de surface sombre ET clair (--card -> --card2)',
   src.includes('--card2:#151C25')&&src.includes('--card2:#F2F5F9'));
ok('liseré lumineux en haut des panneaux (fiches sombres + claires)',
   (src.match(/inset 0 1px 0 rgba\(255,255,255/g)||[]).length>=2);
ok('respiration : 16px entre fiches (était 8)', src.includes('margin-bottom:16px;cursor:poi'));


/* --- v29 : nom en accent, replayer en tête --- */
ok('noms des joueurs : blancs, italiques, graissés (denotent sans crier)',
   src.includes('font-style:italic;')&&src.includes('color:var(--text);letter-spacing:.01em}'));
ok('REPLAYER LA MAIN : premier élément de la feuille, plein cadre, en accent',
   src.includes("let h='<button class=\"btn play\" id=\"rep\">")
   &&src.includes('.btn.play{display:block;width:100%;'));
ok('plus de bouton REJOUER en bas : PARTAGER et PROFIL seulement',
   !src.includes('REJOUER'));


/* --- v33 : replay en un tap, saisie compacte, FAB SAISIR --- */
ok('replay rond entre le prénom et la date, vert profond 44px',
   src.includes("</div>'\n    +'<button class=\"qplay\"")
   &&src.includes('background:linear-gradient(160deg,#1CA85A,#0E6B35)')
   &&src.includes('.qplay{width:44px;height:44px;')); 
ok('un tap = replay direct, sans ouvrir la feuille (propagation stoppée)',
   src.includes("e.stopPropagation(); rp={k:0,playing:false,tick:null}; go('replay',{id:b.dataset.rp});"));
ok('saisie : table compactée à 308px (272 sur petits écrans), replay inchangé à 390',
   src.includes('.ent .tw{height:308px')&&src.includes('@media (max-height:740px){ .ent .tw{height:272px}')
   &&src.includes('height:390px;margin:2px 0 10px}'));
ok('SAISIR : bouton rond flottant au-dessus de la barre, dégradé cyan, halo',
   src.includes('width:54px;height:54px;margin:-30px auto 3px;border-radius:50%;')
   &&src.includes('box-shadow:0 6px 18px rgba(0,216,200,.45)'));

ok('sélecteur de cartes : cases 50px min, police 15/800, feuille 92vh',
   src.includes('.pk{aspect-ratio:.68;min-height:50px;')&&src.includes('max-height:92vh;overflow-y:auto;'));

console.log('\n'+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
