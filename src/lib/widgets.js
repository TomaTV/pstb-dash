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
  {
    id: "showcase-webcam",
    type: "showcase",
    title: "Astuce RGPD",
    focusable: true,
    data: { variant: "webcam" }
  },
  {
    id: "showcase-newsletter-opus",
    type: "showcase",
    title: "Newsletter IA",
    focusable: true,
    data: {
      variant: "newsletter-opus",
      cadence: "HEBDOMADAIRE",
      weekLabel: "Semaine 16",
      dateLabel: "20-24 AVRIL",
      headline: "OPUS 4.7 REDÉFINIT LES STANDARDS DE L'IA",
      hero: {
        title: "OPUS 4.7 : LE SAUT QUI CHANGE LA DONNE",
        image: "",
        imageLabel: "Claude Opus 4.7",
        body: "Anthropic a officiellement lancé <strong>Claude Opus 4.7</strong> le 16 avril 2026, avec de <strong>vrais gains</strong> sur le code, le <strong>raisonnement</strong> long et les tâches <strong>agentiques complexes</strong>.",
      },
      side: [
        {
          title: "OpenAI lève 122 milliards pour accélérer",
          image: "",
          body: "OpenAI a <strong>annoncé</strong> une levée de <strong>122 milliards</strong> de dollars pour soutenir la <strong>montée en puissance de ses modèles</strong>.",
        },
        {
          title: "IBM et ARM misent sur l'infra IA de demain",
          image: "",
          body: "<strong>Développer</strong> une nouvelle architecture matérielle pensée pour les <strong>charges de travail IA</strong> et <strong>data intensives</strong>.",
        },
      ],
      sources: "Anthropic, OpenAI, IBM Newsroom",
      contact: "dpo@pstb.fr",
      nextEdition: "Semaine 17",
    },
  },
  {
    id: "quote-of-the-day",
    type: "quote",
    title: "Quote du jour",
    focusable: true,
    data: {
      text: "Le futur appartient à ceux qui savent collaborer avec les machines, pas à ceux qui les craignent.",
      author: "Yann LeCun",
      role: "Chief AI Scientist · Meta",
    },
  },
  {
    id: "showcase-newsletter-interne",
    type: "showcase",
    title: "Newsletter Interne",
    focusable: true,
    data: {
      variant: "newsletter-interne",
      edition: "Avril 2026",
      headline: "Édition mensuelle",
      subtitle: "Retrouvez les actualités, événements et publications du mois.",
      imageUrl: "",
    }
  },
];

export const PRESETS = {
  "debut-semaine": {
    label: "🌅 Début de semaine",
    widgets: [
      { id: `w-weather-${Date.now()}`, type: "weather", title: "Météo de la semaine", focusable: true, data: { city: "Paris", lat: 48.8566, lon: 2.3522 } },
      { id: `w-transport-${Date.now()}`, type: "transport", title: "Info Trafic", focusable: true, data: { lines: ["1", "9", "A", "B"] } },
      { id: `w-jobs-${Date.now()}`, type: "jobs", title: "Offres d'alternance", focusable: true, data: { fetchCount: 20 } },
      { id: `w-word-${Date.now()}`, type: "word", title: "Mot du jour", focusable: true, data: { word: "Productivité", pronunciation: "pro-duc-ti-vi-té", category: "Mindset", definition: "Rapport entre les résultats obtenus et les ressources utilisées pour les obtenir.", example: "Ce nouvel outil a doublé notre productivité." } },
      { id: `w-student-${Date.now()}`, type: "student", title: "Appel à l'action BDE", focusable: true, status: "approved", data: { title: "", description: "", qrUrl: "", submitter: "" } },
    ],
    settings: { viewMode: "scene", orbitSlots: { satellites: [[], [], [], []] } }
  },
  "fin-semaine": {
    label: "🎉 Fin de semaine",
    widgets: [
      { id: `w-wordle-${Date.now()}`, type: "wordle", title: "Wordle PST&B", focusable: true, data: { pauseMode: false, globalTimeLimit: 15 } },
      { id: `w-gallery-${Date.now()}`, type: "gallery", title: "Souvenirs du Campus", focusable: true, data: { title: "Dernière Soirée BDE", interval: 5, images: [] } },
      { id: `w-poll-${Date.now()}`, type: "poll", title: "Sondage Flash", focusable: true, data: { question: "Quel est votre programme pour ce week-end ?", options: [{ id: "1", label: "Réviser", votes: 0 }, { id: "2", label: "Faire la fête", votes: 0 }, { id: "3", label: "Dormir", votes: 0 }] } },
      { id: `w-student-${Date.now()}`, type: "student", title: "Appel à l'action BDE", focusable: true, status: "approved", data: { title: "", description: "", qrUrl: "", submitter: "" } },
    ],
    settings: { viewMode: "scene", orbitSlots: { satellites: [[], [], [], []] } }
  },
  "monitoring-reseau": {
    label: "🛜 Monitoring réseau",
    widgets: [
      { id: `w-network-${Date.now()}`, type: "network-status", title: "État réseau campus", focusable: true, data: {} },
      { id: `w-transport-${Date.now()}`, type: "transport", title: "Info Trafic", focusable: true, data: { campus: "PST&B · Paris 11e" } },
    ],
    settings: { viewMode: "scene", orbitSlots: { satellites: [[], [], [], []] } }
  },
  "auto-campus-live": {
    label: "🏫 Campus auto live",
    widgets: [
      { id: `w-hub-${Date.now()}`, type: "hub", title: "Hub PST&B", focusable: true, data: { campus: "Campus Paris", lat: 48.8566, lon: 2.3522 } },
      { id: `w-weather-${Date.now()}`, type: "weather", title: "Météo de la semaine", focusable: true, data: { city: "Paris", lat: 48.8566, lon: 2.3522 } },
      { id: `w-transport-${Date.now()}`, type: "transport", title: "Info Trafic", focusable: true, data: { campus: "PST&B · Paris 11e" } },
      { id: `w-jobs-${Date.now()}`, type: "jobs", title: "Offres d'alternance", focusable: true, data: { fetchCount: 20 } },
      { id: `w-network-${Date.now()}`, type: "network-status", title: "État réseau campus", focusable: true, data: {} },
    ],
    settings: { viewMode: "scene", orbitSlots: { satellites: [[], [], [], []] } }
  },
  "salles-libres": {
    label: "🗺️ Salles libres campus",
    widgets: [
      { id: `w-campus-map-${Date.now()}`, type: "campus-map", title: "Salles libres", focusable: true, data: {} },
      { id: `w-hub-${Date.now()}`, type: "hub", title: "Hub PST&B", focusable: true, data: { campus: "Campus Paris", lat: 48.8566, lon: 2.3522 } },
      { id: `w-transport-${Date.now()}`, type: "transport", title: "Info Trafic", focusable: true, data: { campus: "PST&B · Paris 11e" } },
      { id: `w-weather-${Date.now()}`, type: "weather", title: "Météo", focusable: true, data: { city: "Paris", lat: 48.8566, lon: 2.3522 } },
      { id: `w-word-${Date.now()}`, type: "word", title: "Mot du jour", focusable: true, data: { word: "", pronunciation: "", category: "", definition: "", example: "" } },
    ],
    settings: { viewMode: "scene", orbitSlots: { satellites: [[], [], [], []] } }
  },
  "spo-live": {
    label: "📢 Live SPO (Vidéo)",
    widgets: [
      { id: `w-spo-v-${Date.now()}`, type: "spo-video", title: "Live SPO", focusable: true, data: { title: "DÉCOUVRE TON FUTUR CAMPUS", date: new Date(Date.now() + 86400000 * 7).toISOString(), location: "Campus PST&B · Paris", cta: "S'inscrire", videoUrl: "", qrUrl: "https://www.pstb.fr/demande-rdv" } },
      { id: `w-hub-${Date.now()}`, type: "hub", title: "Hub PST&B", focusable: true, data: { campus: "Campus Paris" } },
      { id: `w-gallery-${Date.now()}`, type: "gallery", title: "Le Campus en images", focusable: true, data: { title: "Vie Étudiante", interval: 4, images: [] } },
      { id: `w-transport-${Date.now()}`, type: "transport", title: "Info Trafic", focusable: true, data: { campus: "PST&B · Paris 11e" } },
    ],
    settings: { viewMode: "scene", orbitSlots: { satellites: [[], [], [], []] } }
  },
  "bde-matin": {

    label: "☀️ Matin BDE",
    widgets: [
      { id: `w-hub-${Date.now()}`, type: "hub", title: "Hub PST&B", focusable: true, data: { campus: "Campus Paris", lat: 48.8566, lon: 2.3522 } },
      { id: `w-student-${Date.now()}`, type: "student", title: "Vie associative BDE", focusable: true, status: "approved", data: { title: "", description: "", qrUrl: "", submitter: "" } },
      { id: `w-poll-${Date.now()}`, type: "poll", title: "Sondage du jour", focusable: true, data: { question: "Comment tu vas ce matin ?", options: [{ id: "1", label: "Top forme", votes: 0 }, { id: "2", label: "Moyen", votes: 0 }, { id: "3", label: "Besoin de café", votes: 0 }] } },
      { id: `w-word-${Date.now()}`, type: "word", title: "Mot du jour", focusable: true, data: { word: "", pronunciation: "", category: "", definition: "", example: "" } },
      { id: `w-transport-${Date.now()}`, type: "transport", title: "Info Trafic", focusable: true, data: { campus: "PST&B · Paris 11e" } },
    ],
    settings: { viewMode: "scene", orbitSlots: { satellites: [[], [], [], []] } }
  },
  "default": {
    label: "⚙️ Séquence par défaut",
    widgets: DEFAULT_WIDGETS,
    settings: { viewMode: "scene", orbitSlots: { satellites: [[], [], [], []] } }
  }
};

export const WIDGET_TYPES = [
  { type: "next-event", label: "Prochain événement" },
  { type: "spo", label: "Soirée portes ouvertes" },
  { type: "poll", label: "Sondage" },
  { type: "puzzle", label: "Énigme / Code du jour" },
  { type: "business", label: "Stat marquante" },
  { type: "weather", label: "Météo" },
  { type: "social", label: "Post réseau social" },
  { type: "gallery", label: "Galerie photos" },
  { type: "clock", label: "Horloge" },
  { type: "rss", label: "Flux news" },
  { type: "showcase", label: "Visuels (Newsletter / RGPD)" },
  { type: "quote", label: "Citation" },
  { type: "word", label: "Mot du jour (Lexique)" },
  { type: "wordle", label: "Jeu Wordle" },
  { type: "iframe", label: "Document PDF / Image / Web" },
  { type: "transport", label: "Info trafic (RATP)" },
  { type: "jobs", label: "Offres alternance" },
  { type: "student", label: "BDE / Vie Associative" },
  { type: "crypto", label: "Crypto Markets" },
  { type: "countdown", label: "Compte à rebours" },
  { type: "github-trending", label: "GitHub Trending" },
  { type: "hub", label: "Maintenant à PST&B (hub)" },
  { type: "network-status", label: "État réseau campus" },
  { type: "campus-map", label: "Carte / Salles Libres" },
  { type: "spo-video", label: "SPO Vidéo (Cinématique)" },
  { type: "video", label: "Vidéo Plein Écran" },
  { type: "bfm-stream", label: "BFM Direct" },
];



export const NEW_WIDGET_DEFAULTS = {
  weather: { city: "Paris", lat: 48.8566, lon: 2.3522 },
  social: {
    network: "linkedin",
    author: "PST&B",
    authorRole: "Paris School of Technology & Business",
    handle: "pstb",
    content: "Nouveau post sur LinkedIn — colle ici le contenu de ton dernier post.",
    image: "",
    likes: 0, comments: 0, shares: 0,
    postedAt: "Aujourd'hui",
  },
  puzzle: {
    category: "Énigme du jour",
    question: "Combien de zéros dans un milliard ?",
    hint: "Mille millions, ça aide ?",
    reward: "Une place pour le hackathon",
    cta: "répondre",
    qrUrl: "",
  },
  business: {
    tag: "Le saviez-vous",
    bigStat: "2M",
    statLabel: "Abonnés perdus",
    question: "Pourquoi Netflix a perdu 2M d'abonnés en 2022 ?",
    context: "Première baisse en plus de 10 ans : partage de mots de passe, hausse des prix et concurrence accrue.",
    source: "Netflix Investor Letter",
    year: "2022",
    trend: "down",
  },
  gallery: { title: "Galerie campus", interval: 5, images: [] },
  spo: {
    title: "Découvre le campus PST&B",
    subtitle: "Visite guidée, rencontre avec l'équipe pédagogique et tests d'admission gratuits sur place.",
    date: "2026-05-15T18:00:00",
    location: "Campus PST&B · Paris 9e",
    capacity: "Places limitées · sur inscription",
    qrUrl: "",
    cta: "s'inscrire",
    heroImage: "",
    programme: [
      { time: "18:00", title: "Accueil & visite" },
      { time: "18:30", title: "Présentation des cursus" },
      { time: "19:30", title: "Rencontre étudiants" },
      { time: "20:00", title: "Cocktail de clôture" },
    ],
  },
  word: {
    category: "Tech & Business",
    word: "SaaS",
    pronunciation: "sas",
    definition: "Software as a Service. Modèle de distribution de logiciel où l'application est hébergée sur le cloud et facturée par abonnement.",
    example: "L'école utilise de nombreux outils SaaS pour la collaboration.",
  },
  wordle: {
    word: "STARTUP",
    hint: "Entreprise innovante à fort potentiel de croissance.",
    revealed: "0",
    qrUrl: "",
    pauseMode: false,
  },
  transport: {
    campus: "PST&B · Paris 11e",
  },
  jobs: {
    headline: "Alternances du moment",
    source: "Tech & Marketing · Paris",
    offers: [],
  },
  student: {
    title: "",
    description: "",
    dateLabel: "",
    imageUrl: "",
    qrUrl: "",
    submitter: "",
  },
  crypto: {},
  countdown: {
    title: "Hackathon PST&B",
    subtitle: "48h de code, business et pitch sur le campus",
    date: "2026-05-22T09:00:00",
    accent: "violet",
  },
  "github-trending": {},
  hub: {
    campus: "Campus Paris",
    lat: 48.8566,
    lon: 2.3522,
    nextEvent: {
      name: "",
      date: "",
      location: "",
    },
  },
  "network-status": {},
  "spo-video": {
    title: "SOIRÉE PORTES OUVERTES",
    date: new Date(Date.now() + 86400000 * 14).toISOString(),
    location: "Campus PST&B · Paris",
    cta: "S'inscrire",
    videoUrl: "",
    qrUrl: "",
  },
  video: {
    videoUrl: "",
    objectFit: "cover"
  },
  "bfm-stream": {
    type: "business",
  }
};



/**
 * Transforms common video hosting links (Google Drive, Dropbox) into direct video stream URLs.
 */
export function transformVideoUrl(url) {
  if (!url) return { url: "", isEmbed: false };
  if (url.startsWith("data:")) return { url, isEmbed: false };

  // Google Drive
  const driveMatch = url.match(/\/(?:file\/d\/|open\?id=)([\w-]+)/);
  if (driveMatch && driveMatch[1]) {
    return { 
      url: `https://drive.google.com/file/d/${driveMatch[1]}/preview`, 
      isEmbed: true,
      params: "autoplay=1&mute=1&loop=1&controls=0"
    };
  }

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (ytMatch && ytMatch[1]) {
    const id = ytMatch[1];
    return {
      url: `https://www.youtube.com/embed/${id}`,
      isEmbed: true,
      params: `autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0`
    };
  }

  // Dropbox
  if (url.includes("dropbox.com") && url.endsWith("?dl=0")) {
    return { url: url.replace("?dl=0", "?raw=1"), isEmbed: false };
  }

  return { url, isEmbed: false };
}




