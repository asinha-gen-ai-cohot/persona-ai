import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Persona Chat",
  description: "AI-powered chat simulator for Hitesh Choudhary and Piyush Garg personas."
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
