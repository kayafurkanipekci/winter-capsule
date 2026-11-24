import type { Metadata } from "next";
import { Lora, Courgette } from "next/font/google";
import "./globals.css";

const alice = Lora({
  subsets: ["latin", "latin-ext"],
  variable: "--font-alice",
  weight: ["400", "700"],
});

const courgette = Courgette({
  subsets: ["latin", "latin-ext"],
  variable: "--font-courgette",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Zaman Kapsülü",
  description: "Yılbaşında açılmak üzere mühürlü mektuplar bırakın.",
};

import { Providers } from "./providers";
import ThemeToggle from "@/components/ThemeToggle";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${alice.variable} ${courgette.variable} antialiased overflow-x-hidden`}
      >
        <Providers>
          <div className="fixed top-4 right-4 z-[9999]">
            <ThemeToggle />
          </div>
          {children}
        </Providers>
      </body>
    </html>
  );
}
