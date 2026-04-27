import { NextResponse } from "next/server";
import { getStore, setStore, updateFullDb, getFullDb } from "@/lib/db";

const defaultState = {
  settings: {
    autoRotate: true,
    rotateInterval: 15,
    viewMode: "scene",
  },
  widgets: []
};

export async function GET() {
  const db = getFullDb();
  if (Object.keys(db).length === 0) {
    return NextResponse.json(defaultState);
  }
  return NextResponse.json({
    settings: db.settings || defaultState.settings,
    widgets: db.widgets || defaultState.widgets
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const currentDB = getFullDb();
    
    const screenId = body.screenId;
    const nextDB = {};
    
    if (screenId && screenId !== "main") {
      nextDB[`settings_${screenId}`] = body.settings ?? currentDB[`settings_${screenId}`] ?? defaultState.settings;
      nextDB[`widgets_${screenId}`] = body.widgets ?? currentDB[`widgets_${screenId}`] ?? defaultState.widgets;
    } else {
      nextDB.settings = body.settings ?? currentDB.settings ?? defaultState.settings;
      nextDB.widgets = body.widgets ?? currentDB.widgets ?? defaultState.widgets;
    }

    updateFullDb(nextDB);
    return NextResponse.json(nextDB);
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
