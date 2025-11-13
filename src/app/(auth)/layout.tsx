
import Link from "next/link";
import Image from "next/image";
import { Calculator } from "lucide-react";
import { placeholderImages } from "@/lib/placeholder-images";

const heroImage = placeholderImages.find(p => p.id === "hero");

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center p-6 lg:p-8">
         <div className="absolute top-6 left-6 lg:top-8 lg:left-8 z-10">
            <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <Calculator className="h-6 w-6" />
              <span className="text-xl font-bold font-headline">
                HitunginAja
              </span>
            </Link>
          </div>
        <div className="mx-auto w-full max-w-md space-y-6">
           {children}
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative">
        {heroImage && (
            <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            layout="fill"
            className="object-cover dark:brightness-[0.3]"
            data-ai-hint={heroImage.imageHint}
            />
        )}
        <div className="absolute bottom-8 left-8 right-8 p-6 bg-black/50 backdrop-blur-md rounded-lg">
            <div className="text-white text-lg font-medium">
                &ldquo;Aplikasi ini bener-bener game-changer buat bisnis F&B gue. Ngitung HPP jadi gampang banget dan margin profit langsung keliatan. Wajib coba!&rdquo;
            </div>
            <div className="text-white text-sm mt-2">- Sarah, Owner Kopi Senja</div>
        </div>
      </div>
    </div>
  );
}
