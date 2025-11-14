
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Bot, Calculator, CheckCircle, DollarSign, Landmark, Megaphone, Share2, Sparkles } from "lucide-react";
import { placeholderImages } from "@/lib/placeholder-images";
import { Logo } from "@/components/ui/logo";

const heroImage = placeholderImages.find(p => p.id === "hero");

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background animate-page-fade-in">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="text-2xl font-bold font-headline text-foreground">
            HitunginAja
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="#fitur" className="text-muted-foreground hover:text-foreground transition-colors">Fitur</Link>
            <Link href="#harga" className="text-muted-foreground hover:text-foreground transition-colors">Harga</Link>
            <Link href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Masuk</Link>
          </Button>
          <Button asChild className="font-bold">
            <Link href="/signup">Mulai Gratis</Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 md:py-32">
          <div className="bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full inline-block mb-4 border border-primary/20">
            Kalkulator HPP Paling Cuan untuk UMKM
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold font-headline text-foreground tracking-tight">
            Stop Pusing Mikirin HPP. <br className="hidden md:block"/>
            <span className="text-primary">Fokus Bikin Profit.</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
            HitunginAja membantu ribuan pengusaha muda seperti kamu menentukan harga jual yang tepat, menganalisis profit, dan mengembangkan bisnis dengan lebih percaya diri.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild className="font-bold">
              <Link href="/signup">
                Coba Sekarang, 100% Gratis! <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {heroImage && (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative w-full max-w-6xl mx-auto rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden border-4 border-primary/20 bg-muted p-2">
                 <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
                    <Image
                        src={heroImage.imageUrl}
                        alt={heroImage.description}
                        fill
                        className="object-cover"
                        data-ai-hint={heroImage.imageHint}
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                 </div>
            </div>
          </section>
        )}

        <section id="fitur" className="container mx-auto px-4 sm:px
-6 lg:px-8 py-24 md:py-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground">
              Bukan Sekedar Kalkulator Biasa
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
              Semua yang kamu butuhkan untuk mengelola harga, memaksimalkan profit, dan membuat keputusan bisnis yang lebih cerdas.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Bot className="h-8 w-8 text-primary" />}
              title="Konsultan AI"
              description="Dapetin insight, ide, dan strategi bisnis langsung dari AI. Anggap aja punya mentor bisnis pribadi 24/7!"
            />
            <FeatureCard
              icon={<Calculator className="h-8 w-8 text-primary" />}
              title="Kalkulator HPP Rinci & Cepat"
              description="Hitung biaya produksi dengan mode rinci atau dapatkan estimasi cepat. Fleksibel sesuai kebutuhanmu."
            />
            <FeatureCard
              icon={<DollarSign className="h-8 w-8 text-primary" />}
              title="Saran Harga Jual Ideal"
              description="Tentukan harga jual yang pas berdasarkan target profit margin dan hitung harga dasar sebelum PPN dengan mudah."
            />
            <FeatureCard
              icon={<Megaphone className="h-8 w-8 text-primary" />}
              title="Analisis Iklan (ROAS & ROI)"
              description="Ukur efektivitas setiap kampanye iklanmu untuk memastikan budget marketingmu tidak sia-sia."
            />
             <FeatureCard
              icon={<Landmark className="h-8 w-8 text-primary" />}
              title="Kalkulator Pinjaman Usaha"
              description="Simulasikan cicilan pinjaman modal usaha untuk perencanaan keuangan yang lebih matang sebelum berhutang."
            />
            <FeatureCard
              icon={<Share2 className="h-8 w-8 text-primary" />}
              title="Inspirasi dari Komunitas"
              description="Bagikan hasil perhitunganmu secara anonim dan dapatkan inspirasi dari sesama pengusaha di komunitas."
            />
             <FeatureCard
              icon={<Sparkles className="h-8 w-8 text-primary" />}
              title="Dan Banyak Lagi!"
              description="Temukan juga fitur pelacak pengeluaran, laporan profit bulanan, chat anonim, dan alat bantu lainnya di dalam dashboard."
            />
          </div>
        </section>
        
        <section id="harga" className="bg-muted py-24 md:py-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground">
                      Harga yang Gak Bikin Pusing
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                      Fokus kami adalah membantu bisnismu tumbuh. Mulai dengan paket gratis kami, selamanya.
                    </p>
                </div>
                <div className="flex justify-center">
                    <Card className="w-full max-w-md bg-background shadow-2xl shadow-primary/10 border-primary/30">
                        <CardHeader className="text-center pb-8">
                            <CardTitle className="text-4xl font-extrabold font-headline">Gratis</CardTitle>
                            <p className="text-muted-foreground">Untuk Pengusaha & UMKM</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary"/> Kalkulator HPP Tanpa Batas</li>
                                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary"/> Analisis Profit dengan AI</li>
                                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary"/> Laporan Keuangan Bulanan</li>
                                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary"/> Kalkulator Iklan & Harga Jual</li>
                                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary"/> Akses Komunitas</li>
                            </ul>
                             <Button size="lg" asChild className="w-full font-bold mt-6">
                                <Link href="/signup">
                                    Daftar Sekarang, Gratis Selamanya
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} HitunginAja. Dibuat dengan 🔥 untuk memajukan UMKM Indonesia.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="bg-card/50 dark:bg-card/20 border-border/50 transform transition-all duration-300 hover:scale-105 hover:shadow-primary/10 hover:shadow-lg hover:border-primary/30">
      <CardContent className="p-6 flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-lg mt-1">
          {icon}
        </div>
        <div className="flex-1">
          <CardTitle className="font-headline text-lg mb-2">{title}</CardTitle>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
