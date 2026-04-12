# Veille technologique automatisee (React + Firebase)

## 1) Architecture finale
- Frontend React: [src/components/Veille.jsx](../src/components/Veille.jsx)
- Backend Firebase Functions: [functions/src/index.js](../functions/src/index.js)
- Stockage sans DB: JSON dans Firebase Storage
  - `veille/latest.json`
  - `veille/history.json`
  - `veille/email-meta.json`

## 2) Fonctions backend
- `getVeille` (HTTP): sert la veille au frontend (`/api/veille`)
- `refreshVeilleDigest` (cron): regenerer la veille toutes les 6h
- `sendVeilleDigestEmail` (cron): envoi email quotidien, skip si digest identique

## 2.1) Separation latest / history
- `latest.json` contient uniquement la veille la plus recente.
- `history.json` contient uniquement les anciennes veilles.
- Lors d une nouvelle generation:
  - l ancien `latest` est pousse dans `history`,
  - les doublons sont filtres,
  - l historique est limite a `HISTORY_LIMIT` (20).

## 3) Securite des cles (obligatoire)
Aucune cle sensible dans le code.

Secrets utilises:
- `GEMINI_API_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_TO`
- `EMAIL_FROM`

Configuration:

```bash
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set SMTP_HOST
firebase functions:secrets:set SMTP_PORT
firebase functions:secrets:set SMTP_USER
firebase functions:secrets:set SMTP_PASS
firebase functions:secrets:set EMAIL_TO
firebase functions:secrets:set EMAIL_FROM
```

Notes:
- Ne jamais mettre ces valeurs dans GitHub.
- `.env` est ignore par git (voir `.gitignore`).
- Si une cle a ete exposee dans le passe, la regenerer avant production.

## 4) Installation

```bash
cd functions
npm install
cd ..
```

## 5) Deploiement

```bash
npm run build
firebase deploy --only functions,hosting
```

## 6) Endpoint frontend
- URL par defaut: `/api/veille`
- Override possible en local via `.env`:

```bash
VITE_VEILLE_API_URL=/api/veille
```

Requetes utiles:
- Veille actuelle uniquement (rapide): `GET /api/veille`
- Veille + historique (a la demande): `GET /api/veille?includeHistory=1`
- Forcer une regeneration immediate: `GET /api/veille?refresh=1`

## 6.1) Structure JSON

`latest.json`:

```json
{
  "date": "2026-04-12T20:15:00.000Z",
  "summary": {
    "overview": "Resume global...",
    "keyTrends": ["...", "..."],
    "watchPoints": ["..."]
  },
  "articles": [
    {
      "id": "abc123",
      "rank": 1,
      "title": "Titre article",
      "source": "TechCrunch",
      "link": "https://...",
      "date": "2026-04-12T18:00:00.000Z",
      "dateLabel": "12 avr. 2026",
      "summary": "Resume court...",
      "impact": "Impact...",
      "confidence": "moyenne"
    }
  ],
  "meta": {
    "generatedAtMs": 1776024900000,
    "sourceSignature": "hash...",
    "itemCount": 5,
    "stats": {
      "fetchedTotal": 80,
      "afterDedupe": 35,
      "removedDuplicates": 45,
      "selected": 5
    }
  }
}
```

`history.json`:

```json
[
  {
    "date": "2026-04-11T20:15:00.000Z",
    "summary": {
      "overview": "Resume global...",
      "keyTrends": ["..."],
      "watchPoints": ["..."]
    },
    "articles": [/* meme structure que latest */],
    "meta": {
      "generatedAtMs": 1775938500000,
      "sourceSignature": "hash...",
      "itemCount": 5
    }
  }
]
```

## 7) Personnalisation rapide
- Frequence refresh: `REFRESH_EVERY_HOURS` dans `functions/src/index.js`
- Horaire email: `EMAIL_SCHEDULE` dans `functions/src/index.js`
- Sources RSS: `RSS_FEEDS`
- Nombre max d articles: `MAX_ITEMS`

## 8) Bonnes pratiques SMTP
- Gmail: utiliser un mot de passe application, jamais le mot de passe principal.
- Garder un seul destinataire (ton adresse) pour eviter la logique utilisateur.
- Le backend saute l envoi si le contenu du digest n a pas change.
