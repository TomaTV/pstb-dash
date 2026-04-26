# PST&B Hub — Campus Dashboard

![PST&B Dashboard](./public/banner.svg)

Tableau de bord TV interactif et dynamique pour le campus de la **Paris School of Technology & Business**.

## Stack Technique

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **Tailwind CSS v4** (`@theme inline` + tokens PST&B)
- **Framer Motion** (transitions blur/opacity fluides)
- **Lucide React** (icônes vectorielles)
- État global via **Context API** (`DashboardContext`)
- Persistance serveur locale via `data/db.json` (API route `/api/dashboard`)

## Scripts

```bash
npm run dev      # Serveur de développement (http://localhost:3000)
npm run build    # Build production
npm run start    # Démarrage production
```

## Architecture des Vues

Le Dashboard propose deux modes de rendu dynamique (configurables dans l'Admin) :

### 1. Mode SCÈNE (Plein écran)
- Affichage 100% fullscreen (edge-to-edge).
- **Logo PST&B** ancré en bas à gauche.
- **Horloge** ancrée en bas à droite.
- Transitions de fondu fluides entre chaque widget.

### 2. Mode ORBITE (Dashboard)
- Layout futuriste avec 1 widget central actif (énorme) et 4 slots "satellites" autour.
- Le widget tourne parmi les 4 satellites.
- **Logo PST&B** se déplace automatiquement en haut à gauche (et réduit sa taille).
- **Horloge** se déplace automatiquement en haut à droite.
- Gradients de lumière colorée en fond (`ring-violet`, `shadow-[0_0_80px...]`).

## Gestion du temps d'affichage

Le Dashboard intègre un algorithme de rotation asynchrone basé sur les **Best Practices du Digital Signage** :
- Contenus passifs courts (Citations, Mots) : **6s**
- Contenus passifs denses (Affiches, News) : **10s**
- Contenus interactifs (Sondages QR) : **18s**
- Mini-jeux interactifs (Wordle QR) : **22s**
- Une option d'Override par widget est disponible dans l'admin.

## Admin Panel — Cockpit

Interface de gestion complète accessible sur `/admin` (authentification par session cookie) :

- **Séquence drag & drop** : réordonner les widgets en glissé-déposé (dnd-kit).
- **Modale d'ajout** catégorisée : Événementiel, Contenu & Tech, Interactivité, Live Data.
- Toggle power, override du temps d'affichage, suppression avec confirmation par widget.
- **Presets** : séquences prédéfinies (début/fin de semaine, vierge).
- Configuration des satellites en mode Orbite.
- Vue Analytics et déconnexion.

## Widgets

### Événementiel & Campus
| Widget | Description |
|---|---|
| `next-event` | Prochain événement — compte à rebours ou liste libre avec range de dates |
| `spo` | Soirée Portes Ouvertes — gradient PST&B + image hero, logo 8rem |
| `gallery` | Diaporama photo local |
| `clock` | Horloge monumentale immersive |
| `transport` | Info trafic RATP live — lignes RER/Métro/Tram, panel perturbations |
| `student` | BDE — contenus et infos étudiantes |

### Contenu & Tech
| Widget | Description |
|---|---|
| `word` | Mot du jour (vocabulaire tech/business) |
| `business` | Stat ou KPI marquant |
| `quote` | Citation |
| `rss` | Flux d'actualités école ou tech |
| `weather` | Météo live |
| `social` | Post social |
| `jobs` | Offres d'emploi live |

### Interactivité & Médias
| Widget | Description |
|---|---|
| `poll` | Sondages interactifs temps réel (vote via `/vote`) |
| `puzzle` | Énigme du jour |
| `wordle` | Jeu Wordle multijoueur persistant (saisie via `/jeu`) |
| `showcase` | Visuels premium (Webcam RGPD, Newsletters) |
| `iframe` | Document PDF ou page web externe |

### Live Data & Hub
| Widget | Description |
|---|---|
| `hub` | Hub PST&B — liens vers tous les services internes |
| `countdown` | Compte à rebours paramétrable |
| `crypto` | Cours crypto en temps réel |
| `github-trending` | Repos GitHub tendance du jour |

## API Routes

| Route | Description |
|---|---|
| `/api/auth/login` `/api/auth/logout` | Session cookie HttpOnly |
| `/api/dashboard` | CRUD `data/db.json` |
| `/api/stream` | SSE — updates temps réel du dashboard |
| `/api/transport` | Proxy data.ratp.fr (perturbations live) |
| `/api/crypto` | Cours crypto live |
| `/api/github-trending` | GitHub trending scraper |
| `/api/jobs` | Offres d'emploi live |
| `/api/wordle/guess` | Persistence état Wordle |
| `/api/poll` | Votes sondages |
| `/api/submit` | Soumissions formulaires |

## Pages Spéciales

- `/etudiants` : portail BDE (JobsWidget mobile-friendly).
- `/jeu` : interface Wordle mobile — les étudiants saisissent leurs lettres depuis leur téléphone.
- `/vote` : interface de vote mobile pour les sondages affichés sur TV.

## Identité Visuelle PST&B

- Dark mode premium profond (`bg-bg`: `#0a0a0a` / `#050505`).
- Accents Violet (`#651FFF`), Rouge (`#FF1744`), et Emerald pour les validations.
- Typographie **Inter** structurée pour être lisible à plus de 3 mètres de distance.
- Glassmorphism subtil (fonds `white/[0.015]`, blur) pour donner de la profondeur sans surcharger.