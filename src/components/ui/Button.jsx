"use client";

import { forwardRef } from "react";

const VARIANTS = {
  primary:   "bg-[#FF1744] text-white hover:bg-[#E0143C] shadow-lg shadow-[#FF1744]/20",
  secondary: "bg-elevated text-text border border-border hover:border-violet/40",
  ghost:     "text-sub hover:text-text hover:bg-elevated",
  danger:    "bg-pink text-white hover:bg-pink/90",
};
const SIZES = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

const Button = forwardRef(function Button(
  { variant = "secondary", size = "md", className = "", children, leftIcon, rightIcon, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet/40 disabled:opacity-40 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {leftIcon}{children}{rightIcon}
    </button>
  );
});

export default Button;
