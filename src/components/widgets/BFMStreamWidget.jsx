"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import HLS from "hls.js";

// Cache the stream URL server-side to avoid scraping on every mount
const streamUrlCache = {};

export default function BFMStreamWidget({ widget }) {
  const d = widget?.data ?? {};
  const defaultType = d.type || "business";

  const [activeType, setActiveType] = useState(defaultType);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const recoverAttempts = useRef(0);

  // States
  const [status, setStatus] = useState("loading"); // "loading" | "buffering" | "playing" | "error"
  const [errorMsg, setErrorMsg] = useState(null);

  // Schedule logic: check every minute if we should switch channel
  useEffect(() => {
    const checkSchedule = () => {
      let currentType = defaultType;

      if (d.scheduleStart && d.scheduleEnd && d.scheduleType) {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

        if (d.scheduleStart <= d.scheduleEnd) {
          if (timeStr >= d.scheduleStart && timeStr <= d.scheduleEnd) currentType = d.scheduleType;
        } else {
          if (timeStr >= d.scheduleStart || timeStr <= d.scheduleEnd) currentType = d.scheduleType;
        }
      }

      setActiveType((prev) => (prev !== currentType ? currentType : prev));
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 60000);
    return () => clearInterval(interval);
  }, [d.scheduleStart, d.scheduleEnd, d.scheduleType, defaultType]);

  const title = activeType === "tech" ? "BFM Tech & Co" : "BFM Business";

  // Cleanup
  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadStream = async () => {
      try {
        setStatus("loading");
        setErrorMsg(null);
        recoverAttempts.current = 0;
        destroyHls();

        // Get stream URL (cached after first fetch)
        let streamUrl = streamUrlCache[activeType];
        if (!streamUrl) {
          const res = await fetch(`/api/bfm-stream?type=${activeType}`);
          if (!res.ok) throw new Error(`API Error: ${res.status}`);
          const data = await res.json();
          streamUrl = data.streamUrl;
          if (streamUrl) streamUrlCache[activeType] = streamUrl;
        }

        if (cancelled || !streamUrl || !videoRef.current) {
          if (!streamUrl) throw new Error("URL du flux non reçue");
          return;
        }

        const video = videoRef.current;

        // Detect actual playback via timeupdate (not just manifest parsed)
        const onTimeUpdate = () => {
          if (!cancelled) setStatus("playing");
        };
        const onWaiting = () => {
          if (!cancelled && status === "playing") setStatus("buffering");
        };
        const onPlaying = () => {
          if (!cancelled) setStatus("playing");
        };

        video.addEventListener("timeupdate", onTimeUpdate, { once: true });
        video.addEventListener("waiting", onWaiting);
        video.addEventListener("playing", onPlaying);

        const cleanup = () => {
          video.removeEventListener("timeupdate", onTimeUpdate);
          video.removeEventListener("waiting", onWaiting);
          video.removeEventListener("playing", onPlaying);
        };

        if (!HLS.isSupported()) {
          // Safari native HLS
          video.src = streamUrl;
          video.muted = false;
          video.onloadedmetadata = () => {
            if (!cancelled) {
              video.play().catch(() => {});
              setStatus("buffering");
            }
          };
          return () => { cleanup(); };
        }

        const hls = new HLS({
          startLevel: -1,           // Auto quality
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 6,
          liveDurationInfinity: true,
          initialLiveManifestSize: 1,
          maxBufferLength: 20,
          maxMaxBufferLength: 40,
          maxBufferSize: 60 * 1000 * 1000,
          enableWorker: true,
          lowLatencyMode: false,
          startPosition: -1,        // Jump to live edge immediately
          fragLoadingMaxRetry: 6,
          manifestLoadingMaxRetry: 4,
          levelLoadingMaxRetry: 4,
        });

        hlsRef.current = hls;

        const proxyUrl = `/api/bfm-stream-proxy?url=${encodeURIComponent(streamUrl)}`;
        hls.loadSource(proxyUrl);
        hls.attachMedia(video);

        hls.on(HLS.Events.MANIFEST_PARSED, (event, data) => {
          if (cancelled) return;
          setStatus("buffering");

          // Trouver la qualité avec le bitrate maximum (1080p)
          if (data.levels && data.levels.length > 0) {
            let maxIndex = 0;
            let maxBitrate = 0;
            data.levels.forEach((level, index) => {
              if (level.bitrate > maxBitrate) {
                maxBitrate = level.bitrate;
                maxIndex = index;
              }
            });
            
            hls.startLevel = maxIndex;
            hls.nextLoadLevel = maxIndex;
            hls.currentLevel = maxIndex;
          }

          // Start muted to bypass autoplay policy, then unmute
          video.muted = true;
          video.play()
            .then(() => {
              video.muted = false;
            })
            .catch(() => {
              // If still blocked, at least keep playing muted
            });
        });

        hls.on(HLS.Events.ERROR, (event, data) => {
          if (cancelled) return;

          if (data.fatal) {
            switch (data.type) {
              case HLS.ErrorTypes.MEDIA_ERROR:
                if (recoverAttempts.current < 3) {
                  recoverAttempts.current++;
                  setStatus("buffering"); // Show overlay instead of frozen frame
                  hls.recoverMediaError();
                } else {
                  setStatus("buffering");
                  hls.swapAudioCodec();
                  hls.recoverMediaError();
                  recoverAttempts.current = 0;
                }
                break;
              case HLS.ErrorTypes.NETWORK_ERROR:
                if (recoverAttempts.current < 2) {
                  recoverAttempts.current++;
                  hls.startLoad();
                } else {
                  setStatus("error");
                  setErrorMsg("Erreur réseau");
                }
                break;
              default:
                setStatus("error");
                setErrorMsg(data.details || "Erreur inconnue");
            }
          }
          // Non-fatal: HLS.js handles internally
        });

        return () => { cleanup(); };

      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(err.message || "Erreur de chargement");
        }
      }
    };

    loadStream();

    return () => {
      cancelled = true;
      destroyHls();
    };
  }, [activeType, destroyHls]);

  const isLoading = status === "loading" || status === "buffering";

  return (
    <div className="w-full h-full bg-black relative overflow-hidden">
      {/* Video element always rendered */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        controls={false}
        playsInline
        controlsList="nodownload"
      />

      {/* Loading overlay — hidden once "playing" */}
      {isLoading && !errorMsg && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a]/95 backdrop-blur-md z-10 gap-5 transition-opacity duration-300">
          <div className="flex gap-1.5 items-end">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1 bg-red-500 rounded-full animate-bounce"
                style={{
                  height: `${12 + i * 6}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: "0.8s",
                }}
              />
            ))}
          </div>
          <div className="text-center animate-pulse">
            <p className="text-white font-bold text-lg tracking-tight">{title}</p>
            <p className="text-white/50 text-sm mt-1">
              {status === "loading" ? "Connexion en cours..." : "Reprise du direct..."}
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
          <p className="text-red-400 font-semibold text-lg">{title}</p>
          <p className="text-white/40 text-sm mt-2">{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
