# PST&B Hub — Campus Dashboard

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

## Types de Widgets
- `wordle` : Jeu multijoueur interactif persistant avec affichage sur TV et saisie via QR code mobile.
- `spo` : Affiche "Soirée Portes Ouvertes" en haute définition recréant nativement un template Canva.
- `word` : Vocabulaire tech/business aléatoire (SaaS, KPI, etc).
- `gallery` : Diaporama photo avec intervalles configurables.
- `poll` : Sondages interactifs en temps réel avec URL et QR code uniques.
- `clock` : Horloge monumentale pour focus immersif.
- `rss` : Flux d'actualités école ou tech.
- `showcase` : Visuels premium pour newsletters, astuces, CV.
- `iframe` : Affichage de documents (PDF) ou pages web externes.

## Identité Visuelle PST&B

- Dark mode premium profond (`bg-bg`: `#0a0a0a` / `#050505`).
- Accents Violet (`#651FFF`), Rouge (`#FF1744`), et Emerald pour les validations.
- Typographie **Inter** structurée pour être lisible à plus de 3 mètres de distance.
- Glassmorphism subtil (fonds `white/[0.015]`, blur) pour donner de la profondeur sans surcharger.