"use client";

import { useEffect, useState, useMemo } from "react";
import QRCode from "react-qr-code";
import {
  Briefcase,
  MapPin,
  Building2,
  Code2,
  Megaphone,
  Search,
  ExternalLink,
  Clock,
  ChevronDown,
  RefreshCw,
  X,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";

const CATEGORIES = [
  { key: "all", label: "Toutes" },
  { key: "tech", label: "Tech & Dev" },
  { key: "marketing", label: "Marketing & Business" },
];

const LEVELS = [
  { key: "all", label: "Tous niveaux" },
  { key: "bts", label: "BTS / BUT" },
  { key: "bachelor", label: "Bachelor / Bac+3" },
  { key: "mastere", label: "Mastère / Bac+5" },
];

const CLAUDE_ALTERNANCE_PROMPT = `Tu es un coach de carrière expert et un spécialiste du recrutement en France, particulièrement pour les profils hybrides, Tech et Business. >
Mon objectif est de trouver une alternance. Je suis étudiant(e) à la PST&B (Paris School of Technology & Business), une école qui forme aux doubles compétences en technologie et en commerce.

Je vais te fournir mon CV ci-dessous. En te basant exclusivement sur son contenu (mes compétences, mes expériences, mes projets et ma formation), je veux que tu me construises une stratégie de recherche d'alternance sur mesure, orientée Marketing ou Tech (selon ce qui ressort le plus de mon profil, ou une combinaison des deux).

Voici ce que tu dois me fournir, étape par étape :

1. Analyse de mon profil (Bilan flash) 🔍

    Dégage mes 3 forces principales pour le marché de l'alternance.

    Identifie si mon profil penche plutôt vers la Tech, le Marketing, ou s'il est parfaitement hybride.

    Pointe une faiblesse potentielle de mon CV (manque d'un outil précis, expérience courte, etc.) et dis-moi comment la compenser en entretien.

2. Ciblage des postes (Titres exacts) 🎯

    Propose-moi 3 à 5 intitulés de postes précis (en français et en anglais) qui correspondent exactement à mon niveau et à mes compétences.

    Pour chaque poste, explique en une phrase pourquoi mon CV matche avec ce rôle.

3. Stratégie de recherche et Mots-clés 🔑

    Donne-moi les meilleurs mots-clés à utiliser sur les jobboards (LinkedIn, Welcome to the Jungle, HelloWork) pour trouver ces offres.

    Rédige-moi 2 requêtes booléennes prêtes à l'emploi pour mes recherches LinkedIn.

4. Ciblage des entreprises 🏢

    Suggère-moi 3 catégories d'entreprises qui recrutent ce type de profil en alternance (ex: Agences SEO, Éditeurs de logiciels SaaS, E-commerce, ESN, Startups FinTech...).

    Donne-moi 2 ou 3 exemples de vraies entreprises à Paris/Île-de-France (ou en remote) que je pourrais cibler en candidature spontanée.

5. Le "Hack" PST&B 🚀

    Rédige un court paragraphe d'accroche (3 lignes max) que je peux utiliser dans ma lettre de motivation ou message LinkedIn, qui met en valeur ma double compétence (Tech/Business) propre à la PST&B en lien avec mon CV.

Voici mon CV :`;

function getBadgeColor(category) {
  return category === "tech"
    ? "bg-violet/15 text-violet border-violet/25"
    : "bg-pink-500/15 text-pink-400 border-pink-500/25";
}

function ClaudeLogo() {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D97757]/15 border border-[#D97757]/30 shadow-lg shadow-black/30">
      <div className="absolute inset-1 rounded-xl bg-[#D97757]/10" />
      <Sparkles size={20} className="relative text-[#D97757]" />
    </div>
  );
}

function ClaudePromptModal({ open, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CLAUDE_ALTERNANCE_PROMPT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8 bg-black/70 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="claude-prompt-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0f0f15] shadow-2xl shadow-black/60">
        <div className="absolute -top-32 -right-24 h-64 w-64 rounded-full bg-[#D97757]/20 blur-[90px]" />
        <div className="absolute -bottom-28 -left-20 h-56 w-56 rounded-full bg-violet/20 blur-[80px]" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-xl border border-white/[0.08] bg-white/[0.04] p-2 text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white"
          aria-label="Fermer la fenêtre"
        >
          <X size={16} />
        </button>

        <div className="relative p-7">
          <ClaudeLogo />

          <div className="mt-5 pr-8">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#D97757]">
              Assistant Claude
            </p>
            <h2
              id="claude-prompt-title"
              className="mt-2 text-2xl font-black tracking-tight text-white"
            >
              Recherche d'alternance assistée par IA
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Ce bouton copie un prompt prêt à coller dans Claude. L'étudiant peut ensuite ajouter son CV pour obtenir une stratégie personnalisée : analyse du profil, ciblage des postes, mots-clés, entreprises à contacter et accroche PST&amp;B.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-[#D97757] shadow-[0_0_14px_rgba(217,119,87,0.7)]" />
              <p className="text-xs leading-relaxed text-white/50">
                Le prompt n'est pas affiché dans l'interface afin de garder l'expérience simple côté étudiant. Il est uniquement placé dans le presse-papiers.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-black transition-all border ${
              copied
                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                : "border-[#D97757]/30 bg-[#D97757]/20 text-white hover:bg-[#D97757]/30"
            }`}
          >
            {copied ? <Check size={17} /> : <Copy size={17} />}
            {copied ? "Prompt copié" : "Copier le prompt pour Claude"}
          </button>
        </div>
      </div>
    </div>
  );
}

function OfferCard({ offer, index }) {
  const qrUrl = offer.url || "https://pstb.fr";
  const isNew =
    offer.postedAt &&
    (() => {
      try {
        const [d, m, y] = offer.postedAt.split("/");
        const posted = new Date(`${y}-${m}-${d}`);
        const diff = (Date.now() - posted.getTime()) / 86400000;
        return diff <= 3;
      } catch {
        return false;
      }
    })();

  return (
    <div
      className="group relative rounded-2xl border border-white/[0.1] bg-[#0f0f15] hover:bg-[#14141c] hover:border-violet/30 transition-all duration-300 overflow-hidden flex flex-col shadow-lg"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div
        className={`h-[2px] w-full ${
          offer.category === "tech"
            ? "bg-gradient-to-r from-violet/60 via-violet/30 to-transparent"
            : "bg-gradient-to-r from-pink-500/60 via-pink-500/30 to-transparent"
        }`}
      />

      <div className="flex flex-col gap-4 p-5 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${getBadgeColor(
                  offer.category
                )}`}
              >
                {offer.category === "tech" ? (
                  <Code2 size={8} />
                ) : (
                  <Megaphone size={8} />
                )}
                {offer.category === "tech" ? "Tech" : "Marketing"}
              </span>
              {offer.level && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border bg-amber-500/15 text-amber-400 border-amber-500/25">
                  {offer.level === "bts" ? "BTS/BUT" : offer.level === "bachelor" ? "Bachelor" : "Mastère"}
                </span>
              )}
              {isNew && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/25">
                  Nouveau
                </span>
              )}
            </div>
            <h3 className="text-[15px] font-bold text-white leading-snug group-hover:text-violet transition-colors duration-200 line-clamp-2">
              {offer.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1.5 text-[12px] font-semibold text-white/90 group-hover:text-white transition-colors">
              <Building2 size={11} className="text-violet-400" />
              <span className="truncate">{offer.company}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-white/70 font-medium">
          <span className="flex items-center gap-1">
            <MapPin size={10} />
            {offer.location ?? "Paris"}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase size={10} />
            Alternance
          </span>
          {offer.salary && (
            <span className="text-emerald-400 font-semibold">
              {offer.salary}
            </span>
          )}
          {offer.postedAt && (
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {offer.postedAt}
            </span>
          )}
        </div>

        {offer.description && (
          <p className="text-[11.5px] text-white/80 leading-relaxed line-clamp-2 flex-1">
            {offer.description}
          </p>
        )}

        <div className="text-[9px] uppercase tracking-[0.2em] text-white/50 font-bold border-t border-white/[0.08] pt-3 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${
            offer.source === "francetravail" ? "bg-blue-400/70" : "bg-amber-400/60"
          }`} />
          Source : {offer.source === "francetravail" ? "France Travail" : "Adzuna"}
        </div>
      </div>

      <div className="border-t border-white/[0.06] p-4 bg-[#0a0a0f] flex items-center justify-between gap-4">
        <div className="flex-1">
          <a
            href={qrUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-violet/20 hover:bg-violet/30 text-white font-bold text-xs transition-colors border border-violet/30"
          >
            Voir l'offre
            <ExternalLink size={14} />
          </a>
        </div>
        <div
          className="shrink-0 bg-white p-1.5 rounded-lg shadow-lg shadow-black/40"
          title="Scanner avec un mobile"
        >
          <QRCode value={qrUrl} size={48} />
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] overflow-hidden animate-pulse">
      <div className="h-[2px] bg-white/10" />
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-12 bg-white/10 rounded-full" />
          <div className="h-4 w-10 bg-white/5 rounded-full" />
        </div>
        <div className="h-5 bg-white/10 rounded-lg w-3/4" />
        <div className="h-4 bg-white/5 rounded-lg w-1/2" />
        <div className="flex gap-4">
          <div className="h-3 bg-white/5 rounded w-16" />
          <div className="h-3 bg-white/5 rounded w-20" />
        </div>
        <div className="h-3 bg-white/[0.03] rounded w-full" />
        <div className="h-3 bg-white/[0.03] rounded w-2/3" />
      </div>
      <div className="h-24 bg-white/[0.02] border-t border-white/[0.04]" />
    </div>
  );
}

export default function AlternancePage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isClaudeModalOpen, setIsClaudeModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/jobs?count=200")
      .then((r) => r.json())
      .then((data) => {
        if (data.error && !data.offers?.length) {
          setError(data.error);
        } else {
          setOffers(data.offers ?? []);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered = useMemo(() => {
    let list = offers.filter((o) => {
      const company = (o.company || "").toLowerCase();
      const title = (o.title || "").toLowerCase();

      const isSchool =
        company.includes("iscod") ||
        company.includes("alegria") ||
        company.includes("openclassrooms") ||
        company.includes("my digital school") ||
        company.includes("epitech") ||
        company.includes("aurlom") ||
        company.includes("dsti") ||
        company.includes("school") ||
        company.includes("école") ||
        company.includes("ecole") ||
        company.includes("campus") ||
        company.includes("formation");

      const isFormation =
        title.includes("formation") ||
        title.includes("école") ||
        title.includes("ecole");

      return !isSchool && !isFormation;
    });

    if (category !== "all") list = list.filter((o) => o.category === category);
    if (level !== "all") list = list.filter((o) => o.level === level);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.title?.toLowerCase().includes(q) ||
          o.company?.toLowerCase().includes(q) ||
          o.location?.toLowerCase().includes(q)
      );
    }
    if (sortBy === "salary") {
      list = [...list].sort((a, b) => {
        const pa = parseInt(a.salary) || 0;
        const pb = parseInt(b.salary) || 0;
        return pb - pa;
      });
    }
    return list;
  }, [offers, category, level, search, sortBy]);

  const techCount = offers.filter((o) => o.category === "tech").length;
  const mktCount = offers.filter((o) => o.category === "marketing").length;

  return (
    <div className="h-screen overflow-y-auto custom-scrollbar bg-[#060608] text-white font-sans">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 left-1/4 w-[700px] h-[700px] rounded-full bg-violet/[0.07] blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-pink-500/[0.05] blur-[100px]" />
      </div>

      <div className="relative z-10">
        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#060608]/85 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-violet/10 border border-violet/20">
                  <Briefcase size={22} className="text-violet" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white tracking-tight leading-none">
                    Alternances
                  </h1>
                  <p className="text-[11px] text-white/35 font-medium tracking-wide mt-0.5">
                    PST&amp;B · Campus Paris
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsClaudeModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#D97757]/30 bg-[#D97757]/15 px-3 py-1.5 text-[12px] font-bold text-white/90 transition-colors hover:bg-[#D97757]/25 hover:text-white"
                  title="Copier le prompt Claude pour aider l'étudiant dans sa recherche d'alternance"
                >
                  <Sparkles size={13} className="text-[#D97757]" />
                  Assistant Claude
                </button>

                {!loading && (
                  <>
                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-white/80 bg-white/[0.06] border border-white/[0.1] px-3 py-1.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      {techCount} Tech
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-white/80 bg-white/[0.06] border border-white/[0.1] px-3 py-1.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                      {mktCount} Marketing
                    </div>
                    <div className="text-[12px] font-bold text-violet-300 bg-violet/20 border border-violet/30 px-3 py-1.5 rounded-full">
                      {offers.length} offres au total
                    </div>
                  </>
                )}
                <button
                  onClick={() => setRefreshKey((k) => k + 1)}
                  className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.1] transition-colors"
                  title="Rafraîchir"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search
                  size={13}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
                />
                <input
                  type="text"
                  placeholder="Rechercher un poste, une entreprise…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-violet/40 focus:bg-white/[0.06] transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCategory(c.key)}
                    className={`text-[11px] font-bold px-3 py-2 rounded-lg transition-all duration-200 ${
                      category === c.key
                        ? "bg-violet text-white shadow-[0_0_16px_rgba(101,31,255,0.4)]"
                        : "bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-white hover:bg-white/[0.07]"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="w-px h-5 bg-white/10 hidden sm:block" />

              <div className="flex items-center gap-1.5">
                {LEVELS.map((l) => (
                  <button
                    key={l.key}
                    onClick={() => setLevel(l.key)}
                    className={`text-[11px] font-bold px-3 py-2 rounded-lg transition-all duration-200 ${
                      level === l.key
                        ? "bg-amber-500/80 text-white shadow-[0_0_14px_rgba(245,158,11,0.35)]"
                        : "bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-white hover:bg-white/[0.07]"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white/[0.04] border border-white/[0.08] rounded-xl pl-3 pr-8 py-2.5 text-[11px] font-bold text-white/50 focus:outline-none focus:border-violet/40 cursor-pointer"
                >
                  <option value="date">Plus récents</option>
                  <option value="salary">Meilleur salaire</option>
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
                />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-5 mb-8 flex items-start gap-4">
              <div className="p-2 rounded-xl bg-red-500/10 shrink-0">
                <Briefcase size={18} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-400">
                  Erreur de chargement
                </p>
                <p className="text-xs text-white/30 mt-1">{error}</p>
                <p className="text-xs text-white/20 mt-2">
                  Vérifie que ADZUNA_APP_ID et ADZUNA_APP_KEY sont bien définis
                  dans .env.local
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {!loading && !error && (
            <>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                    <Search size={24} className="text-white/20" />
                  </div>
                  <p className="text-sm text-white/30 font-medium">
                    Aucune offre trouvée
                  </p>
                  <button
                    onClick={() => {
                      setSearch("");
                      setCategory("all");
                      setLevel("all");
                    }}
                    className="text-xs text-violet hover:underline"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[13px] text-white/60 font-semibold mb-5 pl-1">
                    {filtered.length} offre{filtered.length > 1 ? "s" : ""}{" "}
                    affichée{filtered.length > 1 ? "s" : ""}
                    {search && ` · "${search}"`}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filtered.map((offer, i) => (
                      <OfferCard key={i} offer={offer} index={i} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </main>

        <footer className="border-t border-white/[0.05] mt-16 py-8">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
            <div className="text-[11px] text-white/20 font-medium">
              PST&amp;B Campus Paris · Données fournies par{" "}
              <a
                href="https://developer.adzuna.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet/60 hover:text-violet transition-colors"
              >
                Adzuna
              </a>
            </div>
            <div className="text-[11px] text-white/15">
              Mise à jour toutes les 6h
            </div>
          </div>
        </footer>
      </div>

      <ClaudePromptModal
        open={isClaudeModalOpen}
        onClose={() => setIsClaudeModalOpen(false)}
      />
    </div>
  );
}
