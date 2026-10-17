import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const bodyFont = Nunito_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});
const displayFont = Fredoka({
  variable: "--font-display",
  subsets: ["latin"],
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
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <span hidden data-design-contract="playful-continuation">
          Playful card playground: original graphics, expressive type, tactile
          card motion and immediate sound. See .impeccable/playful-direction.md.
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
