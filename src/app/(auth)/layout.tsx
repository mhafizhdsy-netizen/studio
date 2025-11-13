
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
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-[380px] gap-6">
            <Link href="/" className="flex items-center justify-center gap-2 mb-4">
                <Logo />
                <h1 className="text-3xl font-bold font-headline">HitunginAja</h1>
            </Link>
            {children}
        </div>
      </div>
       <div className="hidden bg-muted lg:block">
        {heroImage && (
            <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                width="1920"
                height="1080"
                className="h-full w-full object-cover dark:brightness-[0.3]"
                data-ai-hint={heroImage.imageHint}
                priority
            />
        )}
      </div>
    </div>
  );
}
