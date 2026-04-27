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
  SlidersHorizontal,
  ExternalLink,
  Clock,
  ChevronDown,
  Loader2,
  RefreshCw,
} from "lucide-react";

const CATEGORIES = [
  { key: "all", label: "Toutes" },
  { key: "tech", label: "Tech & Dev" },
  { key: "marketing", label: "Marketing & Business" },
];

function getBadgeColor(category) {
  return category === "tech"
    ? "bg-violet/15 text-violet border-violet/25"
    : "bg-pink-500/15 text-pink-400 border-pink-500/25";
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
      className="group relative rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-white/[0.01] hover:border-white/[0.14] hover:from-white/[0.06] hover:to-white/[0.02] transition-all duration-300 overflow-hidden flex flex-col"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Top accent bar */}
      <div
        className={`h-[2px] w-full ${
          offer.category === "tech"
            ? "bg-gradient-to-r from-violet/60 via-violet/30 to-transparent"
            : "bg-gradient-to-r from-pink-500/60 via-pink-500/30 to-transparent"
        }`}
      />

      <div className="flex flex-col gap-4 p-5 flex-1">
        {/* Header row */}
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
              {isNew && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/25">
                  Nouveau
                </span>
              )}
            </div>
            <h3 className="text-[15px] font-bold text-white leading-snug group-hover:text-violet transition-colors duration-200 line-clamp-2">
              {offer.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1.5 text-[12px] font-semibold text-violet/80">
              <Building2 size={11} />
              <span className="truncate">{offer.company}</span>
            </div>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-white/40 font-medium">
          <span className="flex items-center gap-1">
            <MapPin size={10} />
            {offer.location ?? "Paris"}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase size={10} />
            Alternance
          </span>
          {offer.salary && (
            <span className="text-emerald-400/80 font-semibold">
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

        {/* Description */}
        {offer.description && (
          <p className="text-[11.5px] text-white/30 leading-relaxed line-clamp-2 flex-1">
            {offer.description}
          </p>
        )}

        {/* Source badge */}
        <div className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-bold border-t border-white/[0.04] pt-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
          Source : Adzuna
        </div>
      </div>

      {/* QR Code footer */}
      <div className="border-t border-white/[0.06] px-5 py-4 bg-white/[0.02] flex items-center justify-between gap-4">
        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold mb-0.5">
            Scanner pour postuler
          </p>
          <p className="text-[10px] text-white/20 truncate max-w-[140px]">
            {qrUrl.replace(/^https?:\/\//, "").slice(0, 35)}…
          </p>
        </div>
        <div className="shrink-0 bg-white p-2 rounded-xl shadow-lg shadow-black/40">
          <QRCode value={qrUrl} size={64} />
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
  const [sortBy, setSortBy] = useState("date");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/jobs?count=50")
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
    let list = offers;
    if (category !== "all") list = list.filter((o) => o.category === category);
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
  }, [offers, category, search, sortBy]);

  const techCount = offers.filter((o) => o.category === "tech").length;
  const mktCount = offers.filter((o) => o.category === "marketing").length;

  return (
    <div className="min-h-screen bg-[#060608] text-white font-sans">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 left-1/4 w-[700px] h-[700px] rounded-full bg-violet/[0.07] blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-pink-500/[0.05] blur-[100px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#060608]/85 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between gap-6 flex-wrap">
              {/* Brand */}
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

              {/* Stats pills */}
              <div className="flex items-center gap-3 flex-wrap">
                {!loading && (
                  <>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/50 bg-white/[0.04] border border-white/[0.07] px-3 py-1.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet" />
                      {techCount} Tech
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/50 bg-white/[0.04] border border-white/[0.07] px-3 py-1.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                      {mktCount} Marketing
                    </div>
                    <div className="text-[11px] font-bold text-violet bg-violet/10 border border-violet/20 px-3 py-1.5 rounded-full">
                      {offers.length} offres au total
                    </div>
                  </>
                )}
                <button
                  onClick={() => setRefreshKey((k) => k + 1)}
                  className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
                  title="Rafraîchir"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {/* Search + filters */}
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

              {/* Category filter */}
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

              {/* Sort */}
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

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Error state */}
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

          {/* Loading skeletons */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Results */}
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
                    }}
                    className="text-xs text-violet hover:underline"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[11px] text-white/25 font-medium mb-5">
                    {filtered.length} offre{filtered.length > 1 ? "s" : ""}{" "}
                    affichée{filtered.length > 1 ? "s" : ""}
                    {search && ` · "${search}"`}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((offer, i) => (
                      <OfferCard key={i} offer={offer} index={i} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </main>

        {/* Footer */}
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
    </div>
  );
}
