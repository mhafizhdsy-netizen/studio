
'use client';

import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Shield,
  Users,
  FileText,
  MessageSquare,
  Ban,
  Trash2,
  Pin,
  PinOff,
  MoreHorizontal,
  TrendingUp,
  BarChart,
  ShieldCheck,
} from 'lucide-react';
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
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';

// Interfaces
interface UserProfile extends User {
    // Supabase adds user_metadata, and we can define our custom fields here
    user_metadata: {
        name: string;
        photoURL?: string;
        isAdmin?: boolean;
        isSuspended?: boolean;
    };
}

interface PublicCalculation {
  id: string;
  productName: string;
  userName: string;
  isFeatured?: boolean;
  createdAt: string;
  userId: string;
  commentCount?: number;
}

// Helper Functions
const getInitials = (name: string) =>
  (name || 'A')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();


// --- Components ---

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

function AdminStats({ calculationsWithComments }: { calculationsWithComments: PublicCalculation[] | null }) {
  const [users, setUsers] = useState<UserProfile[] | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      // Note: Supabase admin functions to list users would be called from a secure server environment,
      // not directly from the client. Here we fetch from our public `users` table as a proxy.
      const { data, error } = await supabase.from('users').select('*');
      if (data) setUsers(data as any);
      if (error) console.error("Error fetching users for stats", error);
      setUsersLoading(false);
    };
    fetchUsers();
  }, []);
  
  const isLoading = usersLoading || !calculationsWithComments;
  
  const totalComments = useMemo(() => {
    if (!calculationsWithComments) return 0;
    return calculationsWithComments.reduce((sum, calc) => sum + (calc.commentCount || 0), 0);
  }, [calculationsWithComments]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Total Pengguna"
        value={isLoading ? '...' : (users?.length ?? 0).toString()}
        icon={Users}
      />
      <StatCard
        title="Perhitungan Publik"
        value={isLoading ? '...' : (calculationsWithComments?.length ?? 0).toString()}
        icon={FileText}
      />
       <StatCard
        title="Total Komentar"
        value={isLoading ? "..." : totalComments.toString()}
        icon={MessageSquare}
      />
    </div>
  );
}

function UserManager() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
      setIsLoading(true);
      // In a real app, this should call a server-side function to list all users.
      // For this prototype, we'll fetch from the `users` table.
      const { data, error } = await supabase.from('users').select('*').order('createdAt', { ascending: false });
      if (data) setUsers(data as any);
      if(error) console.error("Error fetching users:", error);
      setIsLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleAdmin = async (user: UserProfile) => {
    // This action requires admin privileges on the server.
    // We are simulating it by updating the `users` table.
    // In production, use an edge function.
    const newIsAdmin = !user.user_metadata.isAdmin;
    const { error } = await supabase.from('users').update({ isAdmin: newIsAdmin }).eq('id', user.id);
     if (error) {
      toast({ title: 'Gagal', description: 'Gagal memperbarui status admin.', variant: 'destructive' });
    } else {
      toast({ title: 'Sukses!', description: `Status admin pengguna telah diperbarui.` });
      fetchUsers(); // Refresh the list
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manajemen Pengguna</CardTitle>
        <CardDescription>
          Lihat, berikan status admin, atau hapus pengguna dari sistem.
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
                        <AvatarImage src={user.user_metadata.photoURL} />
                        <AvatarFallback>
                          {getInitials(user.user_metadata.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.user_metadata.name}</span>
                        {user.user_metadata.isAdmin && <Badge variant="accent"><Shield className="h-3 w-3 mr-1" />Admin</Badge>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.created_at
                      ? format(new Date(user.created_at), 'd MMM yyyy')
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {user.user_metadata.isSuspended && (
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
                          onClick={() => handleToggleAdmin(user)}
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          {user.user_metadata.isAdmin
                            ? 'Hapus Status Admin'
                            : 'Jadikan Admin'}
                        </DropdownMenuItem>
                        
                        {/* Deletion and Suspension should be done via server-side functions for security */}
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

function ContentManager({ calculations, isLoading, onRefresh }: { calculations: PublicCalculation[] | null, isLoading: boolean, onRefresh: () => void }) {
  const { toast } = useToast();

  const handleToggleFeature = async (
    calcId: string,
    isFeatured?: boolean
  ) => {
    // This is not a real field in the view, it's just for demo.
    // In a real app, you'd have an `isFeatured` column on the `calculations` table.
    toast({ title: 'Fungsi Belum Tersedia', description: 'Fitur "Jadikan Pilihan" belum diimplementasikan.' });
  };

  const handleDeleteCalculation = async (calcId: string, userId: string) => {
    const { error } = await supabase.from('calculations').delete().eq('id', calcId);

    if (error) {
      console.error(error);
      toast({
        title: "Gagal",
        description: "Gagal menghapus perhitungan.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Dihapus",
        description: "Perhitungan telah dihapus.",
      });
      onRefresh();
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
                <TableHead>Komentar</TableHead>
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
                    <TableCell>{calc.commentCount ?? 0}</TableCell>
                    <TableCell>
                      {calc.createdAt
                        ? format(new Date(calc.createdAt), 'd MMM yyyy')
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
                          <DropdownMenuSeparator/>
                          <DropdownMenuItem
                            onClick={() => handleDeleteCalculation(calc.id, calc.userId)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus Konten
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

function AnalyticsManager() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Analitik</CardTitle>
                <CardDescription>Halaman analitik sedang dalam pengembangan.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center py-8">Segera Hadir!</p>
            </CardContent>
        </Card>
    );
}


export function AdminDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [calculations, setCalculations] = useState<PublicCalculation[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPublicData = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('public_calculations').select('*').order('createdAt', { ascending: false });
        if (data) setCalculations(data as any);
        if (error) console.error("Error fetching public calculations:", error);
        setIsLoading(false);
    }
    fetchPublicData();
  }, [refreshKey]);


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
        <AdminStats calculationsWithComments={calculations} />
        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Manajemen Pengguna</TabsTrigger>
            <TabsTrigger value="content">Manajemen Konten</TabsTrigger>
            <TabsTrigger value="analytics">Analitik</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4">
            <UserManager />
          </TabsContent>
          <TabsContent value="content" className="mt-4">
            <ContentManager calculations={calculations} isLoading={isLoading} onRefresh={() => setRefreshKey(k => k + 1)}/>
          </TabsContent>
           <TabsContent value="analytics" className="mt-4">
                <AnalyticsManager />
           </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
