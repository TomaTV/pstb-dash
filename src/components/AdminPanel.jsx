"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Eye, RotateCcw, Settings2, Tv2, Timer } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { Card, CardHeader, CardBody, CardTitle } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function AdminPanel() {
  const { widgets, settings, updateWidget, updateWidgetData, resetWidgets, updateSettings } = useDashboard();
  const [selectedId, setSelectedId] = useState(widgets[0]?.id ?? null);
  const [savedAt, setSavedAt] = useState(null);

  const selected = widgets.find(w => w.id === selectedId) ?? null;

  const flash = () => { setSavedAt(Date.now()); setTimeout(() => setSavedAt(null), 1800); };

  return (
    <main className="min-h-screen overflow-auto bg-bg mx-auto w-full max-w-5xl flex-1 p-6 lg:p-10">
      <header className="flex items-center justify-between border-b border-border pb-5 mb-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-elevated px-3 py-2 text-xs text-sub hover:text-text hover:border-violet/50 transition-colors">
            <ArrowLeft size={13} />
            Dashboard
          </Link>
          <div>
            <span className="text-[10px] font-medium uppercase tracking-widest text-sub block">PST&B</span>
            <h1 className="text-lg font-bold text-text leading-none">Administration</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {savedAt && (
            <span className="inline-flex items-center gap-1.5 text-xs text-violet">
              <Check size={12} /> Enregistré
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={resetWidgets} leftIcon={<RotateCcw size={12} />}>
            Réinitialiser
          </Button>
          <Link href="/">
            <Button variant="primary" size="sm" leftIcon={<Eye size={12} />}>Aperçu</Button>
          </Link>
        </div>
      </header>

      {/* ── Panneau Télé ── */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle icon={<Tv2 size={13} />}>Affichage télé</CardTitle>
          <span className="text-[11px] text-sub">Paramètres de la vue campus</span>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap items-center gap-6">
            {/* Toggle auto-rotation */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => { updateSettings({ autoRotate: !settings.autoRotate }); flash(); }}
                className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${settings.autoRotate ? "bg-violet" : "bg-elevated border border-border"}`}
              >
                <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform duration-200 ${settings.autoRotate ? "translate-x-6" : "translate-x-1"}`} />
              </div>
              <div>
                <div className="text-sm font-medium text-text">Rotation automatique</div>
                <div className="text-xs text-sub">Défilement automatique des widgets sur la télé</div>
              </div>
            </label>

            {/* Intervalle */}
            {settings.autoRotate && (
              <label className="flex items-center gap-3">
                <Timer size={14} className="text-sub shrink-0" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-sub mb-1">
                    Intervalle (secondes)
                  </div>
                  <input
                    type="range" min={5} max={60} step={1}
                    value={settings.rotateInterval}
                    onChange={e => { updateSettings({ rotateInterval: Number(e.target.value) }); flash(); }}
                    className="w-40 accent-violet"
                  />
                  <span className="ml-3 text-sm font-mono text-text">{settings.rotateInterval}s</span>
                </div>
              </label>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-12 gap-5">
        {/* List */}
        <aside className="col-span-12 md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle icon={<Settings2 size={13} />}>Widgets</CardTitle>
            </CardHeader>
            <CardBody className="space-y-1">
              {widgets.map(w => (
                <button
                  key={w.id}
                  onClick={() => setSelectedId(w.id)}
                  className={[
                    "w-full rounded-lg border px-4 py-3 text-left transition-colors",
                    selectedId === w.id
                      ? "border-violet/50 bg-violet-dim text-text"
                      : "border-transparent hover:border-border hover:bg-elevated text-sub hover:text-text",
                  ].join(" ")}
                >
                  <div className="text-sm font-medium">{w.title}</div>
                  <div className="text-[11px] font-mono mt-0.5 opacity-60">{w.type}</div>
                </button>
              ))}
            </CardBody>
          </Card>
        </aside>

        {/* Editor */}
        <section className="col-span-12 md:col-span-8">
          {selected ? (
            <Card>
              <CardHeader>
                <CardTitle>Éditer · {selected.title}</CardTitle>
                <span className="text-[10px] font-mono text-sub">{selected.id}</span>
              </CardHeader>
              <CardBody className="space-y-5">
                <Input
                  label="Titre"
                  value={selected.title}
                  onChange={e => { updateWidget(selected.id, { title: e.target.value }); flash(); }}
                />

                <WidgetDataEditor
                  widget={selected}
                  onChange={patch => { updateWidgetData(selected.id, patch); flash(); }}
                />

                <label className="flex items-center gap-3 rounded-lg border border-border bg-elevated px-4 py-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.focusable}
                    onChange={e => { updateWidget(selected.id, { focusable: e.target.checked }); flash(); }}
                    className="accent-violet"
                  />
                  <div>
                    <div className="text-sm text-text font-medium">Focusable</div>
                    <div className="text-xs text-sub">Ouvrable dans la Focus Zone centrale.</div>
                  </div>
                </label>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody>
                <p className="text-sm text-sub">Sélectionnez un widget.</p>
              </CardBody>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}

/* ── Éditeur de données par type ── */
function WidgetDataEditor({ widget, onChange }) {
  const { data, type } = widget;

  if (type === "next-event") return (
    <div className="space-y-4">
      <Input label="Nom de l'événement" value={data.name}
        onChange={e => onChange({ name: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Début" type="datetime-local" value={toInput(data.date)}
          onChange={e => onChange({ date: e.target.value })} />
        <Input label="Fin" type="datetime-local" value={toInput(data.endDate)}
          onChange={e => onChange({ endDate: e.target.value })} />
      </div>
      <Input label="Lieu" value={data.location ?? ""}
        onChange={e => onChange({ location: e.target.value })} />
      <Textarea label="Description" value={data.description ?? ""}
        onChange={e => onChange({ description: e.target.value })} rows={3} />
    </div>
  );

  if (type === "poll") return (
    <div className="space-y-4">
      <Input label="Question" value={data.question}
        onChange={e => onChange({ question: e.target.value })} />
      <div>
        <div className="text-[11px] font-medium uppercase tracking-widest text-sub mb-2">Options</div>
        <div className="space-y-2">
          {data.options.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-2">
              <input
                className="flex-1 rounded-lg bg-elevated border border-border px-3 py-2.5 text-sm text-text focus:outline-none focus:border-violet/60"
                value={opt.label}
                onChange={e => {
                  const next = data.options.slice();
                  next[i] = { ...opt, label: e.target.value };
                  onChange({ options: next });
                }}
              />
              <input type="number" className="w-20 rounded-lg bg-elevated border border-border px-3 py-2.5 text-sm text-text focus:outline-none focus:border-violet/60"
                value={opt.votes}
                onChange={e => {
                  const next = data.options.slice();
                  next[i] = { ...opt, votes: Number(e.target.value) || 0 };
                  onChange({ options: next });
                }}
              />
              <button onClick={() => onChange({ options: data.options.filter(o => o.id !== opt.id) })}
                className="rounded-md p-2 text-sub hover:text-pink-400 hover:bg-elevated transition-colors">
                ×
              </button>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="mt-2"
          onClick={() => onChange({ options: [...data.options, { id: `opt-${Date.now()}`, label: "Nouvelle option", votes: 0 }] })}>
          + Ajouter
        </Button>
      </div>
    </div>
  );

  if (type === "clock") return (
    <div className="grid grid-cols-2 gap-3">
      <Input label="Ville" value={data.city} onChange={e => onChange({ city: e.target.value })} />
      <Input label="Fuseau" value={data.timezone} onChange={e => onChange({ timezone: e.target.value })}
        hint="Ex : Europe/Paris" />
    </div>
  );

  if (type === "rss") return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Source" value={data.source} onChange={e => onChange({ source: e.target.value })} />
        <Input label="URL" value={data.url ?? ""} onChange={e => onChange({ url: e.target.value })} />
      </div>
      <div>
        <div className="text-[11px] font-medium uppercase tracking-widest text-sub mb-2">Articles</div>
        <div className="space-y-3">
          {(data.items ?? []).map((item, i) => (
            <div key={i} className="rounded-xl border border-border bg-elevated p-4 space-y-2">
              <input className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm text-text focus:outline-none focus:border-violet/60"
                placeholder="Titre" value={item.title}
                onChange={e => { const n = data.items.slice(); n[i] = { ...item, title: e.target.value }; onChange({ items: n }); }}
              />
              <textarea className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm text-text focus:outline-none focus:border-violet/60 resize-none"
                placeholder="Résumé" rows={2} value={item.summary ?? ""}
                onChange={e => { const n = data.items.slice(); n[i] = { ...item, summary: e.target.value }; onChange({ items: n }); }}
              />
              <div className="flex items-center gap-2">
                <input type="date" className="rounded-lg bg-surface border border-border px-3 py-2 text-sm text-text focus:outline-none focus:border-violet/60"
                  value={item.date ?? ""}
                  onChange={e => { const n = data.items.slice(); n[i] = { ...item, date: e.target.value }; onChange({ items: n }); }}
                />
                <button onClick={() => onChange({ items: data.items.filter((_, j) => j !== i) })}
                  className="ml-auto text-xs text-sub hover:text-pink-400 px-2 py-1 rounded hover:bg-surface transition-colors">
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="mt-2"
          onClick={() => onChange({ items: [...(data.items ?? []), { title: "Nouvel article", summary: "", date: new Date().toISOString().slice(0, 10) }] })}>
          + Ajouter
        </Button>
      </div>
    </div>
  );

  return <p className="text-sm text-sub">Pas d'éditeur pour ce type.</p>;
}

function toInput(iso) {
  try {
    const d = new Date(iso);
    const p = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  } catch { return ""; }
}
