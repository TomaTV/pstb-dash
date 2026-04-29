import { Inter } from "next/font/google";
import "./globals.css";
import { DashboardProvider } from "@/context/DashboardContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "Dash by PST&B — TV",
  description: "Tableau de bord dynamique du campus Paris School of Technology & Business.",
  metadataBase: new URL("https://dash-pstb.vercel.app"),
  openGraph: {
    title: "Dash by PST&B — TV",
    description: "Le tableau de bord live du campus Paris School of Technology & Business.",
    siteName: "PST&B TV",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dash by PST&B — TV",
    description: "Le tableau de bord live du campus Paris School of Technology & Business.",
    images: ["/og-image.png"],
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-title" content="Dash by pst&b" />
      </head>
      <body className="bg-bg text-text antialiased" suppressHydrationWarning>
        <DashboardProvider>{children}</DashboardProvider>
      </body>
    </html>
  );
}
