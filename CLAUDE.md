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

## Widgets Remarquables
- **WordleWidget** : Jeu multijoueur. L'état est stocké dans `db.json` via `/api/wordle/guess`. Comporte un mode pause avec glassmorphism lors de la victoire.
- **SpoWidget** : Composant de rendu natif du template Canva "Soirée Portes Ouvertes", superposant le QR code sur l'image uploadee.
- **ShowcaseWidget** : Variantes visuelles (Webcam RGPD, Newsletters internes).
- **GalleryWidget** : Slideshow de photos local.

## Objectifs
- Affichage dynamique campus PST&B (Paris School of Technology & Business)
- Interface premium dark mode, lisible à 3m, police Inter
- Admin `/admin` pour éditer live les widgets et paramètres globaux.
