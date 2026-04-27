import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = req.nextUrl;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL manquante" },
      { status: 400 }
    );
  }

  try {
    // Valider que c'est une URL autorisée (BFM ou CDN partenaires)
    const allowedDomains = [
      "bfmb.bct.nextradiotv.com",
      "bfmt.bct.nextradiotv.com",
      "bfmtv",
      "sfr.net",
      "sfr.fr",
      "cloudfront.net",
      "akamaized.net",
      "bfmbusiness",
      "nextradiotv.com",
    ];
    if (!allowedDomains.some(d => url.includes(d))) {
      return NextResponse.json(
        { error: "URL non autorisée" },
        { status: 403 }
      );
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://tvradiozap.eu/",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    if (url.includes(".m3u8")) {
      const content = await response.text();
      const baseUrl = url.substring(0, url.lastIndexOf("/"));
      const body = content
        .split("\n")
        .map((line) => {
          if (!line) return line;

          // Remplacer les URI="..." dans les directives
          if (line.startsWith("#")) {
            if (line.includes('URI="')) {
              return line.replace(/URI="([^"]+)"/, (match, uri) => {
                let absoluteUri = uri;
                if (!uri.startsWith("http")) {
                  absoluteUri = `${baseUrl}/${uri}`;
                }
                return `URI="/api/bfm-stream-proxy?url=${encodeURIComponent(absoluteUri)}"`;
              });
            }
            return line;
          }

          // Pour les segments (lignes sans #)
          let segmentUrl = line;
          if (!line.startsWith("http")) {
            segmentUrl = `${baseUrl}/${line}`;
          }
          return `/api/bfm-stream-proxy?url=${encodeURIComponent(segmentUrl)}`;
        })
        .join("\n");

      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    } else {
      // Pour les segments binaires (.ts, etc.), on lit le buffer complet
      // pour éviter les corruptions de flux (streaming coupé en plein milieu)
      const buffer = await response.arrayBuffer();
      
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": response.headers.get("content-type") || "video/mp2t",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Cache-Control": "public, max-age=31536000",
        },
      });
    }
  } catch (error) {
    console.error("BFM Stream Proxy Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Erreur lors du proxy du flux" },
      { status: 500 }
    );
  }
}
