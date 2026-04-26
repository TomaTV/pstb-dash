"use client";

import React from "react";

export default function FileToDataUrlInput({ accept = "image/*", onLoad, onClear, hasValue }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="file" accept={accept}
        onChange={async e => {
          const f = e.target.files?.[0]; if (!f) return;
          const r = new FileReader();
          r.onload = () => onLoad(r.result);
          r.readAsDataURL(f);
        }}
        className="flex-1 min-w-0 text-xs text-white/55 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-white/10 file:bg-white/5 file:text-white file:font-semibold file:cursor-pointer hover:file:bg-violet hover:file:text-white"
      />
      {hasValue && <button type="button" onClick={onClear} className="text-xs text-white/55 hover:text-red-400 px-2 shrink-0">Retirer</button>}
    </div>
  );
}
