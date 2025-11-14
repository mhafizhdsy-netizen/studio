
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  query,
} from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Shield,
  UserPlus,
  Users,
  FileText,
  MessageSquare,
  Ban,
  Trash2,
  Pin,
  PinOff,
} from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  createdAt: any;
  isSuspended?: boolean;
}

interface PublicCalculation {
  id: string;
  productName: string;
  userName: string;
  isFeatured?: boolean;
  createdAt: any;
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function AdminStats() {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const publicCalcsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'public_calculations') : null),
    [firestore]
  );

  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
  const { data: publicCalcs, isLoading: calcsLoading } =
    useCollection(publicCalcsQuery);

  const isLoading = usersLoading || calcsLoading;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Total Pengguna"
        value={isLoading ? '...' : (users?.length ?? 0).toString()}
        icon={Users}
      />
      <StatCard
        title="Perhitungan Publik"
        value={isLoading ? '...' : (publicCalcs?.length ?? 0).toString()}
        icon={FileText}
      />
    </div>
  );
}

function UserManager() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const usersQuery = useMemoFirebase(
    () =>
      firestore ? query(collection(firestore, 'users'), 'id') : null,
    [firestore]
  );
  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  const handleToggleSuspend = async (uid: string, isSuspended?: boolean) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', uid);
    try {
      await updateDoc(userRef, { isSuspended: !isSuspended });
      toast({
        title: 'Sukses!',
        description: `Status pengguna telah ${
          !isSuspended ? 'ditangguhkan' : 'diaktifkan'
        }.`,
      });
    } catch (e) {
      toast({
        title: 'Gagal',
        description: 'Gagal memperbarui status pengguna.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = (uid: string) => {
    toast({
      title: 'Fitur Dalam Pengembangan',
      description:
        'Penghapusan pengguna memerlukan Firebase Function untuk memastikan semua data terhapus dengan aman.',
      variant: 'default',
    });
  };

  const getInitials = (name: string) =>
    (name || 'A')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manajemen Pengguna</CardTitle>
        <CardDescription>
          Lihat, tangguhkan, atau hapus pengguna dari sistem.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pengguna</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Bergabung</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL} />
                        <AvatarFallback>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.createdAt
                      ? format(user.createdAt.toDate(), 'd MMM yyyy')
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {user.isSuspended && (
                      <span className="text-xs font-semibold text-destructive">
                        Ditangguhkan
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() =>
                            handleToggleSuspend(user.id, user.isSuspended)
                          }
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          {user.isSuspended
                            ? 'Aktifkan Pengguna'
                            : 'Tangguhkan Pengguna'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus Pengguna
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ContentManager() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const publicCalcsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'public_calculations'), 'id')
        : null,
    [firestore]
  );
  const { data: calculations, isLoading } =
    useCollection<PublicCalculation>(publicCalcsQuery);

  const handleToggleFeature = async (
    calcId: string,
    isFeatured?: boolean
  ) => {
    if (!firestore) return;
    const calcRef = doc(firestore, 'public_calculations', calcId);
    try {
      await updateDoc(calcRef, { isFeatured: !isFeatured });
      toast({
        title: 'Sukses!',
        description: `Perhitungan telah ${
          !isFeatured ? 'ditandai sebagai pilihan' : 'dihapus dari pilihan'
        }.`,
      });
    } catch (e) {
      toast({
        title: 'Gagal',
        description: 'Gagal memperbarui status perhitungan.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCalculation = async (calcId: string) => {
    if (!firestore) return;
    const calcRef = doc(firestore, 'public_calculations', calcId);
    try {
      await deleteDoc(calcRef);
      toast({
        title: 'Dihapus!',
        description: 'Perhitungan publik telah berhasil dihapus.',
      });
    } catch (e) {
      toast({
        title: 'Gagal',
        description: 'Gagal menghapus perhitungan publik.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manajemen Konten Publik</CardTitle>
        <CardDescription>
          Kelola perhitungan yang dibagikan oleh komunitas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Produk</TableHead>
                <TableHead>Oleh</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculations
                ?.sort((a, b) => (b.isFeatured ? 1 : -1) - (a.isFeatured ? 1 : -1))
                .map((calc) => (
                  <TableRow
                    key={calc.id}
                    className={calc.isFeatured ? 'bg-primary/10' : ''}
                  >
                    <TableCell className="font-medium flex items-center gap-2">
                      {calc.isFeatured && (
                        <Pin className="h-4 w-4 text-primary" />
                      )}
                      {calc.productName}
                    </TableCell>
                    <TableCell>{calc.userName}</TableCell>
                    <TableCell>
                      {calc.createdAt
                        ? format(calc.createdAt.toDate(), 'd MMM yyyy')
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleFeature(calc.id, calc.isFeatured)
                            }
                          >
                            {calc.isFeatured ? (
                              <PinOff className="mr-2 h-4 w-4" />
                            ) : (
                              <Pin className="mr-2 h-4 w-4" />
                            )}
                            {calc.isFeatured
                              ? 'Hapus dari Pilihan'
                              : 'Jadikan Pilihan'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteCalculation(calc.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminDashboard() {
  return (
    <Card className="mb-6 border-accent/50 bg-accent/10">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2 text-accent">
          <Shield />
          Panel Admin
        </CardTitle>
        <CardDescription>
          Lihat statistik, kelola pengguna, dan moderasi konten dari sini.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AdminStats />
        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Manajemen Pengguna</TabsTrigger>
            <TabsTrigger value="content">Manajemen Konten</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4">
            <UserManager />
          </TabsContent>
          <TabsContent value="content" className="mt-4">
            <ContentManager />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

    