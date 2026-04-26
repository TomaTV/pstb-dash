"use client";

import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";
import { Camera, Link2, ShieldAlert, AlertTriangle, EyeOff, Lock, Server, Wifi, QrCode, RefreshCw, Mail, Cloud, KeyRound, Handshake, Briefcase, UserX, Image, MapPin, HardDrive, Usb, MessageCircle, MonitorOff } from "lucide-react";

const ICONS = {
  camera: Camera,
  shield: ShieldAlert,
  alert: AlertTriangle,
  eye: EyeOff,
  lock: Lock,
  server: Server,
  wifi: Wifi,
  qrcode: QrCode,
  update: RefreshCw,
  email: Mail,
  cloud: Cloud,
  password: KeyRound,
  silence: Handshake,
  linkedin: Briefcase,
  mask: UserX,
  poster: Image,
  cv: MapPin,
  drive: HardDrive,
  usb: Usb,
  whatsapp: MessageCircle,
  screen: MonitorOff
};

export default function ShowcaseWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const { variant } = widget.data;

  const renderContent = (m) => {
    switch (variant) {
      case "webcam": {
        const title = widget.data.title ?? "Une webcam,\ncache ton intimité.";
        const subtitle = widget.data.subtitle ?? "Un simple cache-caméra bloque les regards indiscrets.";
        const iconName = widget.data.iconName ?? "camera";
        const footerTitle = widget.data.footerTitle ?? "PST&B";
        const footerSubtitle = widget.data.footerSubtitle ?? "RGPD à PST&B";
        const IconComponent = ICONS[iconName] || Camera;

        return (
          <div className="flex flex-col items-center justify-center h-full w-full bg-violet p-8 relative overflow-hidden text-center text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-violet to-[#4A148C] opacity-50 z-0"></div>
            <div className="relative z-10 flex flex-col items-center gap-6">
              <IconComponent size={m === "fullscreen" ? 180 : m === "focus" ? 120 : 64} className="text-white shrink-0" />
              <div>
                <h2 className="font-bold leading-tight whitespace-pre-wrap" style={{ fontSize: m === "fullscreen" ? "4rem" : m === "focus" ? "2.5rem" : "1.5rem" }}>
                  {title}
                </h2>
                {m !== "grid" && subtitle && (
                  <p className="text-white/80 mt-6 text-xl max-w-lg mx-auto whitespace-pre-wrap">
                    <strong>Astuce :</strong> {subtitle}
                  </p>
                )}
              </div>
            </div>
            {m !== "grid" && (
              <div className="absolute bottom-0 left-0 right-0 bg-white p-4 flex justify-between items-center text-violet">
                <div className="font-bold flex items-center gap-2">
                  <span className="text-xl tracking-tighter">{footerTitle}</span>
                </div>
                <div className="font-bold">{footerSubtitle}</div>
              </div>
            )}
          </div>
        );
      }

      case "newsletter-opus": {
        const d = widget.data ?? {};
        const cadence = d.cadence ?? "HEBDOMADAIRE";
        const weekLabel = d.weekLabel ?? "Semaine 16";
        const dateLabel = d.dateLabel ?? "20-24 AVRIL";
        const headline = d.headline ?? "OPUS 4.7 REDÉFINIT LES STANDARDS DE L'IA";
        const hero = d.hero ?? {};
        const side = Array.isArray(d.side) ? d.side : [];
        const sources = d.sources ?? "Anthropic, OpenAI, IBM Newsroom";
        const contact = d.contact ?? "dpo@pstb.fr";
        const nextEdition = d.nextEdition ?? "Semaine 17";

        // — Sub-renderers —
        const HeroCard = (
          <div className="flex-[6] border-[3px] border-red p-4 lg:p-8 flex flex-col bg-white relative">
            <h4 className="text-red font-black uppercase leading-tight text-xl lg:text-4xl mb-3 lg:mb-6">
              {hero.title ?? "Opus 4.7 : Le saut qui change la donne"}
            </h4>
            <div className="relative w-full flex-1 min-h-0 rounded overflow-hidden bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
              {hero.image ? (
                <img src={hero.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : null}
              {hero.imageLabel && (
                <div className="relative z-10 bg-black/45 backdrop-blur-sm text-white font-mono px-4 py-2 rounded inline-flex items-center gap-2 text-sm lg:text-2xl">
                  <span className="text-violet-300">✳</span> {hero.imageLabel}
                </div>
              )}
            </div>
            <p
              className="mt-4 lg:mt-6 text-gray-900 leading-snug text-sm lg:text-2xl"
              dangerouslySetInnerHTML={{ __html: hero.body ?? "" }}
            />
          </div>
        );

        const SideCard = (item, i) => (
          <div key={i} className="flex-1 border-[2px] border-violet bg-white p-4 lg:p-6 flex flex-col gap-3 lg:gap-4 min-h-0">
            <h4 className="text-violet font-black uppercase leading-tight text-base lg:text-[1.35rem]">
              {item.title}
            </h4>
            {item.image && (
              <div className="relative w-full flex-[2] min-h-0 rounded overflow-hidden bg-gray-100">
                <img src={item.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col justify-end">
              <p
                className="text-violet font-medium leading-snug text-xs lg:text-[1.05rem] opacity-90 line-clamp-4"
                dangerouslySetInnerHTML={{ __html: item.body ?? "" }}
              />
            </div>
          </div>
        );

        return (
          <div
            className="flex flex-col h-full w-full bg-white text-black overflow-hidden border-violet"
            style={{ 
              borderWidth: m === "fullscreen" ? 14 : m === "focus" ? 10 : 4, 
              padding: m === "fullscreen" ? 36 : m === "focus" ? 24 : 10,
              paddingBottom: m === "focus" ? "var(--safe-bottom, 24px)" : undefined
            }}
          >
            {/* ─── Header ─── */}
            <div className="flex justify-between items-center border-b border-gray-300 pb-4 lg:pb-6 shrink-0">
              <div className="flex items-center gap-3 lg:gap-6">
                <div
                  className="bg-violet shrink-0 w-12 h-12 lg:w-20 lg:h-20"
                  style={{
                    WebkitMaskImage: "url(/logo-svg.svg)",
                    maskImage: "url(/logo-svg.svg)",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center"
                  }}
                />
                <span className="text-violet/30 text-4xl lg:text-6xl font-light mb-1">|</span>
                <span className="text-violet font-bold tracking-tight text-3xl lg:text-5xl">
                  Newsletter
                </span>
                <span className="bg-violet text-white font-black uppercase tracking-wider rounded px-3 py-1 lg:px-6 lg:py-2 text-xl lg:text-4xl">
                  {cadence}
                </span>
              </div>
              <div className="text-gray-700 font-medium text-right text-sm lg:text-2xl">
                {weekLabel} <span className="text-gray-400 mx-2">|</span> <span className="font-bold">{dateLabel}</span>
              </div>
            </div>

            {/* ─── Big headline ─── */}
            <h1 className="text-violet font-black leading-[0.95] uppercase tracking-tight mt-6 lg:mt-8 shrink-0 text-5xl lg:text-[4.2rem] whitespace-normal w-full overflow-hidden text-ellipsis">
              {headline}
            </h1>

            {/* ─── Grid 1 + 2 ─── */}
            <div className="flex gap-4 lg:gap-8 mt-6 lg:mt-10 flex-1 min-h-0">
              {HeroCard}
              {side.length > 0 && (
                <div className="flex-[4] flex flex-col gap-4 lg:gap-8">
                  {side.slice(0, 2).map(SideCard)}
                </div>
              )}
            </div>

            {/* ─── Footer ─── */}
            {m !== "grid" && (
              <div className="flex justify-between items-center border-t border-gray-300 pt-4 lg:pt-6 mt-6 lg:mt-8 shrink-0 text-gray-700 text-sm lg:text-xl">
                <div>
                  <span className="font-bold">Sources & conformité :</span> {sources}
                </div>
                <div>
                  <span className="font-bold">Contact :</span> {contact}
                  <span className="text-gray-400 mx-3">|</span>
                  <span className="font-bold">Prochaine édition :</span> {nextEdition}
                </div>
              </div>
            )}
          </div>
        );
      }

      case "newsletter-interne": {
        const edition = widget.data.edition ?? "Avril 2026";
        const headline = widget.data.headline ?? "Édition mensuelle";
        const subtitle = widget.data.subtitle ?? "";
        const imageUrl = widget.data.imageUrl ?? "";

        // Si une image est fournie : on l'affiche en hero plein cadre.
        if (imageUrl) {
          return (
            <div className="flex flex-col h-full w-full bg-black relative overflow-hidden">
              <img
                src={imageUrl}
                alt={headline}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40" />
              {m !== "grid" && (
                <div className="absolute top-8 right-8 z-20 bg-violet px-5 py-3 text-right shadow-2xl">
                  <div className="text-white/85 text-[11px] font-bold tracking-[0.25em] uppercase">Édition</div>
                  <div className="text-white text-2xl font-black">{edition}</div>
                </div>
              )}
              <div className="relative z-20 mt-auto px-8 pt-8 w-full" style={{ paddingBottom: m === "focus" ? "var(--safe-bottom, 2rem)" : "2rem" }}>
                <div className="text-white/80 font-bold uppercase tracking-[0.3em]" style={{ fontSize: m === "grid" ? "0.55rem" : "0.85rem" }}>
                  Newsletter Interne · PST&B
                </div>
                <h1 className="text-white font-black leading-[0.95] mt-2" style={{ fontSize: m === "fullscreen" ? "5rem" : m === "focus" ? "3.25rem" : "1.5rem" }}>
                  {headline}
                </h1>
                {m !== "grid" && subtitle && (
                  <p className="text-white/85 mt-4 max-w-2xl leading-relaxed" style={{ fontSize: m === "fullscreen" ? "1.5rem" : "1.05rem" }}>
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          );
        }

        // Fallback sans image : design coloré PST&B
        return (
          <div className="flex flex-col justify-end h-full w-full bg-gradient-to-br from-violet via-[#3a0ca3] to-black relative p-8 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-violet/30 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-fuchsia-500/20 blur-3xl" />

            {m !== "grid" && (
              <div className="absolute top-8 right-8 z-20 bg-white text-violet px-5 py-3 text-right">
                <div className="text-violet/70 text-[11px] font-bold tracking-[0.25em] uppercase">Édition</div>
                <div className="text-violet text-2xl font-black">{edition}</div>
              </div>
            )}

            {m === "grid" && (
              <div className="absolute top-8 left-8 z-20">
                <div className="text-white/85 font-bold uppercase tracking-[0.3em]" style={{ fontSize: "0.55rem" }}>
                  Newsletter Interne · Mensuelle
                </div>
              </div>
            )}

            <div className="relative z-20 mt-auto w-full" style={{ paddingBottom: m === "focus" ? "calc(var(--safe-bottom, 2rem) - 2rem)" : undefined }}>
              <h1 className="text-white font-black leading-[0.95]" style={{ fontSize: m === "fullscreen" ? "5rem" : m === "focus" ? "3.25rem" : "1.5rem" }}>
                {headline}
              </h1>
              {m !== "grid" && subtitle && (
                <p className="text-white/85 mt-4 max-w-2xl leading-relaxed" style={{ fontSize: m === "fullscreen" ? "1.5rem" : "1.05rem" }}>
                  {subtitle}
                </p>
              )}
              <div className="h-px w-32 bg-white/40 mt-6" />
              <div className="text-white/60 text-sm mt-3 uppercase tracking-widest font-semibold">PST&B · Paris</div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const wrapperClasses =
    mode === "grid" ? "-mx-5 -mt-3 -mb-5 h-[calc(100%+2rem)] w-[calc(100%+2.5rem)]" :
      mode === "focus" ? "h-full w-full" :
        "-m-14 h-[calc(100%+7rem)] w-[calc(100%+7rem)]";

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => (
        <div className={`overflow-hidden ${wrapperClasses}`}>
          {renderContent(m)}
        </div>
      )}
    </WidgetWrapper>
  );
}
