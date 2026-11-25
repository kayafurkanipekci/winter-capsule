import type { Metadata } from "next";
import { Jersey_15, JetBrains_Mono, Courgette } from "next/font/google";
import "./globals.css";

const pixelHead = Jersey_15({
  subsets: ["latin", "latin-ext"],
  variable: "--font-alice",
  weight: ["400"],
});

const pixelBody = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
});

const courgette = Courgette({
  subsets: ["latin", "latin-ext"],
  variable: "--font-courgette",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Zaman Kapsülü | Ben Kimim?",
  description: "Arkadaşların sana yılbaşına kadar ipucu kartları bıraksın; 1 Ocak'ta kim olduklarını tahmin et!",
};

import { Providers } from "./providers";
import ThemeToggle from "@/components/ThemeToggle";
import ReindeerWalker from "@/components/ReindeerWalker";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${pixelHead.variable} ${pixelBody.variable} ${courgette.variable} antialiased overflow-x-hidden`}
      >
        <Providers>
          <div className="fixed top-4 right-4 z-[9999] global-theme-toggle">
            <ThemeToggle />
          </div>
          {children}
          <ReindeerWalker />
        </Providers>
      </body>
    </html>
  );
}
