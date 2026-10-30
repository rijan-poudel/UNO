import type { Metadata, Viewport } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import "./table.css";
import "./arena.css";
import "./home.css";
import "./club.css";
import "./settings.css";

const bodyFont = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});
const cardFont = Space_Grotesk({
  variable: "--font-card",
  subsets: ["latin"],
  weight: ["700"],
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
  themeColor: "#123d86",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('uno.preferred.theme');if(['paper','midnight','forest','sunset'].includes(t))document.documentElement.dataset.theme=t}catch(e){}try{document.documentElement.dataset.cardStyle=localStorage.getItem('uno.settings.cardStyle')==='nordic'?'nordic':'swiss'}catch(e){document.documentElement.dataset.cardStyle='swiss'}})();`,
          }}
        />
      </head>
      <body className={`${bodyFont.variable} ${cardFont.variable}`}>
        <template
          dangerouslySetInnerHTML={{
            __html:
              "<!-- focused-account-20261026. THESIS: One task per screen; optional account tools open from the avatar. OWN-WORLD: UNO Color play, Outfit, blue arena, native cards, theme-aware panels and amber actions. STORY: Join by code; accept friends separately; invite accepted friends with one tap. FIRST VIEWPORT: Play/Create/Join and an avatar; account sidebar with one mounted panel, mobile section picker, fixed Done. FORM: User-specified focused account extension; native popover reveal and non-blocking invitation notices. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance -->",
          }}
        />
        <span hidden data-design-contract="color-play">
          UNO Color play: user-approved blue arena, Color court portraits, vivid
          native cards, amber turn cues, a calm title screen and shared
          components with preset moods. Contract:
          .impeccable/review/experience-reset/contract.md.
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
