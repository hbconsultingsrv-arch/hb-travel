# HB Travel — Site vitrine voyages halal

Site vitrine avec **espace client** : inscription, connexion, profil et suivi des demandes.

## Pages

| Fichier | Description |
|---------|-------------|
| `index.html` | Site vitrine + formulaire de devis |
| `login.html` | Connexion |
| `register.html` | Inscription |
| `compte.html` | Espace client (profil + demandes) |
| `admin.html` | Dashboard admin (séjours + demandes) |

## Backend (Supabase)

Le site reste hébergé sur **GitHub Pages** (gratuit). Les données passent par **Supabase** (gratuit) :

- Authentification e-mail / mot de passe
- Profil : nom, e-mail, téléphone, adresse
- Demandes de voyage avec statut

**Configuration obligatoire** → voir **[SETUP.md](SETUP.md)**

## Lancer en local

```bash
python -m http.server 8080
```

Puis ouvrez http://localhost:8080

## Structure

```
hb-travel/
├── index.html
├── login.html
├── register.html
├── compte.html
├── css/style.css
├── js/
│   ├── config.js          ← clés Supabase
│   ├── auth.js
│   ├── dashboard.js
│   └── main.js
└── supabase/schema.sql    ← script base de données
```
