# Projet PST&B Dashboard

## Règles de travail

- **Toujours préférer `Edit` à `Write`** : ne jamais réécrire un fichier entier si une modification ciblée suffit. Utiliser `Edit` avec `old_string` / `new_string` précis.
- `Write` uniquement pour créer un nouveau fichier ou refactor total justifié (et rare).
- Lire le fichier avant d'éditer si son état exact n'est pas connu.

## Stack Technique
- Framework: Next.js 16+ (App Router, Turbopack)
- UI: React 19, Framer Motion (animations blur/opacity), TailwindCSS v4
- Icônes: Lucide React
- État global: React Context API
- Persistance: Fichier local `data/db.json` accédé via `/api/dashboard` (CRUD via requêtes HTTP).

## Architecture UI (fullscreen TV)

Le dashboard est conçu pour des écrans TV campus — dark mode premium, typographie grande distance.

### Modes de vue (settings.viewMode)
- `"scene"` : Affichage classique. Le widget actif remplit l'écran `absolute inset-0`. Le logo PST&B est en bas à gauche, l'horloge en bas à droite.
- `"orbit"` : Affichage Dashboard. Un grand widget central et 4 satellites miniatures. Les composants de branding (Logo, Horloge) se déplacent en haut via CSS transition.
- Le toggle se fait dans `/admin` et est persisté dans `db.json`.

### Composants Persistants
- **Logo PST&B** et **PersistentClock** gérés par `Dashboard.jsx`.
- **Progress bar** : Ligne 2px dynamique gérée par `framer-motion` animée selon le temps restant.
- **Aucun chrome** : Pas de boutons "fermer" ou de menu sur les widgets en mode focus.

### Auto-rotation & Temps intelligents
- Configurable via `/admin` (Intervalle par défaut, Auto-Rotate on/off).
- Chaque widget a désormais un **temps d'affichage intelligent basé sur les Best Practices Digital Signage** :
  - Passif court (Citations) : 6s
  - Passif long (Images, News) : 10s
  - Actif (Poll) : 18s
  - Jeu interactif (Wordle) : 22s
- Le temps peut être surchargé (override) individuellement dans le panel admin.
- L'animation de la `progress bar` s'adapte automatiquement à ce temps.

## Admin Panel (Cockpit)
- UI "Cockpit" 2 colonnes : sidebar séquence (drag & drop via dnd-kit) + panneau détail.
- **Modale d'ajout** : 4 catégories (Événementiel, Contenu & Tech, Interactivité, Live Data).
- Toggle power par widget, override temps d'affichage, suppression avec confirmation.
- **Presets** : séquences prédéfinies (début de semaine, fin de semaine, vierge).
- **Orbit config** : assignation des satellites en mode Orbite.
- **Analytics** : vue statistiques (clics, rotations, votes…).
- Logout avec session cookie (`/admin/login` + `/api/auth`).

## Widgets Remarquables
- **WordleWidget** : Jeu multijoueur. L'état est stocké dans `db.json` via `/api/wordle/guess`. Mode pause glassmorphism en cas de victoire. Page mobile `/jeu`.
- **SpoWidget** : Rendu natif "Soirée Portes Ouvertes". Gradient PST&B + image hero uploadée. Logo 8rem en fullscreen.
- **TransportWidget** : Info trafic RATP live (`/api/transport` → proxy data.ratp.fr). Panel droit perturbations avec badges colorés par ligne, scroll infini.
- **NextEventWidget** : Mode `single` (compte à rebours + horaires) et mode `list` (liste libre avec range de dates visible dans le widget).
- **HubWidget** : Hub PST&B unifié avec liens vers tous les services internes.
- **CryptoWidget** : Cours crypto en temps réel via `/api/crypto`.
- **GithubTrendingWidget** : Repos GitHub du jour via `/api/github-trending`.
- **JobsWidget** : Offres d'emploi via `/api/jobs`. Page mobile `/etudiants`.
- **PollWidget** : Sondages interactifs persistants. Vote mobile via `/vote`.
- **ShowcaseWidget** : Variantes visuelles (Webcam RGPD, Newsletters internes).
- **GalleryWidget** : Slideshow de photos local.
- **WeatherWidget** : Météo live.
- **CountdownWidget** : Compte à rebours paramétrable.
- **BusinessCardWidget** : Stat ou KPI marquant.
- **QuoteWidget**, **WordWidget**, **PuzzleWidget**, **SocialWidget**, **StudentWidget** : contenus passifs campus.

## API Routes & Infrastructure
- `/api/auth/login` + `/api/auth/logout` : session cookie HttpOnly.
- `/api/stream` : SSE (Server-Sent Events) pour updates temps réel du dashboard.
- `/api/transport`, `/api/crypto`, `/api/github-trending`, `/api/jobs` : proxies live data.
- `/api/wordle/guess`, `/api/poll`, `/api/submit` : persistence état jeux/votes.
- `src/lib/db.js` : abstraction lecture/écriture `data/db.json`.
- `src/lib/widgets.js` : defaults centralisés + temps d'affichage signage par type.

## Pages Spéciales
- `/etudiants` : portail BDE (JobsWidget mobile-friendly).
- `/jeu` : Wordle mobile (saisie via smartphone depuis la salle).
- `/vote` : Interface de vote mobile pour les sondages.

## Composants Utilitaires
- **BreakingNews** : bandeau défilant d'alerte.
- **LiveTicker** : ticker de news en bas d'écran.
- **FileToDataUrlInput** : upload d'image local → base64 pour le SPO/Gallery.

## Objectifs
- Affichage dynamique campus PST&B (Paris School of Technology & Business)
- Interface premium dark mode, lisible à 3m, police Inter
- Admin `/admin` pour éditer live les widgets et paramètres globaux.
