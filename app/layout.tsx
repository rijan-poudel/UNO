import type { Metadata, Viewport } from "next";
import { Outfit, Barlow_Condensed } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import "./table.css";
import "./arena.css";
import "./home.css";

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
  themeColor: "#fff8ec",
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
        <span hidden data-design-contract="centered-home-2e1e4271">
          THESIS: Playing owns the center, replacing the rejected side-column
          landing page. OWN-WORLD: An illustrated after-hours card club, deep
          teal ink, warm ivory, yellow play, six-pixel controls, Outfit
          lettering. STORY: Enter the card scene, then play with bots or
          create/join a private room. FIRST VIEWPORT: Centered title above
          original panoramic artwork; a centered foreground action group with
          visible Play, Create and Join. Short landscape keeps the complete cast
          and all three start actions in reach. FORM: Owner-pinned game title
          screen; code-led surface direction6, seed2e1e4271. The five browser
          corrections supersede the prior home verdict. FINISH: unreviewed and
          undocumented is unfinished; this build ends with the finish review,
          the verdict, DESIGN.md, and every shipping raster carrying its
          provenance
        </span>
        <span hidden data-design-contract="uno-play-field">
          THESIS: Vivid held cards in an illustrated game room. OWN-WORLD: Warm
          lounge furniture above a clear petrol tabletop, vivid deck inks.
          STORY: Lifted playable cards invite a direct tap or flick; secondary
          controls live in Menu. FIRST VIEWPORT: Close piles and a held hand,
          graphical opponents and a quiet header; no casino rail. FORM:
          Owner-pinned UNO play field, code-led, inherited seed457003dd. See
          .impeccable/review/opponent-badges/contract.md. Opponent flights
          connect to visible fans or compact graphical seats. FINISH: unreviewed
          and undocumented is unfinished; this build ends with the finish
          review, the verdict, DESIGN.md, and every shipping raster carrying its
          provenance
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
