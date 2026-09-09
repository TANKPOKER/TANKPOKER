# TANK — mise en ligne des comptes réels

Trois briques, zéro serveur à administrer : **Supabase** (comptes + base de
données), **Netlify ou Vercel** (hébergement du site), et le fichier
`app-v10.html`. Budget : 0 € jusqu'à plusieurs milliers d'utilisateurs.
Temps : moins d'une heure.

## 1. Créer le backend (15 min)

1. Crée un compte sur supabase.com, puis un projet (région `eu-west` pour la
   France). Note le mot de passe base de données, tu n'en auras plus besoin
   ensuite.
2. Menu **SQL Editor** → colle l'intégralité de `supabase-schema.sql` → Run.
   Le schéma crée : profils, mains, réactions, commentaires, abonnements,
   le déclencheur qui fabrique le profil à l'inscription, et les règles RLS.
   Ce fichier a été exécuté et testé sur Postgres : 15 vérifications, dont
   le refus d'écrire sans session et le refus d'usurper une identité.
3. Menu **Authentication → Providers** : Email est activé par défaut.
   Deux réglages à décider :
   - *Confirm email* : ON = l'inscrit doit cliquer un lien reçu par mail
     avant de se connecter (recommandé en production, évite les comptes
     jetables) ; OFF = connexion immédiate (pratique pour tes premiers tests).
   - *Site URL* (Authentication → URL Configuration) : mets l'URL de ton
     site (étape 3) pour que les liens de confirmation redirigent au bon
     endroit.

## 1 bis. Connexion Google et Apple (15-30 min)

Les boutons « Continuer avec Google / Apple » de l'écran compte marchent dès
que le fournisseur est activé côté Supabase (Authentication → Providers).

**Google — gratuit.**
1. console.cloud.google.com → crée un projet → « APIs & Services →
   OAuth consent screen » (External, nom TANK, ton email).
2. « Credentials → Create credentials → OAuth client ID », type Web.
   Dans *Authorized redirect URIs*, colle l'URL de callback affichée par
   Supabase sur la page du provider Google
   (`https://<ton-projet>.supabase.co/auth/v1/callback`).
3. Copie Client ID et Client Secret dans Supabase → provider Google → Enable.

**Apple — exige l'Apple Developer Program (99 $/an).** Sans ce compte payant,
le bouton Apple renverra une erreur : c'est une contrainte d'Apple, pas du
site. Si tu ne veux pas payer tout de suite, lance avec Google seul — le
bouton Apple peut rester, il affichera « indisponible » proprement.
1. developer.apple.com → Identifiers → crée un App ID puis un **Services ID**
   (c'est lui le client), coche « Sign in with Apple », renseigne le domaine
   du site et l'URL de callback Supabase ci-dessus.
2. Keys → crée une clé « Sign in with Apple », télécharge le fichier .p8.
3. Dans Supabase → provider Apple : Services ID, Team ID, Key ID et le
   contenu du .p8 → Enable.

**Dans les deux cas** : Authentication → URL Configuration → ajoute l'URL
publique du site dans *Redirect URLs* (et garde-la en *Site URL*), sinon le
retour de connexion sera refusé.

Détail utile : le pseudo d'un compte Google/Apple est dérivé du nom du compte
(« Sacha Delamarre » → `Sacha_Delamarre`), et chacun peut le changer ensuite
dans Modifier le profil — l'unicité reste garantie par la base.

## 2. Brancher le site (2 min)

En tête de `app-v10.html`, deux constantes à remplir :

```js
const SUPABASE_URL='https://xxxx.supabase.co';   // Settings > API > Project URL
const SUPABASE_ANON_KEY='eyJ...';                // Settings > API > anon public
```

La clé **anon** est conçue pour être publiée côté client : elle ne donne
que les droits définis par les règles RLS du schéma (tout lire, n'écrire
que sous sa propre identité). La clé **service_role**, elle, ne doit
JAMAIS apparaître dans ce fichier ni dans aucun code envoyé au navigateur.

Sans ces deux valeurs, le site tourne en mode démo local : c'est voulu,
rien ne casse.

## 3. Héberger (10 min)

Deux fichiers : `app-v24.html` renommé en **index.html**, et **sw.js** à côté.
Le second rend le site ouvrable hors ligne une fois visité (indispensable en
salle de poker) ; sans lui, tout marche à l'identique mais en ligne seulement.

Installé sur l'écran d'accueil (menu du navigateur → « Ajouter à l'écran
d'accueil »), TANK se lance en plein écran avec son icône, comme une app —
manifest et icônes sont embarqués dans le fichier.

- **Netlify** : renomme `app-v10.html` en `index.html`, glisse-le sur
  app.netlify.com/drop. C'est en ligne.
- **Vercel** : même chose via vercel.com/new (projet "Other", pas de build).
- Domaine : ajoute ton domaine dans les réglages de l'hébergeur quand tu
  l'auras acheté. Vérifie la disponibilité du nom (INPI + registrar) avant.

## 4. Vérifier (5 min)

1. Ouvre le site → l'écran d'accueil propose « Créer mon compte ».
2. Inscris-toi avec un pseudo → (confirme l'email si activé) → connecte-toi.
3. Saisis et publie une main → elle doit apparaître dans **Supabase →
   Table Editor → hands**, avec ton `author_id`.
4. Ouvre le site en navigation privée : la main est visible sans compte,
   mais liker demande de se connecter. C'est la RLS qui travaille.

## Ce que cette v1 ne fait pas encore (à savoir, pas bloquant)

- **Validation serveur du déroulé.** Le moteur valide la main côté client,
  mais un client modifié pourrait insérer un `payload` incohérent. La
  parade propre est une Edge Function Supabase qui rejoue la main avant
  insertion — même moteur, même code. À faire avant d'ouvrir au public
  large, pas avant tes 50 premiers utilisateurs.
- **Rechargement en direct.** Les mains des autres apparaissent au
  chargement de la page, pas en temps réel. Supabase Realtime le permet en
  quelques lignes quand le besoin se fera sentir.
- **Modération.** Aucun outil de signalement ou de suppression par un
  admin. À prévoir avec les premiers inconnus sur le site.
- **Récupération de mot de passe.** Supabase le gère nativement
  (`resetPasswordForEmail`), l'écran n'est pas encore dans l'interface.
