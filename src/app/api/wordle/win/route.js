import { NextResponse } from "next/server";
import { getStore, setStore } from "@/lib/db";

const WORD_LIST = [
  { word: "STARTUP", hint: "Entreprise innovante à fort potentiel de croissance." },
  { word: "RESEAU", hint: "Ensemble de connexions professionnelles." },
  { word: "CAMPUS", hint: "Lieu où l'on étudie." },
  { word: "DIGITAL", hint: "Le monde du numérique." },
  { word: "PYTHON", hint: "Langage de programmation très populaire en data." },
  { word: "LEADER", hint: "Celui qui dirige et inspire une équipe." },
  { word: "INNOVER", hint: "Créer quelque chose de nouveau." },
  { word: "DONNEES", hint: "Informations brutes (Data) au cœur de la tech." },
  { word: "AGILE", hint: "Méthodologie de gestion de projet flexible." },
  { word: "PITCH", hint: "Présentation courte et percutante d'un projet." },
  { word: "CLOUD", hint: "Hébergement de données à distance." }
];

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.ip || "unknown";
    const ipKey = `rate_limit_wordle_${ip}`;
    const lastWin = getStore(ipKey);
    
    // Simple Rate Limiting: 1 win per IP per minute
    if (lastWin && Date.now() - lastWin < 60 * 1000) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const widgets = getStore("widgets");
    if (!widgets) {
      return NextResponse.json({ error: "DB not found" }, { status: 404 });
    }

    const wordleIndex = widgets.findIndex(w => w.type === "wordle");
    if (wordleIndex === -1) {
      return NextResponse.json({ error: "Wordle widget not found" }, { status: 404 });
    }

    const currentWordle = widgets[wordleIndex];
    const currentWord = currentWordle.data.word;

    // Pick a new word that is different from the current one
    let newWordData;
    do {
      newWordData = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    } while (newWordData.word === currentWord && WORD_LIST.length > 1);

    // Set pause for 5 minutes
    const pauseUntil = Date.now() + 5 * 60 * 1000;

    // Update the widget
    widgets[wordleIndex] = {
      ...currentWordle,
      data: {
        ...currentWordle.data,
        word: newWordData.word,
        hint: newWordData.hint,
        revealed: "0", // Reset revealed
        guesses: [], // Reset the guesses array for the new game
        pauseUntil: pauseUntil,
        pauseMode: false, // Turn off manual pause
      }
    };

    setStore("widgets", widgets);
    setStore(ipKey, Date.now());

    return NextResponse.json({ success: true, pauseUntil });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
