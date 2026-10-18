import type { Metadata, Viewport } from "next";
import { Outfit, Barlow_Condensed } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import "./table.css";

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
        <span hidden data-design-contract="tactile-table">
          Held cards, situational controls, audible immediate feedback. See
          .impeccable/tactile-direction.md.
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
