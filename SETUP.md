# Configuration Supabase — HB Travel

Le site utilise **Supabase** (gratuit) comme backend : authentification, profils utilisateurs et demandes de voyage. Aucun serveur à héberger.

## 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com) et créez un compte gratuit
2. **New project** → nom : `hb-travel`
3. Choisissez un mot de passe base de données (notez-le)
4. Attendez la création (~2 min)

## 2. Créer les tables

1. Dans Supabase → **SQL Editor** → **New query**
2. Copiez-collez le contenu de `supabase/schema.sql`
3. Cliquez **Run**

## 3. Récupérer les clés API

1. **Project Settings** → **API**
2. Copiez :
   - **Project URL** (ex. `https://abcdefgh.supabase.co`)
   - **anon public** key (clé publique)

## 4. Configurer le site

Ouvrez `js/config.js` et remplacez :

```javascript
window.HB_CONFIG = {
  supabaseUrl: 'https://VOTRE-PROJET.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

## 5. Activer l'inscription par e-mail

1. **Authentication** → **Providers** → **Email** → activé
2. **Authentication** → **URL Configuration** :
   - **Site URL** : `https://hbconsultingsrv-arch.github.io/hb-travel/`
   - **Redirect URLs** : ajoutez la même URL

> Pour les tests en local, ajoutez aussi `http://localhost:8080`

## 6. Désactiver la confirmation e-mail (optionnel, pour tester)

**Authentication** → **Providers** → **Email** → désactivez **Confirm email** temporairement.

En production, laissez-la activée.

## Fonctionnalités

| Page | Rôle |
|------|------|
| `register.html` | Créer un compte |
| `login.html` | Se connecter |
| `compte.html` | Profil + historique des demandes |
| Formulaire contact | Enregistre une demande si connecté |

## Mettre en ligne

```bash
git add .
git commit -m "Ajout espace client avec Supabase"
git push
```

## Coût

- **Supabase Free** : 50 000 utilisateurs/mois, suffisant pour démarrer
- **GitHub Pages** : gratuit (frontend)
