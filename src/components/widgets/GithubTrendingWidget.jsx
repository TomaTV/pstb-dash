"use client";

import { useEffect, useState } from "react";
import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";
import { Code, Star, GitFork, Flame } from "lucide-react";

const LANG_COLORS = {
  JavaScript: "#F1E05A",
  TypeScript: "#3178C6",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#DEA584",
  Java: "#B07219",
  "C++": "#F34B7D",
  C: "#555555",
  HTML: "#E34C26",
  CSS: "#563D7C",
  Shell: "#89E051",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Solidity: "#AA6746",
};

function fmtStars(n) {
  if (n == null) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function RepoRow({ repo, rank, big = false }) {
  const lc = LANG_COLORS[repo.language] || "#999";
  return (
    <div className={`grid items-center gap-4 border-b border-white/5 ${big ? "px-6 py-4" : "px-4 py-3"}`}
      style={{ gridTemplateColumns: "auto 1fr auto auto" }}>
      <span className={`font-mono font-black tabular-nums ${big ? "text-2xl" : "text-base"} text-white/25 min-w-[40px]`}>
        {String(rank).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <div className={`flex items-baseline gap-2 ${big ? "text-base" : "text-sm"}`}>
          <span className="text-white/40 truncate">{repo.owner} /</span>
          <span className="font-black text-white truncate">{repo.name}</span>
        </div>
        {big && repo.description && (
          <div className="text-[12px] text-white/45 mt-1 line-clamp-1 leading-relaxed">{repo.description}</div>
        )}
      </div>
      {repo.language && (
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full" style={{ background: lc }} />
          <span className={`font-medium text-white/65 ${big ? "text-xs" : "text-[10px]"}`}>{repo.language}</span>
        </div>
      )}
      <div className="flex items-center gap-3 shrink-0 font-mono text-white/85">
        <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
          <Star size={big ? 14 : 11} fill="currentColor" />
          {fmtStars(repo.stars)}
        </span>
        {big && repo.forks > 0 && (
          <span className="inline-flex items-center gap-1 text-white/45 text-xs">
            <GitFork size={12} />
            {fmtStars(repo.forks)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function CodeTrendingWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const [repos, setRepos] = useState([]);

  useEffect(() => {
    let on = true;
    const load = async () => {
      try {
        const res = await fetch("/api/github-trending", { cache: "no-store" });
        const json = await res.json();
        if (on && json.repos) setRepos(json.repos);
      } catch (e) {
        console.error("[CodeTrendingWidget]", e);
      }
    };
    load();
    const id = setInterval(load, 30 * 60 * 1000);
    return () => { on = false; clearInterval(id); };
  }, []);

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => {
        if (m === "grid") {
          const top3 = repos.slice(0, 3);
          return (
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 mb-2">
                <Code size={14} className="text-white" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-white/85">GitHub · Trending</span>
              </div>
              <div className="flex-1 space-y-1.5 mt-1">
                {top3.map((r, i) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-bold text-white truncate">{r.name}</span>
                    <span className="inline-flex items-center gap-1 text-amber-400 font-mono shrink-0">
                      <Star size={9} fill="currentColor" />{fmtStars(r.stars)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Focus
        const top = repos[0];
        return (
          <div className="relative h-full w-full overflow-hidden bg-[#0a0a0a]">
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px]" />
            <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-violet/10 blur-[120px]" />

            <div className="relative h-full flex flex-col px-12 py-10">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-3">
                  <Code size={26} className="text-white" />
                  <h1 className="text-3xl font-black text-white tracking-tight">GitHub Trending</h1>
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/35 ml-1">Last 24h · top stars</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Flame size={12} className="text-amber-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Hot</span>
                </div>
              </div>

              {top && (
                <div className="mb-6 rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/8 p-6 shrink-0">
                  <div className="flex items-start gap-5">
                    {top.avatar && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={top.avatar} alt="" className="w-14 h-14 rounded-xl border border-white/10" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">#1 Trending</span>
                      </div>
                      <h2 className="text-3xl font-black text-white leading-tight">
                        <span className="text-white/40">{top.owner} /</span> {top.name}
                      </h2>
                      {top.description && (
                        <p className="text-sm text-white/55 mt-2 leading-relaxed line-clamp-2">{top.description}</p>
                      )}
                      <div className="flex items-center gap-5 mt-4 text-sm font-mono">
                        <span className="inline-flex items-center gap-1.5 text-amber-400 font-bold">
                          <Star size={14} fill="currentColor" />
                          {fmtStars(top.stars)} stars
                        </span>
                        {top.forks > 0 && (
                          <span className="inline-flex items-center gap-1.5 text-white/55">
                            <GitFork size={14} />
                            {fmtStars(top.forks)} forks
                          </span>
                        )}
                        {top.language && (
                          <span className="inline-flex items-center gap-1.5 text-white/65">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: LANG_COLORS[top.language] || "#999" }} />
                            {top.language}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-1 min-h-0 rounded-xl bg-white/[0.015] border border-white/5 overflow-hidden">
                <div className="grid items-center gap-4 px-6 py-2 border-b border-white/8 text-[9px] uppercase tracking-widest text-white/35 font-bold"
                  style={{ gridTemplateColumns: "auto 1fr auto auto" }}>
                  <div className="min-w-[40px]">#</div>
                  <div>Repository</div>
                  <div>Lang</div>
                  <div className="text-right">Stars</div>
                </div>
                <div className="overflow-y-auto">
                  {repos.slice(1, 10).map((r, i) => <RepoRow key={r.id} repo={r} rank={i + 2} big />)}
                </div>
              </div>

              <div className="text-[10px] text-white/20 mt-4 font-mono uppercase tracking-widest shrink-0">
                Source · api.github.com
              </div>
            </div>
          </div>
        );
      }}
    </WidgetWrapper>
  );
}
