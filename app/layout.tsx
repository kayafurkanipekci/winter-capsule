import type { Metadata } from "next";
import { Alice, Courgette } from "next/font/google"; // Alice for everything, Courgette for letters
import "./globals.css";

const alice = Alice({
  subsets: ["latin", "latin-ext"],
  variable: "--font-alice",
  weight: ["400"],
});

const courgette = Courgette({
  subsets: ["latin", "latin-ext"],
  variable: "--font-courgette",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Zaman Kapsülü | 2025",
  description: "Yılbaşında açılmak üzere mühürlü mektuplar bırakın.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${alice.variable} ${courgette.variable} antialiased bg-[#0a0f0d] text-[#e8e4d9] overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
