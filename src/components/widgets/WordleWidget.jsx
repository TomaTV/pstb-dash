"use client";

import { Gamepad2 } from "lucide-react";
import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";

export default function WordleWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const d = widget.data ?? {};

  const word = (d.word ?? "STARTUP").toUpperCase();
  const hint = d.hint ?? "Entreprise innovante à fort potentiel de croissance.";
  const [now, setNow] = useState(Date.now());
  const defaultQrUrl = typeof window !== 'undefined' ? `${window.location.origin}/jeu` : "https://pstb.fr/jeu";

  const isPaused = d.pauseMode || (d.pauseUntil && now < d.pauseUntil);
  const msLeft = isPaused && d.pauseUntil ? Math.max(0, d.pauseUntil - now) : 0;

  useEffect(() => {
    if (isPaused && d.pauseUntil) {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }, [isPaused, d.pauseUntil]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Reveal some letters based on the 'revealed' string (e.g. "0,3")
  const revealedIndices = (d.revealed ?? "0").split(",").map(n => parseInt(n.trim())).filter(n => !isNaN(n));
  const guesses = d.guesses || [];

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => {
        if (m === "grid") {
          return (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-2">Wordle du jour</div>
                {isPaused ? (
                  <div className="text-emerald-500 font-bold text-sm bg-emerald-500/10 px-2 py-1 rounded inline-block">
                    Pause {msLeft > 0 ? formatTime(msLeft) : ""}
                  </div>
                ) : (
                  <div className="flex gap-1 mb-2">
                    {word.split("").slice(0, 5).map((l, i) => (
                      <div key={i} className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${revealedIndices.includes(i) ? 'bg-emerald-500 text-white' : 'bg-white/10 text-transparent'}`}>
                        {l}
                      </div>
                    ))}
                    {word.length > 5 && <span className="text-white/30 text-xs">...</span>}
                  </div>
                )}
              </div>
              {!isPaused && <p className="text-[10px] text-sub line-clamp-2">Indice: {hint}</p>}
            </div>
          );
        }

        // FULLSCREEN
        return (
          <div className="relative h-full w-full bg-[#0a0a0a] overflow-hidden flex">
            {/* Left Section: Game UI */}
            <div className={`p-16 flex flex-col justify-center relative z-10 ${isPaused ? 'w-full max-w-5xl items-center mx-auto' : 'flex-1 pt-32'}`}>
              <div className={`flex items-center gap-4 mb-10 ${isPaused ? 'justify-center w-full' : ''}`}>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Gamepad2 size={24} className="text-emerald-400" />
                </div>
                <div className="text-sm font-bold uppercase tracking-[0.4em] text-white/50">
                  Le jeu du campus
                </div>
              </div>

              {isPaused ? (
                <div className="max-w-4xl text-center flex flex-col items-center relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
                  
                  <div className="relative z-10 w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-10 shadow-[0_0_80px_rgba(16,185,129,0.4)]">
                    <span className="text-5xl md:text-6xl drop-shadow-md">🏆</span>
                  </div>
                  
                  <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500 font-black tracking-tight leading-none mb-6 uppercase"
                    style={{ fontSize: m === "fullscreen" ? "6rem" : "4.5rem" }}>
                    Mot trouvé !
                  </h1>
                  
                  <p className="text-white/80 text-2xl md:text-3xl font-medium max-w-2xl leading-snug mb-16">
                    Quelqu'un a été plus rapide que toi...
                    <span className="text-white/50 text-lg md:text-xl font-normal mt-4 block">Le jeu est en pause. Prépare-toi pour le prochain mot !</span>
                  </p>
                  
                  <div className="relative z-10 flex flex-col items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 min-w-[300px] md:min-w-[400px] shadow-2xl">
                     <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl pointer-events-none" />
                     <div className="text-xs md:text-sm font-bold uppercase tracking-[0.4em] text-emerald-400/80 mb-4">Prochain mot dans</div>
                     <div className="text-5xl md:text-7xl font-black font-mono text-white drop-shadow-[0_0_25px_rgba(16,185,129,0.4)] tabular-nums">
                       {msLeft > 0 ? formatTime(msLeft) : "..."}
                     </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl">
                  <h1 className="text-emerald-400 font-black tracking-tight leading-none mb-6"
                    style={{ fontSize: m === "fullscreen" ? "5rem" : "3.5rem" }}>
                    Devine le mot !
                  </h1>

                  <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-12 max-w-2xl backdrop-blur-md">
                    <div className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-3">Indice du jour</div>
                    <div className="text-white text-2xl font-medium leading-snug">« {hint} »</div>
                  </div>

                  <div className="flex flex-col gap-4 relative">
                    <div className="absolute -left-12 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/50 to-transparent" />
                    
                    {/* Row 1: The Word */}
                    <div className="flex gap-4">
                      {word.split("").map((letter, i) => {
                        const isRevealed = revealedIndices.includes(i);
                        return (
                          <div key={i}
                            className={`flex items-center justify-center rounded-2xl border-4 font-black text-white
                                          ${isRevealed
                                ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                                : 'bg-transparent border-white/20'}`}
                            style={{
                              width: m === "fullscreen" ? "100px" : "70px",
                              height: m === "fullscreen" ? "100px" : "70px",
                              fontSize: m === "fullscreen" ? "3rem" : "2.5rem"
                            }}>
                            {isRevealed ? letter : ""}
                          </div>
                        );
                      })}
                    </div>
                    {/* Guesses rows (max 5) */}
                    {Array.from({ length: 5 }).map((_, rowIndex) => {
                      const guess = guesses[rowIndex];
                      const emptyOpacity = rowIndex === 0 ? 'opacity-60' : rowIndex === 1 ? 'opacity-40' : rowIndex === 2 ? 'opacity-20' : 'opacity-10';
                      
                      return (
                        <div key={`row-${rowIndex}`} className={`flex gap-4 ${!guess ? emptyOpacity : ''} transition-all duration-500`}>
                          {word.split("").map((targetLetter, i) => {
                            let letter = "";
                            let boxStyle = "bg-transparent border-white/10";
                            
                            if (guess) {
                              letter = guess[i] || "";
                              if (letter === targetLetter) boxStyle = "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]";
                              else if (word.includes(letter)) boxStyle = "bg-yellow-500 border-yellow-500 text-white shadow-[0_0_20px_rgba(234,179,8,0.2)]";
                              else boxStyle = "bg-white/10 border-white/20 text-white/40";
                            }
                            
                            return (
                              <div key={i} className={`flex items-center justify-center rounded-2xl border-4 font-black transition-colors duration-500 ${boxStyle}`}
                                   style={{ width: m === "fullscreen" ? "100px" : "70px", height: m === "fullscreen" ? "100px" : "70px", fontSize: m === "fullscreen" ? "3rem" : "2.5rem" }}>
                                {letter}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Section: QR Code */}
            {!isPaused && (
              <div className="w-[400px] h-full bg-emerald-950/30 border-l border-emerald-900/50 p-12 flex flex-col items-center justify-center text-center relative z-10 shadow-2xl backdrop-blur-md">
                <div className="w-full aspect-square bg-white p-6 rounded-3xl shadow-[0_0_60px_rgba(16,185,129,0.3)] mb-8 transition-transform hover:scale-105">
                  <QRCode value={defaultQrUrl} size={256} className="w-full h-full" />
                </div>
                <div className="text-emerald-400 font-bold uppercase tracking-[0.3em] text-sm mb-4">À toi de jouer</div>
                <h2 className="text-3xl font-bold text-white leading-tight">Scanne pour<br />participer</h2>
                <p className="text-white/50 mt-4 text-sm">Le premier à trouver gagne des points campus.</p>
              </div>
            )}

            {/* Background Glow */}
            <div className={`absolute bottom-0 right-[200px] w-[600px] h-[600px] ${isPaused ? 'bg-blue-500/10' : 'bg-emerald-500/10'} blur-[150px] rounded-full pointer-events-none`} />
          </div>
        );
      }}
    </WidgetWrapper>
  );
}
