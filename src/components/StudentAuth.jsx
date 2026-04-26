"use client";

import { useState, useEffect } from "react";
import { User, Key, Mail, ArrowRight, ShieldCheck, UserCircle2 } from "lucide-react";

export default function StudentAuth({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("login"); // "login" | "register" | "pin_reveal"
  const [pin, setPin] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    pin: ""
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser(data.user);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      if (mode === "register") {
        setPin(data.pin);
        setMode("pin_reveal");
      } else {
        setUser(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishRegister = () => {
    // Refresh to get session
    window.location.reload();
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center text-emerald-400">Chargement...</div>;
  }

  if (user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md relative z-10">
        
        {mode === "pin_reveal" ? (
          <div className="text-center animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-black mb-2">Compte créé !</h2>
            <p className="text-white/60 mb-8">Voici votre code PIN secret. Gardez-le précieusement, il vous servira à vous reconnecter.</p>
            
            <div className="text-5xl font-mono font-black text-emerald-400 tracking-[0.5em] mb-8 bg-black/40 py-6 rounded-2xl border border-white/5 shadow-inner">
              {pin}
            </div>

            <button 
              onClick={handleFinishRegister}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-4 rounded-xl transition-colors flex justify-center items-center gap-2"
            >
              J'ai noté mon code <ArrowRight size={20} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 animate-in fade-in">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-violet-500/20 text-violet-400 rounded-full flex items-center justify-center mx-auto mb-4">
                {mode === "register" ? <UserCircle2 size={32} /> : <Key size={32} />}
              </div>
              <h2 className="text-2xl font-black">{mode === "register" ? "Créer un profil" : "Connexion"}</h2>
              <p className="text-white/50 text-sm mt-2">
                {mode === "register" ? "Un profil unique pour participer aux jeux et sondages du campus." : "Entrez votre email et votre code PIN secret."}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                <input 
                  type="email"
                  required
                  placeholder="Email (@stu-pstb.fr)"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />
              </div>

              {mode === "register" && (
                <>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                    <input 
                      type="text"
                      required
                      placeholder="Prénom"
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                    <input 
                      type="text"
                      required
                      placeholder="Nom"
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                    />
                  </div>
                </>
              )}

              {mode === "login" && (
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                  <input 
                    type="text"
                    required
                    placeholder="Code PIN (4 chiffres)"
                    maxLength={4}
                    pattern="\d{4}"
                    value={formData.pin}
                    onChange={e => setFormData({...formData, pin: e.target.value.replace(/\D/g, '')})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-mono tracking-widest"
                  />
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-white/90 transition-colors mt-2 disabled:opacity-50"
            >
              {loading ? "..." : (mode === "register" ? "Générer mon PIN" : "Se connecter")}
            </button>

            <div className="text-center mt-2">
              <button 
                type="button" 
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError("");
                }}
                className="text-sm text-white/50 hover:text-white transition-colors underline underline-offset-4"
              >
                {mode === "login" ? "Créer un profil" : "J'ai déjà un profil"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
