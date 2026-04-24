// Widget registry & default seed data.
// Each widget has: id, type, title, focusable, data.
// The `type` maps to a component in /components/widgets.

export const DEFAULT_WIDGETS = [
  {
    id: "next-event",
    type: "next-event",
    title: "Prochain événement",
    focusable: true,
    data: {
      name: "Soirée Portes Ouvertes au campus",
      date: "2026-05-06T17:00:00",
      endDate: "2026-05-06T20:00:00",
      location: "Campus PST&B — Paris",
      description:
        "Rencontre l'équipe pédagogique, visite du campus et échanges avec les étudiants.",
      upcoming: [
        { name: "Afterwork Alumni", date: "2026-05-14T19:00:00" },
        { name: "Hackathon Tech x Business", date: "2026-05-22T09:00:00" },
        { name: "Conférence IA & Stratégie", date: "2026-06-03T18:30:00" },
      ],
    },
  },
  {
    id: "daily-poll",
    type: "poll",
    title: "Sondage du jour",
    focusable: true,
    data: {
      question: "Quelle techno vous fait le plus vibrer en 2026 ?",
      options: [
        { id: "ai", label: "IA générative", votes: 42 },
        { id: "data", label: "Data Science", votes: 31 },
        { id: "web3", label: "Web3", votes: 12 },
        { id: "cyber", label: "Cybersécurité", votes: 27 },
      ],
      history: [
        {
          question: "Meilleur langage backend ?",
          winner: "TypeScript",
          votes: 88,
        },
        { question: "IDE préféré ?", winner: "VS Code", votes: 104 },
        {
          question: "Stack front favorite ?",
          winner: "Next.js",
          votes: 76,
        },
      ],
    },
  },
  {
    id: "campus-clock",
    type: "clock",
    title: "Campus Time",
    focusable: true,
    data: { city: "Paris", timezone: "Europe/Paris" },
  },
  {
    id: "rss-feed",
    type: "rss",
    title: "Tech News",
    focusable: true,
    data: {
      source: "PST&B News",
      url: "https://www.pstb.fr",
      items: [
        {
          title: "Lancement du Mastère Data Science in Business",
          summary:
            "Double diplôme en partenariat avec la Formation Continue Panthéon-Sorbonne.",
          date: "2026-04-18",
        },
        {
          title: "Hackathon PST&B 2026 — inscriptions ouvertes",
          summary: "48h de code, de business et de pitch sur le campus.",
          date: "2026-04-10",
        },
        {
          title: "Nouveau partenariat entreprise",
          summary: "L'école signe avec un leader du conseil IT européen.",
          date: "2026-04-02",
        },
      ],
    },
  },
];

export const WIDGET_TYPES = [
  { type: "next-event", label: "Prochain événement" },
  { type: "poll", label: "Sondage" },
  { type: "clock", label: "Horloge" },
  { type: "rss", label: "Flux news" },
];
