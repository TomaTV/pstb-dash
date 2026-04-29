import { NextResponse } from "next/server";
import { getStore, setStore } from "@/lib/db";

export async function POST(req) {
  try {
    let { guess } = await req.json();
    if (!guess || typeof guess !== "string") return NextResponse.json({ error: "Missing guess" }, { status: 400 });

    const widgets = await getStore("widgets");
    if (!widgets) return NextResponse.json({ error: "DB not found" }, { status: 404 });

    const wordleIndex = widgets.findIndex(w => w.type === "wordle");
    if (wordleIndex === -1) return NextResponse.json({ error: "Wordle widget not found" }, { status: 404 });

    const currentWordle = widgets[wordleIndex];
    
    // Only accept guess if we are not paused
    const pauseUntil = currentWordle.data.pauseUntil || 0;
    if (Date.now() < pauseUntil || currentWordle.data.pauseMode) {
        return NextResponse.json({ error: "Game is paused" }, { status: 400 });
    }

    // Sanitize guess: uppercase, alphabetic only, slice to word length
    const targetLength = currentWordle.data.word?.length || 5;
    guess = guess.toUpperCase().replace(/[^A-Z]/g, "").slice(0, targetLength);
    if (!guess) return NextResponse.json({ error: "Invalid guess format" }, { status: 400 });

    let guesses = currentWordle.data.guesses || [];
    guesses.push(guess);
    
    // Keep only the last 5 guesses (since the first row is the target word)
    if (guesses.length > 5) {
        guesses = guesses.slice(-5);
    }

    widgets[wordleIndex] = {
      ...currentWordle,
      data: {
        ...currentWordle.data,
        guesses
      }
    };

    await setStore("widgets", widgets);
    return NextResponse.json({ success: true, guesses });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
