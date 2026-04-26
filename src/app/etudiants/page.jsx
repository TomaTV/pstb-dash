"use client";

import { useState } from "react";
import { Megaphone, Upload, CheckCircle } from "lucide-react";
import FileToDataUrlInput from "@/components/FileToDataUrlInput";

export default function EtudiantsPage() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    dateLabel: "",
    submitter: "",
    qrUrl: "",
    imageUrl: "",
  });
  const [status, setStatus] = useState("idle"); // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch (e) {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h1 className="text-2xl font-black tracking-tight mb-2">Demande envoyée !</h1>
          <p className="text-white/60">
            Votre demande a été soumise avec succès. Elle sera diffusée sur les écrans du campus une fois validée par un administrateur.
          </p>
          <button
            onClick={() => {
              setForm({ title: "", description: "", dateLabel: "", submitter: "", qrUrl: "", imageUrl: "" });
              setStatus("idle");
            }}
            className="mt-8 bg-white/10 hover:bg-white/15 px-6 py-3 rounded-full font-bold transition-colors"
          >
            Soumettre un autre contenu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans selection:bg-violet selection:text-white">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-violet rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(101,31,255,0.4)]">
            <Megaphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Espace Étudiants & BDE</h1>
            <p className="text-white/50 font-medium">Proposez du contenu pour les écrans du campus</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white/[0.02] border border-white/5 rounded-3xl p-8 md:p-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Titre de l'événement</label>
              <input
                required
                type="text"
                placeholder="Ex: Soirée d'intégration"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Organisateur (Assos/BDE)</label>
              <input
                required
                type="text"
                placeholder="Ex: BDE ou Club eSport"
                value={form.submitter}
                onChange={e => setForm({ ...form, submitter: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Description courte</label>
            <textarea
              required
              rows={3}
              placeholder="Ex: Rejoignez-nous pour la plus grande soirée de l'année au Duplex..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Date & Heure (Optionnel)</label>
              <input
                type="text"
                placeholder="Ex: Jeudi 24 Octobre à 20h"
                value={form.dateLabel}
                onChange={e => setForm({ ...form, dateLabel: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Lien QR Code (Optionnel)</label>
              <input
                type="url"
                placeholder="Ex: https://linktr.ee/..."
                value={form.qrUrl}
                onChange={e => setForm({ ...form, qrUrl: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Image / Affiche (Optionnel)</label>
            <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus-within:border-violet transition-colors">
              <FileToDataUrlInput
                hasValue={!!form.imageUrl}
                onLoad={v => setForm({ ...form, imageUrl: v })}
                onClear={() => setForm({ ...form, imageUrl: "" })}
                accept="image/*"
              />
            </div>
            <p className="text-xs text-white/30 mt-1">L'image sera utilisée comme fond d'écran de l'annonce.</p>
          </div>

          {status === "error" && (
            <div className="bg-red-500/20 text-red-300 px-4 py-3 rounded-lg text-sm border border-red-500/30">
              Une erreur est survenue lors de l'envoi de la demande. Veuillez réessayer.
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading" || !form.title || !form.description || !form.submitter}
            className="w-full bg-violet hover:bg-violet/80 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(101,31,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "loading" ? "Envoi en cours..." : "Soumettre pour validation"}
          </button>

        </form>
      </div>
    </div>
  );
}
