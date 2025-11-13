
"use client";

import { useState, useRef, ChangeEvent } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth, useFirestore, useStorage } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { uploadFile } from "@/firebase/storage";

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
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // States for photo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const createUserProfile = async (uid: string, name: string, email: string, photoURL?: string) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', uid);
    await setDoc(userDocRef, {
        name,
        email,
        photoURL: photoURL || '',
        createdAt: serverTimestamp(),
        onboardingCompleted: false, // Set onboarding as not completed for new users
    }, { merge: true });
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !firestore) return;
    setIsLoadingEmail(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        let photoURL = '';

        if (photoFile && storage) {
            setIsUploading(true);
            const filePath = `profile-images/${user.uid}/${photoFile.name}`;
            photoURL = await uploadFile(storage, filePath, photoFile, (progress) => {
                setUploadProgress(progress);
            });
            setIsUploading(false);
        }

        await updateProfile(user, { displayName: values.name, photoURL: photoURL || undefined });
        await createUserProfile(user.uid, values.name, values.email, photoURL);

        toast({
            title: "Akun Berhasil Dibuat!",
            description: "Selamat datang di HitunginAja! Yuk mulai hitung HPP pertamamu.",
        });
        router.push("/dashboard");
    } catch (error) {
        toast({
            title: "Gagal Daftar",
            description: "Email ini mungkin sudah terdaftar. Coba email lain.",
            variant: "destructive",
        });
        setIsLoadingEmail(false);
        setIsUploading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!auth) return;
    setIsLoadingGoogle(true);
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        await createUserProfile(user.uid, user.displayName!, user.email!, user.photoURL || undefined);

        toast({
            title: "Berhasil Masuk!",
            description: "Selamat datang! Yuk mulai hitung HPP.",
        });
        router.push("/dashboard");
    } catch (error) {
        toast({
            title: "Gagal Masuk dengan Google",
            description: "Ada masalah pas coba masuk pakai Google. Coba lagi ya.",
            variant: "destructive",
        });
    }
    setIsLoadingGoogle(false);
  }

  const isLoading = isLoadingEmail || isLoadingGoogle || isUploading;

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Buat Akun Baru</CardTitle>
        <CardDescription>
          Sudah punya akun?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Masuk di sini
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <div className="flex flex-col items-center gap-4">
                 <div className="relative">
                    <Avatar className="h-24 w-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <AvatarImage src={photoPreview || undefined} alt="Foto Profil"/>
                        <AvatarFallback className="bg-muted">
                           <User className="h-12 w-12 text-muted-foreground" />
                        </AvatarFallback>
                    </Avatar>
                    <div 
                        className="absolute bottom-1 right-1 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Camera className="h-4 w-4" />
                    </div>
                </div>
                {uploadProgress !== null && <Progress value={uploadProgress} className="w-full h-2" />}
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  className="hidden"
                  accept="image/png, image/jpeg, image/webp"
                  disabled={isLoading}
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
                    <Input placeholder="contoh@email.com" {...field} disabled={isLoading} />
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
                    <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full font-bold" disabled={isLoading}>
              {isLoadingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUploading ? `Mengunggah (${Math.round(uploadProgress || 0)}%)...` : "Daftar"}
            </Button>
          </form>
        </Form>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Atau daftar dengan
            </span>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
           {isLoadingGoogle ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2" />}
          Google
        </Button>
      </CardContent>
    </Card>
  );
}
