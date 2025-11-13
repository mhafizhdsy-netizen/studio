
import Link from "next/link";
import Image from "next/image";
import { placeholderImages } from "@/lib/placeholder-images";
import { Logo } from "@/components/ui/logo";

const heroImage = placeholderImages.find(p => p.id === "hero");

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
         <div className="absolute top-6 left-6 lg:top-8 lg:left-8 z-10">
            <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <Logo />
              <span className="text-xl font-bold font-headline">
                HitunginAja
              </span>
            </Link>
          </div>
        <div className="mx-auto grid w-full max-w-md gap-6">
           {children}
        </div>
      </div>
       <div className="hidden bg-muted lg:flex items-center justify-center relative p-10">
        {heroImage && (
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                 <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    fill
                    className="object-cover dark:brightness-[0.4]"
                    data-ai-hint={heroImage.imageHint}
                />
            </div>
        )}
      </div>
    </div>
  );
}
