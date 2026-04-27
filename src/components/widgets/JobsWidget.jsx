"use client";

import { useState, useEffect, useCallback } from "react";
import QRCode from "react-qr-code";
import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";
import { Briefcase, MapPin, Building2, Code2, Megaphone } from "lucide-react";

function OfferCard({ offer }) {
  const qrUrl = offer.url || "https://pstb.fr";
  return (
    <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-white/[0.025] border border-white/[0.06]">
      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[15px] font-bold text-white leading-tight truncate">{offer.title}</h3>
        <div className="text-[13px] text-violet font-semibold mt-0.5">{offer.company}</div>
        <div className="flex items-center gap-3 text-[11px] text-white/35 font-medium mt-1">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {offer.location ?? "Paris"}
          </span>
          {offer.salary && <span>{offer.salary}</span>}
          {offer.postedAt && <span>{offer.postedAt}</span>}
        </div>
      </div>
      {/* QR */}
      <div className="shrink-0 bg-white p-1.5 rounded-lg shadow-sm">
        <QRCode value={qrUrl} size={60} />
      </div>
    </div>
  );
}

function CategorySection({ icon: Icon, title, offers }) {
  if (!offers || offers.length === 0) return null;
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2.5 mb-4">
        <Icon className="w-5 h-5 text-violet" />
        <span className="text-sm font-bold uppercase tracking-[0.2em] text-white/40">{title}</span>
        <div className="flex-1 h-px bg-white/[0.06] ml-2" />
      </div>
      <div className="space-y-3">
        {offers.map((offer, i) => <OfferCard key={i} offer={offer} />)}
      </div>
    </div>
  );
}

let cachedOffers = null;
let lastFetch = 0;

export default function JobsWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const d = widget.data ?? {};
  const [apiOffers, setApiOffers] = useState(cachedOffers || []);

  const fetchJobs = useCallback(async () => {
    if (cachedOffers && Date.now() - lastFetch < 600_000) {
      setApiOffers(cachedOffers);
      return;
    }
    try {
      const res = await fetch("/api/jobs?count=20");
      if (!res.ok) return;
      const data = await res.json();
      if (data.offers?.length > 0) {
        cachedOffers = data.offers;
        lastFetch = Date.now();
        setApiOffers(data.offers);
      }
    } catch (e) {
      console.warn("[JobsWidget] API fetch failed:", e);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 86_400_000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const manualOffers = (d.offers ?? []).filter(o => o.title);
  const allOffers = manualOffers.length > 0 ? manualOffers : apiOffers;

  // Split by category (set by API, fallback to keyword detection)
  const techOffers = allOffers.filter(o => {
    if (o.category) return o.category === "tech";
    const t = (o.title + " " + o.company).toLowerCase();
    return t.includes("dev") || t.includes("data") || t.includes("tech") || t.includes("fullstack") ||
           t.includes("ia") || t.includes("cyber") || t.includes("cloud");
  }).slice(0, 5);
  
  const marketingOffers = allOffers.filter(o => {
    if (o.category) return o.category !== "tech";
    const t = (o.title + " " + o.company).toLowerCase();
    return !(t.includes("dev") || t.includes("data") || t.includes("tech") || t.includes("fullstack") ||
           t.includes("ia") || t.includes("cyber") || t.includes("cloud"));
  }).slice(0, 5);

  const displayedCount = techOffers.length + marketingOffers.length;

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => {
        if (m === "grid") {
          return (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-violet font-bold mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3" /> Alternances
                </div>
                <div className="text-xs text-text font-bold">{displayedCount} offre{displayedCount > 1 ? "s" : ""}</div>
                {allOffers[0] && <p className="text-[10px] text-sub truncate mt-1">{allOffers[0].title}</p>}
              </div>
              <div className="text-[10px] text-sub font-mono">Tech & Marketing</div>
            </div>
          );
        }

        // ═══════ FULLSCREEN / FOCUS ═══════
        return (
          <div className="relative h-full w-full overflow-hidden bg-[#050505]">
            <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-violet/5 rounded-full blur-[150px]" />

            <div className="relative z-10 h-full w-full flex flex-col px-14 py-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-8 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-violet/10 border border-violet/20">
                    <Briefcase className="w-6 h-6 text-violet" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">
                      {d.headline ?? "Alternances du moment"}
                    </h1>
                    <p className="text-sm text-white/30 font-medium mt-1">Tech & Marketing · Paris</p>
                  </div>
                </div>
                <div className="text-sm font-bold text-violet bg-violet/10 px-5 py-2 rounded-full border border-violet/20">
                  {displayedCount} offre{displayedCount > 1 ? "s" : ""}
                </div>
              </div>

              {/* Two columns: Tech | Marketing */}
              <div className="flex-1 flex gap-8 min-h-0 overflow-hidden">
                <CategorySection icon={Code2} title="Tech & Dev" offers={techOffers} />
                <CategorySection icon={Megaphone} title="Marketing & Business" offers={marketingOffers} />
              </div>

              {/* Footer */}
              <div className="text-[11px] text-white/20 mt-6 shrink-0">
                Scanne le QR code pour postuler · Source : Adzuna
              </div>
            </div>
          </div>
        );
      }}
    </WidgetWrapper>
  );
}
