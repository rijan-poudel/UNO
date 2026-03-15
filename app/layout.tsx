import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster
          position="bottom-right"
          richColors={false}
          closeButton
          expand
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
