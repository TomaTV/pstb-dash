# OrbitDash — PST&B

Tableau de bord dynamique pour les écrans du campus de la **Paris School of Technology & Business**.

Grille de widgets interactifs autour d'une **Focus Zone** centrale qui accueille, via une animation `layoutId` Framer Motion, le widget cliqué.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **Tailwind CSS v4** (`@theme inline` + tokens PST&B)
- **Framer Motion** (transitions grille → focus → fullscreen)
- **Lucide React** (icônes)
- État global via **Context API** (`DashboardContext`)
- Persistance via `localStorage` (remplaçable par Supabase / Firebase / JSON-Server)

## Scripts

```bash
npm run dev      # dev server
npm run build    # production build
npm run start    # start prod server
```

## Architecture

```
src/
├─ app/
│  ├─ layout.js             # Root layout + <DashboardProvider>
│  ├─ page.js               # Route "/" → <Dashboard />
│  ├─ admin/page.js         # Route "/admin" → <AdminPanel />
│  └─ globals.css           # Tailwind v4 + tokens PST&B + glassmorphism
│
├─ context/
│  └─ DashboardContext.jsx  # widgets, focusedId, fullscreenId, CRUD + swap
│
├─ lib/
│  └─ widgets.js            # registre + données seed des widgets
│
└─ components/
   ├─ Dashboard.jsx         # grille CSS + Focus Zone + fullscreen overlay
   ├─ AdminPanel.jsx        # édition live des widgets
   ├─ WidgetWrapper.jsx     # composant générique (mode: grid | focus | fullscreen)
   ├─ ui/                   # Button, Card, Input, Textarea
   └─ widgets/
      ├─ NextEventWidget.jsx
      ├─ PollWidget.jsx
      ├─ ClockWidget.jsx
      ├─ RssWidget.jsx
      └─ index.js           # registre { type → Component }
```

### Contrat d'un widget

```js
{
  id: string,                 // identifiant unique
  type: "next-event"|"poll"|"clock"|"rss",
  title: string,
  focusable: boolean,         // éligible à la Focus Zone ?
  data: { ... }               // payload édité côté /admin
}
```

Chaque composant widget accepte `{ widget, mode }` avec `mode ∈ {"grid","focus","fullscreen"}` et doit savoir se rendre dans les trois formats.

### Flux de données

```
/admin (édition)  ──▶  DashboardContext  ──▶  localStorage
                             │
                             └────▶  Dashboard + widgets (live re-render)
```

## Identité visuelle

| Token            | Valeur    | Usage                       |
|------------------|-----------|-----------------------------|
| `pstb-navy`      | `#002349` | Business / profondeur       |
| `pstb-navy-deep` | `#001529` | Fond dégradé haut           |
| `pstb-navy-black`| `#000814` | Fond dégradé bas            |
| `pstb-cyan`      | `#00e5ff` | Tech / accents / hover      |
| `pstb-violet`    | `#6a2bff` | Dégradés accent             |
| `pstb-magenta`   | `#ff2d87` | Actions destructives / CTA  |

Typo generous (`text-2xl`+), espacements larges : le dashboard se regarde **à 3 mètres**, pas à 30 cm.

## Roadmap

- [ ] Mode **Admin Layout** (drag & swap — `swapWidgets` déjà exposé dans le context)
- [ ] **Theme Engine** (dark/light + densité compact/spaced)
- [ ] **Real-time** via Supabase Realtime
- [ ] **Widget Factory** (ajout dynamique via l'UI)
- [ ] Backend persistant (remplacer localStorage)

## Équipe

- _À compléter_ — nom/prénom + pseudo GitHub + contributions.
