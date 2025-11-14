
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/ui/logo";
import { placeholderImages } from "@/lib/placeholder-images";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const heroImage = placeholderImages.find(p => p.id === "hero");

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 animate-page-fade-in">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-[350px] gap-6">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                <Link href="/" className="flex items-center gap-2">
                    <Logo />
                    <h1 className="text-2xl font-bold font-headline">HitunginAja</h1>
                </Link>
            </div>
            {children}
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative">
        {heroImage && (
            <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover"
                data-ai-hint={heroImage.imageHint}
            />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-background/20 to-transparent"></div>
         <div className="absolute bottom-10 left-10 right-10">
            <div className="bg-black/50 backdrop-blur-md p-6 rounded-xl border border-white/10">
                 <blockquote className="text-white text-lg font-medium">
                    "Stop pusing mikirin HPP. Fokus bikin profit. Aplikasi ini benar-benar mengubah cara saya mengelola bisnis."
                </blockquote>
                <footer className="text-white/70 mt-4 text-sm">
                    - Pengusaha Muda Sukses
                </footer>
            </div>
        </div>
      </div>
    </div>
  );
}
