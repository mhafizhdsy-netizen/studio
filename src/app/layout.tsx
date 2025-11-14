
import type { Metadata } from "next";
import { AuthProvider } from "@/supabase/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "HitunginAja: Kalkulator HPP & Bisnis untuk UMKM Indonesia",
  description: "HitunginAja adalah aplikasi kalkulator HPP, profit, dan analisis bisnis gratis untuk UMKM dan pengusaha muda Indonesia. Dapatkan saran harga jual, analisis iklan, dan konsultasi AI.",
  keywords: ["kalkulator HPP", "UMKM", "bisnis", "harga jual", "analisis profit", "konsultan AI", "wirausaha"],
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
