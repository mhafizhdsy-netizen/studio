
import Link from "next/link";
import Image from "next/image";
import { placeholderImages } from "@/lib/placeholder-images";
import { Logo } from "@/components/ui/logo";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const heroImage = placeholderImages.find(p => p.id === "hero");

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 animate-page-fade-in">
      <div className="flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-sm">
             <Card className="shadow-lg border-border/20">
                 <CardHeader className="items-center justify-center text-center gap-2 pt-8 md:pt-10">
                     <Link href="/" className="flex items-center gap-3">
                        <Logo />
                        <h1 className="text-2xl font-bold font-headline">HitunginAja</h1>
                    </Link>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-6">
                    {children}
                </CardContent>
            </Card>
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
