
"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Loader2, MailCheck, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Card, CardContent, CardHeader } from "../ui/card";

const formSchema = z.object({
  name: z.string().min(2, { message: "Nama minimal 2 karakter." }),
  email: z.string().email({ message: "Format email tidak valid." }),
  password: z.string().min(6, { message: "Password minimal 6 karakter." }),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.788,44,30.038,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);

export function SignupForm() {
  const { toast } = useToast();
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoadingEmail(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          name: values.name,
          photoURL: '', 
        }
      }
    });
    
    if (signUpError) {
      toast({
          title: "Gagal Daftar",
          description: signUpError.message || "Email ini mungkin sudah terdaftar. Coba email lain.",
          variant: "destructive",
      });
      setIsLoadingEmail(false);
      return;
    }
    
    if (!signUpData.user) {
        toast({
            title: "Gagal Daftar",
            description: "Gagal membuat pengguna. Silakan coba lagi.",
            variant: "destructive",
        });
        setIsLoadingEmail(false);
        return;
    }
    
    setShowVerificationMessage(true);
    setIsLoadingEmail(false);
  }

  async function handleGoogleSignIn() {
    setIsLoadingGoogle(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
       options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
       toast({
            title: "Gagal Masuk dengan Google",
            description: error.message || "Ada masalah pas coba masuk pakai Google. Coba lagi ya.",
            variant: "destructive",
        });
    }
    setIsLoadingGoogle(false);
  }

  const isLoading = isLoadingEmail || isLoadingGoogle;

  if (showVerificationMessage) {
    return (
        <Card className="w-full bg-background/50 backdrop-blur-sm border-white/10 text-center">
            <CardHeader>
                 <div className="mx-auto h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                    <MailCheck className="h-6 w-6 text-primary" />
                 </div>
                <AlertTitle className="font-bold text-lg text-foreground">Satu Langkah Lagi, Sultan!</AlertTitle>
            </CardHeader>
            <CardContent>
                <AlertDescription className="mt-2 text-muted-foreground">
                    Akunmu berhasil dibuat. Kami udah kirim link verifikasi ke <br/><strong>{form.getValues('email')}</strong>.
                    <br/><br/>
                    Cek inbox (atau folder spam), lalu klik link itu buat aktivasi akunmu sebelum login.
                </AlertDescription>
                 <div className="mt-6">
                    <Button asChild>
                        <Link href="/login">Kembali ke Halaman Login</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="w-full bg-background/50 backdrop-blur-sm border-white/10">
        <CardHeader className="text-center">
            <h2 className="text-2xl font-bold font-headline">Gabung Sekarang, Gratis!</h2>
        </CardHeader>
        <CardContent className="space-y-6">
            <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                {isLoadingGoogle ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2" />}
                Lanjutkan dengan Google
            </Button>
            
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background/50 px-2 text-muted-foreground">
                    Atau daftar dengan email
                    </span>
                </div>
            </div>

       <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Nama</FormLabel>
                <FormControl>
                  <Input placeholder="Nama kamu" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Email kamu" {...field} disabled={isLoading} />
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
                <FormLabel className="sr-only">Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Buat password yang kuat" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full font-bold" disabled={isLoading}>
            {isLoadingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <UserPlus className="mr-2 h-4 w-4" />
            Buat Akun
          </Button>
        </form>
      </Form>
      <div className="text-center text-sm text-muted-foreground">
        Udah punya akun?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Masuk di sini
        </Link>
      </div>
      </CardContent>
    </Card>
  );
}
