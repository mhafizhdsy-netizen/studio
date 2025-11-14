
"use client";

import { useState, useRef, ChangeEvent } from "react";
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
import { Loader2, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase, uploadFileToSupabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { sanitizeFileName } from "@/lib/utils";
import { moderateImage } from "@/ai/flows/image-moderation-flow";

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

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });
  
  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
       
      const imageDataUri = await fileToDataUri(file);
      const moderationResult = await moderateImage({ imageDataUri });

      if (!moderationResult.isSafe) {
          toast({
              title: "Gambar Tidak Sesuai",
              description: moderationResult.reason || "Gambar yang Anda pilih melanggar pedoman komunitas kami.",
              variant: "destructive",
          });
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          return;
      }
      
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoadingEmail(true);
    let photoURL = '';

    if (photoFile) {
        // We need user ID for path, so we upload after signup
        // For now, we just prepare the file
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          name: values.name,
          photoURL: '', // Start with empty photoURL
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

    const user = signUpData.user;

    if (photoFile) {
        const cleanFileName = sanitizeFileName(photoFile.name);
        const filePath = `public/profile-images/${user.id}/${cleanFileName}`;
        photoURL = await uploadFileToSupabase(photoFile, 'user-assets', filePath);
        
        // Update user metadata with the photoURL
        const { error: updateError } = await supabase.auth.updateUser({
          data: { ...user.user_metadata, photoURL }
        });

        if (updateError) {
            console.error("Error updating user photo after signup:", updateError);
            toast({
                title: "Peringatan",
                description: "Gagal menyimpan foto profil. Anda bisa mengaturnya lagi di halaman profil.",
            });
        }
    }

    toast({
        title: "Akun Berhasil Dibuat!",
        description: "Selamat datang di HitunginAja! Yuk mulai hitung HPP pertamamu.",
    });

    router.push("/dashboard");
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
    // Browser will redirect
    setIsLoadingGoogle(false);
  }

  const isLoading = isLoadingEmail || isLoadingGoogle;

  return (
    <>
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold font-headline">Buat Akun Gratis</h1>
        <p className="text-balance text-muted-foreground">
            Mulai perjalanan bisnismu dengan menghitung profit secara akurat.
        </p>
      </div>

       <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="flex flex-col items-center gap-2">
                <div 
                    className="relative p-1 rounded-full border-2 border-dashed border-muted-foreground/50 cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={photoPreview ?? undefined} />
                        <AvatarFallback className="text-3xl bg-muted">
                            {(form.getValues('name') || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-1 right-1 bg-background border rounded-full p-1.5 flex items-center justify-center">
                        <Camera className="h-4 w-4 text-muted-foreground" />
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">Unggah foto profil (opsional)</p>
                <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                />
            </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Lengkap</FormLabel>
                <FormControl>
                  <Input placeholder="Nama Kamu" {...field} disabled={isLoading} />
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
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="email@contoh.com" {...field} disabled={isLoading} />
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="•••••••• (minimal 6 karakter)" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full font-bold mt-2" disabled={isLoading}>
            {isLoadingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Buat Akun
          </Button>
           <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Atau
                    </span>
                </div>
            </div>
           <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                {isLoadingGoogle ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2" />}
                Daftar dengan Google
            </Button>
        </form>
      </Form>
      <div className="mt-4 text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href="/login" className="underline text-primary font-semibold hover:text-primary/80">
          Masuk di sini
        </Link>
      </div>
    </>
  );
}
