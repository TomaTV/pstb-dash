import { NextResponse } from "next/server";
import { getFullDb, getStore, setStore, updateFullDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function seededPick(list, seed) {
  if (!Array.isArray(list) || !list.length) return "";
  return list[seed % list.length];
}

function dailySeed() {
  const d = new Date().toISOString().slice(0, 10);
  return Number(d.replaceAll("-", ""));
}

async function generateWithGroq(targets) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;

  const prompt = `Generate concise French campus content as strict JSON with keys: quote{text,author,role}, word{word,pronunciation,category,definition,example}, puzzle{category,question,hint,reward,cta}, wordle{word,hint}. Targets enabled: ${JSON.stringify(targets)}.`;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.6,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function generateFallback(targets) {
  const seed = dailySeed();
  return {
    quote: targets.quote
      ? {
          text: seededPick([
            "Le futur appartient a ceux qui apprennent tous les jours.",
            "Une idee vaut peu sans execution collective.",
            "La rigueur transforme les ambitions en resultats.",
          ], seed),
          author: seededPick(["PST&B", "Equipe Pedagogique", "Campus Lab"], seed + 1),
          role: "Campus Insight",
        }
      : null,
    word: targets.word
      ? {
          word: seededPick(["Scalabilite", "Resilience", "Automatisation"], seed + 2),
          pronunciation: "auto",
          category: "Tech & Business",
          definition: "Concept cle pour faire grandir un systeme de maniere fiable.",
          example: "Notre dashboard gagne en resilience grace a un mode automatique.",
        }
      : null,
    puzzle: targets.puzzle
      ? {
          category: "Enigme campus",
          question: seededPick([
            "Je suis utilise partout mais on ne me voit jamais. Qui suis-je ?",
            "Plus tu me partages, moins il t'en reste. Qui suis-je ?",
          ], seed + 3),
          hint: "Pense numerique.",
          reward: "Badge digital signage",
          cta: "repondre",
        }
      : null,
    wordle: targets.wordle
      ? {
          word: seededPick(["CAMPUS", "METIER", "PROJET"], seed + 4),
          hint: "Mot lie a la vie etudiante/pro.",
        }
      : null,
  };
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "1";
    const today = new Date().toISOString().slice(0, 10);
    const lastRun = getStore("auto_content_last_run");
    if (!force && lastRun === today) return NextResponse.json({ ok: true, skipped: true });

    const db = getFullDb();
    const settings = db.settings || {};
    const targets = settings.autoContent?.targets || { quote: true, word: true, puzzle: true, wordle: true };

    const generated = (await generateWithGroq(targets)) || generateFallback(targets);
    const widgets = Array.isArray(db.widgets) ? [...db.widgets] : [];

    const TYPE_LABELS = { quote: "Quote du jour", word: "Mot du jour", puzzle: "Énigme du jour", wordle: "Wordle PST&B" };

    const updateTypeData = (type, updater) => {
      let idx = widgets.findIndex((w) => w.type === type);
      if (idx < 0) {
        // Auto-create missing widget
        widgets.push({
          id: `${type}-auto-${Date.now()}`,
          type,
          title: TYPE_LABELS[type] || type,
          focusable: true,
          data: {},
        });
        idx = widgets.length - 1;
      }
      const extra = type === "wordle" ? { guesses: [], revealed: "0", pauseUntil: 0 } : {};
      widgets[idx] = { ...widgets[idx], data: { ...(widgets[idx].data || {}), ...updater, ...extra } };
    };

    if (generated.quote) updateTypeData("quote", generated.quote);
    if (generated.word) updateTypeData("word", generated.word);
    if (generated.puzzle) updateTypeData("puzzle", generated.puzzle);
    if (generated.wordle) updateTypeData("wordle", generated.wordle);

    updateFullDb({ ...db, widgets, settings });
    setStore("auto_content_last_run", today);

    return NextResponse.json({ ok: true, updated: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "auto_content_failed" }, { status: 500 });
  }
}
