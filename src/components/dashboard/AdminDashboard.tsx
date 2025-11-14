
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser } from '@/firebase';
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

// Interfaces
interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  createdAt: string;
  isSuspended?: boolean;
  isAdmin?: boolean;
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
      if (!supabase) return;
      setUsersLoading(true);
      const { data, error } = await supabase.from('users').select('*');
      if (data) setUsers(data);
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

  useEffect(() => {
    const fetchUsers = async () => {
      if (!supabase) return;
      setIsLoading(true);
      const { data, error } = await supabase.from('users').select('*').order('createdAt', { ascending: false });
      if (data) setUsers(data);
      if(error) console.error("Error fetching users:", error);
      setIsLoading(false);
    }
    fetchUsers();
  }, []);

  const handleToggleSuspend = async (uid: string, isSuspended?: boolean) => {
    if (!supabase) return;
    const { error } = await supabase.from('users').update({ isSuspended: !isSuspended }).eq('id', uid);
    if (error) {
      toast({ title: 'Gagal', description: 'Gagal memperbarui status pengguna.', variant: 'destructive' });
    } else {
      toast({ title: 'Sukses!', description: `Status pengguna telah diperbarui.` });
      setUsers(users.map(u => u.id === uid ? { ...u, isSuspended: !isSuspended } : u));
    }
  };

  const handleToggleAdmin = async (uid: string, isAdmin?: boolean) => {
    if (!supabase) return;
    const { error } = await supabase.from('users').update({ isAdmin: !isAdmin }).eq('id', uid);
     if (error) {
      toast({ title: 'Gagal', description: 'Gagal memperbarui status admin.', variant: 'destructive' });
    } else {
      toast({ title: 'Sukses!', description: `Status admin pengguna telah diperbarui.` });
      setUsers(users.map(u => u.id === uid ? { ...u, isAdmin: !isAdmin } : u));
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!supabase) return;
    
    // This is a simplified deletion. In a real-world scenario,
    // you would use a Firebase Function to delete the user from Auth
    // and all their associated data (calculations, expenses, etc.).
    const { error } = await supabase.from('users').delete().eq('id', uid);

    if (error) {
        toast({ title: "Gagal Menghapus", description: "Gagal menghapus pengguna dari database.", variant: "destructive"});
    } else {
        toast({
            title: 'Pengguna Dihapus',
            description: 'Dokumen pengguna di Supabase telah dihapus. Hapus pengguna dari Firebase Authentication secara manual.',
            duration: 5000,
        });
        setUsers(users.filter(u => u.id !== uid));
    }
  };

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
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.name}</span>
                        {user.isAdmin && <Badge variant="accent"><Shield className="h-3 w-3 mr-1" />Admin</Badge>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.createdAt
                      ? format(new Date(user.createdAt), 'd MMM yyyy')
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
                            handleToggleAdmin(user.id, user.isAdmin)
                          }
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          {user.isAdmin
                            ? 'Hapus Status Admin'
                            : 'Jadikan Admin'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
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

function ContentManager({ calculations, isLoading, onRefresh }: { calculations: PublicCalculation[] | null, isLoading: boolean, onRefresh: () => void }) {
  const { toast } = useToast();

  const handleToggleFeature = async (
    calcId: string,
    isFeatured?: boolean
  ) => {
    if (!supabase) return;
    const { error } = await supabase.from('public_calculations').update({ isFeatured: !isFeatured }).eq('id', calcId);
    
    if (error) {
        toast({ title: 'Gagal', description: 'Gagal memperbarui status pilihan.', variant: 'destructive'});
    } else {
        toast({ title: 'Sukses!', description: `Perhitungan telah diperbarui.`});
        onRefresh(); 
    }
  };

  const handleDeleteCalculation = async (calcId: string, userId: string) => {
    if (!supabase) return;
    
    try {
      // Non-blocking deletions
      await supabase.from('public_calculations').delete().eq('id', calcId);
      await supabase.from('calculations').delete().eq('id', calcId);

      toast({
        title: "Dihapus",
        description: "Perhitungan telah dihapus dari publik dan data pengguna.",
      });
      onRefresh();

    } catch (e) {
      console.error(e);
      toast({
        title: "Gagal",
        description: "Gagal menghapus perhitungan.",
        variant: "destructive",
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
    const [isLoading, setIsLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0); 

    const [calculationsWithComments, setCalculationsWithComments] = useState<PublicCalculation[] | null>(null);
    const [users, setUsers] = useState<UserProfile[] | null>(null);

    const [analytics, setAnalytics] = useState({
        newUsers7Days: 0,
        newUsers30Days: 0,
        mostActiveUsers: [] as { name: string; id: string; count: number; photoURL: string; }[],
        mostCommentedCalcs: [] as { name: string; id: string; count: number; }[],
    });

    useEffect(() => {
        if (!supabase) return;

        const fetchAnalytics = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch users
                const { data: usersData, error: usersError } = await supabase.from('users').select('*').order('createdAt', { ascending: false });
                if (usersError) throw usersError;
                setUsers(usersData);
                
                // 2. Fetch public calculations
                const { data: publicCalcsData, error: publicCalcsError } = await supabase.from('public_calculations').select('*').order('createdAt', { ascending: false });
                if (publicCalcsError) throw publicCalcsError;

                // 3. Fetch comment counts for each calculation
                const calcsWithCommentCounts = await Promise.all(
                    (publicCalcsData || []).map(async (calc) => {
                        const { count, error } = await supabase.from('comments').select('id', { count: 'exact' }).eq('calculationId', calc.id);
                        if (error) {
                            console.error(`Could not fetch comments for ${calc.id}`, error);
                            return { ...calc, commentCount: 0 };
                        }
                        return { ...calc, commentCount: count ?? 0 };
                    })
                );
                setCalculationsWithComments(calcsWithCommentCounts);

                // 4. Calculate New Users
                const now = new Date();
                const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

                const newUsers7Days = (usersData || []).filter(u => new Date(u.createdAt) > sevenDaysAgo).length;
                const newUsers30Days = (usersData || []).filter(u => new Date(u.createdAt) > thirtyDaysAgo).length;

                // 5. Calculate Most Active Users
                const userCalcCounts = (publicCalcsData || []).reduce((acc, calc) => {
                    acc[calc.userId] = (acc[calc.userId] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);
                
                const userMap = new Map((usersData || []).map(u => [u.id, {name: u.name, photoURL: u.photoURL || ''}]));
                
                const mostActiveUsers = Object.entries(userCalcCounts)
                    .map(([userId, count]) => ({
                        id: userId,
                        name: userMap.get(userId)?.name || 'Pengguna Dihapus',
                        photoURL: userMap.get(userId)?.photoURL || '',
                        count: count
                    }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);

                // 6. Calculate Most Commented Calcs
                const mostCommentedCalcs = calcsWithCommentCounts
                    .filter(c => (c.commentCount ?? 0) > 0)
                    .sort((a, b) => (b.commentCount ?? 0) - (a.commentCount ?? 0))
                    .slice(0, 5)
                    .map(c => ({ id: c.id, name: c.productName, count: c.commentCount ?? 0 }));
                
                setAnalytics({ newUsers7Days, newUsers30Days, mostActiveUsers, mostCommentedCalcs });

            } catch (error) {
                console.error("Failed to fetch analytics data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();

    }, [refreshKey]);

    return (
      <div className="space-y-6">
        <AdminStats calculationsWithComments={calculationsWithComments} />
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
            <ContentManager calculations={calculationsWithComments} isLoading={isLoading} onRefresh={() => setRefreshKey(k => k + 1)}/>
          </TabsContent>
           <TabsContent value="analytics" className="mt-4">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><TrendingUp className="text-primary"/> Pertumbuhan Pengguna</CardTitle>
                        </CardHeader>
                        <CardContent className="grid sm:grid-cols-2 gap-4">
                            <StatCard title="Pengguna Baru (7 Hari)" value={isLoading ? '...' : analytics.newUsers7Days.toString()} icon={Users} />
                            <StatCard title="Pengguna Baru (30 Hari)" value={isLoading ? '...' : analytics.newUsers30Days.toString()} icon={Users} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BarChart className="text-primary"/> Analitik Engagement</CardTitle>
                        </CardHeader>
                        <CardContent className="grid lg:grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-semibold mb-2">Pengguna Paling Aktif</h3>
                                <p className="text-sm text-muted-foreground mb-4">Berdasarkan jumlah perhitungan yang dibagikan ke publik.</p>
                                {isLoading ? <Loader2 className="animate-spin" /> : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Pengguna</TableHead>
                                                <TableHead className="text-right">Kontribusi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {analytics.mostActiveUsers.map(user => (
                                                <TableRow key={user.id}>
                                                    <TableCell className="flex items-center gap-2">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={user.photoURL} />
                                                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                                        </Avatar>
                                                        {user.name}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">{user.count}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Post Paling Banyak Dikomentari</h3>
                                <p className="text-sm text-muted-foreground mb-4">Perhitungan publik dengan diskusi terbanyak.</p>
                                {isLoading ? <Loader2 className="animate-spin" /> : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nama Produk</TableHead>
                                                <TableHead className="text-right">Total Komentar</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {analytics.mostCommentedCalcs.map(calc => (
                                                <TableRow key={calc.id}>
                                                    <TableCell>{calc.name}</TableCell>
                                                    <TableCell className="text-right font-bold">{calc.count}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
           </TabsContent>
        </Tabs>
      </div>
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
        <AnalyticsManager />
      </CardContent>
    </Card>
  );
}
