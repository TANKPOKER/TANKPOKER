# TANK ♠ — la review de mains de poker par la communauté

Saisis une main en moins de 20 secondes, publie-la, et laisse la communauté
liker, commenter street par street, et la replayer sur une vraie table.
Site mobile-first **et** PWA installable (icône, plein écran, hors-ligne).

**Un seul fichier applicatif** : `index.html` contient le moteur de poker,
l'interface et le client Supabase. `sw.js` ajoute le chargement hors-ligne.

## Fonctionnalités

- **Saisie éclair** : skip-to-player d'un tap, sizings natifs par régime
  (ouvertures en bb, 3-bets/4-bets en multiples, postflop en % du pot +
  molette), undo permanent, brouillon persistant, capture 5s à finir plus tard
- **Replay** : table verte façon salle de poker, dos rouges, héros couronné 👑,
  replay en un tap depuis le feed
- **Communauté** : feed d'abonnements, classement Hot (Wilson score,
  controverse, demi-vie 72 h) filtrable par format et limite, notifications,
  commentaires ancrés à une street, tags automatiques (3bet pot, squeeze,
  overbet…), lien partageable par main (`#/main/xxx`)
- **Comptes** : email + Google + Apple (Supabase Auth), profil éditable,
  sections Publiées / Likées / Commentées
- **Deux thèmes** (sombre/clair) — la table de poker reste un objet physique
  dans les deux

## Démarrage

Sans configuration, `index.html` s'ouvre en **mode démo local** (données
d'exemple, tout fonctionne hors comptes).

Pour la vraie mise en ligne — Supabase (gratuit) + hébergeur statique —
suivre pas à pas **[docs/mise-en-ligne.md](docs/mise-en-ligne.md)** :
1. Exécuter `supabase-schema.sql` dans l'éditeur SQL Supabase
2. Coller `SUPABASE_URL` et `SUPABASE_ANON_KEY` en tête de `index.html`
3. Déployer `index.html` + `sw.js` (Netlify Drop, Vercel, ou GitHub Pages)

> GitHub Pages fonctionne directement : Settings → Pages → branche `main`,
> racine. Penser à mettre l'URL Pages dans Supabase (Auth → URL Configuration).

## Tests — 425 verts, 22 suites

```bash
npm install     # PGlite : un vrai Postgres pour tester le schéma et la RLS
npm test        # extrait les modules depuis index.html puis lance les 22 suites
```

Couverture : moteur de poker (ordre de parole, side pots, all-ins courts,
HU), schéma SQL exécuté sur Postgres réel (RLS, triggers, cascades, OAuth),
sizings au centime, classements, titres/tags automatiques, liens profonds,
et le CSS critique (thèmes, table, contrastes) verrouillé par assertions —
plusieurs régressions visuelles ont été attrapées par ces tests avant
d'atteindre un écran.

## Structure

```
index.html            l'application entière (moteur, UI, Supabase, PWA)
sw.js                 service worker : ouverture hors-ligne
supabase-schema.sql   schéma + RLS + trigger de profil (testé sur Postgres)
tests/                22 suites + modules extraits (core18.js, engine.js)
scripts/extract.js    régénère les modules de test depuis index.html
scripts/run-tests.js  lance toutes les suites
docs/                 guide de mise en ligne, état du projet
```

## À savoir avant d'ouvrir au public

- La validation **serveur** du déroulé des mains (Edge Function rejouant le
  moteur) n'est pas encore en place — voir docs/mise-en-ligne.md. À faire
  avant l'ouverture large, pas avant les ~50 premiers inscrits.
- La connexion Apple exige l'Apple Developer Program (99 $/an) ; Google est
  gratuit.
- Pas encore de modération ni de reset de mot de passe dans l'interface.

## Licence

Tous droits réservés — projet privé de Sacha Delamarre. (Changer cette
section si le dépôt devient public : ajouter un fichier LICENSE.)
