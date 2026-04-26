"use client";

export function Card({ className = "", children, ...props }) {
  return (
    <div className={`relative border border-white/10 bg-[#141414]/80 backdrop-blur-3xl rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.4)] ${className}`} {...props}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none opacity-50" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
export function CardHeader({ className = "", children }) {
  return (
    <div className={`flex items-center justify-between gap-3 border-b border-white/10 px-8 py-6 bg-white/[0.01] ${className}`}>
      {children}
    </div>
  );
}
export function CardBody({ className = "", children }) {
  return <div className={`p-8 ${className}`}>{children}</div>;
}
export function CardTitle({ className = "", children, icon }) {
  return (
    <div className="flex items-center gap-2.5">
      {icon && <span className="text-violet/90 bg-violet/10 p-1.5 rounded-lg">{icon}</span>}
      <h3 className={`text-[12px] font-semibold uppercase tracking-[0.2em] text-white/80 ${className}`}>
        {children}
      </h3>
    </div>
  );
}
