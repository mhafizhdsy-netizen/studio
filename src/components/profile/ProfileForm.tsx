
"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUser, useAuth, useFirestore, useStorage } from "@/firebase";
import {
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { uploadFile } from "@/firebase/storage";
import { doc, setDoc } from "firebase/firestore";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const profileFormSchema = z
  .object({
    name: z.string().min(2, { message: "Nama minimal 2 karakter." }),
    email: z.string().email({ message: "Format email tidak valid." }),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword && !data.currentPassword) {
        return false;
      }
      return true;
    },
    {
      message: "Password saat ini dibutuhkan untuk mengubah password.",
      path: ["currentPassword"],
    }
  )
  .refine(
    (data) => {
      if (data.newPassword && data.newPassword.length < 6) {
        return false;
      }
      return true;
    },
    {
      message: "Password baru minimal 6 karakter.",
      path: ["newPassword"],
    }
  )
  .refine(
    (data) => {
      if (data.newPassword && data.newPassword !== data.confirmPassword) {
        return false;
      }
      return true;
    },
    {
      message: "Password baru tidak cocok.",
      path: ["confirmPassword"],
    }
  );

type ProfileFormData = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoURL, setPhotoURL] = useState(user?.photoURL);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.displayName || "",
      email: user?.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  useEffect(() => {
    if (user) {
        form.reset({
            name: user.displayName || "",
            email: user.email || "",
        });
        setPhotoURL(user.photoURL);
    }
  }, [user, form]);


  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!storage || !user || !auth.currentUser) {
      toast({
        title: "Gagal",
        description: "Layanan pengguna tidak tersedia.",
        variant: "destructive",
      });
      return;
    }

    const file = e.target.files[0];
    const localUrl = URL.createObjectURL(file);
    setPhotoURL(localUrl); // Show preview immediately

    setIsUploading(true);
    setUploadProgress(0);

    const filePath = `profile-images/${user.uid}/${file.name}`;

    try {
      const newPhotoURL = await uploadFile(
        storage,
        filePath,
        file,
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      // Update Auth and Firestore
      await updateProfile(auth.currentUser, { photoURL: newPhotoURL });
      const userDocRef = doc(firestore, "users", user.uid);
      await setDoc(userDocRef, { photoURL: newPhotoURL }, { merge: true });

      setPhotoURL(newPhotoURL); // Set final URL
      toast({
        title: "Foto Profil Diperbarui",
        description: "Foto profil Anda telah berhasil diubah.",
      });
    } catch (uploadError) {
      console.error("Failed to upload photo:", uploadError);
      setPhotoURL(user?.photoURL); // Revert to old photo on error
      toast({
        title: "Gagal Mengunggah Foto",
        description: "Terjadi kesalahan saat mengunggah foto profil.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(null), 2000); // Hide progress bar after 2s
    }
  };


  const getInitials = (name: string | null | undefined) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase()
      : "?";

  async function onSubmit(data: ProfileFormData) {
    if (!user || !auth) return;
    setIsSubmitting(true);

    try {
      const needsReauth = data.newPassword || data.email !== user.email;
      if (data.currentPassword && needsReauth && user.email) {
        const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
        await reauthenticateWithCredential(user, credential);
      } else if (!data.currentPassword && needsReauth) {
         throw new Error("Password saat ini dibutuhkan untuk mengubah email atau password.");
      }

      // Update Profile Name
      if (data.name !== user.displayName) {
        await updateProfile(user, { displayName: data.name });
      }

      // Update Email
      if (data.email !== user.email) {
        await updateEmail(user, data.email);
      }

      // Update Password
      if (data.newPassword) {
        await updatePassword(user, data.newPassword);
      }
      
      const userDocRef = doc(firestore, "users", user.uid);
      await setDoc(
        userDocRef,
        { name: data.name, email: data.email },
        { merge: true }
      );
      
      toast({
        title: "Profil Berhasil Diperbarui!",
        description: "Informasi akunmu sudah berhasil disimpan.",
      });
      
      form.reset({
        ...data,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

    } catch (error: any) {
      console.error(error);
      let description = "Terjadi kesalahan. Coba lagi nanti.";
      if (error.code === 'auth/wrong-password' || error.message.includes("Password saat ini dibutuhkan")) {
        description = "Password saat ini yang kamu masukkan salah atau kosong."
      } else if (error.code === 'auth/email-already-in-use') {
        description = "Email ini sudah digunakan oleh akun lain."
      } else if (error.code === 'auth/requires-recent-login') {
        description = "Perlu login ulang untuk melakukan aksi ini. Silakan logout dan login kembali."
      }
      toast({
        title: "Gagal Memperbarui Profil",
        description: description,
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
  }

  if (isUserLoading) {
      return <div className="flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <Card className="w-full max-w-2xl shadow-none border-none">
      <CardHeader>
        <CardTitle>Edit Informasi Akun</CardTitle>
        <CardDescription>
          Perbarui nama, email, password, dan foto profil Anda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={photoURL || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-2xl">
                    {getInitials(user?.displayName)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 rounded-full h-7 w-7"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </Button>
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  className="hidden"
                  accept="image/png, image/jpeg, image/webp"
                  disabled={isUploading}
                />
              </div>
              <div className="flex-grow space-y-2">
                 <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama Kamu" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {uploadProgress !== null && <Progress value={uploadProgress} className="w-full h-2 mt-2" />}
              </div>
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="contoh@email.com" {...field} disabled={isSubmitting}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Ubah Password</CardTitle>
                <CardDescription>
                  Isi jika ingin mengubah password. Anda harus memasukkan password saat ini.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password Saat Ini</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} disabled={isSubmitting}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password Baru</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} disabled={isSubmitting}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konfirmasi Password Baru</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} disabled={isSubmitting}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Simpan Perubahan
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    