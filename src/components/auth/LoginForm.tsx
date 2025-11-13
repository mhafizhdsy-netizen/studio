
"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth, useFirestore } from "@/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Separator } from "../ui/separator";

const formSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid." }),
  password: z.string().min(1, { message: "Password tidak boleh kosong." }),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.788,44,30.038,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
  );

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoadingEmail(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Berhasil Masuk!",
        description: "Selamat datang kembali! Yuk lanjutin cuan.",
      });
      router.push("/dashboard");
    } catch (error) {
      toast({
        title: "Gagal Masuk",
        description: "Email atau password salah. Coba lagi yuk!",
        variant: "destructive",
      });
    }
    setIsLoadingEmail(false);
  }

  const createUserProfile = async (uid: string, name: string, email: string, photoURL: string) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    // Hanya buat dokumen jika belum ada
    if (!userDoc.exists()) {
        await setDoc(userDocRef, {
            id: uid,
            name,
            email,
            photoURL: photoURL || '',
            createdAt: serverTimestamp(),
            onboardingCompleted: false,
        }, { merge: true });
    }
  }

  async function handleGoogleSignIn() {
    setIsLoadingGoogle(true);
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        await createUserProfile(user.uid, user.displayName || 'User', user.email || '', user.photoURL || '');

        toast({
            title: "Berhasil Masuk!",
            description: "Selamat datang! Yuk mulai hitung HPP.",
        });
        router.push("/dashboard");
    } catch (error) {
        console.error(error);
        toast({
            title: "Gagal Masuk dengan Google",
            description: "Ada masalah pas coba masuk pakai Google. Coba lagi ya.",
            variant: "destructive",
        });
    }
    setIsLoadingGoogle(false);
  }

  return (
    <div className="w-full">
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold">Selamat Datang Kembali!</h1>
        <p className="text-balance text-muted-foreground">
          Masukkan email dan password untuk mengakses dashboard.
        </p>
      </div>

       <div className="grid gap-4 mt-8">
        <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoadingEmail || isLoadingGoogle}>
            {isLoadingGoogle ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2" />}
            Masuk dengan Google
        </Button>
      </div>

       <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Atau lanjutkan dengan
            </span>
          </div>
        </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="contoh@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                    <FormLabel>Password</FormLabel>
                    <Link
                        href="#"
                        className="ml-auto inline-block text-xs text-primary hover:underline"
                    >
                        Lupa password?
                    </Link>
                </div>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full font-bold mt-2" disabled={isLoadingEmail || isLoadingGoogle}>
            {isLoadingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Masuk
          </Button>
        </form>
      </Form>
      <div className="mt-6 text-center text-sm">
        Belum punya akun?{" "}
        <Link href="/signup" className="underline text-primary font-semibold">
          Daftar di sini
        </Link>
      </div>
    </div>
  );
}

