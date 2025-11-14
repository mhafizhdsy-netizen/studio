
'use client';

import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/ui/logo";
import { placeholderImages } from "@/lib/placeholder-images";
import { useAuth } from "@/supabase/auth-provider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const heroImage = placeholderImages.find(p => p.id === "hero");

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-3 animate-page-fade-in">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 lg:col-span-1">
        <div className="mx-auto grid w-full max-w-sm gap-6">
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-3 mb-4">
                <Link href="/" className="flex items-center gap-2">
                    <Logo />
                    <h1 className="text-2xl font-bold font-headline">HitunginAja</h1>
                </Link>
                {children}
            </div>
        </div>
      </div>
      <div className="hidden lg:block lg:col-span-2 relative">
        {heroImage && (
            <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover"
                data-ai-hint={heroImage.imageHint}
            />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/10 to-transparent"></div>
         <div className="absolute bottom-10 left-10 right-10 max-w-xl">
            <div className="bg-black/50 backdrop-blur-md p-6 rounded-xl border border-white/10">
                 <blockquote className="text-white text-xl font-medium leading-relaxed">
                    "Aplikasi ini bukan cuma kalkulator, tapi partner strategis. Menentukan harga jadi lebih percaya diri, dan profitabilitas saya meningkat drastis."
                </blockquote>
                <footer className="text-white/70 mt-4 text-sm">
                    - Sarah, Pemilik Brand Fashion Lokal
                </footer>
            </div>
        </div>
      </div>
    </div>
  );
}
