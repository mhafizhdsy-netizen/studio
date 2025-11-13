
"use client";

import { useState, useRef, ChangeEvent } from "react";
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
import { uploadProfileImage } from "@/firebase/storage";
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
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoURL, setPhotoURL] = useState(user?.photoURL);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoURL(URL.createObjectURL(file));
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

  async function onSubmit(data: ProfileFormData) {
    if (!user || !auth) return;
    setIsSubmitting(true);

    try {
      // Re-authentication if password or email is being changed
      if (data.currentPassword && (data.newPassword || data.email !== user.email)) {
        const credential = EmailAuthProvider.credential(user.email!, data.currentPassword);
        await reauthenticateWithCredential(user, credential);
      }

      // Update Photo
      let newPhotoURL = user.photoURL;
      if (photo && storage) {
        newPhotoURL = await uploadProfileImage(storage, user.uid, photo);
      }

      // Update Profile (Name & Photo)
      if (data.name !== user.displayName || newPhotoURL !== user.photoURL) {
        await updateProfile(user, {
          displayName: data.name,
          photoURL: newPhotoURL,
        });
      }

      // Update Email
      if (data.email !== user.email) {
        await updateEmail(user, data.email);
      }

      // Update Password
      if (data.newPassword) {
        await updatePassword(user, data.newPassword);
      }

      // Update Firestore user document
      const userDocRef = doc(firestore, "users", user.uid);
      await setDoc(
        userDocRef,
        {
          name: data.name,
          email: data.email,
        },
        { merge: true }
      );

      toast({
        title: "Profil Berhasil Diperbarui!",
        description: "Informasi akunmu sudah berhasil disimpan.",
      });
      // Reset form to clear password fields
      form.reset({
        ...data,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error(error);
      let description = "Terjadi kesalahan. Coba lagi nanti.";
      if (error.code === 'auth/wrong-password') {
        description = "Password saat ini yang kamu masukkan salah."
      } else if (error.code === 'auth/email-already-in-use') {
        description = "Email ini sudah digunakan oleh akun lain."
      }
       else if (error.code === 'auth/requires-recent-login') {
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
                    {getInitials(user?.displayName || "?")}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 rounded-full h-7 w-7"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  className="hidden"
                  accept="image/png, image/jpeg, image/webp"
                />
              </div>
              <div className="flex-grow">
                 <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama Kamu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Ubah Password</CardTitle>
                <CardDescription>
                  Biarkan kosong jika tidak ingin mengubah password.
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
                        <Input type="password" {...field} />
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
                        <Input type="password" {...field} />
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
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button type="submit" disabled={isSubmitting}>
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
