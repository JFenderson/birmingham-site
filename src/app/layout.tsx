import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// The clean, readable font for paragraphs and small text
const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-sans" 
});

// The smooth, modern font for your h1, h2, h3 tags
const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"], 
  variable: "--font-heading" 
});



export const metadata: Metadata = {
  title: "Tau Sigma Graduate Chapter",
  description: "birminghamsigmas.org — Tau Sigma Graduate Chapter and advised collegiate chapters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
<html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      {/* The 'antialiased' class is crucial for physical smoothness on screens */}
      <body className="font-sans antialiased text-foreground">
        {children}
      </body>
    </html>
  );
}
