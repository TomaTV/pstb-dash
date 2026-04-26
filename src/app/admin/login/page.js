"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowRight, AlertCircle, Shield } from "lucide-react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    document.body.setAttribute("data-admin", "true");
    setMounted(true);
    // Auto-focus password field
    const t = setTimeout(() => inputRef.current?.focus(), 600);
    return () => {
      clearTimeout(t);
      document.body.removeAttribute("data-admin");
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim() || loading) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        const data = await res.json();
        setError(data.error || "Mot de passe incorrect");
        setPassword("");
        inputRef.current?.focus();
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#050505]">
      {/* ── Ambient background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(101,31,255,0.12) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,23,68,0.08) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── Login card ── */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 30, scale: mounted ? 1 : 0.96 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px] mx-4"
      >
        {/* Card */}
        <div className="relative rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]">
          {/* Glow on top */}
          <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-violet/40 to-transparent" />

          <div className="px-10 pt-12 pb-10">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-col items-center mb-10"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-violet/20 rounded-2xl blur-xl scale-125" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet/20 to-violet/5 border border-violet/20 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo-svg.svg"
                    alt="PST&B"
                    className="w-9 h-9 object-contain"
                  />
                </div>
              </div>

              <h1 className="text-[22px] font-bold text-white tracking-tight">
                Administration
              </h1>
              <p className="text-sm text-white/35 mt-1.5 text-center leading-relaxed">
                Panneau de contrôle du Campus Dashboard
              </p>
            </motion.div>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Password field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30 mb-2.5"
                >
                  Mot de passe
                </label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
                    <Lock size={16} className="text-white/20 group-focus-within:text-violet/60 transition-colors" />
                  </div>
                  <input
                    ref={inputRef}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full h-12 pl-12 pr-12 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 text-sm font-medium outline-none focus:border-violet/40 focus:bg-white/[0.06] focus:ring-1 focus:ring-violet/20 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-white/20 hover:text-white/50 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -5, height: 0 }}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red/10 border border-red/20"
                  >
                    <AlertCircle size={15} className="text-red shrink-0" />
                    <span className="text-sm text-red font-medium">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={(loading || !password.trim()) || undefined}
                className="relative w-full h-12 rounded-xl font-semibold text-sm text-white overflow-hidden transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                {/* Button background */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet to-[#8B5CF6] group-hover:from-[#7B2FFF] group-hover:to-[#9B6FFF] transition-all duration-300" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)" }} />

                <div className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <span>Se connecter</span>
                      <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </motion.form>
          </div>

          {/* Footer */}
          <div className="px-10 py-4 border-t border-white/[0.04] flex items-center justify-center gap-2">
            <Shield size={12} className="text-white/15" />
            <span className="text-[11px] text-white/15 font-medium tracking-wide">
              Accès réservé aux administrateurs
            </span>
          </div>
        </div>

        {/* Ambient reflection below card */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-violet/5 rounded-full blur-2xl" />
      </motion.div>
    </div>
  );
}
