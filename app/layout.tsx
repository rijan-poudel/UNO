import type { Metadata, Viewport } from "next";
import { Outfit, Barlow_Condensed } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import "./table.css";
import "./arena.css";
import "./home.css";
import "./club.css";

const bodyFont = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});
const cardFont = Barlow_Condensed({
  variable: "--font-card",
  subsets: ["latin"],
  weight: ["700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "UNO — Your table. Your rules.",
  description:
    "A seat for everyone. Play UNO with friends or bots, with your favorite house rules.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#15151b",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('uno.preferred.theme');if(['paper','midnight','forest','sunset'].includes(t))document.documentElement.dataset.theme=t}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${bodyFont.variable} ${cardFont.variable}`}>
        <div className="club-frame" aria-hidden="true" />
        <span hidden data-design-contract="comic-card-showdown">
          THESIS: One comic-card world across home, setup, rooms, preferences
          and play. OWN-WORLD: Crisp dark ink, warm white, native four-color
          graphics, Barlow Condensed display and Outfit UI. FIRST VIEWPORT:
          Centered UNO, original comic cast, clear Play/Create/Join. Live cards
          lead a calm arena with direct play and a cropped held hand. FORM:
          Owner-selected Comic-card showdown, seed 5f8e7c72; comp-led panel
          composition chosen under delegated continuation. Contract:
          .impeccable/review/site-redesign/contract.md.
        </span>
        {children}
        <Toaster
          position="bottom-right"
          closeButton
          visibleToasts={2}
          toastOptions={{ className: "uno-toast", duration: 3200 }}
        />
      </body>
    </html>
  );
}
