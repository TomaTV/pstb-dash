/**
 * Détection Tizen / Samsung Smart Signage (MagicINFO).
 * À appeler uniquement côté client (dans useEffect ou après mount).
 */
export function isTizen() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return ua.includes("Tizen") || ua.includes("SmartTV") || ua.includes("SMART-TV");
}

/**
 * Retourne les variants framer-motion réduits sur Tizen (pas de blur/opacity lourds).
 * Usage : const variants = tizenSafeVariants({ initial: ..., animate: ..., exit: ... })
 */
export function tizenSafeVariants(variants) {
  if (!isTizen()) return variants;
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.15 } },
    exit:    { opacity: 0, transition: { duration: 0.1 } },
  };
}
