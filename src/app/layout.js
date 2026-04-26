import { Inter } from "next/font/google";
import "./globals.css";
import { DashboardProvider } from "@/context/DashboardContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "PST&B — Campus Dashboard",
  description: "Tableau de bord dynamique du campus Paris School of Technology & Business.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${inter.variable} h-full`}>
      <head>
        <meta name="apple-mobile-web-app-title" content="Dash by pst&b" />
      </head>
      <body className="bg-bg text-text antialiased">
        <DashboardProvider>{children}</DashboardProvider>
      </body>
    </html>
  );
}
