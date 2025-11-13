import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart, Bot, Calculator, History, Share2, DollarSign } from "lucide-react";
import { placeholderImages } from "@/lib/placeholder-images";

const heroImage = placeholderImages.find(p => p.id === "hero");

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Calculator className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold font-headline text-foreground">
            GenHPP
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Masuk</Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/signup">Mulai Gratis</Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 md:py-32">
          <h1 className="text-4xl md:text-6xl font-extrabold font-headline text-foreground tracking-tight">
            Hitung HPP Bisnismu, <br />
            <span className="text-primary">Bukan Pusingnya.</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
            GenHPP adalah cara modern buat pengusaha muda Indonesia menghitung Harga Pokok Produksi (HPP) dengan cepat, akurat, dan asik.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg">
              <Link href="/signup">
                Coba Sekarang, Gratis! <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {heroImage && (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative aspect-[16/9] w-full max-w-5xl mx-auto rounded-xl shadow-2xl overflow-hidden border">
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
          </section>
        )}

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground">
              Fitur Canggih untuk Bisnis Kekinian
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
              Semua yang kamu butuhin buat ngatur harga jual dan maksimalkan cuan.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
            <FeatureCard
              icon={<Calculator className="h-8 w-8 text-primary" />}
              title="Kalkulator HPP Interaktif"
              description="Masukkan semua biaya produksi, dari bahan baku sampai overhead. Biar GenHPP yang hitung totalnya."
            />
            <FeatureCard
              icon={<DollarSign className="h-8 w-8 text-primary" />}
              title="Kalkulator Harga Jual"
              description="Tentukan harga jual ideal berdasarkan target profit dan hitung harga dasar sebelum PPN dengan mudah."
            />
             <FeatureCard
              icon={<Bot className="h-8 w-8 text-primary" />}
              title="Analisis Profit AI"
              description="Dapatkan strategi, saran efisiensi, dan benchmark harga pasar dari AI untuk memaksimalkan keuntunganmu."
            />
             <FeatureCard
              icon={<BarChart className="h-8 w-8 text-primary" />}
              title="Visualisasi Biaya"
              description="Lihat rincian biaya dalam pie chart yang gampang dimengerti. Jadi tahu mana biaya paling besar."
            />
            <FeatureCard
              icon={<History className="h-8 w-8 text-primary" />}
              title="Riwayat Tersimpan"
              description="Semua perhitungan HPP-mu aman tersimpan. Bisa kamu lihat, edit, atau hapus kapan aja."
            />
            <FeatureCard
              icon={<Share2 className="h-8 w-8 text-primary" />}
              title="Bagikan ke Komunitas"
              description="Bagikan hasil perhitunganmu ke tim atau jadi inspirasi bagi pengusaha lain di komunitas."
            />
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} GenHPP. Dibuat dengan 🔥 untuk pengusaha muda Indonesia.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="bg-card/50 dark:bg-card/20 border-border/50 transform transition-transform duration-300 hover:scale-105 hover:shadow-primary/20 hover:shadow-lg">
      <CardHeader className="items-center">
        <div className="bg-primary/10 p-3 rounded-full">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="text-center">
        <CardTitle className="font-headline text-lg mb-2">{title}</CardTitle>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}
