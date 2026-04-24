"use client";

export function Card({ className = "", children, ...props }) {
  return (
    <div className={`border border-border bg-surface rounded-2xl ${className}`} {...props}>
      {children}
    </div>
  );
}
export function CardHeader({ className = "", children }) {
  return (
    <div className={`flex items-center justify-between gap-3 border-b border-border px-5 py-4 ${className}`}>
      {children}
    </div>
  );
}
export function CardBody({ className = "", children }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
export function CardTitle({ className = "", children, icon }) {
  return (
    <div className="flex items-center gap-2">
      {icon && <span className="text-violet">{icon}</span>}
      <h3 className={`text-[11px] font-medium uppercase tracking-[0.22em] text-sub ${className}`}>
        {children}
      </h3>
    </div>
  );
}
