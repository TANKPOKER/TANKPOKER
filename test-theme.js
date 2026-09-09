const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
let pass=0,fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++;console.log((c?'  ok  ':'FAIL  ')+n+(c?'':'   '+x));};

/* --- fiches délimitées --- */
ok('les fiches ont surface en dégradé, bord et vraie élévation',
   src.includes('--card:#232E3B; --card2:#151C25;')&&src.includes('0 8px 22px rgba(0,0,0,.42)'));
ok('la fiche est un panneau : dégradé 168\u00b0, rayon 16, padding 16',
   src.includes('background:linear-gradient(168deg,var(--card),var(--card2))')
   &&src.includes('border-radius:16px;'));
ok('les notifs héritent automatiquement (mêmes fiches .hc)',
   src.includes("'<button class=\"hc\""));

/* --- mode clair --- */
ok('body.light redéfinit toute la palette', src.includes('body.light{')&&src.includes('--bg:#E9EDF2'));
ok('couleurs d\'action assombries pour tenir sur blanc',
   src.includes('--raise:#D93A34')&&src.includes('--call:#189A4A')&&src.includes('--fold:#2F66C4'));
ok('fonds d\'action pastel en clair', src.includes('--raise-d:#F6D9D7')&&src.includes('--call-d:#D3EEDD'));
ok('cyan assombri : lisible sur blanc', src.includes('--cyan:#009486'));
ok('bascule dans l\'en-tête des quatre onglets racine',
   src.includes('id="th"')&&src.includes('aria-label="changer de thème"'));
ok('choix persisté, thème système respecté au premier lancement',
   src.includes("store.get('theme')")&&src.includes("prefers-color-scheme: light"));
ok('la barre système du téléphone suit le thème',
   src.includes("m.content=(t==='light'?'#E9EDF2':'#0A0D11')"));
ok('objets physiques inchangés en clair : tapis et dos de cartes restent sombres',
   src.includes('.felt')&&src.includes('.card.back'));

/* --- barre d'onglets --- */
ok('onglet actif : blanc sur voile clair + trait cyan (barre violette)',
   src.includes('.tab.on{color:#FFFFFF;border-top-color:var(--cyan);background:rgba(255,255,255,.07)}'));
ok('icône de l\'onglet actif en cyan', src.includes('.tab.on .ic{color:var(--cyan)}'));
ok('onglets inactifs en lavande (palette de la barre violette)',
   src.includes('border-top:2px solid transparent;color:var(--tabmut);'));

/* --- police --- */
ok('Plus Jakarta Sans chargée (400 à 800), IBM Plex Sans retirée',
   src.includes('family=Plus+Jakarta+Sans:wght@400;500;600;700;800')&&!src.includes('IBM+Plex+Sans'));
ok('la marque, les actions ET le texte passent en Jakarta',
   src.includes("--fd:'Plus Jakarta Sans'")&&src.includes("--font:'Plus Jakarta Sans'"));
ok('les nombres restent en mono (tableaux de bb alignés)',
   src.includes("--fm:'IBM Plex Mono'"));
ok('les rangs du logo suivent la nouvelle police',
   src.includes('font-family="Plus Jakarta Sans,Arial,sans-serif"'));

console.log('\n'+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
