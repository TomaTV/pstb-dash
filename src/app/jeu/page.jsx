"use client";

import { useState, useEffect } from "react";
import { Gamepad2, Send } from "lucide-react";

export default function JeuWordlePage() {
  const [wordData, setWordData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Game state
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameStatus, setGameStatus] = useState("playing"); // playing, won, lost

  useEffect(() => {
    // Fetch the word from the dashboard data
    fetch("/api/dashboard")
      .then(res => res.json())
      .then(data => {
        const wordleWidget = data.widgets?.find(w => w.type === "wordle");
        if (wordleWidget && wordleWidget.data) {
          setWordData({
            word: (wordleWidget.data.word || "STARTUP").toUpperCase(),
            hint: wordleWidget.data.hint || "",
            revealed: (wordleWidget.data.revealed || "0").split(",").map(n => parseInt(n.trim())).filter(n => !isNaN(n)),
            pauseUntil: wordleWidget.data.pauseUntil || 0,
            pauseMode: wordleWidget.data.pauseMode || false
          });
        } else {
          setWordData({ word: "PSTB", hint: "Notre école", revealed: [], pauseUntil: 0, pauseMode: false });
        }
        setLoading(false);
      })
      .catch(() => {
        setWordData({ word: "STARTUP", hint: "Entreprise innovante", revealed: [0], pauseUntil: 0, pauseMode: false });
        setLoading(false);
      });
  }, []);

  const [now, setNow] = useState(Date.now());
  
  const isPaused = wordData?.pauseMode || (wordData?.pauseUntil && now < wordData?.pauseUntil);
  const msLeft = isPaused && wordData?.pauseUntil ? Math.max(0, wordData.pauseUntil - now) : 0;

  useEffect(() => {
    if (isPaused && wordData?.pauseUntil) {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }, [isPaused, wordData?.pauseUntil]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const MAX_GUESSES = 6;
  const word = wordData?.word || "STARTUP";
  
  const onKeyPress = (key) => {
    if (gameStatus !== "playing") return;
    
    if (key === "ENTER") {
      if (currentGuess.length !== word.length) return;
      const newGuesses = [...guesses, currentGuess];
      setGuesses(newGuesses);
      setCurrentGuess("");
      
      if (currentGuess === word) {
        setGameStatus("won");
        // Trigger win sequence on the dashboard
        fetch("/api/wordle/win", { method: "POST" }).catch(console.error);
      } else {
        // Send guess to the dashboard screen
        fetch("/api/wordle/guess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guess: currentGuess })
        }).catch(console.error);

        if (newGuesses.length >= MAX_GUESSES) {
          setGameStatus("lost");
        }
      }
    } else if (key === "BACKSPACE") {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else {
      if (currentGuess.length < word.length) {
        setCurrentGuess(prev => prev + key);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") onKeyPress("ENTER");
      else if (e.key === "Backspace") onKeyPress("BACKSPACE");
      else if (/^[A-Za-z]$/.test(e.key)) onKeyPress(e.key.toUpperCase());
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (loading) return <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center text-emerald-400">Chargement...</div>;

  const KEYBOARD_ROWS = [
    ["A", "Z", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["Q", "S", "D", "F", "G", "H", "J", "K", "L", "M"],
    ["ENTER", "W", "X", "C", "V", "B", "N", "BACKSPACE"]
  ];

  const getLetterColor = (letter, index, guess) => {
    if (word[index] === letter) return "bg-emerald-500 text-white border-emerald-500";
    if (word.includes(letter)) return "bg-yellow-500 text-white border-yellow-500";
    return "bg-white/10 text-white/40 border-white/10";
  };

  const getKeyboardKeyColor = (key) => {
    if (key === "ENTER" || key === "BACKSPACE") return "bg-white/10 text-white";
    let status = "bg-white/10 text-white";
    
    for (const guess of guesses) {
      for (let i = 0; i < guess.length; i++) {
        if (guess[i] === key) {
          if (word[i] === key) return "bg-emerald-500 text-white"; // Correct is strictly emerald
          if (word.includes(key)) status = "bg-yellow-500 text-white"; // Partial
          else if (status !== "bg-yellow-500 text-white") status = "bg-black/40 text-white/20"; // Wrong
        }
      }
    }
    return status;
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col items-center py-8 px-4 font-sans max-w-md mx-auto relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-20%] w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 w-full justify-center">
        <Gamepad2 className="text-emerald-400" size={28} />
        <h1 className="text-2xl font-black tracking-tight text-white uppercase">Le Mot du Campus</h1>
      </div>

      {/* Game Content */}
      {!isPaused ? (
        <>
          {wordData.hint && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 w-full text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Indice</div>
              <div className="text-sm text-white/80">{wordData.hint}</div>
            </div>
          )}

          {/* Grid */}
          <div className="flex flex-col gap-2 mb-auto w-full max-w-[300px] mx-auto">
            {Array.from({ length: MAX_GUESSES }).map((_, rowIndex) => {
              const isCurrentRow = rowIndex === guesses.length;
              const guess = guesses[rowIndex];
              
              return (
                <div key={rowIndex} className="flex gap-2 justify-center">
                  {Array.from({ length: word.length }).map((_, colIndex) => {
                    let letter = "";
                    let colorClass = "border-white/10";
                    
                    if (guess) {
                      letter = guess[colIndex];
                      colorClass = getLetterColor(letter, colIndex, guess);
                    } else if (isCurrentRow) {
                      letter = currentGuess[colIndex] || "";
                      colorClass = letter ? "border-white/40" : "border-white/10";
                      // Show revealed letter on current row if empty
                      if (!letter && wordData.revealed.includes(colIndex)) {
                        letter = word[colIndex];
                        colorClass = "border-white/10 text-emerald-500/50";
                      }
                    } else {
                      // Future rows
                      if (wordData.revealed.includes(colIndex)) {
                        letter = word[colIndex];
                        colorClass = "border-white/10 text-white/10";
                      }
                    }

                    return (
                      <div 
                        key={colIndex}
                        className={`flex-1 aspect-square max-h-[60px] flex items-center justify-center font-black text-2xl sm:text-3xl rounded-lg border-2 uppercase transition-all duration-300 ${colorClass}`}
                      >
                        {letter}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Status Messages */}
          {gameStatus === "won" && (
            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-6 text-center w-full mt-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-4xl mb-2">🏆</div>
              <h2 className="text-xl font-bold text-emerald-400 mb-1">Bravo !</h2>
              <p className="text-sm text-white/70">Tu as trouvé le mot du jour en {guesses.length} essai{guesses.length > 1 ? 's' : ''}.</p>
            </div>
          )}

          {gameStatus === "lost" && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center w-full mt-8 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold text-red-400 mb-1">Dommage !</h2>
              <p className="text-sm text-white/70">Le mot était : <span className="font-bold text-white">{word}</span></p>
            </div>
          )}

          {/* Keyboard */}
          {gameStatus === "playing" && (
            <div className="w-full mt-8 flex flex-col gap-2">
              {KEYBOARD_ROWS.map((row, i) => (
                <div key={i} className="flex justify-center gap-1.5 sm:gap-2">
                  {row.map(key => {
                    const isSpecial = key === "ENTER" || key === "BACKSPACE";
                    return (
                      <button
                        key={key}
                        onClick={() => onKeyPress(key)}
                        className={`${isSpecial ? 'px-2 sm:px-4 text-xs' : 'flex-1 max-w-[40px] text-sm'} 
                                  h-12 flex items-center justify-center font-bold rounded-lg transition-colors active:scale-95
                                  ${getKeyboardKeyColor(key)}`}
                      >
                        {key === "BACKSPACE" ? "⌫" : key === "ENTER" ? <Send size={16} /> : key}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center w-full mt-12 animate-in fade-in">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
            <span className="text-3xl">🎉</span>
          </div>
          <h2 className="text-3xl font-black text-emerald-400 mb-4 tracking-tight">Mot Trouvé !</h2>
          <p className="text-white/70 text-base max-w-sm mx-auto mb-8">
            Quelqu'un a été plus rapide que toi... Le jeu est en pause.
          </p>
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute inset-0 bg-emerald-500/5 z-0" />
            <div className="relative z-10">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-2">Prochain mot dans</div>
              <div className="text-4xl font-black font-mono text-white tabular-nums tracking-wider drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                {msLeft > 0 ? formatTime(msLeft) : "..."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
