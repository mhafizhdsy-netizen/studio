
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PackagePlus, Wand2, Lightbulb, CheckCircle2 } from "lucide-react";

export function OnboardingGuide() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const userDocRef = useMemoFirebase(() => {
      if (!user || !firestore) return null;
      return doc(firestore, "users", user.uid);
  }, [user, firestore]);

  useEffect(() => {
    if (!userDocRef) return;

    const checkOnboardingStatus = async () => {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        // Show onboarding if onboardingCompleted is not explicitly true
        if (userData.onboardingCompleted !== true) {
          setShowOnboarding(true);
        }
      } else {
        // If user doc doesn't exist, they are definitely a new user
        setShowOnboarding(true);
      }
    };
    checkOnboardingStatus();
  }, [userDocRef]);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const handleDismiss = async (skipped = false) => {
    setShowOnboarding(false);
    if (userDocRef) {
      await setDoc(userDocRef, {
        onboardingCompleted: true,
        onboardingSkipped: skipped,
        onboardingCompletionDate: serverTimestamp(),
      }, { merge: true });
    }
  };
  
  const progressValue = (current / count) * 100;

  const onboardingSteps = [
    {
      icon: <PackagePlus className="h-12 w-12 text-primary" />,
      title: "Isi Produk Pertamamu",
      description: "Masuk ke Kalkulator HPP dan masukkan rincian biaya produkmu, mulai dari bahan baku sampai biaya operasional.",
    },
    {
      icon: <Wand2 className="h-12 w-12 text-accent" />,
      title: "Hitung HPP & Margin",
      description: "Tentukan target profit margin kamu, lalu klik 'Hitung HPP'. GenHPP akan secara otomatis menghitung semuanya untukmu.",
    },
    {
      icon: <Lightbulb className="h-12 w-12 text-yellow-400" />,
      title: "Dapatkan Insight Harga",
      description: "Lihat hasil perhitungan, visualisasi biaya, dan dapatkan saran harga jual. Kamu juga bisa dapat analisis dari AI.",
    },
  ];

  return (
    <Dialog open={showOnboarding}>
      <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-center">Selamat Datang di GenHPP!</DialogTitle>
          <DialogDescription className="text-center">
            Yuk, ikuti 3 langkah mudah untuk memulai.
          </DialogDescription>
        </DialogHeader>
        
        <Carousel setApi={setApi} className="w-full">
            <CarouselContent>
            {onboardingSteps.map((step, index) => (
                <CarouselItem key={index}>
                    <Card className="border-none shadow-none">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-4 h-56">
                        {step.icon}
                        <h3 className="font-bold text-lg">{step.title}</h3>
                        <p className="text-muted-foreground text-sm">{step.description}</p>
                    </CardContent>
                    </Card>
                </CarouselItem>
            ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
        </Carousel>

        <div className="px-4 space-y-2">
            <Progress value={progressValue} className="w-full h-2"/>
            <p className="text-center text-sm text-muted-foreground">
                Langkah {current} dari {count}
            </p>
        </div>
        
        <DialogFooter className="sm:justify-between flex-row-reverse sm:flex-row-reverse">
          <Button onClick={() => handleDismiss(false)}>
            <CheckCircle2 className="mr-2 h-4 w-4"/>
            Selesai
          </Button>
          <Button variant="ghost" onClick={() => handleDismiss(true)}>Lewati Tur</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
