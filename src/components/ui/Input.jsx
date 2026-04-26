"use client";

import { forwardRef } from "react";

const base = "w-full rounded-lg bg-white/[0.03] border border-white/10 px-4 py-3 text-sm text-text placeholder:text-white/30 transition-all duration-300 focus:outline-none focus:border-violet/60 focus:bg-white/[0.08] focus:ring-4 focus:ring-violet/10";
export const Input = forwardRef(function Input({ className = "", label, hint, ...props }, ref) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-[11px] font-medium uppercase tracking-widest text-sub">{label}</span>}
      <input ref={ref} className={`${base} ${className}`} {...props} />
      {hint && <span className="text-xs text-sub">{hint}</span>}
    </label>
  );
});

export const Textarea = forwardRef(function Textarea({ className = "", label, rows = 3, ...props }, ref) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-[11px] font-medium uppercase tracking-widest text-sub">{label}</span>}
      <textarea ref={ref} rows={rows} className={`${base} resize-none ${className}`} {...props} />
    </label>
  );
});
