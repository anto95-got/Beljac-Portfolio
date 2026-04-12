# Audit technique - Veille React + Firebase

## Contexte
Audit realise le 12 avril 2026 sur l architecture veille du portfolio.

## Points forts
- Separation frontend/backend deja en place (`/api/veille`).
- Aucune base de donnees necessaire: stockage JSON simple et lisible.
- Fonctions planifiees pour refresh et email.
- IA executee cote serveur (pas cote navigateur).

## Faiblesses identifiees (avant durcissement)
- Risque de doublons RSS (meme news via liens differents/tracking).
- Resume IA parfois heterogene (pas de schema strict structure).
- Cout potentiel inutile si regeneration frequente sans changement de sources.
- Email potentiellement repetitif meme contenu.
- API publique sans cache HTTP explicite.

## Ameliorations integrees
- Separation stricte des fichiers:
  - `latest.json` = veille courante uniquement
  - `history.json` = anciennes veilles uniquement
  - rotation automatique de l ancien latest vers history.
- Deduplication avancee:
  - normalisation URL (suppression `utm_*`, `gclid`, `fbclid`, etc.)
  - fingerprint titre pour eviter les doublons semantiques.
- Ranking pertinence + recence:
  - score par mots-cles IA/robotique
  - score par recence
  - score par source
  - top 5 final.
- Resume IA structure:
  - `overview`
  - `keyTrends[]`
  - `watchPoints[]`
  - `summary/impact/confidence` par article.
- Optimisation cout/perf:
  - cache memoire function
  - cache HTTP + ETag
  - skip regeneration si source signature identique.
  - chargement historique optionnel (`includeHistory=1`) pour eviter les lectures inutiles.
- Fiabilite:
  - fallback automatique sur dernier digest si RSS en erreur
  - fallback resume si IA indisponible.
- Email:
  - template HTML propre
  - skip envoi si digest identique (anti-spam)
  - contenu facilement modifiable via `buildEmailTemplate`.

## Securite
- Secrets uniquement via Firebase Secrets Manager.
- Aucune cle API/SMTP dans le code.
- .env ignore par git.

## Impact BTS SIO
- Architecture claire et justifiable en soutenance.
- Demonstration des notions:
  - securite des secrets,
  - automatisation backend,
  - gestion d erreurs,
  - optimisation des couts cloud,
  - separation front/back propre.
