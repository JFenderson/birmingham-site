import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: {
    default: "Birmingham Sigmas | Phi Beta Sigma Fraternity, Inc.",
    template: "%s | Birmingham Sigmas",
  },
  description:
    "Birmingham Sigmas of Phi Beta Sigma Fraternity, Inc. serving Birmingham and Jefferson County.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body className="font-sans antialiased text-foreground">{children}</body>
    </html>
  );
}
