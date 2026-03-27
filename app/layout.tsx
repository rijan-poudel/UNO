import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const monkeytypeMono = Roboto_Mono({
  variable: "--font-monkeytype-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "UNO — Card Game",
  description: "A customisable UNO-style card game with bot support and house rules.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const PREFERRED_THEME_KEY = 'uno.preferred.theme';
                const themeVars = {
                  paper: {
                    '--ui-bg': '#fafafa',
                    '--ui-surface': '#ffffff',
                    '--ui-text': '#212121',
                    '--ui-muted': 'rgba(33,33,33,0.54)',
                    '--ui-line': 'rgba(0,0,0,0.12)',
                    '--ui-accent-red': '#e53935',
                    '--ui-accent-yellow': '#f9a825',
                    '--ui-accent-green': '#43a047',
                    '--ui-accent-blue': '#1e88e5',
                  },
                  midnight: {
                    '--ui-bg': '#121212',
                    '--ui-surface': '#1e1e1e',
                    '--ui-text': '#e0e0e0',
                    '--ui-muted': 'rgba(224,224,224,0.6)',
                    '--ui-line': 'rgba(255,255,255,0.12)',
                    '--ui-accent-red': '#ef5350',
                    '--ui-accent-yellow': '#fdd835',
                    '--ui-accent-green': '#66bb6a',
                    '--ui-accent-blue': '#42a5f5',
                  },
                  forest: {
                    '--ui-bg': '#e0f2f1',
                    '--ui-surface': '#ffffff',
                    '--ui-text': '#004d40',
                    '--ui-muted': 'rgba(0,77,64,0.6)',
                    '--ui-line': 'rgba(0,77,64,0.15)',
                    '--ui-accent-red': '#e53935',
                    '--ui-accent-yellow': '#f9a825',
                    '--ui-accent-green': '#00897b',
                    '--ui-accent-blue': '#1e88e5',
                  },
                  sunset: {
                    '--ui-bg': '#1a0033',
                    '--ui-surface': '#2d0057',
                    '--ui-text': '#ede7f6',
                    '--ui-muted': 'rgba(237,231,246,0.65)',
                    '--ui-line': 'rgba(237,231,246,0.18)',
                    '--ui-accent-red': '#ef9a9a',
                    '--ui-accent-yellow': '#fff59d',
                    '--ui-accent-green': '#a5d6a7',
                    '--ui-accent-blue': '#ce93d8',
                  },
                };
                
                let theme = 'midnight';
                try {
                  const stored = localStorage.getItem(PREFERRED_THEME_KEY);
                  if (stored && (stored === 'paper' || stored === 'forest' || stored === 'sunset')) {
                    theme = stored;
                  }
                } catch {}
                
                const vars = themeVars[theme] || themeVars.midnight;
                Object.entries(vars).forEach(([key, value]) => {
                  document.documentElement.style.setProperty(key, value);
                });
                document.documentElement.style.backgroundColor = vars['--ui-bg'];
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${monkeytypeMono.variable} antialiased`}
      >
        {children}
        <Toaster
          position="bottom-right"
          richColors={false}
          closeButton
          expand={false}
          visibleToasts={3}
          offset={12}
          toastOptions={{
            duration: 2800,
            classNames: {
              toast: "uno-toast",
              title: "uno-toast-title",
              description: "uno-toast-description",
              actionButton: "uno-toast-action",
              cancelButton: "uno-toast-cancel",
              closeButton: "uno-toast-close",
              success: "uno-toast-success",
              error: "uno-toast-error",
              warning: "uno-toast-warning",
              info: "uno-toast-info",
            },
          }}
        />
      </body>
    </html>
  );
}
