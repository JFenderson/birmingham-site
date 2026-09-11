import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL?.replace(/^http:/, "https:") ?? "https://birminghamsigmas.org"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Birmingham Sigmas",
    title: "Birmingham Sigmas | Phi Beta Sigma Fraternity, Inc.",
    description: "Brotherhood, scholarship, and service across Birmingham and Jefferson County.",
    images: [{ url: "/branding/tau-sigma.png", width: 1200, height: 630, alt: "Birmingham Sigmas" }],
  },
  twitter: { card: "summary_large_image", title: "Birmingham Sigmas", description: "Brotherhood, scholarship, and service across Birmingham and Jefferson County.", images: ["/branding/tau-sigma.png"] },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      {/* Browser extensions such as Grammarly add data attributes before hydration. */}
      <body suppressHydrationWarning className="font-sans antialiased text-foreground">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
