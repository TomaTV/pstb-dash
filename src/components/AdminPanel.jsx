"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Check, Eye, Maximize2, Settings2, Plus, Trash2, GripVertical,
  Zap, Edit3, Timer, Power, PowerOff, Film, LayoutGrid, RotateCcw,
  Calendar, BarChart3, Clock as ClockIcon, Newspaper, Sparkles, FileText,
  Quote as QuoteIcon, Sun, Share2, Brain, TrendingDown, Images, PartyPopper,
  X as XIcon, BookOpen, Gamepad2, Train, Briefcase, Radio, AlertTriangle, LogOut,
  Activity, Wifi, WifiOff, RefreshCw, Save, UserPlus, QrCode, Users, Download, Copy, Key, ChevronDown, Monitor
} from "lucide-react";
import QRCode from "react-qr-code";
import { useDashboard } from "@/context/DashboardContext";
import { Card, CardHeader, CardBody, CardTitle } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { NEW_WIDGET_DEFAULTS, PRESETS } from "@/lib/widgets";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const TYPE_META = {
  "next-event": { label: "Événement", Icon: Calendar, color: "text-violet" },
  poll: { label: "Sondage", Icon: BarChart3, color: "text-pink-400" },
  clock: { label: "Horloge", Icon: ClockIcon, color: "text-blue-400" },
  rss: { label: "Flux news", Icon: Newspaper, color: "text-amber-400" },
  showcase: { label: "Visuel", Icon: Sparkles, color: "text-fuchsia-400" },
  iframe: { label: "Document", Icon: FileText, color: "text-emerald-400" },
  quote: { label: "Citation", Icon: QuoteIcon, color: "text-violet" },
  weather: { label: "Météo", Icon: Sun, color: "text-blue-300" },
  puzzle: { label: "Énigme", Icon: Brain, color: "text-violet" },
  business: { label: "Stat marquante", Icon: TrendingDown, color: "text-red-400" },
  gallery: { label: "Galerie", Icon: Images, color: "text-fuchsia-400" },
  spo: { label: "SPO", Icon: PartyPopper, color: "text-violet" },
  word: { label: "Mot du jour", Icon: BookOpen, color: "text-violet" },
  wordle: { label: "Jeu Wordle", Icon: Gamepad2, color: "text-emerald-400" },
  transport: { label: "Info trafic", Icon: Train, color: "text-blue-400" },
  social: { label: "Post social", Icon: Share2, color: "text-blue-500" },
  jobs: { label: "Offres", Icon: Briefcase, color: "text-amber-400" },
  student: { label: "BDE", Icon: PartyPopper, color: "text-emerald-400" },
  crypto: { label: "Crypto", Icon: TrendingDown, color: "text-amber-400" },
  countdown: { label: "Countdown", Icon: Timer, color: "text-violet" },
  "github-trending": { label: "GitHub", Icon: Sparkles, color: "text-white" },
  hub: { label: "Hub PST&B", Icon: Sparkles, color: "text-violet" },
  "network-status": { label: "État réseau", Icon: Wifi, color: "text-emerald-400" },
  "campus-map": { label: "Salles Libres", Icon: LayoutGrid, color: "text-emerald-400" },
  "spo-video": { label: "SPO Vidéo", Icon: Film, color: "text-violet" },
  video: { label: "Vidéo seule", Icon: Film, color: "text-blue-400" },
  "bfm-stream": { label: "BFM Direct", Icon: Radio, color: "text-red-500" },
};



const ADD_CATEGORIES = [
  {
    name: "Événementiel & Campus",
    items: [
      { type: "next-event", label: "Événement", data: () => ({ name: "Nouvel événement", date: new Date().toISOString() }) },
      { type: "spo", label: "SPO", data: () => NEW_WIDGET_DEFAULTS.spo },
      { type: "gallery", label: "Galerie", data: () => NEW_WIDGET_DEFAULTS.gallery },
      { type: "clock", label: "Horloge", data: () => ({ city: "Paris", timezone: "Europe/Paris" }) },
      { type: "transport", label: "Info trafic", data: () => NEW_WIDGET_DEFAULTS.transport },
      { type: "student", label: "BDE / Étudiants", data: () => NEW_WIDGET_DEFAULTS.student },
      { type: "campus-map", label: "Carte / Salles", data: () => ({}) },
      { type: "spo-video", label: "SPO Vidéo", data: () => NEW_WIDGET_DEFAULTS["spo-video"] },
    ]

  },
  {
    name: "Contenu & Tech",
    items: [
      { type: "word", label: "Mot du jour", data: () => NEW_WIDGET_DEFAULTS.word },
      { type: "business", label: "Stat", data: () => NEW_WIDGET_DEFAULTS.business },
      { type: "quote", label: "Citation", data: () => ({ text: "", author: "", role: "" }) },
      { type: "rss", label: "Flux news", data: () => ({ source: "", url: "", items: [] }) },
      { type: "weather", label: "Météo", data: () => NEW_WIDGET_DEFAULTS.weather },
      { type: "social", label: "Post social", data: () => NEW_WIDGET_DEFAULTS.social },
      { type: "jobs", label: "Offres emploi", data: () => NEW_WIDGET_DEFAULTS.jobs },
      { type: "bfm-stream", label: "BFM Direct", data: () => ({ type: "business" }) },
    ]
  },
  {
    name: "Interactivité & Médias",
    items: [
      { type: "poll", label: "Sondage", data: () => ({ question: "Question ?", options: [] }) },
      { type: "puzzle", label: "Énigme", data: () => NEW_WIDGET_DEFAULTS.puzzle },
      { type: "wordle", label: "Jeu Wordle", data: () => NEW_WIDGET_DEFAULTS.wordle },
      { type: "showcase", label: "Visuel", data: () => ({ variant: "webcam" }) },
      { type: "iframe", label: "Document", data: () => ({ url: "" }) },
      { type: "video", label: "Vidéo Plein Écran", data: () => NEW_WIDGET_DEFAULTS.video },
    ]

  },
  {
    name: "Live Data & Hub",
    items: [
      { type: "hub", label: "Hub PST&B", data: () => NEW_WIDGET_DEFAULTS.hub },
      { type: "network-status", label: "État réseau campus", data: () => NEW_WIDGET_DEFAULTS["network-status"] },
      { type: "countdown", label: "Compte à rebours", data: () => NEW_WIDGET_DEFAULTS.countdown },
      { type: "crypto", label: "Crypto Markets", data: () => NEW_WIDGET_DEFAULTS.crypto },
      { type: "github-trending", label: "GitHub Trending", data: () => NEW_WIDGET_DEFAULTS["github-trending"] },
    ]
  }
];

/* ════════════════════════════════════════════
   ADMIN PANEL
═══════════════════════════════════════════════ */
export default function AdminPanel() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  useEffect(() => setIsMounted(true), []);
  const {
    widgets, settings, focusedId,
    activeScreenId, setActiveScreenId,
    updateWidget, updateWidgets, updateWidgetData, updateSettings,
    addWidget, deleteWidget, reorderWidgets, resetWidgets, loadPreset,
  } = useDashboard();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const [selectedId, setSelectedId] = useState(widgets[0]?.id ?? null);
  const [savedAt, setSavedAt] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "Confirmer",
    tone: "danger",
    hint: "",
  });

  const askConfirm = (title, message, onConfirm, options = {}) =>
    setConfirmModal({
      open: true,
      title,
      message,
      onConfirm,
      confirmText: options.confirmText || "Confirmer",
      tone: options.tone || "danger",
      hint: options.hint || "",
    });
  const closeConfirm = () => setConfirmModal(s => ({ ...s, open: false }));

  const selectedWidget = widgets.find(w => w.id === selectedId) ?? null;
  const flash = () => { setSavedAt(Date.now()); setTimeout(() => setSavedAt(null), 1500); };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = widgets.findIndex(w => w.id === active.id);
    const newIdx = widgets.findIndex(w => w.id === over.id);
    const next = arrayMove(widgets, oldIdx, newIdx);
    reorderWidgets(next.map(w => w.id));
    flash();
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-violet/30 selection:text-white">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-25%] left-[-10%] w-[55%] h-[55%] bg-violet/12 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[45%] h-[45%] bg-blue-500/8 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[35%] h-[40%] bg-red-500/6 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 h-screen mx-auto w-full max-w-[1640px] px-4 lg:px-8 py-4 flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <header className="flex items-center justify-between bg-[#13131A]/80 border border-white/10 backdrop-blur-xl rounded-2xl px-6 py-4 mb-6 shrink-0 shadow-lg">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-full hover:bg-white/8 transition-colors" title="Retour">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-violet block mb-0.5">PST&B · Cockpit</span>
              <h1 className="text-xl font-bold text-white leading-none tracking-tight">Configuration</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group mr-2">
              <div className="flex items-center gap-2 bg-[#1c1c24] hover:bg-[#252530] border border-white/10 rounded-lg px-3 py-1.5 transition-colors shadow-inner">
                <Monitor size={14} className="text-violet" />
                <select
                  value={activeScreenId}
                  onChange={(e) => setActiveScreenId(e.target.value)}
                  className="bg-transparent text-white text-sm font-semibold outline-none cursor-pointer appearance-none pr-8 focus:ring-0"
                >
                  <option value="main" className="bg-[#13131A]">TV Principale</option>
                  <option value="tv2" className="bg-[#13131A]">TV 2</option>
                  <option value="tv3" className="bg-[#13131A]">TV 3</option>
                </select>
                <ChevronDown size={14} className="text-white/50 absolute right-3 pointer-events-none group-hover:text-white transition-colors" />
              </div>
            </div>

            {savedAt && (
              <span className="inline-flex items-center gap-1.5 text-xs text-violet font-semibold bg-violet/10 px-3 py-1.5 rounded-full">
                <Check size={12} /> Enregistré
              </span>
            )}

            <div className="h-6 w-px bg-white/10 mx-2" />

            <button
              onClick={() => setSelectedId("analytics")}
              className={`p-2.5 rounded-full transition-colors ${selectedId === "analytics" ? "bg-emerald-500/20 text-emerald-400" : "text-white/60 hover:text-white hover:bg-white/8"}`}
              title="Analytics"
            >
              <Activity size={18} />
            </button>

            <button
              onClick={() => setSelectedId("settings")}
              className={`p-2.5 rounded-full transition-colors ${selectedId === "settings" ? "bg-violet/20 text-violet" : "text-white/60 hover:text-white hover:bg-white/8"}`}
              title="Paramètres globaux"
            >
              <Settings2 size={18} />
            </button>

            {settings.viewMode === "orbit" && (
              <button
                onClick={() => setSelectedId("orbit-config")}
                className={`p-2.5 rounded-full transition-colors ${selectedId === "orbit-config" ? "bg-violet/20 text-violet" : "text-white/60 hover:text-white hover:bg-white/8"}`}
                title="Configuration des satellites"
              >
                <LayoutGrid size={18} />
              </button>
            )}

            <div className="h-6 w-px bg-white/10 mx-2" />

            <div id="admin-save-action" className="empty:hidden mr-1" />

            <Link href={`/?screen=${activeScreenId}`} target="_blank" title="Voir en direct">
              <button className="p-2.5 rounded-full text-white/60 hover:text-white hover:bg-white/8 transition-colors">
                <Eye size={18} />
              </button>
            </Link>
            <Link href={`/?screen=${activeScreenId}`} title="Lancer l'affichage">
              <button className="p-2.5 rounded-full bg-violet/20 text-violet hover:bg-violet/30 transition-colors shadow-[0_0_15px_rgba(101,31,255,0.3)]">
                <Maximize2 size={18} />
              </button>
            </Link>

            <div className="h-6 w-px bg-white/10 mx-1" />

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-full text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Déconnexion"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* ── 2 columns ── */}
        <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0 overflow-hidden">

          {/* ═══ LEFT SIDEBAR ═══ */}
          <aside className="w-full lg:w-[320px] shrink-0 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 pb-4">
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/45 flex items-center gap-2">
                <span>{settings.viewMode === "scene" ? "Séquence Principale" : "Liste des widgets"}</span>
                <span className="bg-white/10 px-2 py-0.5 rounded text-white/60 font-mono">{widgets.filter(w => w.status !== "pending").length}</span>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-violet hover:text-white transition-colors bg-violet/10 hover:bg-violet/30 px-3 py-1.5 rounded-lg"
              >
                <Plus size={12} strokeWidth={3} /> Ajouter
              </button>
            </div>
            <div className="flex gap-2 px-2 mb-2">
              <button
                onClick={() => { widgets.filter(w => w.status !== "pending").forEach(w => updateWidget(w.id, { focusable: true })); flash(); }}
                className="flex-1 text-[10px] uppercase tracking-wider font-bold text-emerald-400 hover:text-white transition-colors bg-emerald-500/10 hover:bg-emerald-500/25 px-3 py-1.5 rounded-lg"
              >
                Tout activer
              </button>
              <button
                onClick={() => { widgets.filter(w => w.status !== "pending").forEach(w => updateWidget(w.id, { focusable: false })); flash(); }}
                className="flex-1 text-[10px] uppercase tracking-wider font-bold text-red-400 hover:text-white transition-colors bg-red-500/10 hover:bg-red-500/25 px-3 py-1.5 rounded-lg"
              >
                Tout désactiver
              </button>
            </div>

            <div>
              {widgets.filter(w => w.status === "pending").length > 0 && (
                <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-3 flex items-center gap-2">
                    En attente de validation
                  </div>
                  <div className="space-y-2">
                    {widgets.filter(w => w.status === "pending").map((w) => (
                      <div
                        key={w.id}
                        onClick={() => setSelectedId(w.id)}
                        className={`cursor-pointer px-4 py-3 rounded-xl border transition-all ${selectedId === w.id ? "bg-amber-500/20 border-amber-500/40" : "bg-white/5 border-white/10 hover:bg-white/10"
                          }`}
                      >
                        <div className="font-bold text-sm text-white truncate">{w.title}</div>
                        <div className="text-xs text-white/50 truncate mt-0.5">{w.data?.submitter || "Étudiant / BDE"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={widgets.filter(w => w.status !== "pending").map(w => w.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {widgets.filter(w => w.status !== "pending").map((w, i) => (
                      <SortableRow
                        key={w.id} widget={w} index={i}
                        selected={selectedId === w.id}
                        onSelect={() => setSelectedId(w.id)}
                        onToggleActive={() => { updateWidget(w.id, { focusable: !w.focusable }); flash(); }}
                        onDelete={() => {
                          askConfirm(
                            "Supprimer ce widget",
                            `"${w.title}" sera retiré de la séquence définitivement.`,
                            () => { deleteWidget(w.id); if (selectedId === w.id) setSelectedId("settings"); },
                            {
                              confirmText: "Supprimer",
                              tone: "danger",
                              hint: "Action irreversible - ce widget et sa configuration seront perdus.",
                            }
                          );
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </aside>

          {/* ═══ RIGHT PANEL ═══ */}
          <section className="flex-1 min-w-0 bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 lg:p-8 overflow-y-auto custom-scrollbar flex flex-col relative shadow-[0_0_40px_rgba(0,0,0,0.2)]">
            {selectedId === "analytics" ? (
              <AnalyticsPanel widgets={widgets} settings={settings} />
            ) : selectedId === "settings" ? (
              <GlobalSettingsPanel
                widgets={widgets}
                settings={settings}
                addWidget={addWidget}
                onChange={(p) => { updateSettings(p); flash(); }}
                onReset={() => askConfirm(
                  "Réinitialiser",
                  "Tous les widgets seront remplacés par les widgets d'usine. Cette action est irréversible.",
                  () => resetWidgets()
                )}
                onLoadPreset={(p, label) => askConfirm(
                  "Charger un preset",
                  `La séquence actuelle sera remplacée par "${label}". Les widgets non sauvegardés seront perdus.`,
                  () => { loadPreset(p); flash(); }
                )}
              />
            ) : selectedId === "orbit-config" ? (
              <div className="max-w-4xl mx-auto w-full">
                <SectionTitle eyebrow="Mode Orbite" title="Configuration des satellites" hint="Choisis les widgets qui occupent chacun des 4 emplacements satellites autour du widget principal." />
                <div className="mt-8">
                  <OrbitSlotsConfig widgets={widgets} slots={settings.orbitSlots?.satellites ?? [[], [], [], []]} onChange={s => { updateSettings({ orbitSlots: { ...(settings.orbitSlots || {}), satellites: s } }); flash(); }} />
                </div>
              </div>
            ) : selectedWidget ? (
              <div className="max-w-4xl mx-auto w-full">
                {selectedWidget.status === "pending" && (
                  <div className="mb-8 p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-amber-500 mb-1">Validation requise</h3>
                      <p className="text-sm text-white/70">Ce contenu a été soumis par un étudiant/BDE. Vérifiez-le avant de l'afficher sur les écrans.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => askConfirm(
                          "Refuser la demande",
                          "Ce contenu soumis sera supprimé définitivement. L'étudiant ne sera pas notifié.",
                          () => { deleteWidget(selectedWidget.id); setSelectedId("settings"); }
                        )}
                        className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold transition-colors"
                      >
                        Refuser
                      </button>
                      <button
                        onClick={() => {
                          const placeholders = widgets.filter(w =>
                            w.type === "student" &&
                            w.id !== selectedWidget.id &&
                            w.status !== "pending" &&
                            !w.data?.title
                          );

                          if (updateWidgets) {
                            const updates = [
                              { id: selectedWidget.id, patch: { status: "approved" } },
                              ...placeholders.map(p => ({ id: p.id, patch: { focusable: false } }))
                            ];
                            updateWidgets(updates);
                          } else {
                            // Fallback
                            updateWidget(selectedWidget.id, { status: "approved" });
                            placeholders.forEach(p => updateWidget(p.id, { focusable: false }));
                          }

                          flash();
                        }}
                        className="px-6 py-2 rounded-xl bg-emerald-500 text-white font-black hover:bg-emerald-600 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      >
                        Approuver & Afficher
                      </button>
                    </div>
                  </div>
                )}
                <EditorPanel
                  widget={selectedWidget}
                  onChange={(patch) => { updateWidget(selectedWidget.id, patch); flash(); }}
                  onChangeData={(patch) => { updateWidgetData(selectedWidget.id, patch); flash(); }}
                />
              </div>
            ) : (
              <EmptyState message="Sélectionne un élément dans le menu à gauche pour le modifier." />
            )}
          </section>
        </div>
      </main>

      {/* MODAL AJOUTER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 w-full max-w-4xl shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors">
              <XIcon size={20} />
            </button>
            <SectionTitle eyebrow="Bibliothèque" title="Ajouter un widget" hint="Choisis le type de widget à intégrer à la séquence." />
            <div className="mt-8 space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {ADD_CATEGORIES.map((cat, idx) => (
                <div key={idx}>
                  <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                    {cat.name}
                    <div className="h-px bg-white/10 flex-1" />
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {cat.items.map(b => {
                      const meta = TYPE_META[b.type];
                      const Icon = meta?.Icon ?? Sparkles;
                      return (
                        <button
                          key={b.type + b.label}
                          onClick={() => {
                            addWidget(b.type, b.label, b.data());
                            flash();
                            setShowAddModal(false);
                          }}
                          className="group flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.015] hover:bg-violet/10 hover:border-violet/40 p-3 text-left transition-colors"
                        >
                          <div className={`p-2 rounded-lg bg-white/5 group-hover:scale-110 transition-transform ${meta?.color ?? "text-white"}`}>
                            <Icon size={16} strokeWidth={2} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white group-hover:text-violet transition-colors">{b.label}</div>
                            <div className="text-[10px] text-white/40 mt-0.5 line-clamp-1">Widget {meta?.label?.toLowerCase() || b.type}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm modal ── */}
      {confirmModal.open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={closeConfirm}
        >
          <div
            className="relative overflow-hidden bg-[#111] border border-white/12 rounded-3xl p-6 w-[min(92vw,460px)] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-red-500/[0.07] via-transparent to-transparent" />
            <div className="flex items-start gap-3.5 mb-5">
              <div className="shrink-0 mt-0.5 w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                <AlertTriangle size={18} className="text-red-400" />
              </div>
              <div className="relative z-10">
                <div className="text-[10px] font-bold uppercase tracking-[0.35em] text-red-300/80 mb-1">Confirmation requise</div>
                <h3 className="text-lg leading-tight font-black text-white">{confirmModal.title}</h3>
                <p className="text-sm text-white/55 mt-1.5 leading-relaxed">{confirmModal.message}</p>
                {confirmModal.hint && (
                  <p className="text-[10px] text-red-300/75 mt-2 font-medium">{confirmModal.hint}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={closeConfirm}
                className="px-4 py-1.5 rounded-xl border border-white/10 text-white/55 hover:text-white hover:border-white/20 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors"
              >
                Annuler
              </button>
              <div className="flex-1" />
              <button
                onClick={() => { confirmModal.onConfirm?.(); closeConfirm(); }}
                className="px-5 py-1.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-[10px] font-black uppercase tracking-[0.15em] transition-colors shadow-[0_2px_12px_rgba(239,68,68,0.3)]"
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   ATOMS
═══════════════════════════════════════════════ */
function SectionTitle({ eyebrow, title, hint }) {
  return (
    <div>
      {eyebrow && <div className="text-[9px] font-bold uppercase tracking-[0.35em] text-violet mb-1.5">{eyebrow}</div>}
      <h2 className="text-lg font-bold text-white tracking-tight leading-none">{title}</h2>
      {hint && <p className="text-[11px] text-white/45 mt-1.5">{hint}</p>}
    </div>
  );
}



function EmptyState({ message }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 mb-4">
        <Sparkles size={24} />
      </div>
      <p className="text-sm text-white/45">{message}</p>
    </div>
  );
}

/* ════════════════════════════════════════════
   SORTABLE ROW
═══════════════════════════════════════════════ */
function SortableRow({ widget, index, selected, onSelect, onToggleActive, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };
  const meta = TYPE_META[widget.type] ?? { Icon: Sparkles, color: "text-white/50", label: widget.type };
  const Icon = meta.Icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "group relative flex items-stretch rounded-xl border transition-all duration-200 overflow-hidden shadow-sm",
        selected ? "border-violet-500/50 bg-violet-500/10 shadow-[0_0_20px_rgba(101,31,255,0.15)]" : "border-white/10 bg-[#13131A] hover:border-white/20 hover:bg-[#1a1a24]",
        !widget.focusable && "opacity-50",
      ].filter(Boolean).join(" ")}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center px-2 bg-black/30 text-white/20 hover:text-white/70 hover:bg-black/50 cursor-grab active:cursor-grabbing touch-none transition-colors border-r border-white/5"
        title="Glisser pour réordonner"
      >
        <GripVertical size={14} />
      </div>

      <button onClick={onSelect} className="flex-1 min-w-0 flex items-center gap-3 px-3 py-3 text-left">
        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-black/50 text-[10px] font-mono font-bold text-white/60 shrink-0 shadow-inner">
          {index + 1}
        </div>
        <Icon size={16} className={`${meta.color} shrink-0`} strokeWidth={2} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-white truncate">{widget.title}</div>
          <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mt-0.5">{meta.label}</div>
        </div>
      </button>

      <div className="flex items-center px-1 border-l border-white/5 bg-black/10">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleActive(); }}
          title={widget.focusable ? "Désactiver de la rotation" : "Activer dans la rotation"}
          className={`p-2 rounded-lg transition-colors ${widget.focusable ? "text-emerald-400 hover:bg-emerald-500/15" : "text-white/30 hover:bg-white/10"}`}
        >
          {widget.focusable ? <Power size={14} /> : <PowerOff size={14} />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Supprimer"
          className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   EDITOR PANEL
═══════════════════════════════════════════════ */
function EditorPanel({ widget, onChange, onChangeData }) {
  const meta = TYPE_META[widget.type] ?? { Icon: Sparkles, color: "text-white/60", label: widget.type };
  const Icon = meta.Icon;

  const [draftTitle, setDraftTitle] = useState(widget.title);
  const [draftFocusable, setDraftFocusable] = useState(widget.focusable);
  const [draftDuration, setDraftDuration] = useState(widget.duration || "");
  const [draftData, setDraftData] = useState(widget.data);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDraftTitle(widget.title);
    setDraftFocusable(widget.focusable);
    setDraftDuration(widget.duration || "");
    setDraftData(widget.data);
  }, [widget.id, widget.title, widget.focusable, widget.duration, widget.data]);

  // Prevent simple object reference comparison issues by using JSON
  const hasChanges =
    draftTitle !== widget.title ||
    draftFocusable !== widget.focusable ||
    (draftDuration || undefined) !== (widget.duration || undefined) ||
    JSON.stringify(draftData) !== JSON.stringify(widget.data);

  const handleSave = () => {
    const patch = {};
    if (draftTitle !== widget.title) patch.title = draftTitle;
    if (draftFocusable !== widget.focusable) patch.focusable = draftFocusable;
    if ((draftDuration || undefined) !== (widget.duration || undefined)) {
      patch.duration = draftDuration ? Number(draftDuration) : undefined;
    }

    if (Object.keys(patch).length > 0) {
      onChange(patch);
    }
    onChangeData(draftData);
  };

  return (
    <div className="space-y-6 pb-12 relative">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-violet/10 border border-violet/20 shadow-inner">
          <Icon size={24} className={meta.color} strokeWidth={2} />
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-[0.35em] text-violet mb-0.5">{meta.label}</div>
          <h2 className="text-xl font-bold text-white tracking-tight leading-none">{draftTitle}</h2>
          <span className="text-[9px] font-mono text-white/30 block mt-0.5">ID: {widget.id}</span>
        </div>
      </div>

      <div className="space-y-5">
        <FieldGroup eyebrow="Identité du Widget">
          <Input label="Titre (interne)" value={draftTitle} onChange={e => setDraftTitle(e.target.value)} />
          <Input
            label="Durée personnalisée (s)"
            type="number"
            value={draftDuration}
            onChange={e => setDraftDuration(e.target.value)}
            placeholder="Laisser vide = durée auto"
          />
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.015] px-4 py-3 cursor-pointer hover:border-white/20 transition-colors">
            <input type="checkbox" checked={draftFocusable}
              onChange={e => setDraftFocusable(e.target.checked)}
              className="accent-violet w-4 h-4 rounded" />
            <div>
              <div className="text-sm text-white font-semibold">Widget actif sur l'écran</div>
              <div className="text-[11px] text-white/45">Si désactivé, retiré de la rotation.</div>
            </div>
          </label>
        </FieldGroup>

        <Divider />

        <FieldGroup eyebrow="Contenu">
          <WidgetDataEditor
            widget={{ ...widget, data: draftData }}
            onChange={(patch) => setDraftData(prev => ({ ...prev, ...patch }))}
          />
        </FieldGroup>
      </div>

      {mounted && hasChanges && typeof document !== "undefined" && createPortal(
        <button
          onClick={handleSave}
          title="Sauvegarder les modifications"
          className="px-2.5 py-2.5 rounded-full bg-emerald-500 text-white font-black uppercase tracking-wider text-xs hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2 animate-in fade-in zoom-in-95"
        >
          <Save size={16} strokeWidth={2.5} />
        </button>,
        document.getElementById("admin-save-action")
      )}
    </div>
  );
}

function FieldGroup({ eyebrow, children }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
      {eyebrow && <div className="text-[10px] font-bold uppercase tracking-[0.35em] text-violet-400 mb-5">{eyebrow}</div>}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-white/8 my-5" />;
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-widest text-white/55 mb-2">{label}</div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3.5 text-sm text-white focus:outline-none focus:border-violet/60 [&>option]:bg-[#141414]"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

/* ════════════════════════════════════════════
   LIVE TICKER (bandeau défilant)
═══════════════════════════════════════════════ */
function TickerPanel({ ticker, onChange }) {
  const t = ticker || {};
  const enabled = !!t.enabled;
  const position = t.position === "top" ? "top" : "bottom";
  const speed = Number(t.speed) || 60;
  const accent = t.accent || "violet";
  const messages = Array.isArray(t.messages) ? t.messages : [];

  const update = (patch) => onChange({ ticker: { ...t, ...patch } });

  const setMessage = (i, val) => {
    const next = [...messages];
    next[i] = val;
    update({ messages: next });
  };
  const addMessage = () => update({ messages: [...messages, ""] });
  const removeMessage = (i) => update({ messages: messages.filter((_, idx) => idx !== i) });

  const accentOptions = [
    { value: "violet", label: "Violet", color: "#651FFF" },
    { value: "red", label: "Rouge", color: "#FF1744" },
    { value: "amber", label: "Ambre", color: "#F59E0B" },
    { value: "emerald", label: "Émeraude", color: "#10B981" },
  ];

  return (
    <FieldGroup eyebrow="Bandeau live">
      <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.015] px-4 py-3 cursor-pointer hover:border-white/20 transition-colors">
        <div className="flex items-center gap-3">
          <Radio size={16} className="text-violet" />
          <div>
            <div className="text-sm font-semibold text-white">Activer le bandeau</div>
            <div className="text-[11px] text-white/45">Texte défilant en haut ou en bas.</div>
          </div>
        </div>
        <div
          onClick={(e) => { e.preventDefault(); update({ enabled: !enabled }); }}
          className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${enabled ? "bg-violet" : "bg-black border border-white/15"}`}
        >
          <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
        </div>
      </label>

      {enabled && (
        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => update({ position: "top" })}
              className={`p-3 rounded-xl border text-left transition-colors ${position === "top" ? "border-violet bg-violet/10" : "border-white/10 bg-white/[0.02] hover:border-white/25"}`}
            >
              <div className="text-xs font-bold text-white">En haut</div>
              <div className="text-[10px] text-white/45">Au-dessus de tout</div>
            </button>
            <button
              onClick={() => update({ position: "bottom" })}
              className={`p-3 rounded-xl border text-left transition-colors ${position === "bottom" ? "border-violet bg-violet/10" : "border-white/10 bg-white/[0.02] hover:border-white/25"}`}
            >
              <div className="text-xs font-bold text-white">En bas</div>
              <div className="text-[10px] text-white/45">Recommandé</div>
            </button>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.015] px-4 py-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-white flex items-center gap-2">
                <Timer size={12} className="text-violet" /> Vitesse de défilement
              </div>
              <div className="text-[11px] font-mono bg-violet/20 text-violet px-2 py-0.5 rounded font-bold">
                {speed}s / cycle
              </div>
            </div>
            <input type="range" min={5} max={195} step={5}
              value={200 - speed}
              onChange={e => update({ speed: 200 - Number(e.target.value) })}
              className="w-full accent-violet" />
            <div className="flex justify-between text-[10px] font-medium text-white/30 mt-1">
              <span>Lent</span><span>Rapide</span>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-2">Couleur d&apos;accent</div>
            <div className="grid grid-cols-4 gap-2">
              {accentOptions.map(o => (
                <button key={o.value}
                  onClick={() => update({ accent: o.value })}
                  className={`p-3 rounded-xl border text-[11px] font-bold transition-colors ${accent === o.value ? "border-white/60" : "border-white/10 hover:border-white/30"}`}
                  style={{ background: accent === o.value ? `${o.color}22` : undefined }}
                >
                  <div className="w-full h-2 rounded-full mb-2" style={{ background: o.color }} />
                  <span className="text-white">{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-white/70 uppercase tracking-widest">Messages ({messages.length})</div>
              <Button variant="ghost" size="sm" onClick={addMessage} leftIcon={<Plus size={12} />}>Ajouter</Button>
            </div>
            <div className="space-y-2">
              {messages.length === 0 && (
                <div className="text-xs text-white/40 italic px-2">Aucun message — ajoute du texte qui défilera en boucle.</div>
              )}
              {messages.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={m}
                    onChange={e => setMessage(i, e.target.value)}
                    placeholder="Ex: Inscriptions ouvertes pour la SPO du 15 mai"
                    className="flex-1"
                  />
                  <button
                    onClick={() => removeMessage(i)}
                    className="shrink-0 px-3 rounded-xl border border-white/10 hover:border-red-400/60 hover:bg-red-500/10 hover:text-red-400 text-white/50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </FieldGroup>
  );
}

/* ════════════════════════════════════════════
   BREAKING NEWS (override plein écran)
═══════════════════════════════════════════════ */
function BreakingNewsPanel({ breaking, onChange }) {
  const b = breaking || {};
  const active = !!b.active;
  const accent = b.accent || "red";
  const update = (patch) => onChange({ breaking: { ...b, ...patch } });

  const accentOptions = [
    { value: "red", label: "Rouge", color: "#FF1744" },
    { value: "amber", label: "Ambre", color: "#F59E0B" },
    { value: "violet", label: "Violet", color: "#651FFF" },
    { value: "emerald", label: "Émeraude", color: "#10B981" },
  ];

  return (
    <FieldGroup eyebrow="Breaking news">
      <div className="rounded-xl border border-white/10 bg-white/[0.015] px-4 py-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-400 shrink-0" />
          <div className="text-sm font-semibold text-white">Annonce plein écran</div>
        </div>

        <Input value={b.title ?? ""} onChange={e => update({ title: e.target.value })} placeholder="Breaking News" label="Titre" />
        <Textarea value={b.message ?? ""} onChange={e => update({ message: e.target.value })} placeholder="Ex: Cours annulés cet après-midi en salle 204" rows={2} label="Message" />

        <div className="flex items-center gap-2">
          <div className="text-[10px] font-semibold text-white/50 uppercase tracking-widest shrink-0">Couleur</div>
          <div className="flex gap-1.5 flex-1">
            {accentOptions.map(o => (
              <button key={o.value}
                onClick={() => update({ accent: o.value })}
                className={`flex-1 h-6 rounded-lg border transition-colors ${accent === o.value ? "border-white/60 ring-1 ring-white/30" : "border-white/10 hover:border-white/30"}`}
                style={{ background: o.color }}
                title={o.label}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => update({ active: !active })}
          className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all border flex items-center justify-center gap-2 ${active
            ? "bg-red-500 border-red-500 text-white shadow-[0_0_20px_rgba(255,23,68,0.4)]"
            : "border-white/15 text-white/70 hover:border-red-400/60 hover:text-red-400"
            }`}
        >
          {active ? <><span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />Diffusion en cours — arrêter</> : <><Zap size={12} />Diffuser maintenant</>}
        </button>
      </div>
    </FieldGroup>
  );
}

/* ════════════════════════════════════════════
   GLOBAL SETTINGS
═══════════════════════════════════════════════ */
function GlobalSettingsPanel({ settings, widgets, addWidget, onChange, onReset, onLoadPreset }) {
  const [draftSettings, setDraftSettings] = useState(settings);
  const [mounted, setMounted] = useState(false);
  const [selectedAutoDay, setSelectedAutoDay] = useState(1);

  useEffect(() => {
    setMounted(true);
    setDraftSettings(settings);
  }, [settings]);

  const hasChanges = JSON.stringify(draftSettings) !== JSON.stringify(settings);

  const handleSave = () => {
    onChange(draftSettings);
  };

  const updateDraft = (patch) => {
    setDraftSettings(prev => ({ ...prev, ...patch }));
  };

  const dayLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const dayFullLabels = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const SMART_WEEK_PRESETS = [
    {
      key: "campus", label: "Semaine campus", Icon: Sun, color: "text-blue-300",
      desc: "Essentiels du campus, décalé chaque jour",
      dayTypes: {
        1: ["hub", "weather", "transport", "jobs", "word", "quote"],
        2: ["hub", "weather", "transport", "network-status", "word", "rss"],
        3: ["hub", "weather", "transport", "jobs", "showcase", "quote"],
        4: ["hub", "weather", "transport", "business", "word", "network-status"],
        5: ["hub", "weather", "gallery", "word", "spo", "transport"],
      },
      // trafic actif seulement aux heures de pointe, offres d'alternance l'après-midi
      timeRules: [
        { type: "transport", start: "07:30", end: "09:30", days: [1, 2, 3, 4, 5] },
        { type: "transport", start: "17:00", end: "19:30", days: [1, 2, 3, 4, 5] },
        { type: "jobs", start: "12:00", end: "18:00", days: [1, 2, 3, 4, 5] },
      ],
    },
    {
      key: "event", label: "Semaine événement", Icon: PartyPopper, color: "text-fuchsia-400",
      desc: "Événements au premier plan, interactivité",
      dayTypes: {
        1: ["hub", "next-event", "countdown", "word", "weather", "poll"],
        2: ["hub", "next-event", "spo", "gallery", "word", "quote"],
        3: ["hub", "next-event", "countdown", "poll", "transport", "showcase"],
        4: ["hub", "next-event", "wordle", "word", "spo", "weather"],
        5: ["hub", "next-event", "gallery", "poll", "student", "showcase"],
      },
      // sondage visible seulement en fin de journée, transport aux heures de pointe
      timeRules: [
        { type: "poll", start: "16:00", end: "20:00", days: [1, 2, 3, 4, 5] },
        { type: "transport", start: "07:30", end: "09:30", days: [1, 2, 3, 4, 5] },
        { type: "transport", start: "17:00", end: "19:30", days: [1, 2, 3, 4, 5] },
      ],
    },
    {
      key: "info", label: "Mode information", Icon: Newspaper, color: "text-amber-400",
      desc: "News, stats, citations, social — focus contenu",
      dayTypes: {
        1: ["hub", "rss", "quote", "business", "word", "weather"],
        2: ["hub", "rss", "social", "showcase", "crypto", "word"],
        3: ["hub", "rss", "quote", "business", "transport", "network-status"],
        4: ["hub", "rss", "social", "word", "showcase", "weather"],
        5: ["hub", "rss", "quote", "crypto", "gallery", "business"],
      },
      // crypto en matinée seulement (marchés ouverts), social en fin de journée
      timeRules: [
        { type: "crypto", start: "08:00", end: "12:00", days: [1, 2, 3, 4, 5] },
        { type: "social", start: "15:00", end: "20:00", days: [1, 2, 3, 4, 5] },
      ],
    },
    {
      key: "interactive", label: "Interactif & fun", Icon: Gamepad2, color: "text-emerald-400",
      desc: "Wordle, sondages, énigmes, BDE — engagement max",
      dayTypes: {
        1: ["hub", "wordle", "poll", "word", "weather", "transport"],
        2: ["hub", "puzzle", "poll", "gallery", "word", "showcase"],
        3: ["hub", "wordle", "student", "word", "transport", "weather"],
        4: ["hub", "puzzle", "poll", "showcase", "quote", "word"],
        5: ["hub", "wordle", "gallery", "student", "poll", "word"],
      },
      // jeux visibles en pause déj et après les cours
      timeRules: [
        { type: "wordle", start: "12:00", end: "14:00", days: [1, 2, 3, 4, 5] },
        { type: "wordle", start: "17:30", end: "20:00", days: [1, 2, 3, 4, 5] },
        { type: "puzzle", start: "12:00", end: "14:00", days: [1, 2, 3, 4, 5] },
        { type: "puzzle", start: "17:30", end: "20:00", days: [1, 2, 3, 4, 5] },
        { type: "poll", start: "11:00", end: "20:00", days: [1, 2, 3, 4, 5] },
      ],
    },
    {
      key: "jpo", label: "Journée Portes Ouvertes (JPO)", Icon: UserPlus, color: "text-rose-400",
      desc: "Idéal pour les visiteurs : Galeries, Vidéos, Chiffres & Météo",
      dayTypes: {
        1: ["hub", "gallery", "spo-video", "iframe", "showcase", "quote", "weather"],
        2: ["hub", "gallery", "spo-video", "iframe", "business", "quote", "weather"],
        3: ["hub", "gallery", "spo-video", "iframe", "showcase", "quote", "weather"],
        4: ["hub", "gallery", "spo-video", "iframe", "business", "quote", "weather"],
        5: ["hub", "gallery", "spo-video", "iframe", "showcase", "quote", "weather"],
        6: ["hub", "gallery", "spo-video", "iframe", "showcase", "quote", "weather"], // Activé le samedi pour la JPO

      },
      timeRules: [],
    },
    {
      key: "salles-libres", label: "Salles libres", Icon: LayoutGrid, color: "text-cyan-400",
      desc: "Carte des salles + essentiels campus — idéal couloirs & accueil",
      dayTypes: {
        1: ["campus-map", "hub", "transport", "weather", "word", "quote"],
        2: ["campus-map", "hub", "transport", "network-status", "word", "rss"],
        3: ["campus-map", "hub", "transport", "weather", "jobs", "quote"],
        4: ["campus-map", "hub", "transport", "business", "word", "network-status"],
        5: ["campus-map", "hub", "gallery", "weather", "word", "quote"],
      },
      timeRules: [
        { type: "transport", start: "07:30", end: "09:30", days: [1, 2, 3, 4, 5] },
        { type: "transport", start: "17:00", end: "19:30", days: [1, 2, 3, 4, 5] },
        { type: "campus-map", start: "07:00", end: "21:00", days: [1, 2, 3, 4, 5] },
      ],
    },
    {
      key: "bde-matin", label: "Matin BDE", Icon: BookOpen, color: "text-orange-400",
      desc: "Vie étudiante & associations au démarrage de journée",
      dayTypes: {
        1: ["hub", "student", "poll", "weather", "word", "transport"],
        2: ["hub", "student", "puzzle", "word", "transport", "rss"],
        3: ["hub", "student", "poll", "showcase", "word", "weather"],
        4: ["hub", "student", "puzzle", "word", "transport", "quote"],
        5: ["hub", "student", "gallery", "poll", "word", "wordle"],
      },
      timeRules: [
        { type: "student", start: "07:30", end: "12:00", days: [1, 2, 3, 4, 5] },
        { type: "poll", start: "10:00", end: "18:00", days: [1, 2, 3, 4, 5] },
        { type: "transport", start: "07:30", end: "09:30", days: [1, 2, 3, 4, 5] },
        { type: "wordle", start: "12:00", end: "14:00", days: [5] },
      ],
    },
    { key: "full", label: "Tout activer", Icon: Zap, color: "text-violet", desc: "Tous les widgets Lun→Ven, aucune règle horaire", dayTypes: "all", timeRules: [] },
    { key: "clear", label: "Tout vider", Icon: RotateCcw, color: "text-white/40", desc: "Recommencer de zéro", dayTypes: {}, timeRules: [] },
  ];
  const autoWeek = draftSettings.autoWeek || {
    enabled: false,
    dayWidgetMap: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
    timeRules: [],
  };
  const autoContent = draftSettings.autoContent || {
    enabled: false,
    provider: "groq",
    refreshHour: 6,
    targets: { quote: true, word: true, puzzle: true, wordle: true },
  };

  const updateAutoWeek = (next) => updateDraft({ autoWeek: next });
  const updateAutoContent = (next) => updateDraft({ autoContent: next });

  const selectedDayWidgetIds = autoWeek.dayWidgetMap?.[selectedAutoDay] || [];
  const applyPresetToDay = (day, presetKey) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    const presetTypes = new Set((preset.widgets || []).map((w) => w.type));
    const ids = widgets.filter((w) => presetTypes.has(w.type)).map((w) => w.id);
    updateAutoWeek({
      ...autoWeek,
      dayWidgetMap: { ...(autoWeek.dayWidgetMap || {}), [day]: ids },
    });
  };

  const toggleWidgetForDay = (day, widgetId) => {
    const current = autoWeek.dayWidgetMap?.[day] || [];
    const next = current.includes(widgetId)
      ? current.filter((id) => id !== widgetId)
      : [...current, widgetId];
    updateAutoWeek({
      ...autoWeek,
      dayWidgetMap: { ...(autoWeek.dayWidgetMap || {}), [day]: next },
    });
  };

  const addTimeRule = () => {
    const firstWidgetId = widgets[0]?.id || "";
    const nextRules = [
      ...(autoWeek.timeRules || []),
      {
        id: `rule-${Date.now()}`,
        widgetId: firstWidgetId,
        start: "16:00",
        end: "18:00",
        days: [1, 2, 3, 4, 5],
        enabled: true,
      },
    ];
    updateAutoWeek({ ...autoWeek, timeRules: nextRules });
  };

  const updateTimeRule = (id, patch) => {
    const nextRules = (autoWeek.timeRules || []).map((r) => (r.id === id ? { ...r, ...patch } : r));
    updateAutoWeek({ ...autoWeek, timeRules: nextRules });
  };

  const removeTimeRule = (id) => {
    const nextRules = (autoWeek.timeRules || []).filter((r) => r.id !== id);
    updateAutoWeek({ ...autoWeek, timeRules: nextRules });
  };

  const applySmartWeekPreset = (preset) => {
    const existingTypes = new Set(widgets.map(w => w.type));
    // Collect all types needed across all days
    const allNeeded = new Set();
    if (preset.dayTypes === "all") {
      Object.keys(TYPE_META).forEach(t => allNeeded.add(t));
    } else if (preset.dayTypes && typeof preset.dayTypes === "object") {
      Object.values(preset.dayTypes).flat().forEach(t => allNeeded.add(t));
    }
    // Also collect types from timeRules
    (preset.timeRules || []).forEach(r => r.type && allNeeded.add(r.type));

    // Auto-add missing widgets and build a combined array of existing + new widgets
    const combinedWidgets = [...widgets];
    for (const type of allNeeded) {
      if (!existingTypes.has(type) && TYPE_META[type] && addWidget) {
        const defaults = NEW_WIDGET_DEFAULTS[type] || {};
        const newId = addWidget(type, TYPE_META[type].label, typeof defaults === "object" ? { ...defaults } : {});
        if (newId) combinedWidgets.push({ id: newId, type });
      }
    }

    // Build per-day map
    const newMap = {};
    for (let d = 0; d <= 6; d++) {
      const isWeekend = d === 0 || d === 6;
      if (isWeekend) { newMap[d] = []; continue; }
      if (preset.dayTypes === "all") {
        newMap[d] = combinedWidgets.map(w => w.id);
      } else {
        const types = preset.dayTypes?.[d] || [];
        newMap[d] = combinedWidgets.filter(w => types.includes(w.type)).map(w => w.id);
      }
    }

    // Convert type-based timeRules → widgetId-based rules
    const timeRules = [];
    (preset.timeRules || []).forEach((r, i) => {
      const matchedWidgets = combinedWidgets.filter(w => w.type === r.type);
      matchedWidgets.forEach(w => {
        // Parse HH:MM to "HH:MM" — runtime already uses string comparison
        timeRules.push({
          id: `preset-rule-${i}-${w.id}`,
          widgetId: w.id,
          start: r.start,
          end: r.end,
          days: r.days,
          enabled: true,
        });
      });
    });

    updateAutoWeek({ ...autoWeek, dayWidgetMap: newMap, timeRules });
  };

  const exceptions = autoWeek.exceptions || [];
  const addException = () => {
    updateAutoWeek({ ...autoWeek, exceptions: [...exceptions, { id: `exc-${Date.now()}`, date: "", label: "", type: "holiday", widgetIds: [] }] });
  };
  const updateException = (id, patch) => {
    updateAutoWeek({ ...autoWeek, exceptions: exceptions.map(e => e.id === id ? { ...e, ...patch } : e) });
  };
  const removeException = (id) => {
    updateAutoWeek({ ...autoWeek, exceptions: exceptions.filter(e => e.id !== id) });
  };
  const toggleExceptionWidget = (excId, widgetId) => {
    const exc = exceptions.find(e => e.id === excId);
    if (!exc) return;
    const ids = exc.widgetIds || [];
    updateException(excId, { widgetIds: ids.includes(widgetId) ? ids.filter(x => x !== widgetId) : [...ids, widgetId] });
  };

  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState(null);

  return (
    <div className="max-w-3xl mx-auto w-full space-y-4 pb-8 relative">
      <SectionTitle eyebrow="Affichage" title="Paramètres globaux" hint="Gère le comportement de rotation de tes écrans." />

      <FieldGroup eyebrow="Mode d'affichage">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { updateDraft({ viewMode: "scene" }); }}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-colors text-left ${(!draftSettings.viewMode || draftSettings.viewMode === "scene") ? "border-violet bg-violet/10 ring-1 ring-violet/30" : "border-white/10 bg-white/[0.015] hover:border-white/25"}`}
          >
            <Film size={18} className={(!draftSettings.viewMode || draftSettings.viewMode === "scene") ? "text-violet shrink-0" : "text-white/50 shrink-0"} />
            <div>
              <div className="text-sm font-bold text-white">Mode Scène</div>
              <div className="text-[11px] text-white/45 mt-0.5">Plein écran séquentiel</div>
            </div>
          </button>
          <button
            onClick={() => { updateDraft({ viewMode: "orbit" }); }}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-colors text-left ${draftSettings.viewMode === "orbit" ? "border-violet bg-violet/10 ring-1 ring-violet/30" : "border-white/10 bg-white/[0.015] hover:border-white/25"}`}
          >
            <LayoutGrid size={18} className={draftSettings.viewMode === "orbit" ? "text-violet shrink-0" : "text-white/50 shrink-0"} />
            <div>
              <div className="text-sm font-bold text-white">Mode Orbite</div>
              <div className="text-[11px] text-white/45 mt-0.5">Central + 4 satellites</div>
            </div>
          </button>
        </div>
      </FieldGroup>

      <FieldGroup eyebrow="Rotation automatique">
        <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.015] px-5 py-3.5 cursor-pointer hover:border-white/20 transition-colors">
          <div>
            <div className="text-sm font-semibold text-white">Activer la rotation</div>
            <div className="text-[11px] text-white/45 mt-0.5">Les widgets actifs défilent automatiquement.</div>
          </div>
          <div
            onClick={(e) => { e.preventDefault(); updateDraft({ autoRotate: !draftSettings.autoRotate }); }}
            className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${draftSettings.autoRotate ? "bg-violet" : "bg-black border border-white/15"}`}
          >
            <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${draftSettings.autoRotate ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
        </label>

        {draftSettings.autoRotate && (
          <div className="rounded-xl border border-white/10 bg-white/[0.015] px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <Timer size={14} className="text-violet" />
                Intervalle de rotation
              </div>
              <div className="text-xs font-mono bg-violet/20 text-violet px-2 py-0.5 rounded font-bold">
                {draftSettings.rotateInterval}s
              </div>
            </div>
            <input type="range" min={5} max={60} step={1}
              value={draftSettings.rotateInterval}
              onChange={e => updateDraft({ rotateInterval: Number(e.target.value) })}
              className="w-full accent-violet" />
            <div className="flex justify-between text-[10px] font-medium text-white/30 mt-1.5">
              <span>5s</span><span>30s</span><span>60s</span>
            </div>
          </div>
        )}
      </FieldGroup>

      <Divider />

      <TickerPanel ticker={draftSettings.ticker} onChange={updateDraft} />

      <Divider />

      <BreakingNewsPanel breaking={draftSettings.breaking} onChange={updateDraft} />

      <Divider />

      <FieldGroup eyebrow="Planning hebdomadaire">
        <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.015] px-5 py-3.5 cursor-pointer hover:border-white/20 transition-colors">
          <div>
            <div className="text-sm font-semibold text-white">Activer le planning hebdomadaire</div>
            <div className="text-[11px] text-white/45 mt-0.5">Configure automatiquement les widgets par jour et heure.</div>
          </div>
          <div
            onClick={(e) => { e.preventDefault(); updateAutoWeek({ ...autoWeek, enabled: !autoWeek.enabled }); }}
            className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${autoWeek.enabled ? "bg-violet" : "bg-black border border-white/15"}`}
          >
            <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${autoWeek.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
        </label>

        {autoWeek.enabled && (
          <div className="space-y-4">
            {/* ── Smart week presets ── */}
            <div className="grid grid-cols-3 gap-2">
              {SMART_WEEK_PRESETS.map(p => {
                const PIcon = p.Icon;
                return (
                  <button key={p.key} onClick={() => applySmartWeekPreset(p)}
                    className="group flex items-center gap-2.5 p-3 rounded-xl border border-white/8 bg-white/[0.02] hover:bg-violet/10 hover:border-violet/30 transition-all text-left">
                    <div className={`shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform ${p.color}`}>
                      <PIcon size={15} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white group-hover:text-violet transition-colors leading-tight truncate">{p.label}</div>
                      <div className="text-[9px] text-white/30 leading-tight truncate">{p.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ── Week overview (Lun–Ven only, Sam/Dim = fermé) ── */}
            <div className="grid grid-cols-7 gap-1.5">
              {dayLabels.map((label, idx) => {
                const dayIds = autoWeek.dayWidgetMap?.[idx] || [];
                const isSelected = selectedAutoDay === idx;
                const isWeekend = idx === 0 || idx === 6;

                if (isWeekend) {
                  return (
                    <div key={label} className="flex flex-col items-center p-2 rounded-xl border border-white/5 bg-black/20 opacity-30">
                      <span className="text-[10px] font-bold text-white/30">{label}</span>
                      <span className="text-[9px] text-white/20 mt-1 font-medium">Fermé</span>
                    </div>
                  );
                }

                return (
                  <button key={label} onClick={() => setSelectedAutoDay(idx)}
                    className={`relative flex flex-col items-center p-2 rounded-xl border transition-all ${isSelected ? "border-violet bg-violet/10 ring-1 ring-violet/25 shadow-[0_0_12px_rgba(101,31,255,0.15)]" : "border-white/8 bg-white/[0.015] hover:border-white/15 hover:bg-white/[0.03]"}`}>
                    <span className={`text-[10px] font-bold ${isSelected ? "text-violet" : "text-white/60"}`}>{label}</span>
                    <span className={`text-lg font-black mt-0.5 ${isSelected ? "text-white" : dayIds.length ? "text-white/80" : "text-white/20"}`}>{dayIds.length}</span>
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-full">
                      {dayIds.slice(0, 5).map(id => {
                        const w = widgets.find(x => x.id === id);
                        const meta = w ? TYPE_META[w.type] : null;
                        const dotColor = meta?.color?.includes("violet") ? "#651FFF" : meta?.color?.includes("blue") ? "#60A5FA" : meta?.color?.includes("emerald") ? "#34D399" : meta?.color?.includes("amber") ? "#FBBF24" : meta?.color?.includes("pink") ? "#F472B6" : meta?.color?.includes("red") ? "#F87171" : "#666";
                        return <div key={id} className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />;
                      })}
                      {dayIds.length > 5 && <span className="text-[7px] text-white/25 ml-0.5">+{dayIds.length - 5}</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ── Selected day detail ── */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-bold text-white">{dayFullLabels[selectedAutoDay]}</div>
                  <div className="text-[10px] text-white/35">{selectedDayWidgetIds.length} / {widgets.length} widgets programmés</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateAutoWeek({ ...autoWeek, dayWidgetMap: { ...(autoWeek.dayWidgetMap || {}), [selectedAutoDay]: widgets.map(w => w.id) } })} className="text-[9px] px-2 py-1 rounded-md border border-white/10 text-white/50 hover:text-white hover:border-white/25 transition-colors font-bold uppercase tracking-wider">Tous</button>
                  <button onClick={() => updateAutoWeek({ ...autoWeek, dayWidgetMap: { ...(autoWeek.dayWidgetMap || {}), [selectedAutoDay]: [] } })} className="text-[9px] px-2 py-1 rounded-md border border-white/10 text-white/50 hover:text-red-400 hover:border-red-400/30 transition-colors font-bold uppercase tracking-wider">Aucun</button>
                </div>
              </div>

              {/* Active widgets for this day */}
              {selectedDayWidgetIds.length > 0 && (
                <div className="mb-3">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-400/60 mb-1.5">Actifs ce jour</div>
                  <div className="flex flex-wrap gap-1.5">
                    {widgets.filter(w => selectedDayWidgetIds.includes(w.id)).map((w) => {
                      const meta = TYPE_META[w.type] ?? { Icon: Sparkles, color: "text-white/40" };
                      const Icon = meta.Icon;
                      return (
                        <button key={w.id} onClick={() => toggleWidgetForDay(selectedAutoDay, w.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all border bg-violet/12 border-violet/35 text-white hover:bg-red-500/10 hover:border-red-400/30 hover:text-red-300 group">
                          <Icon size={11} className={meta.color} strokeWidth={2} />
                          <span>{w.title}</span>
                          <XIcon size={9} className="text-white/20 group-hover:text-red-400 ml-0.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Inactive widgets (available to add) */}
              {widgets.filter(w => !selectedDayWidgetIds.includes(w.id)).length > 0 && (
                <div>
                  {selectedDayWidgetIds.length > 0 && <div className="h-px bg-white/6 mb-3" />}
                  <div className="text-[9px] font-bold uppercase tracking-widest text-white/25 mb-1.5">Disponibles</div>
                  <div className="flex flex-wrap gap-1.5">
                    {widgets.filter(w => !selectedDayWidgetIds.includes(w.id)).map((w) => {
                      const meta = TYPE_META[w.type] ?? { Icon: Sparkles, color: "text-white/40" };
                      const Icon = meta.Icon;
                      return (
                        <button key={w.id} onClick={() => toggleWidgetForDay(selectedAutoDay, w.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all border bg-white/[0.02] border-white/8 text-white/35 hover:text-white hover:border-violet/30 hover:bg-violet/8">
                          <Icon size={11} className="text-white/25" strokeWidth={2} />
                          <span>{w.title}</span>
                          <Plus size={9} className="text-white/15 ml-0.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── Time rules ── */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs font-bold text-white">Règles horaires</div>
                  <div className="text-[10px] text-white/30">Widgets activés seulement sur certains créneaux</div>
                </div>
                <button onClick={addTimeRule} className="text-[10px] px-2.5 py-1 rounded-lg border border-violet/30 text-violet hover:text-white hover:bg-violet/20 font-bold transition-colors">+ Règle</button>
              </div>
              {(autoWeek.timeRules || []).length === 0 ? (
                <div className="text-[11px] text-white/25 italic">Aucune règle — les widgets suivent le planning journalier.</div>
              ) : (
                <div className="space-y-2">
                  {(autoWeek.timeRules || []).map((rule) => {
                    const ruleWidget = widgets.find(w => w.id === rule.widgetId);
                    const ruleMeta = ruleWidget ? TYPE_META[ruleWidget.type] : null;
                    const RuleIcon = ruleMeta?.Icon ?? Sparkles;
                    return (
                      <div key={rule.id} className="flex items-center gap-2 rounded-lg border border-white/8 bg-black/20 p-2">
                        <select value={rule.widgetId} onChange={(e) => updateTimeRule(rule.id, { widgetId: e.target.value })} className="flex-1 min-w-0 rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1.5 text-[11px] text-white [&>option]:bg-[#141414]">
                          {widgets.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}
                        </select>
                        <input type="time" value={rule.start || "16:00"} onChange={(e) => updateTimeRule(rule.id, { start: e.target.value })} className="w-20 rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1.5 text-[11px] text-white text-center" />
                        <span className="text-[10px] text-white/25">→</span>
                        <input type="time" value={rule.end || "18:00"} onChange={(e) => updateTimeRule(rule.id, { end: e.target.value })} className="w-20 rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1.5 text-[11px] text-white text-center" />
                        <div className="flex gap-0.5">
                          {dayLabels.map((dl, di) => {
                            const dayActive = (rule.days || []).includes(di);
                            return (
                              <button key={di} onClick={() => { const next = dayActive ? (rule.days || []).filter(d => d !== di) : [...(rule.days || []), di].sort(); updateTimeRule(rule.id, { days: next }); }}
                                className={`w-5 h-5 rounded text-[8px] font-bold transition-colors ${dayActive ? "bg-violet/20 text-violet border border-violet/30" : "bg-white/[0.02] text-white/20 border border-white/8 hover:text-white/40"}`}>
                                {dl[0]}
                              </button>
                            );
                          })}
                        </div>
                        <button onClick={() => removeTimeRule(rule.id)} className="p-1 text-white/25 hover:text-red-400 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Calendar exceptions ── */}
            <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.03] p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5"><Calendar size={12} /> Exceptions calendrier</div>
                  <div className="text-[10px] text-white/30">Jours fériés ou événements prioritaires qui override le planning</div>
                </div>
                <button onClick={addException} className="text-[10px] px-2.5 py-1 rounded-lg border border-amber-500/25 text-amber-400 hover:text-white hover:bg-amber-500/15 font-bold transition-colors">+ Exception</button>
              </div>
              {exceptions.length === 0 ? (
                <div className="text-[11px] text-white/25 italic">Aucune exception configurée.</div>
              ) : (
                <div className="space-y-2">
                  {exceptions.map(exc => (
                    <div key={exc.id} className="rounded-lg border border-white/8 bg-black/20 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="date" value={exc.date || ""} onChange={e => updateException(exc.id, { date: e.target.value })} className="rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1.5 text-[11px] text-white" />
                        <input placeholder="Label (ex: Jour férié)" value={exc.label || ""} onChange={e => updateException(exc.id, { label: e.target.value })} className="flex-1 rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1.5 text-[11px] text-white placeholder-white/20" />
                        <select value={exc.type || "holiday"} onChange={e => updateException(exc.id, { type: e.target.value })} className="rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1.5 text-[11px] text-white [&>option]:bg-[#141414]">
                          <option value="holiday">🏖️ Férié</option>
                          <option value="event">🎯 Événement</option>
                        </select>
                        <button onClick={() => removeException(exc.id)} className="p-1 text-white/25 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                      </div>
                      {exc.type === "event" && (
                        <div>
                          <div className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5">Widgets prioritaires ce jour</div>
                          <div className="flex flex-wrap gap-1">
                            {widgets.map(w => {
                              const isIn = (exc.widgetIds || []).includes(w.id);
                              const meta = TYPE_META[w.type] ?? { Icon: Sparkles, color: "text-white/40" };
                              const Icon = meta.Icon;
                              return (
                                <button key={w.id} onClick={() => toggleExceptionWidget(exc.id, w.id)}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all border ${isIn ? "bg-amber-500/10 border-amber-500/25 text-amber-300" : "bg-white/[0.02] border-white/6 text-white/25 hover:text-white/40"}`}>
                                  <Icon size={9} strokeWidth={2} />
                                  <span className="truncate max-w-[80px]">{w.title}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {exc.type === "holiday" && (
                        <div className="text-[10px] text-amber-400/50 italic">Aucun widget ne sera affiché ce jour.</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </FieldGroup>

      <Divider />

      <FieldGroup eyebrow="Génération auto contenu">
        <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.015] px-5 py-3.5 cursor-pointer hover:border-white/20 transition-colors">
          <div>
            <div className="text-sm font-semibold text-white">Activer la génération automatique</div>
            <div className="text-[11px] text-white/45 mt-0.5">Quote / mot du jour / puzzle / wordle via provider IA.</div>
          </div>
          <div
            onClick={(e) => { e.preventDefault(); updateAutoContent({ ...autoContent, enabled: !autoContent.enabled }); }}
            className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${autoContent.enabled ? "bg-violet" : "bg-black border border-white/15"}`}
          >
            <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${autoContent.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
        </label>
        {autoContent.enabled && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Provider" value={autoContent.provider || "groq"} onChange={(e) => updateAutoContent({ ...autoContent, provider: e.target.value })} />
              <Input label="Heure de refresh (0-23)" type="number" min={0} max={23} value={autoContent.refreshHour ?? 6} onChange={(e) => updateAutoContent({ ...autoContent, refreshHour: Number(e.target.value) || 6 })} />
            </div>
            <button
              disabled={generating}
              onClick={async () => {
                setGenerating(true);
                setGenResult(null);
                try {
                  const res = await fetch("/api/automation/content?force=1", { method: "POST" });
                  const json = await res.json();
                  setGenResult(json.ok ? (json.skipped ? "skipped" : "success") : "error");
                } catch { setGenResult("error"); }
                setGenerating(false);
                setTimeout(() => setGenResult(null), 4000);
              }}
              className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border flex items-center justify-center gap-2 ${genResult === "success" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" :
                genResult === "skipped" ? "bg-amber-500/10 border-amber-500/25 text-amber-400" :
                  genResult === "error" ? "bg-red-500/10 border-red-500/25 text-red-400" :
                    "bg-violet/10 border-violet/30 text-violet hover:bg-violet/20"
                }`}
            >
              {generating ? (
                <><RefreshCw size={13} className="animate-spin" /> Génération en cours...</>
              ) : genResult === "success" ? (
                <><Check size={13} /> Contenu généré avec succès</>
              ) : genResult === "skipped" ? (
                <><ClockIcon size={13} /> Déjà généré aujourd'hui</>
              ) : genResult === "error" ? (
                <><AlertTriangle size={13} /> Erreur de génération</>
              ) : (
                <><Sparkles size={13} /> Lancer la génération maintenant</>
              )}
            </button>
          </div>
        )}
      </FieldGroup>

      <Divider />

      <FieldGroup eyebrow="Presets de Séquences">
        <div className="flex gap-2">
          <button onClick={() => onLoadPreset("debut-semaine", "Début de semaine")}
            className="flex-1 flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-violet/10 hover:border-violet/40 transition-colors group">
            <Sun size={15} className="text-blue-300 shrink-0" strokeWidth={1.8} />
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-white truncate">Début de semaine</div>
              <div className="text-[10px] text-white/40 truncate">Trafic, Météo...</div>
            </div>
          </button>
          <button onClick={() => onLoadPreset("fin-semaine", "Fin de semaine")}
            className="flex-1 flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-violet/10 hover:border-violet/40 transition-colors group">
            <PartyPopper size={15} className="text-fuchsia-400 shrink-0" strokeWidth={1.8} />
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-white truncate">Fin de semaine</div>
              <div className="text-[10px] text-white/40 truncate">Wordle, Galerie...</div>
            </div>
          </button>
          <button onClick={() => onLoadPreset("default", "Séquence vierge")}
            className="flex-1 flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-violet/10 hover:border-violet/40 transition-colors group">
            <Settings2 size={15} className="text-white/50 shrink-0" strokeWidth={1.8} />
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-white truncate">Par défaut</div>
              <div className="text-[10px] text-white/40 truncate">Widgets usine</div>
            </div>
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={() => onLoadPreset("spo-live", "Live SPO (Vidéo)")}
            className="flex-1 flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-violet/20 hover:bg-violet/10 hover:border-violet/40 transition-colors group">
            <Film size={15} className="text-violet shrink-0" strokeWidth={1.8} />
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-white truncate">Live SPO</div>
              <div className="text-[10px] text-white/40 truncate">Vidéo cinématique</div>
            </div>
          </button>

          <button onClick={() => onLoadPreset("monitoring-reseau", "Monitoring réseau")}
            className="flex-1 flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-violet/10 hover:border-violet/40 transition-colors group">
            <Activity size={15} className="text-emerald-400 shrink-0" strokeWidth={1.8} />
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-white truncate">Monitoring réseau</div>
              <div className="text-[10px] text-white/40 truncate">Status, uptime, qualité WAN</div>
            </div>
          </button>
          <button onClick={() => onLoadPreset("auto-campus-live", "Campus auto live")}
            className="flex-1 flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-violet/10 hover:border-violet/40 transition-colors group">
            <Sparkles size={15} className="text-blue-300 shrink-0" strokeWidth={1.8} />
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-white truncate">Campus auto live</div>
              <div className="text-[10px] text-white/40 truncate">100% auto (hub/météo/trafic)</div>
            </div>
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={() => onLoadPreset("salles-libres", "Salles libres campus")}
            className="flex-1 flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-colors group">
            <LayoutGrid size={15} className="text-cyan-400 shrink-0" strokeWidth={1.8} />
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-white truncate">Salles libres</div>
              <div className="text-[10px] text-white/40 truncate">Carte + trafic + météo</div>
            </div>
          </button>
          <button onClick={() => onLoadPreset("bde-matin", "Matin BDE")}
            className="flex-1 flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-orange-500/10 hover:border-orange-500/40 transition-colors group">
            <BookOpen size={15} className="text-orange-400 shrink-0" strokeWidth={1.8} />
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-white truncate">Matin BDE</div>
              <div className="text-[10px] text-white/40 truncate">Vie étudiante & sondage</div>
            </div>
          </button>
        </div>
      </FieldGroup>

      <Divider />

      <div className="pt-2">
        <Button variant="ghost" size="sm" className="text-white/55 hover:text-red-400 hover:bg-red-500/10" onClick={onReset} leftIcon={<RotateCcw size={14} />}>
          Réinitialiser aux paramètres d'usine (Danger)
        </Button>
      </div>

      {mounted && hasChanges && typeof document !== "undefined" && createPortal(
        <button
          onClick={handleSave}
          title="Sauvegarder les modifications"
          className="p-2.5 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center animate-in fade-in zoom-in-95 group"
        >
          <Save size={18} strokeWidth={2} />
        </button>,
        document.getElementById("admin-save-action")
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   ORBIT SLOTS CONFIG
═══════════════════════════════════════════════ */
function OrbitSlotsConfig({ widgets, slots, onChange }) {
  const setSlot = (i, ids) => {
    const next = [0, 1, 2, 3].map(j => j === i ? ids : (slots[j] ?? []));
    onChange(next);
  };

  return (
    <FieldGroup eyebrow="Configurer le mode orbite">
      <p className="text-[12px] text-white/55 -mt-2 mb-2">
        Choisis les widgets qui occupent chacun des 4 satellites. Si un slot contient plusieurs widgets, ils défilent à tour de rôle.
      </p>
      <div className="space-y-3">
        {[0, 1, 2, 3].map(i => (
          <SlotRow key={i} index={i} pool={slots[i] ?? []} widgets={widgets} onChange={(ids) => setSlot(i, ids)} />
        ))}
      </div>
    </FieldGroup>
  );
}

function SlotRow({ index, pool, widgets, onChange }) {
  const [picking, setPicking] = useState(false);
  const inPool = (id) => pool.includes(id);
  const available = widgets.filter(w => !inPool(w.id));
  const items = pool.map(id => widgets.find(w => w.id === id)).filter(Boolean);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.015] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-violet/15 border border-violet/30 flex items-center justify-center text-[11px] font-bold text-violet">
            {index + 1}
          </div>
          <span className="text-sm font-semibold text-white">Satellite {index + 1}</span>
          <span className="text-[10px] uppercase tracking-widest text-white/35">{pool.length === 0 ? "vide" : `${pool.length} widget${pool.length > 1 ? "s" : ""}`}</span>
        </div>
        <button
          onClick={() => setPicking(p => !p)}
          className="text-xs font-semibold text-violet hover:text-white transition-colors flex items-center gap-1"
        >
          <Plus size={12} /> Ajouter
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-[11px] text-white/35 italic px-1 py-2">Aucun widget — clique sur Ajouter.</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map(w => {
            const meta = TYPE_META[w.type] ?? { Icon: Sparkles, color: "text-white/60" };
            const Icon = meta.Icon;
            return (
              <span key={w.id} className="inline-flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg bg-violet/10 border border-violet/30 text-xs">
                <Icon size={11} className={meta.color} strokeWidth={2} />
                <span className="text-white font-medium truncate max-w-[180px]">{w.title}</span>
                <button onClick={() => onChange(pool.filter(x => x !== w.id))} className="text-white/45 hover:text-red-400 p-0.5">
                  <XIcon size={11} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {picking && (
        <div className="mt-3 pt-3 border-t border-white/8">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Choisir un widget à ajouter</div>
          {available.length === 0 ? (
            <div className="text-[11px] text-white/35 italic">Tous les widgets sont déjà dans ce slot.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {available.map(w => {
                const meta = TYPE_META[w.type] ?? { Icon: Sparkles, color: "text-white/60" };
                const Icon = meta.Icon;
                return (
                  <button key={w.id}
                    onClick={() => { onChange([...pool, w.id]); setPicking(false); }}
                    className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-white/[0.025] border border-white/10 hover:border-violet/40 hover:bg-violet/8 text-xs transition-colors"
                  >
                    <Icon size={11} className={meta.color} strokeWidth={2} />
                    <span className="text-white/85 font-medium truncate max-w-[180px]">{w.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   FILE UPLOAD HELPER
═══════════════════════════════════════════════ */
function FileToDataUrlInput({ accept = "image/*", onLoad, onClear, hasValue }) {
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
      {hasValue && <button onClick={onClear} className="text-xs text-white/55 hover:text-red-400 px-2 shrink-0">Retirer</button>}
    </div>
  );
}

/* ════════════════════════════════════════════
   WIDGET DATA EDITOR (per-type)
═══════════════════════════════════════════════ */
function WidgetDataEditor({ widget, onChange }) {
  const { data, type } = widget;

  if (type === "next-event") return (
    <>
      <Input label="Nom de l'événement" value={data.name ?? ""} onChange={e => onChange({ name: e.target.value })} />
      <SelectField label="Mode d'affichage" value={data.mode ?? "single"} onChange={v => onChange({ mode: v })}
        options={[{ value: "single", label: "Date précise (compte à rebours + horaires)" }, { value: "list", label: "Liste libre (un par ligne)" }]} />
      {data.mode === "list" ? (
        <>
          <Textarea label="Liste d'événements" rows={5} value={data.listText ?? ""} onChange={e => onChange({ listText: e.target.value })} placeholder="12 Mai - Soirée Alumni&#10;15 Mai - Conférence IA" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Début" type="datetime-local" value={toInput(data.date)} onChange={e => onChange({ date: e.target.value })} />
            <Input label="Fin" type="datetime-local" value={toInput(data.endDate)} onChange={e => onChange({ endDate: e.target.value })} />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Input label="Début" type="datetime-local" value={toInput(data.date)} onChange={e => onChange({ date: e.target.value })} />
          <Input label="Fin" type="datetime-local" value={toInput(data.endDate)} onChange={e => onChange({ endDate: e.target.value })} />
        </div>
      )}
      <Input label="Lieu" value={data.location ?? ""} onChange={e => onChange({ location: e.target.value })} />
      <Textarea label="Description" value={data.description ?? ""} onChange={e => onChange({ description: e.target.value })} rows={3} />
    </>
  );

  if (type === "spo") return (
    <>
      <Input label="Titre" value={data.title ?? ""} onChange={e => onChange({ title: e.target.value })} />
      <Textarea label="Sous-titre" rows={2} value={data.subtitle ?? ""} onChange={e => onChange({ subtitle: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Date & heure" type="datetime-local" value={toInput(data.date)} onChange={e => onChange({ date: e.target.value })} />
        <Input label="Lieu" value={data.location ?? ""} onChange={e => onChange({ location: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Capacité / mention" value={data.capacity ?? ""} onChange={e => onChange({ capacity: e.target.value })} />
        <Input label="CTA bouton QR" value={data.cta ?? ""} onChange={e => onChange({ cta: e.target.value })} placeholder="s'inscrire" />
      </div>
      <Input label="URL d'inscription (QR code)" value={data.qrUrl ?? ""} onChange={e => onChange({ qrUrl: e.target.value })} placeholder="https://..." />
      <div>
        <div className="text-[11px] font-medium uppercase tracking-widest text-white/55 mb-1.5">Image hero (background)</div>
        <FileToDataUrlInput hasValue={!!data.heroImage}
          onLoad={url => onChange({ heroImage: url })}
          onClear={() => onChange({ heroImage: "" })} />
        {data.heroImage && <img src={data.heroImage} alt="" className="mt-3 w-full h-32 object-cover rounded-xl border border-white/10" />}
      </div>
      <ProgrammeEditor programme={data.programme ?? []} onChange={(p) => onChange({ programme: p })} />
    </>
  );

  if (type === "poll") return (
    <>
      <Input label="Question" value={data.question ?? ""} onChange={e => onChange({ question: e.target.value })} />
      <div>
        <div className="text-[11px] font-medium uppercase tracking-widest text-white/55 mb-2">Options</div>
        <div className="space-y-2">
          {(data.options ?? []).map((opt, i) => (
            <div key={opt.id ?? i} className="flex items-center gap-2">
              <input className="flex-1 rounded-lg bg-white/[0.03] border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet/60"
                value={opt.label}
                onChange={e => { const n = data.options.slice(); n[i] = { ...opt, label: e.target.value }; onChange({ options: n }); }} />
              <input type="number" className="w-20 rounded-lg bg-white/[0.03] border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet/60"
                value={opt.votes ?? 0}
                onChange={e => { const n = data.options.slice(); n[i] = { ...opt, votes: Number(e.target.value) || 0 }; onChange({ options: n }); }} />
              <button onClick={() => onChange({ options: data.options.filter((_, j) => j !== i) })} className="rounded-md p-2 text-white/40 hover:text-red-400 hover:bg-white/5">×</button>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="mt-2"
          onClick={() => onChange({ options: [...(data.options ?? []), { id: `opt-${Date.now()}`, label: "Nouvelle option", votes: 0 }] })}>
          + Ajouter une option
        </Button>
      </div>
    </>
  );

  if (type === "puzzle") return (
    <>
      <Input label="Catégorie / titre" value={data.category ?? ""} onChange={e => onChange({ category: e.target.value })} placeholder="Énigme du jour" />
      <Textarea label="Question" rows={3} value={data.question ?? ""} onChange={e => onChange({ question: e.target.value })} />
      <Input label="Indice" value={data.hint ?? ""} onChange={e => onChange({ hint: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Récompense" value={data.reward ?? ""} onChange={e => onChange({ reward: e.target.value })} />
        <Input label="Texte CTA QR" value={data.cta ?? ""} onChange={e => onChange({ cta: e.target.value })} placeholder="répondre" />
      </div>
      <Input label="URL du QR (formulaire de réponse)" value={data.qrUrl ?? ""} onChange={e => onChange({ qrUrl: e.target.value })} placeholder="https://forms.gle/..." />
    </>
  );

  if (type === "business") return (
    <>
      <Input label="Tag (eyebrow)" value={data.tag ?? ""} onChange={e => onChange({ tag: e.target.value })} placeholder="Le saviez-vous" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Statistique (gros chiffre)" value={data.bigStat ?? ""} onChange={e => onChange({ bigStat: e.target.value })} placeholder="2M" />
        <Input label="Label sous le chiffre" value={data.statLabel ?? ""} onChange={e => onChange({ statLabel: e.target.value })} placeholder="Abonnés perdus" />
      </div>
      <Textarea label="Question / accroche" rows={2} value={data.question ?? ""} onChange={e => onChange({ question: e.target.value })} />
      <Textarea label="Contexte / explication" rows={3} value={data.context ?? ""} onChange={e => onChange({ context: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Source" value={data.source ?? ""} onChange={e => onChange({ source: e.target.value })} />
        <Input label="URL de la source" value={data.sourceUrl ?? ""} onChange={e => onChange({ sourceUrl: e.target.value })} placeholder="https://..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Année" value={data.year ?? ""} onChange={e => onChange({ year: e.target.value })} />
        <SelectField label="Tendance" value={data.trend ?? "down"} onChange={v => onChange({ trend: v })}
          options={[{ value: "down", label: "Baisse (rouge)" }, { value: "up", label: "Hausse (vert)" }, { value: "neutral", label: "Neutre (violet)" }]} />
      </div>
    </>
  );

  if (type === "weather") return (
    <>
      <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 cursor-pointer hover:border-white/20">
        <div>
          <div className="text-sm font-semibold text-white">Mode multi-campus</div>
          <div className="text-[11px] text-white/45 mt-0.5">Affiche les 3 campus PST&B (Paris, République, Grigny) côte à côte.</div>
        </div>
        <div
          onClick={(e) => { e.preventDefault(); onChange({ multiCampus: !data.multiCampus }); }}
          className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${data.multiCampus ? "bg-violet" : "bg-black border border-white/15"}`}
        >
          <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${data.multiCampus ? "translate-x-6" : "translate-x-1"}`} />
        </div>
      </label>
      {!data.multiCampus && (
        <>
          <Input label="Ville (affichage)" value={data.city ?? ""} onChange={e => onChange({ city: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Latitude" type="number" value={data.lat ?? ""} onChange={e => onChange({ lat: Number(e.target.value) || 0 })} hint="Paris ≈ 48.8566" />
            <Input label="Longitude" type="number" value={data.lon ?? ""} onChange={e => onChange({ lon: Number(e.target.value) || 0 })} hint="Paris ≈ 2.3522" />
          </div>
        </>
      )}
      <p className="text-[11px] text-white/45">Données fournies par Open-Meteo (gratuit, sans clé). Mise à jour toutes les 30 min.</p>
    </>
  );



  if (type === "gallery") return (
    <>
      <Input label="Titre de la galerie" value={data.title ?? ""} onChange={e => onChange({ title: e.target.value })} />
      <Input label="Cadence (s)" type="number" value={data.interval ?? 5} onChange={e => onChange({ interval: Number(e.target.value) || 5 })} hint="Temps d'affichage par photo" />
      <div>
        <div className="text-[11px] font-medium uppercase tracking-widest text-white/55 mb-2">Photos</div>
        <div className="space-y-3">
          {(data.images ?? []).map((im, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
              <div className="flex items-start gap-3">
                {im.url && <img src={im.url} alt="" className="w-20 h-20 object-cover rounded-lg border border-white/10 shrink-0" />}
                <div className="flex-1 space-y-2">
                  <input className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet/60"
                    placeholder="Légende" value={im.caption ?? ""}
                    onChange={e => { const n = data.images.slice(); n[i] = { ...im, caption: e.target.value }; onChange({ images: n }); }} />
                  <input className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet/60"
                    placeholder="Date / lieu" value={im.date ?? ""}
                    onChange={e => { const n = data.images.slice(); n[i] = { ...im, date: e.target.value }; onChange({ images: n }); }} />
                  <FileToDataUrlInput hasValue={!!im.url}
                    onLoad={url => { const n = data.images.slice(); n[i] = { ...im, url }; onChange({ images: n }); }}
                    onClear={() => { const n = data.images.slice(); n[i] = { ...im, url: "" }; onChange({ images: n }); }} />
                </div>
                <button onClick={() => onChange({ images: data.images.filter((_, j) => j !== i) })}
                  className="text-xs text-white/45 hover:text-red-400 px-2 py-1 shrink-0">Supprimer</button>
              </div>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="mt-2"
          onClick={() => onChange({ images: [...(data.images ?? []), { url: "", caption: "Nouvelle photo", date: "" }] })}>
          + Ajouter une photo
        </Button>
      </div>
    </>
  );

  if (type === "clock") return (
    <div className="grid grid-cols-2 gap-3">
      <Input label="Ville" value={data.city ?? ""} onChange={e => onChange({ city: e.target.value })} />
      <Input label="Fuseau horaire" value={data.timezone ?? ""} onChange={e => onChange({ timezone: e.target.value })} hint="ex : Europe/Paris" />
    </div>
  );

  if (type === "rss") return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Source" value={data.source ?? ""} onChange={e => onChange({ source: e.target.value })} />
        <Input label="URL" value={data.url ?? ""} onChange={e => onChange({ url: e.target.value })} />
      </div>
      <div>
        <div className="text-[11px] font-medium uppercase tracking-widest text-white/55 mb-2">Articles</div>
        <div className="space-y-3">
          {(data.items ?? []).map((item, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
              <input className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet/60"
                placeholder="Titre" value={item.title ?? ""}
                onChange={e => { const n = data.items.slice(); n[i] = { ...item, title: e.target.value }; onChange({ items: n }); }} />
              <textarea className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet/60 resize-none"
                placeholder="Résumé" rows={2} value={item.summary ?? ""}
                onChange={e => { const n = data.items.slice(); n[i] = { ...item, summary: e.target.value }; onChange({ items: n }); }} />
              <div className="flex items-center gap-2">
                <input type="date" className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet/60"
                  value={item.date ?? ""}
                  onChange={e => { const n = data.items.slice(); n[i] = { ...item, date: e.target.value }; onChange({ items: n }); }} />
                <button onClick={() => onChange({ items: data.items.filter((_, j) => j !== i) })}
                  className="ml-auto text-xs text-white/45 hover:text-red-400 px-2 py-1 rounded">Supprimer</button>
              </div>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="mt-2"
          onClick={() => onChange({ items: [...(data.items ?? []), { title: "Nouvel article", summary: "", date: new Date().toISOString().slice(0, 10) }] })}>
          + Ajouter un article
        </Button>
      </div>
    </>
  );

  if (type === "iframe") return (
    <>
      <Input label="URL du document" value={data.url ?? ""} onChange={e => onChange({ url: e.target.value })} placeholder="https://..." />
      <div>
        <div className="text-[11px] font-medium uppercase tracking-widest text-white/55 mb-2">Ou téléverser un fichier (PDF, Image, Vidéo)</div>
        <FileToDataUrlInput accept="application/pdf,image/*,video/mp4,video/quicktime"
          hasValue={!!data.url}
          onLoad={url => onChange({ url })}
          onClear={() => onChange({ url: "" })} />
      </div>
    </>

  );

  if (type === "word") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Mot/Terme" value={data.word ?? ""} onChange={e => onChange({ word: e.target.value })} />
          <Input label="Prononciation (ex: sa-as)" value={data.pronunciation ?? ""} onChange={e => onChange({ pronunciation: e.target.value })} />
        </div>
        <Input label="Catégorie (ex: Tech & Business)" value={data.category ?? ""} onChange={e => onChange({ category: e.target.value })} />
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-white/50 ml-1">Définition</label>
          <Textarea value={data.definition ?? ""} onChange={e => onChange({ definition: e.target.value })} rows={3} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-white/50 ml-1">Exemple d'utilisation</label>
          <Textarea value={data.example ?? ""} onChange={e => onChange({ example: e.target.value })} rows={2} />
        </div>
      </div>
    );
  }

  if (type === "student") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Titre de l'événement" value={data.title ?? ""} onChange={e => onChange({ title: e.target.value })} />
          <Input label="Organisateur (Assos/BDE)" value={data.submitter ?? ""} onChange={e => onChange({ submitter: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-white/50 ml-1">Description courte</label>
          <Textarea value={data.description ?? ""} onChange={e => onChange({ description: e.target.value })} rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Date & Heure" value={data.dateLabel ?? ""} onChange={e => onChange({ dateLabel: e.target.value })} />
          <Input label="URL du QR Code" value={data.qrUrl ?? ""} onChange={e => onChange({ qrUrl: e.target.value })} />
        </div>
        <div>
          <div className="text-[11px] font-medium uppercase tracking-widest text-white/55 mb-2">Affiche / Image de fond</div>
          <FileToDataUrlInput accept="image/*"
            hasValue={!!data.imageUrl}
            onLoad={url => onChange({ imageUrl: url })}
            onClear={() => onChange({ imageUrl: "" })} />
        </div>
      </div>
    );
  }

  if (type === "wordle") {
    return (
      <div className="space-y-6">
        <label className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.015] px-5 py-4 cursor-pointer hover:border-white/20 transition-colors">
          <input type="checkbox" checked={data.pauseMode ?? false}
            onChange={e => onChange({ pauseMode: e.target.checked })}
            className="accent-emerald-500 w-4 h-4 rounded" />
          <div>
            <div className="text-sm text-emerald-400 font-bold uppercase tracking-widest">Jeu en pause</div>
            <div className="text-xs text-white/50 mt-0.5">Coche ceci quand quelqu'un a trouvé le mot pour afficher l'écran "Pause de 5min".</div>
          </div>
        </label>
        <Input label="Mot à deviner (en majuscules)" value={data.word ?? ""} onChange={e => onChange({ word: e.target.value.toUpperCase() })} />
        <Input label="Indices des lettres révélées (ex: 0,3)" value={data.revealed ?? ""} onChange={e => onChange({ revealed: e.target.value })} hint="Séparés par des virgules. 0 = 1ère lettre." />
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-white/50 ml-1">Indice pour le mot</label>
          <Textarea value={data.hint ?? ""} onChange={e => onChange({ hint: e.target.value })} rows={2} />
        </div>
      </div>
    );
  }

  if (type === "quote") return (
    <>
      <Textarea label="Citation" value={data.text ?? ""} onChange={e => onChange({ text: e.target.value })} rows={3} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Auteur" value={data.author ?? ""} onChange={e => onChange({ author: e.target.value })} />
        <Input label="Rôle / fonction" value={data.role ?? ""} onChange={e => onChange({ role: e.target.value })} placeholder="Chief AI · Meta" />
      </div>
    </>
  );

  if (type === "showcase") {
    const variant = data.variant ?? "webcam";
    return (
      <>
        <SelectField label="Variante visuelle" value={variant} onChange={v => onChange({ variant: v })}
          options={[
            { value: "webcam", label: "Astuce RGPD / Icône" },
            { value: "newsletter-opus", label: "Newsletter hebdo" },
            { value: "newsletter-interne", label: "Newsletter interne" },
          ]} />

        {variant === "newsletter-opus" && <NewsletterOpusEditor data={data} onChange={onChange} />}

        {variant === "webcam" && (
          <>
            <Input label="Titre principal" value={data.title ?? ""} onChange={e => onChange({ title: e.target.value })} />
            <SelectField label="Icône" value={data.iconName ?? "camera"} onChange={v => onChange({ iconName: v })}
              options={[
                { value: "camera", label: "Caméra" }, { value: "shield", label: "Bouclier" }, { value: "alert", label: "Alerte" },
                { value: "eye", label: "Œil barré" }, { value: "lock", label: "Cadenas" }, { value: "server", label: "Serveur" },
                { value: "wifi", label: "Wi-Fi" }, { value: "qrcode", label: "QR Code" }, { value: "update", label: "Mise à jour" },
                { value: "email", label: "Email" }, { value: "cloud", label: "Cloud" }, { value: "password", label: "Mot de passe" },
                { value: "silence", label: "Silence" }, { value: "linkedin", label: "LinkedIn" }, { value: "mask", label: "Masque" },
                { value: "poster", label: "Poster" }, { value: "cv", label: "CV" }, { value: "drive", label: "Drive" },
                { value: "usb", label: "Clé USB" }, { value: "whatsapp", label: "WhatsApp" }, { value: "screen", label: "Écran" },
              ]} />
            <Textarea label="Texte astuce" value={data.subtitle ?? ""} onChange={e => onChange({ subtitle: e.target.value })} rows={2} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Pied de page (gauche)" value={data.footerTitle ?? ""} onChange={e => onChange({ footerTitle: e.target.value })} />
              <Input label="Pied de page (droite)" value={data.footerSubtitle ?? ""} onChange={e => onChange({ footerSubtitle: e.target.value })} />
            </div>
          </>
        )}

        {variant === "newsletter-interne" && (
          <>
            <Input label="Titre principal" value={data.headline ?? ""} onChange={e => onChange({ headline: e.target.value })} />
            <Input label="Édition" value={data.edition ?? ""} onChange={e => onChange({ edition: e.target.value })} placeholder="Avril 2026" />
            <Textarea label="Sous-titre / chapô" value={data.subtitle ?? ""} onChange={e => onChange({ subtitle: e.target.value })} rows={2} />
            <div>
              <div className="text-[11px] font-medium uppercase tracking-widest text-white/55 mb-1.5">Image de fond</div>
              <FileToDataUrlInput hasValue={!!data.imageUrl}
                onLoad={url => onChange({ imageUrl: url })}
                onClear={() => onChange({ imageUrl: "" })} />
              {data.imageUrl && <img src={data.imageUrl} alt="" className="mt-3 w-full h-32 object-cover rounded-xl border border-white/10" />}
            </div>
          </>
        )}
      </>
    );
  }

  if (type === "social") return (
    <>
      <SelectField label="Réseau social" value={data.network ?? "linkedin"} onChange={v => onChange({ network: v })}
        options={[{ value: "linkedin", label: "LinkedIn" }, { value: "instagram", label: "Instagram" }]} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Auteur" value={data.author ?? ""} onChange={e => onChange({ author: e.target.value })} placeholder="PST&B" />
        <Input label="Rôle / bio" value={data.authorRole ?? ""} onChange={e => onChange({ authorRole: e.target.value })} />
      </div>
      <Textarea label="Contenu du post" rows={4} value={data.content ?? ""} onChange={e => onChange({ content: e.target.value })} />
      <div>
        <div className="text-[11px] font-medium uppercase tracking-widest text-white/55 mb-1.5">Image du post</div>
        <FileToDataUrlInput hasValue={!!data.image}
          onLoad={url => onChange({ image: url })}
          onClear={() => onChange({ image: "" })} />
        {data.image && <img src={data.image} alt="" className="mt-3 w-full h-32 object-cover rounded-xl border border-white/10" />}
      </div>
      <div>
        <div className="text-[11px] font-medium uppercase tracking-widest text-white/55 mb-1.5">Avatar auteur</div>
        <FileToDataUrlInput hasValue={!!data.authorAvatar}
          onLoad={url => onChange({ authorAvatar: url })}
          onClear={() => onChange({ authorAvatar: "" })} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input label="Likes" type="number" value={data.likes ?? 0} onChange={e => onChange({ likes: Number(e.target.value) || 0 })} />
        <Input label="Commentaires" type="number" value={data.comments ?? 0} onChange={e => onChange({ comments: Number(e.target.value) || 0 })} />
        <Input label="Partages" type="number" value={data.shares ?? 0} onChange={e => onChange({ shares: Number(e.target.value) || 0 })} />
      </div>
      <Input label="Date de publication" value={data.postedAt ?? ""} onChange={e => onChange({ postedAt: e.target.value })} placeholder="Aujourd'hui" />
    </>
  );

  if (type === "jobs") return (
    <>
      <Input label="Titre section" value={data.headline ?? ""} onChange={e => onChange({ headline: e.target.value })} placeholder="Offres du moment" />
      <Input label="Sous-titre" value={data.source ?? ""} onChange={e => onChange({ source: e.target.value })} placeholder="Alternances, stages et emplois" />
      <div className="p-4 rounded-xl border border-violet/20 bg-violet/5 space-y-3">
        <div className="text-[11px] font-bold uppercase tracking-widest text-violet mb-1">Recherche automatique (Adzuna)</div>
        <p className="text-[11px] text-white/40 mb-2">Si aucune offre manuelle n'est ajoutée, le widget récupère automatiquement des offres via Adzuna.</p>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Recherche" value={data.searchQuery ?? ""} onChange={e => onChange({ searchQuery: e.target.value })} placeholder="alternance développeur" />
          <Input label="Localisation" value={data.searchLocation ?? ""} onChange={e => onChange({ searchLocation: e.target.value })} placeholder="Paris" />
        </div>
      </div>
      <div>
        <div className="text-[11px] font-medium uppercase tracking-widest text-white/55 mb-2">Offres</div>
        <div className="space-y-3">
          {(data.offers ?? []).map((offer, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet/60"
                  placeholder="Poste" value={offer.title ?? ""}
                  onChange={e => { const n = data.offers.slice(); n[i] = { ...offer, title: e.target.value }; onChange({ offers: n }); }} />
                <input className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet/60"
                  placeholder="Entreprise" value={offer.company ?? ""}
                  onChange={e => { const n = data.offers.slice(); n[i] = { ...offer, company: e.target.value }; onChange({ offers: n }); }} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet/60"
                  placeholder="Localisation" value={offer.location ?? ""}
                  onChange={e => { const n = data.offers.slice(); n[i] = { ...offer, location: e.target.value }; onChange({ offers: n }); }} />
                <select className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet/60 [&>option]:bg-[#141414]"
                  value={offer.contract ?? "Alternance"}
                  onChange={e => { const n = data.offers.slice(); n[i] = { ...offer, contract: e.target.value }; onChange({ offers: n }); }}>
                  <option value="Alternance">Alternance</option>
                  <option value="Stage">Stage</option>
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                </select>
              </div>
              <textarea className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet/60 resize-none"
                placeholder="Description courte" rows={2} value={offer.description ?? ""}
                onChange={e => { const n = data.offers.slice(); n[i] = { ...offer, description: e.target.value }; onChange({ offers: n }); }} />
              <button onClick={() => onChange({ offers: data.offers.filter((_, j) => j !== i) })}
                className="text-xs text-white/45 hover:text-red-400 px-2 py-1">Supprimer</button>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="mt-2"
          onClick={() => onChange({ offers: [...(data.offers ?? []), { title: "Nouveau poste", company: "", location: "Paris", contract: "Alternance", description: "" }] })}>
          + Ajouter une offre
        </Button>
      </div>
    </>
  );

  if (type === "transport") return (
    <TransportDisruptionsEditor data={data} onChange={onChange} />
  );

  if (type === "crypto") return (
    <p className="text-sm text-white/45">Affiche les 12 plus grosses cryptos en temps réel (prix, variation 24h, sparkline 7j). Données CoinGecko, mises à jour toutes les minutes.</p>
  );

  if (type === "github-trending") return (
    <p className="text-sm text-white/45">Top 10 des dépôts GitHub les plus étoilés sur les dernières 24h. Données api.github.com, mise en cache 30 min.</p>
  );

  if (type === "countdown") return (
    <>
      <Input label="Titre" value={data.title ?? ""} onChange={e => onChange({ title: e.target.value })} placeholder="Hackathon PST&B" />
      <Textarea label="Sous-titre (optionnel)" rows={2} value={data.subtitle ?? ""} onChange={e => onChange({ subtitle: e.target.value })} />
      <Input
        label="Date cible"
        type="datetime-local"
        value={data.date ? new Date(data.date).toISOString().slice(0, 16) : ""}
        onChange={e => onChange({ date: e.target.value ? new Date(e.target.value).toISOString() : "" })}
      />
      <SelectField
        label="Couleur d'accent"
        value={data.accent ?? "violet"}
        onChange={v => onChange({ accent: v })}
        options={[
          { value: "violet", label: "Violet" },
          { value: "red", label: "Rouge (urgent)" },
          { value: "amber", label: "Ambre" },
          { value: "emerald", label: "Émeraude" },
        ]}
      />
    </>
  );

  if (type === "hub") return (
    <>
      <p className="text-[11px] text-white/45">Ce widget agrège l'heure, la météo locale, le prochain événement et la première ligne du bandeau live. Idéal en page d'accueil de la rotation.</p>
      <Input label="Nom du campus (affichage)" value={data.campus ?? ""} onChange={e => onChange({ campus: e.target.value })} placeholder="Campus Paris" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Latitude" type="number" value={data.lat ?? ""} onChange={e => onChange({ lat: Number(e.target.value) || 0 })} hint="Paris ≈ 48.8566" />
        <Input label="Longitude" type="number" value={data.lon ?? ""} onChange={e => onChange({ lon: Number(e.target.value) || 0 })} hint="Paris ≈ 2.3522" />
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
        <div className="text-[11px] font-medium uppercase tracking-widest text-white/60">Prochain evenement (override Hub)</div>
        <Input
          label="Titre de l'evenement"
          value={data.nextEvent?.name ?? ""}
          onChange={e => onChange({ nextEvent: { ...(data.nextEvent || {}), name: e.target.value } })}
          placeholder="Laisser vide pour utiliser automatiquement les widgets Evenement"
        />
        <Input
          label="Date et heure"
          type="datetime-local"
          value={data.nextEvent?.date ? new Date(data.nextEvent.date).toISOString().slice(0, 16) : ""}
          onChange={e => onChange({
            nextEvent: {
              ...(data.nextEvent || {}),
              date: e.target.value ? new Date(e.target.value).toISOString() : "",
            },
          })}
        />
        <Input
          label="Lieu (optionnel)"
          value={data.nextEvent?.location ?? ""}
          onChange={e => onChange({ nextEvent: { ...(data.nextEvent || {}), location: e.target.value } })}
          placeholder="Campus PST&B - Paris"
        />
      </div>
    </>
  );

  if (type === "spo-video") return (
    <>
      <Input label="Titre" value={data.title ?? ""} onChange={e => onChange({ title: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Date de l'évènement" type="date" value={data.date ? data.date.split("T")[0] : ""} onChange={e => onChange({ date: e.target.value })} />
        <Input label="Lieu" value={data.location ?? ""} onChange={e => onChange({ location: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="CTA bouton QR" value={data.cta ?? ""} onChange={e => onChange({ cta: e.target.value })} placeholder="s'inscrire" />
        <Input label="URL d'inscription (QR code)" value={data.qrUrl ?? ""} onChange={e => onChange({ qrUrl: e.target.value })} placeholder="https://..." />
      </div>
      <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.015] px-4 py-3 cursor-pointer hover:border-white/20 transition-colors">
        <input type="checkbox" checked={data.hideContent ?? false}
          onChange={e => onChange({ hideContent: e.target.checked })}
          className="accent-violet w-4 h-4 rounded" />
        <div>
          <div className="text-sm text-white font-semibold">Masquer les textes (Mode vidéo seule)</div>
          <div className="text-[11px] text-white/45">Affiche uniquement la vidéo en plein écran sans les infos SPO.</div>
        </div>
      </label>
      <div>
        <div className="text-[11px] font-medium uppercase tracking-widest text-white/55 mb-1.5">Lien de la vidéo (Drive, Dropbox, Direct...)</div>
        <Input
          value={data.videoUrl ?? ""}
          onChange={e => onChange({ videoUrl: e.target.value })}
          placeholder="https://drive.google.com/file/d/.../view"
        />
        <div className="mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="text-[10px] text-amber-400 font-bold uppercase mb-1 flex items-center gap-1.5">
            <AlertTriangle size={10} /> Attention Google Drive
          </div>
          <p className="text-[10px] text-white/50 leading-relaxed">
            Google Drive bloque souvent la lecture directe des fichiers volumineux (&gt;100 Mo) avec un message d'erreur. Si la vidéo reste noire, utilisez un lien direct ou réduisez la taille du fichier.
          </p>
        </div>


        <div className="text-[11px] font-medium uppercase tracking-widest text-white/55 mb-1.5">Ou téléverser (max 5-10 Mo conseillé)</div>
        <FileToDataUrlInput accept="video/mp4,video/quicktime,video/webm"
          hasValue={!!data.videoUrl && data.videoUrl.startsWith("data:")}
          onLoad={url => onChange({ videoUrl: url })}
          onClear={() => onChange({ videoUrl: "" })} />
        {data.videoUrl && (

          <div className="mt-3 relative rounded-xl overflow-hidden border border-white/10 aspect-video">
            <video src={data.videoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
          </div>
        )}
      </div>
    </>
  );

  if (type === "video") return (
    <>
      <div>
        <div className="text-[11px] font-medium uppercase tracking-widest text-white/55 mb-1.5">Lien de la vidéo (Direct / Drive / Dropbox)</div>
        <Input
          value={data.videoUrl ?? ""}
          onChange={e => onChange({ videoUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <SelectField label="Remplissage" value={data.objectFit ?? "cover"} onChange={v => onChange({ objectFit: v })}
        options={[{ value: "cover", label: "Remplir (Cover)" }, { value: "contain", label: "Entier (Contain)" }]} />
      <div>
        <div className="text-[11px] font-medium uppercase tracking-widest text-white/55 mb-1.5">Ou téléverser un fichier</div>
        <FileToDataUrlInput accept="video/mp4,video/quicktime,video/webm"
          hasValue={!!data.videoUrl && data.videoUrl.startsWith("data:")}
          onLoad={url => onChange({ videoUrl: url })}
          onClear={() => onChange({ videoUrl: "" })} />
      </div>
    </>
  );

  if (type === "network-status") return (
    <div className="space-y-2">
      <p className="text-sm text-white/45">
        Widget de supervision automatique du réseau campus.
      </p>
      <p className="text-xs text-white/40">
        Configure `NETWORK_PUBLIC_URL` et `NETWORK_WIFI_IP` dans `.env.local` (et Vercel) pour activer les checks HTTP/TCP.
      </p>
    </div>
  );

  if (type === "bfm-stream") return (
    <>
      <div className="space-y-2">
        <div className="text-[11px] font-medium uppercase tracking-widest text-white/55">Chaîne par défaut</div>
        <div className="flex gap-2">
          <button onClick={() => onChange({ type: "business" })}
            className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${data.type !== "tech" ? "border-red-500 bg-red-500/10 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white"}`}>
            <span className="font-bold">BFM Business</span>
          </button>
          <button onClick={() => onChange({ type: "tech" })}
            className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${data.type === "tech" ? "border-blue-500 bg-blue-500/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white"}`}>
            <span className="font-bold">BFM Tech & Co</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-4 mt-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-violet mb-1">Horaires Spécifiques (Optionnel)</div>
          <p className="text-xs text-white/45">Bascule automatiquement sur l'autre chaîne pendant ce créneau.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Heure de début" type="time" value={data.scheduleStart ?? ""} onChange={e => onChange({ scheduleStart: e.target.value })} />
          <Input label="Heure de fin" type="time" value={data.scheduleEnd ?? ""} onChange={e => onChange({ scheduleEnd: e.target.value })} />
        </div>

        <div>
          <div className="text-[11px] font-medium uppercase tracking-widest text-white/55 mb-2">Chaîne pendant cet horaire</div>
          <div className="flex gap-2">
            <button onClick={() => onChange({ scheduleType: "business" })}
              className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all ${data.scheduleType !== "tech" ? "border-red-500 bg-red-500/10 text-red-100" : "border-white/10 bg-black/40 text-white/40 hover:text-white/80 hover:bg-white/5"}`}>
              BFM Business
            </button>
            <button onClick={() => onChange({ scheduleType: "tech" })}
              className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all ${data.scheduleType === "tech" ? "border-blue-500 bg-blue-500/10 text-blue-100" : "border-white/10 bg-black/40 text-white/40 hover:text-white/80 hover:bg-white/5"}`}>
              BFM Tech & Co
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return <p className="text-sm text-white/45">Pas d'éditeur pour ce type.</p>;
}

/* ════════════════════════════════════════════
   Sub-editors
═══════════════════════════════════════════════ */
function ProgrammeEditor({ programme, onChange }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-widest text-white/55 mb-2">Programme (4 max affichés)</div>
      <div className="space-y-2">
        {programme.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className="w-24 rounded-lg bg-white/[0.03] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet/60"
              placeholder="18:00" value={p.time ?? ""}
              onChange={e => { const n = programme.slice(); n[i] = { ...p, time: e.target.value }; onChange(n); }} />
            <input className="flex-1 rounded-lg bg-white/[0.03] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet/60"
              placeholder="Titre" value={p.title ?? ""}
              onChange={e => { const n = programme.slice(); n[i] = { ...p, title: e.target.value }; onChange(n); }} />
            <button onClick={() => onChange(programme.filter((_, j) => j !== i))} className="text-xs text-white/45 hover:text-red-400 px-2">×</button>
          </div>
        ))}
      </div>
      <Button variant="ghost" size="sm" className="mt-2" onClick={() => onChange([...programme, { time: "", title: "" }])}>
        + Étape
      </Button>
    </div>
  );
}

function NewsletterOpusEditor({ data, onChange }) {
  const hero = data.hero ?? {};
  const side = Array.isArray(data.side) ? data.side : [];
  const setHero = patch => onChange({ hero: { ...hero, ...patch } });
  const setSide = (i, patch) => { const next = side.slice(); next[i] = { ...(next[i] ?? {}), ...patch }; onChange({ side: next }); };
  const addSide = () => { if (side.length >= 2) return; onChange({ side: [...side, { title: "Nouvel article", body: "", image: "" }] }); };
  const removeSide = i => onChange({ side: side.filter((_, j) => j !== i) });

  return (
    <div className="space-y-5 pt-4 border-t border-white/8">
      <div className="grid grid-cols-3 gap-3">
        <Input label="Cadence" value={data.cadence ?? ""} onChange={e => onChange({ cadence: e.target.value })} placeholder="HEBDOMADAIRE" />
        <Input label="Semaine" value={data.weekLabel ?? ""} onChange={e => onChange({ weekLabel: e.target.value })} placeholder="Semaine 16" />
        <Input label="Dates" value={data.dateLabel ?? ""} onChange={e => onChange({ dateLabel: e.target.value })} placeholder="20-24 AVRIL" />
      </div>

      <Textarea label="Titre principal (gros violet)" value={data.headline ?? ""} onChange={e => onChange({ headline: e.target.value })} rows={2} />

      <div className="rounded-xl border border-red-500/40 bg-red-500/5 p-4 space-y-3">
        <div className="text-[11px] font-bold uppercase tracking-widest text-red-400">Article principal · cadre rouge</div>
        <Input label="Titre" value={hero.title ?? ""} onChange={e => setHero({ title: e.target.value })} />
        <Input label="Label sur image" value={hero.imageLabel ?? ""} onChange={e => setHero({ imageLabel: e.target.value })} />
        <FileToDataUrlInput hasValue={!!hero.image} onLoad={url => setHero({ image: url })} onClear={() => setHero({ image: "" })} />
        {hero.image && <img src={hero.image} alt="" className="mt-2 w-full h-24 object-cover rounded border border-white/10" />}
        <Textarea label="Texte (HTML autorisé : <strong>, <em>)" value={hero.body ?? ""} onChange={e => setHero({ body: e.target.value })} rows={3} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold uppercase tracking-widest text-violet">Articles secondaires · 2 max</div>
          {side.length < 2 && <Button variant="ghost" size="sm" onClick={addSide}>+ Ajouter</Button>}
        </div>
        {side.map((item, i) => (
          <div key={i} className="rounded-xl border border-violet/40 bg-violet/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-widest text-violet">Article {i + 1}</div>
              <button onClick={() => removeSide(i)} className="text-xs text-white/55 hover:text-red-400 px-2">Supprimer</button>
            </div>
            <Input label="Titre" value={item.title ?? ""} onChange={e => setSide(i, { title: e.target.value })} />
            <FileToDataUrlInput hasValue={!!item.image} onLoad={url => setSide(i, { image: url })} onClear={() => setSide(i, { image: "" })} />
            {item.image && <img src={item.image} alt="" className="mt-2 w-20 h-20 object-cover rounded border border-white/10" />}
            <Textarea label="Texte (HTML autorisé)" value={item.body ?? ""} onChange={e => setSide(i, { body: e.target.value })} rows={2} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Input label="Sources" value={data.sources ?? ""} onChange={e => onChange({ sources: e.target.value })} />
        <Input label="Contact" value={data.contact ?? ""} onChange={e => onChange({ contact: e.target.value })} />
        <Input label="Prochaine édition" value={data.nextEdition ?? ""} onChange={e => onChange({ nextEdition: e.target.value })} />
      </div>
    </div>
  );
}

function toInput(iso) {
  try {
    const d = new Date(iso);
    const p = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  } catch { return ""; }
}

/* =====================================
   TRANSPORT DISRUPTIONS EDITOR
====================================== */
const TRANSPORT_LINES = {
  rer: ["A", "B", "C", "D", "E", "H", "J", "K", "L", "N", "P", "R", "U"],
  metro: ["1", "2", "3", "3b", "4", "5", "6", "7", "7b", "8", "9", "10", "11", "12", "13", "14"],
  tram: ["T1", "T2", "T3a", "T3b", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11"],
};

function TransportDisruptionsEditor({ data, onChange }) {
  const [disruptions, setDisruptions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load current disruptions from API on mount
  useEffect(() => {
    fetch("/api/transport")
      .then(r => r.json())
      .then(json => {
        const all = [
          ...(json.lines?.rer ?? []),
          ...(json.lines?.metro ?? []),
          ...(json.lines?.tram ?? []),
        ].filter(l => l.status !== "ok");
        setDisruptions(all.map(l => ({ lineId: l.id, status: l.status, message: l.message || "" })));
      })
      .catch(() => { });
  }, []);

  const addDisruption = () => setDisruptions(d => [...d, { lineId: "A", status: "disrupted", message: "" }]);
  const removeDisruption = (i) => setDisruptions(d => d.filter((_, j) => j !== i));
  const update = (i, patch) => setDisruptions(d => d.map((item, j) => j === i ? { ...item, ...patch } : item));

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/transport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disruptions }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };




  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">Configure les perturbations qui s&apos;affichent sur le widget transport. Sans perturbation, &laquo;&nbsp;Trafic normal&nbsp;&raquo; est affiché.</p>
        </div>
        <button
          onClick={addDisruption}
          className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-violet hover:text-white transition-colors bg-violet/10 hover:bg-violet/30 px-3 py-1.5 rounded-lg shrink-0"
        >
          <Plus size={12} strokeWidth={3} /> Ajouter
        </button>
      </div>

      {disruptions.length === 0 ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-sm text-emerald-400 font-medium">Aucune perturbation — trafic normal</span>
        </div>
      ) : (
        <div className="space-y-3">
          {disruptions.map((d, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 space-y-3">
              <div className="flex items-center gap-3">
                <select
                  value={d.lineId}
                  onChange={e => update(i, { lineId: e.target.value })}
                  className="flex-1 rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet/50"
                >
                  <optgroup label="RER / Trains">
                    {TRANSPORT_LINES.rer.map(id => <option key={id} value={id}>RER {id}</option>)}
                  </optgroup>
                  <optgroup label="Métro">
                    {TRANSPORT_LINES.metro.map(id => <option key={id} value={id}>Métro {id}</option>)}
                  </optgroup>
                  <optgroup label="Tram">
                    {TRANSPORT_LINES.tram.map(id => <option key={id} value={id}>Tram {id}</option>)}
                  </optgroup>
                </select>
                <select
                  value={d.status}
                  onChange={e => update(i, { status: e.target.value })}
                  className={`rounded-xl border px-3 py-2 text-sm font-bold focus:outline-none focus:border-violet/50 ${d.status === "critical"
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    }`}
                >
                  <option value="disrupted">Perturbé</option>
                  <option value="critical">Interrompu</option>
                </select>
                <button onClick={() => removeDisruption(i)} className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
              <input
                placeholder="Message (optionnel) — ex: Travaux jusqu'au 30 mai"
                value={d.message}
                onChange={e => update(i, { message: e.target.value })}
                className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet/50"
              />
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-3 rounded-2xl font-bold text-sm transition-all ${saved
          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          : "bg-violet hover:bg-violet/80 text-white"
          }`}
      >
        {saved ? "✓ Sauvegardé — la télé se met à jour" : saving ? "Sauvegarde..." : "Appliquer les perturbations"}
      </button>
    </div>
  );
}

/* =====================================
   ANALYTICS PANEL
====================================== */
function QrGenerator({ widgets }) {
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [customUrl, setCustomUrl] = useState("");
  const [label, setLabel] = useState("");
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const targetUrl = selectedWidget
    ? (() => {
      const w = widgets.find((x) => x.id === selectedWidget);
      // Default tracked URL per widget type
      const dest = w?.type === "wordle" ? `${baseUrl}/jeu`
        : w?.type === "jobs" ? `${baseUrl}/etudiants`
          : w?.type === "poll" ? `${baseUrl}/vote`
            : customUrl || baseUrl;
      return dest;
    })()
    : customUrl;

  const trackingUrl = targetUrl && selectedWidget
    ? `${baseUrl}/api/track?w=${selectedWidget}&url=${encodeURIComponent(targetUrl)}`
    : targetUrl
      ? `${baseUrl}/api/track?url=${encodeURIComponent(targetUrl)}`
      : null;

  const handleCopy = () => {
    if (!trackingUrl) return;
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    const svg = document.getElementById("qr-preview");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `qr-${label || selectedWidget || "pstb"}.svg`;
    a.click();
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <QrCode size={16} className="text-violet" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">Générateur de QR Code</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Config */}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-2">Widget lié (optionnel)</label>
            <select
              value={selectedWidget || ""}
              onChange={(e) => setSelectedWidget(e.target.value || null)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet/50"
            >
              <option value="">— Aucun widget (URL libre) —</option>
              {widgets.map((w) => (
                <option key={w.id} value={w.id}>{w.title} ({w.type})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-2">URL de destination</label>
            <input
              type="url"
              value={selectedWidget
                ? (() => {
                  const w = widgets.find((x) => x.id === selectedWidget);
                  return w?.type === "wordle" ? `${baseUrl}/jeu`
                    : w?.type === "jobs" ? `${baseUrl}/etudiants`
                      : w?.type === "poll" ? `${baseUrl}/vote`
                        : customUrl || baseUrl;
                })()
                : customUrl}
              onChange={(e) => { setCustomUrl(e.target.value); setSelectedWidget(null); }}
              placeholder="https://..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-violet/50"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-2">Label (pour le nom du fichier)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex: wordle-salle-b"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet/50"
            />
          </div>

          {trackingUrl && (
            <div className="rounded-xl bg-white/[0.03] border border-white/8 p-4">
              <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">URL de tracking générée</div>
              <div className="text-xs font-mono text-violet break-all">{trackingUrl}</div>
              <button
                onClick={handleCopy}
                className="mt-3 flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied ? "Copié !" : "Copier l’URL"}
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleDownloadSvg}
              disabled={!trackingUrl}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet/20 text-violet text-sm font-semibold hover:bg-violet/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Download size={14} /> Télécharger SVG
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col items-center justify-center gap-4">
          {trackingUrl ? (
            <div className="p-6 bg-white rounded-2xl shadow-xl">
              <QRCode id="qr-preview" value={trackingUrl} size={180} />
            </div>
          ) : (
            <div className="w-[220px] h-[220px] rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center">
              <QrCode size={48} className="text-white/10" />
            </div>
          )}
          {label && <div className="text-sm text-white/50 font-medium">{label}</div>}
        </div>
      </div>
    </div>
  );
}

function AnalyticsPanel({ widgets, settings }) {
  const [sseStatus, setSseStatus] = useState("checking");
  const [lastPing, setLastPing] = useState(null);
  const [uptime, setUptime] = useState(0);
  const [analytics, setAnalytics] = useState({ students: [], stats: { scans: {}, events: [] } });
  const [showPins, setShowPins] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setUptime(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const es = new EventSource("/api/stream");
    es.onopen = () => setSseStatus("connected");
    es.onmessage = () => setLastPing(new Date());
    es.onerror = () => setSseStatus("error");
    return () => es.close();
  }, []);

  useEffect(() => {
    fetch("/api/analytics")
      .then(res => res.json())
      .then(data => { if (!data.error) setAnalytics(data); })
      .catch(err => console.error("Failed to load analytics", err));
  }, []);

  const activeWidgets = widgets.filter(w => w.focusable && w.status !== "pending");
  const pendingWidgets = widgets.filter(w => w.status === "pending");
  const typeCounts = activeWidgets.reduce((acc, w) => ({ ...acc, [w.type]: (acc[w.type] || 0) + 1 }), {});

  const totalScans = Object.values(analytics.stats?.scans || {}).reduce((s, v) => s + v, 0);
  const totalEvents = (analytics.stats?.events || []).length;

  const fmtUptime = (s) => {
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-emerald-400">Tableau de bord</span>
        <h2 className="text-3xl font-bold text-white tracking-tight mt-1">Analytics</h2>
        <p className="text-sm text-white/40 mt-1">Vue temps réel de l’état du dashboard.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <div className="text-[10px] uppercase tracking-widest text-white/35 mb-2">Widgets actifs</div>
          <div className="text-4xl font-black text-white">{activeWidgets.length}</div>
          <div className="text-xs text-white/35 mt-1">/ {widgets.length} total</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <div className="text-[10px] uppercase tracking-widest text-white/35 mb-2">Étudiants inscrits</div>
          <div className="text-4xl font-black text-emerald-400">{analytics.students.length}</div>
          <div className="text-xs text-white/35 mt-1">comptes PST&B</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <div className="text-[10px] uppercase tracking-widest text-white/35 mb-2">Scans QR Code</div>
          <div className="text-4xl font-black text-violet">{totalScans}</div>
          <div className="text-xs text-white/35 mt-1">{totalEvents} avec session</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <div className="text-[10px] uppercase tracking-widest text-white/35 mb-2">Session admin</div>
          <div className="text-2xl font-black text-emerald-400">{fmtUptime(uptime)}</div>
          <div className="text-xs text-white/35 mt-1">depuis l’ouverture</div>
        </div>
      </div>

      {/* SSE Status */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/35 mb-1">Connexion temps réel (SSE)</div>
            <div className="flex items-center gap-2 mt-2">
              {sseStatus === "connected" ? (
                <><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-bold text-emerald-400">Connecté</span></>
              ) : sseStatus === "error" ? (
                <><WifiOff size={16} className="text-red-400" />
                  <span className="text-sm font-bold text-red-400">Déconnecté</span></>
              ) : (
                <><RefreshCw size={14} className="text-white/40 animate-spin" />
                  <span className="text-sm text-white/40">Vérification...</span></>
              )}
            </div>
          </div>
          {lastPing && (
            <div className="text-right">
              <div className="text-[10px] text-white/35 uppercase tracking-widest">Dernier événement</div>
              <div className="text-sm font-mono text-white mt-1">
                {lastPing.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Widget breakdown */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-4">Répartition par type</div>
        <div className="space-y-2">
          {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
            const meta = TYPE_META[type];
            const Icon = meta?.Icon ?? Sparkles;
            const pct = Math.round((count / activeWidgets.length) * 100);
            return (
              <div key={type} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-44 shrink-0">
                  <Icon size={13} className={meta?.color ?? "text-white/50"} />
                  <span className="text-sm text-white/70 truncate">{meta?.label ?? type}</span>
                </div>
                <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full bg-violet/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-mono text-white/40 w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sequence preview */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-4">Séquence de rotation</div>
        <div className="space-y-1.5">
          {activeWidgets.map((w, i) => {
            const meta = TYPE_META[w.type];
            const Icon = meta?.Icon ?? Sparkles;
            const duration = w.duration || settings.rotateInterval || 15;
            return (
              <div key={w.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] font-mono text-white/20 w-5">{i + 1}</span>
                <Icon size={13} className={meta?.color ?? "text-white/40"} />
                <span className="text-sm text-white flex-1 truncate">{w.title}</span>
                <span className="text-[10px] font-mono text-white/30">{duration}s</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-xs text-white/25 font-mono">
          Cycle total ≈ {activeWidgets.reduce((sum, w) => sum + (w.duration || settings.rotateInterval || 15), 0)}s
        </div>
      </div>

      <Divider />

      {/* QR Code Generator */}
      <QrGenerator widgets={widgets} />

      <Divider />

      {/* Scans Analytics */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <QrCode size={16} className="text-violet" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">Scans de QR Codes par Widget</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Object.keys(analytics.stats?.scans || {}).length === 0 ? (
            <div className="text-sm text-white/40 italic">Aucun scan enregistré pour le moment.</div>
          ) : (
            Object.entries(analytics.stats.scans).sort((a, b) => b[1] - a[1]).map(([widgetId, count]) => {
              const w = widgets.find(x => x.id === widgetId);
              const wName = w ? w.title : `Widget inconnu (${widgetId.slice(0, 6)})`;
              return (
                <div key={widgetId} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between">
                  <div className="truncate pr-3">
                    <div className="text-sm font-semibold text-white truncate">{wName}</div>
                    <div className="text-[10px] uppercase text-white/30">{w?.type || "Inconnu"}</div>
                  </div>
                  <div className="text-2xl font-black text-violet">{count}</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Divider />

      {/* Students Directory */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">Étudiants Inscrits</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPins((v) => !v)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${showPins ? "bg-amber-500/20 border-amber-500/30 text-amber-400" : "border-white/10 text-white/40 hover:text-white"}`}
            >
              <Key size={11} /> {showPins ? "Masquer PINs" : "Afficher PINs"}
            </button>
            <div className="text-xs font-bold bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full">
              {analytics.students.length} inscrits
            </div>
          </div>
        </div>
        {analytics.students.length === 0 ? (
          <div className="text-sm text-white/40 italic">Aucun étudiant inscrit pour le moment.</div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/40 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 font-semibold text-white/40 uppercase tracking-widest text-[10px]">Nom</th>
                  <th className="px-4 py-3 font-semibold text-white/40 uppercase tracking-widest text-[10px]">Email</th>
                  {showPins && <th className="px-4 py-3 font-semibold text-amber-400/60 uppercase tracking-widest text-[10px]">PIN</th>}
                  <th className="px-4 py-3 font-semibold text-white/40 uppercase tracking-widest text-[10px]">Inscription</th>
                  <th className="px-4 py-3 font-semibold text-white/40 uppercase tracking-widest text-[10px]">Scans</th>
                  <th className="px-4 py-3 font-semibold text-white/40 uppercase tracking-widest text-[10px]">Dernier scan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {analytics.students.map((stu, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{stu.firstName} {stu.lastName}</td>
                    <td className="px-4 py-3 text-white/50">{stu.email}</td>
                    {showPins && (
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">{stu.pin}</span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-white/50">{stu.createdAt ? new Date(stu.createdAt).toLocaleDateString("fr-FR") : "N/A"}</td>
                    <td className="px-4 py-3">
                      {stu.scanCount > 0 ? (
                        <span className="text-violet font-bold">{stu.scanCount}</span>
                      ) : (
                        <span className="text-white/20">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {stu.lastScan ? new Date(stu.lastScan).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
