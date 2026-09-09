# TANK — état compact (v33, 424 tests verts / 22 suites)

## Produit
Site+PWA mobile de saisie/partage de mains de poker. Onglets : FEED · HOT ·
SAISIR (FAB rond cyan flottant) · NOTIFS · PROFIL. Barre violette (#1B1233 /
#241947 clair). Thèmes sombre/clair (bascule ☀/☾ en-tête, persistée,
prefers-color-scheme). Police Plus Jakarta Sans + IBM Plex Mono (nombres).
Logo : éventail royale à pique (pivot commun, index de coin, as central).

## Fichier principal : app-v33.html (unique, + sw.js pour hors-ligne)
- Moteur pur testé (sections 1-4, tests extraits par marqueurs de commentaires)
- Saisie <20s : skip-to-player, undo ↩ permanent, brouillon persisté à chaque
  action, capture 5s "À FINIR", chrono
- Sizings 3 régimes : open bb (cash 2/2.3/2.5/3, MTT 2/2.2/2.5/3), vs relance
  multiples (3bet 3/3.5/4/5x, 4bet 2.2/2.5/3x), postflop %pot
  (25/33/50/75/POT/OVB150) + molette (bb préflop, 10-250% postflop)
- Tournoi : stack ICM (paliers 5-100 + champ exact 0.5bb) ; expresso supprimé
- Résultat : winners purgés/reset partout (bug +0.8 corrigé), alerte pot
  partagé, SUPPRIMER sa main
- Fiches : panneau dégradé (--card/--card2), titre 18px/800, cartes agrandies,
  pilule résultat mono, ▶ replay direct (qplay, stopPropagation), noms blancs
  italiques, bande colorée supprimée
- Table : feutre vert radial + rail + betline + filigrane, dos rouges bordés
  blanc, plaques/pot/street sombres EN DUR (hors thème), couronne or = héros
  (table + lignes d'action, colonne réservée), replay 390px / saisie 308px
  (272 si max-height:740)
- Feuille de main : REPLAYER LA MAIN plein cadre en tête ; bas = PARTAGER+PROFIL
- Comptes : Supabase (email + Google + Apple OAuth), trigger pseudo (nom→email→
  joueur_xxx, collision suffixée), pseudo modifiable, lecture libre/écriture
  connectée, publication écrite en base AVANT affichage, tendances filtres
  format+limite, tags auto (3bet/squeeze/overbet/tapis/HU/live), liens #/main/x
  #/feed #/hot #/notifs, activité=notifs avec pastille, profil 3 sections
  (Publiées/Likées/Commentées), édition profil
- PWA : manifest+icônes inline (éventail sur tuile), sw.js réseau-d'abord,
  16px inputs, cibles 40px+, overscroll contain, molette pouce 26px

## Backend
supabase-schema.sql testé sur PGlite (18 tests, RLS réelle, cascade, OAuth).
mise-en-ligne.md : Supabase + Google (gratuit) + Apple (99$/an) + Netlify
(index.html + sw.js). Restent : Edge Function validation serveur (après 50
inscrits), Realtime, modération, reset password, side pots à l'écran résultat.

## Workflow (à respecter)
- Patches python rep(a,b) assert count ; TOUJOURS grep de vérification POST-
  écriture (3 pertes silencieuses vécues) ; jamais de sed chaîné après un test
  rouge ; redirection suites vérifiée par grep -L AVANT le run global.
- Chirurgie de tests : ancres SANS apostrophe (fichiers échappent \').
- Aperçus visuels : resvg (icônes, logo, mockups PNG) — pas de navigateur.
- Suites : test-{moteur,skip,schema,v4,v5,brand,brand2,v7,v9,v10,v11,v12,v13,
  sizing,result,oauth,mobile,theme,visual,hero,v30,table}.js sur app-v33.html
  + core18.js (module extrait) + engine.js.
- Style réponses : verdict d'abord, chiffres, causes de bugs expliquées,
  limites honnêtes, une question/incertitude en fin.

## Signalé à surveiller (non bloquant)
qplay 38px (<44), FAB déborde 30px sur fin de scroll, noms cliquables sans
indice visuel, vue Hot chargée en filtres, clavier virtuel vs barre commentaire
(à tester sur iPhone).
