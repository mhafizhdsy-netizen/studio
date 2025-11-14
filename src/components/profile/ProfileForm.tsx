
"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/supabase/auth-provider";
import { supabase, uploadFileToSupabase } from "@/lib/supabase";
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
import { sanitizeFileName } from "@/lib/utils";
import { moderateImage } from "@/ai/flows/image-moderation-flow";

const profileFormSchema = z
  .object({
    name: z.string().min(2, { message: "Nama minimal 2 karakter." }),
    email: z.string().email({ message: "Format email tidak valid." }),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
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

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export function ProfileForm() {
  const { user, isLoading: isUserLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  useEffect(() => {
    if (user) {
        form.setValue('email', user.email || "");
        form.setValue('name', user.user_metadata.name || "");
        setPhotoURL(user.user_metadata.photoURL || null);
    }
  }, [user, form]);


  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;

    const file = e.target.files[0];
    const localUrl = URL.createObjectURL(file);
    setPhotoURL(localUrl);
    setIsUploading(true);
    setUploadProgress(0);

    const imageDataUri = await fileToDataUri(file);
    const moderationResult = await moderateImage({ imageDataUri });

    if (!moderationResult.isSafe) {
        toast({
            title: "Gambar Tidak Sesuai",
            description: moderationResult.reason || "Gambar yang Anda pilih melanggar pedoman komunitas kami.",
            variant: "destructive",
        });
        setPhotoURL(user.user_metadata.photoURL || null);
        setIsUploading(false);
        setUploadProgress(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        return;
    }

    const cleanFileName = sanitizeFileName(file.name);
    const filePath = `public/profile-images/${user.id}/${cleanFileName}`;

    try {
      const newPhotoURL = await uploadFileToSupabase(
        file,
        'user-assets',
        filePath
      );
      
      const { error: updateError } = await supabase.auth.updateUser({
        data: { ...user.user_metadata, photoURL: newPhotoURL }
      });

      if (updateError) throw updateError;

      setPhotoURL(newPhotoURL);
      toast({
        title: "Foto Profil Diperbarui",
        description: "Foto profil Anda telah berhasil diubah.",
      });
    } catch (uploadError) {
      console.error("Failed to upload or update photo:", uploadError);
      setPhotoURL(user.user_metadata.photoURL || null);
      toast({
        title: "Gagal Mengunggah Foto",
        description: "Terjadi kesalahan saat mengunggah foto profil.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(null), 2000);
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
    if (!user) return;
    setIsSubmitting(true);

    try {
        const hasDataChanged = data.name !== user.user_metadata.name;
        const hasEmailChanged = data.email !== user.email;

        // Prepare update objects
        const userUpdateData: any = {};
        if (hasDataChanged) {
            userUpdateData.data = { ...user.user_metadata, name: data.name };
        }
        if (hasEmailChanged) {
            userUpdateData.email = data.email;
        }
        if (data.newPassword) {
            userUpdateData.password = data.newPassword;
        }

        // Perform update if there's anything to change
        if (Object.keys(userUpdateData).length > 0) {
            const { error } = await supabase.auth.updateUser(userUpdateData);
            if (error) throw error;
        }
      
      toast({
        title: "Profil Berhasil Diperbarui!",
        description: "Informasi akunmu sudah berhasil disimpan.",
      });
      
      form.reset({
        ...data,
        newPassword: "",
        confirmPassword: "",
      });

    } catch (error: any) {
      console.error(error);
      toast({
        title: "Gagal Memperbarui Profil",
        description: error.message || "Terjadi kesalahan. Coba lagi nanti.",
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
  }

  if (isUserLoading || !user) {
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
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={photoURL || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-2xl">
                    {getInitials(user.user_metadata.name)}
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
              <div className="flex-grow w-full space-y-2">
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
                  Isi jika ingin mengubah password.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
