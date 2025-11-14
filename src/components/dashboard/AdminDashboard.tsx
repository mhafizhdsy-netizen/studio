
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase, FirestorePermissionError, errorEmitter } from '@/firebase';
import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  query,
  getDocs,
  Timestamp,
  orderBy,
  limit,
  where,
  getDoc,
} from 'firebase/firestore';
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
  Edit,
  MoreHorizontal,
  TrendingUp,
  BarChart,
  Calculator,
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
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format } from 'date-fns';
import Link from 'next/link';

// Interfaces
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
  userId: string;
  commentCount?: number;
}

interface Calculation {
    id: string;
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
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  
  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
  
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
  const firestore = useFirestore();
  const { toast } = useToast();
  const usersQuery = useMemoFirebase(
    () =>
      firestore ? query(collection(firestore, 'users'), orderBy('createdAt', 'desc')) : null,
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

function ContentManager({ calculations, isLoading }: { calculations: PublicCalculation[] | null, isLoading: boolean }) {
  const firestore = useFirestore();
  const { toast } = useToast();

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
                           <DropdownMenuItem asChild>
                                <Link href={`/calculator/${calc.id}`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                           </DropdownMenuItem>
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

function AnalyticsManager() {
    const firestore = useFirestore();
    const [isLoading, setIsLoading] = useState(true);
    const [calculationsWithComments, setCalculationsWithComments] = useState<PublicCalculation[] | null>(null);

    const [analytics, setAnalytics] = useState({
        newUsers7Days: 0,
        newUsers30Days: 0,
        mostActiveUsers: [] as { name: string; id: string; count: number; photoURL: string; }[],
        mostCommentedCalcs: [] as { name: string; id: string; count: number; }[],
    });

    const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

    const publicCalcsQuery = useMemoFirebase(
      () => (firestore ? query(collection(firestore, 'public_calculations'), orderBy('createdAt', 'desc')) : null),
      [firestore]
    );
    const { data: publicCalcs, isLoading: publicCalcsLoading } = useCollection<PublicCalculation>(publicCalcsQuery);

    useEffect(() => {
        if (usersLoading || publicCalcsLoading) {
            setIsLoading(true);
            return;
        }
        if (!users || !publicCalcs || !firestore) {
            setIsLoading(false);
            return;
        }

        const fetchAnalytics = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch all comment counts
                const calcsWithCommentCounts = await Promise.all(
                    publicCalcs.map(async (calc) => {
                        const commentsRef = collection(firestore, 'public_calculations', calc.id, 'comments');
                        try {
                             const commentsSnapshot = await getDocs(query(commentsRef, limit(1))); // Optimized
                             // This is a bit of a hack. We can't get count() efficiently on the client.
                             // Instead, we just check if it's > 0. A full count would require a cloud function.
                             // For a more accurate but slower count:
                             const fullSnapshot = await getDocs(commentsRef);
                             return {
                                 ...calc,
                                 commentCount: fullSnapshot.size,
                             };
                        } catch (error) {
                             console.error(`Could not fetch comments for ${calc.id}`, error);
                             return { ...calc, commentCount: 0 }; // Default to 0 on error
                        }
                    })
                );
                setCalculationsWithComments(calcsWithCommentCounts);

                // 2. Calculate New Users
                const now = new Date();
                const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

                const newUsers7Days = users.filter(u => u.createdAt?.toDate() > sevenDaysAgo).length;
                const newUsers30Days = users.filter(u => u.createdAt?.toDate() > thirtyDaysAgo).length;

                // 3. Calculate Most Active Users (based on public calculation count)
                const userCalcCounts = publicCalcs.reduce((acc, calc) => {
                  acc[calc.userId] = (acc[calc.userId] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);
                
                const userMap = new Map(users.map(u => [u.id, {name: u.name, photoURL: u.photoURL || ''}]));
                
                const mostActiveUsers = Object.entries(userCalcCounts)
                    .map(([userId, count]) => ({
                        id: userId,
                        name: userMap.get(userId)?.name || 'Pengguna Dihapus',
                        photoURL: userMap.get(userId)?.photoURL || '',
                        count: count
                    }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);

                // 4. Calculate Most Commented Calcs (using the data from step 1)
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

    }, [firestore, publicCalcs, users, usersLoading, publicCalcsLoading]);

    const finalLoading = isLoading || usersLoading || publicCalcsLoading;

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
            <ContentManager calculations={calculationsWithComments} isLoading={finalLoading}/>
          </TabsContent>
           <TabsContent value="analytics" className="mt-4">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><TrendingUp className="text-primary"/> Pertumbuhan Pengguna</CardTitle>
                        </CardHeader>
                        <CardContent className="grid sm:grid-cols-2 gap-4">
                            <StatCard title="Pengguna Baru (7 Hari)" value={finalLoading ? '...' : analytics.newUsers7Days.toString()} icon={Users} />
                            <StatCard title="Pengguna Baru (30 Hari)" value={finalLoading ? '...' : analytics.newUsers30Days.toString()} icon={Users} />
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
                                {finalLoading ? <Loader2 className="animate-spin" /> : (
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
                                {finalLoading ? <Loader2 className="animate-spin" /> : (
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
