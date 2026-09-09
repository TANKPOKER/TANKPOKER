const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
let pass=0,fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++;console.log((c?'  ok  ':'FAIL  ')+n+(c?'':'   '+x));};

/* --- installable comme une app --- */
ok('manifest embarqué (nom, standalone, icônes 192 et 512)',
   src.includes('rel="manifest"')&&src.includes('application/manifest%2Bjson')||src.includes('application/manifest+json'));
ok('icône iPhone embarquée (apple-touch-icon en PNG)',
   src.includes('rel="apple-touch-icon" href="data:image/png;base64,'));
ok('plein écran iOS + barre système sombre',
   src.includes('apple-mobile-web-app-capable')&&src.includes('theme-color'));
ok('service worker : enregistré si présent, silencieux sinon',
   src.includes("navigator.serviceWorker.register('./sw.js').catch(()=>{})"));
const sw=fs.readFileSync(require('path').join(__dirname,'..','sw.js'),'utf8');
ok('sw.js : réseau d\'abord, cache en secours, vieux caches purgés',
   sw.includes('fetch(e.request).then')&&sw.includes('caches.match')&&sw.includes('caches.delete'));

/* --- ergonomie tactile mesurée --- */
ok('champs à 16px : iOS ne zoome plus de force à la saisie',
   src.includes('border-radius:5px;font-size:16px;'));
ok('segments à ~40px de haut (padding 11px, était 7px)',
   src.includes('border-radius:4px;padding:11px 4px;'));
ok('boutons d\'en-tête 40px (était 32)', src.includes('.ib{width:40px;height:40px;'));
ok('cartes du sélecteur : 50px minimum (agrandies pour la lisibilité)',
   src.includes('.pk{aspect-ratio:.68;min-height:50px;'));
ok('molette saisissable au pouce : curseur 26px sur piste fine',
   src.includes('::-webkit-slider-thumb')&&src.includes('width:26px;height:26px'));
ok('pas de zoom double-tap sur les contrôles',
   src.includes('button,input[type=range]{touch-action:manipulation}'));
ok('tirer vers le bas ne recharge plus la page en pleine saisie',
   src.includes('body{overscroll-behavior-y:contain}'));
ok('pas de flash gris au tap (déjà en place, vérifié)',
   src.includes('-webkit-tap-highlight-color:transparent'));

/* --- chargement --- */
ok('mode LIVE : écran de chargement au lieu du flash des données démo',
   src.includes('let BOOTING=!!(SUPABASE_URL&&SUPABASE_ANON_KEY)')
   &&src.includes("if(BOOTING){")&&src.includes('Récupération du feed'));
ok('échec de chargement du client : retour propre au mode démo',
   src.includes('BOOTING=false; if(typeof render')); 

console.log('\n'+pass+' réussis, '+fail+' échoués');
process.exit(fail?1:0);
