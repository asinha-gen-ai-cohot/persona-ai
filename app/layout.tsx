import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Persona Chat",
  description: "AI-powered chat simulator for Hitesh Choudhary and Piyush Garg personas.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
