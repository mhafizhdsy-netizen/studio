
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
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  MoreHorizontal,
  Pin,
  PinOff,
  Trash2,
  AlertTriangle,
  Send,
  Construction,
  Rocket,
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { useQuery } from '@tanstack/react-query';

// Interfaces
interface UserProfile {
    id: string;
    email: string;
    user_metadata: {
        name: string;
        photoURL?: string;
        isAdmin?: boolean;
        isSuspended?: boolean;
    };
    createdAt: string;
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

interface Report {
    id: string;
    category: string;
    reason: string;
    status: 'pending' | 'resolved' | 'dismissed';
    createdAt: string;
    calculation: {
        id: string;
        productName: string;
    };
    reporter: {
        id: string;
        name: string;
    };
    reported: {
        id: string;
        name: string;
    };
}

interface SiteStatus {
    id: number;
    isMaintenanceMode: boolean;
    maintenanceTitle: string | null;
    maintenanceMessage: string | null;
    isUpdateMode: boolean;
    updateTitle: string | null;
    updateMessage: string | null;
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

function AdminStats({ users, calculations }: { users: UserProfile[] | null, calculations: PublicCalculation[] | null }) {
    
    const isLoading = !users || !calculations;
    
    const totalComments = useMemo(() => {
        if (!calculations) return 0;
        return calculations.reduce((sum, calc) => sum + (calc.commentCount || 0), 0);
    }, [calculations]);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
            title="Total Pengguna"
            value={isLoading ? '...' : (users?.length ?? 0).toString()}
            icon={Users}
        />
        <StatCard
            title="Perhitungan Publik"
            value={isLoading ? '...' : (calculations?.length ?? 0).toString()}
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

function UserManager({ users, isLoading, onRefresh }: { users: UserProfile[] | null, isLoading: boolean, onRefresh: () => void }) {
  const { toast } = useToast();
  const [action, setAction] = useState<'suspend' | 'ban' | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const handleToggleAdmin = async (user: UserProfile) => {
    const newIsAdmin = !user.user_metadata?.isAdmin;
    
    const { error } = await supabase.auth.admin.updateUserById(
        user.id,
        { user_metadata: { ...user.user_metadata, isAdmin: newIsAdmin } }
    );
    
     if (error) {
      toast({ title: 'Gagal', description: 'Gagal memperbarui status admin.', variant: 'destructive' });
    } else {
      toast({ title: 'Sukses!', description: `Status admin pengguna telah diperbarui.` });
      onRefresh();
    }
  };

  const handleToggleSuspend = async (user: UserProfile) => {
    const newIsSuspended = !user.user_metadata?.isSuspended;
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, isSuspended: newIsSuspended }
    });
    if (error) {
      toast({ title: 'Gagal', description: 'Gagal memperbarui status penangguhan.', variant: 'destructive' });
    } else {
      toast({ title: 'Sukses!', description: `Status penangguhan pengguna telah diperbarui.` });
      onRefresh();
    }
    closeDialog();
  };

  const handleBanUser = async (user: UserProfile) => {
    // This is a destructive action.
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      toast({ title: 'Gagal', description: 'Gagal memblokir pengguna secara permanen.', variant: 'destructive' });
    } else {
      toast({ title: 'Sukses!', description: `Pengguna telah diblokir permanen.` });
      onRefresh();
    }
    closeDialog();
  };

  const openDialog = (user: UserProfile, type: 'suspend' | 'ban') => {
    setSelectedUser(user);
    setAction(type);
  };
  
  const closeDialog = () => {
    setSelectedUser(null);
    setAction(null);
  }

  const dialogContent = useMemo(() => {
    if (!action || !selectedUser) return { title: '', description: '', onConfirm: () => {} };
    if (action === 'suspend') {
      const isSuspending = !selectedUser.user_metadata?.isSuspended;
      return {
        title: `${isSuspending ? 'Tangguhkan' : 'Aktifkan Kembali'} Pengguna Ini?`,
        description: `Akun ${selectedUser.user_metadata?.name} akan ${isSuspending ? 'dinonaktifkan sementara' : 'diaktifkan kembali'}.`,
        onConfirm: () => handleToggleSuspend(selectedUser),
      }
    }
    return {
      title: 'Blokir Permanen Pengguna Ini?',
      description: `Tindakan ini tidak dapat diurungkan. Akun ${selectedUser.user_metadata?.name} dan datanya akan dihapus.`,
      onConfirm: () => handleBanUser(selectedUser),
    }
  }, [action, selectedUser]);


  return (
    <>
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id} className={user.user_metadata?.isSuspended ? 'bg-destructive/10' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.photoURL} />
                        <AvatarFallback>
                          {getInitials(user.user_metadata?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.user_metadata?.name || 'No Name'}</span>
                        {user.user_metadata?.isAdmin && <Badge variant="accent"><Shield className="h-3 w-3 mr-1" />Admin</Badge>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                   <TableCell>
                    {user.user_metadata?.isSuspended ? (
                      <Badge variant="destructive">Ditangguhkan</Badge>
                    ) : (
                      <Badge variant="secondary">Aktif</Badge>
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
                          {user.user_metadata?.isAdmin
                            ? 'Hapus Status Admin'
                            : 'Jadikan Admin'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem
                          onClick={() => openDialog(user, 'suspend')}
                        >
                          <ShieldAlert className="mr-2 h-4 w-4" />
                          {user.user_metadata?.isSuspended
                            ? 'Aktifkan Kembali'
                            : 'Tangguhkan Akun'}
                        </DropdownMenuItem>
                         <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => openDialog(user, 'ban')}
                          >
                          <ShieldX className="mr-2 h-4 w-4" />
                          Blokir Permanen
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
    <AlertDialog open={!!action} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogContent.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={dialogContent.onConfirm} className={action === 'ban' ? "bg-destructive hover:bg-destructive/90" : ""}>
                Ya, Lanjutkan
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

function ContentManager({ calculations, isLoading, onRefresh }: { calculations: PublicCalculation[] | null, isLoading: boolean, onRefresh: () => void }) {
  const { toast } = useToast();

  const handleToggleFeature = async (
    calcId: string,
    isFeatured?: boolean
  ) => {
    const { error } = await supabase
      .from('calculations')
      .update({ isFeatured: !isFeatured })
      .eq('id', calcId);
    
    if (error) {
      toast({
        title: 'Gagal',
        description: 'Gagal memperbarui status pilihan.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sukses!',
        description: `Status pilihan telah diperbarui.`,
      });
      onRefresh();
    }
  };

  const handleDeleteCalculation = async (calcId: string) => {
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
                            onClick={() => handleDeleteCalculation(calc.id)}
                            className="text-destructive focus:text-destructive"
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

function ReportsManager({ onRefresh }: { onRefresh: () => void }) {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isReplying, setIsReplying] = useState(false);
    const [replyingReport, setReplyingReport] = useState<Report | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const { toast } = useToast();

    const fetchReports = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('reports')
            .select(`
                id, category, reason, status, createdAt,
                calculation:calculations (id, productName),
                reporter:users!reports_reporterUserId_fkey (id, name),
                reported:users!reports_reportedUserId_fkey (id, name)
            `)
            .order('createdAt', { ascending: false });

        if (error) {
            console.error("Error fetching reports", error);
            toast({ title: 'Gagal memuat laporan', variant: 'destructive' });
        } else {
            setReports(data as any);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchReports();
    }, [onRefresh]);

    const updateReportStatus = async (reportId: string, status: 'resolved' | 'dismissed') => {
        const { error } = await supabase
            .from('reports')
            .update({ status })
            .eq('id', reportId);
        
        if (error) {
            toast({ title: 'Gagal memperbarui status', variant: 'destructive' });
        } else {
            toast({ title: 'Status laporan diperbarui' });
            fetchReports();
        }
    };
    
    const handleSendReply = async () => {
        if (!replyingReport || !replyContent) return;
        setIsReplying(true);
        
        const { error } = await supabase.from('notifications').insert({
            userId: replyingReport.reporter.id,
            type: 'report_reply',
            title: `Balasan untuk Laporan Anda: "${replyingReport.calculation.productName}"`,
            content: replyContent,
            referenceId: replyingReport.id,
        });

        if (error) {
            toast({ title: 'Gagal mengirim balasan', variant: 'destructive' });
        } else {
            toast({ title: 'Balasan berhasil dikirim.' });
            await updateReportStatus(replyingReport.id, 'resolved');
            setReplyingReport(null);
            setReplyContent('');
        }
        setIsReplying(false);
    }

    const getStatusBadge = (status: Report['status']) => {
        switch (status) {
            case 'pending': return <Badge variant="secondary">Menunggu</Badge>;
            case 'resolved': return <Badge variant="default">Selesai</Badge>;
            case 'dismissed': return <Badge variant="outline">Ditolak</Badge>;
        }
    }

    return (
      <>
        <Card>
            <CardHeader>
                <CardTitle>Laporan Konten</CardTitle>
                <CardDescription>Tinjau dan kelola laporan konten dari pengguna.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produk Dilaporkan</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Alasan</TableHead>
                                <TableHead>Pelapor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.map(report => (
                                <TableRow key={report.id}>
                                    <TableCell>
                                        <div className="font-medium">{report.calculation?.productName || 'Konten Dihapus'}</div>
                                        <div className="text-xs text-muted-foreground">oleh {report.reported?.name || 'Pengguna Dihapus'}</div>
                                    </TableCell>
                                    <TableCell><Badge variant="destructive">{report.category}</Badge></TableCell>
                                    <TableCell className="max-w-xs truncate">{report.reason}</TableCell>
                                    <TableCell>{report.reporter?.name || 'Pengguna Dihapus'}</TableCell>
                                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => setReplyingReport(report)} disabled={report.status !== 'pending'}>
                                                    <Send className="mr-2 h-4 w-4" /> Balas & Selesaikan
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateReportStatus(report.id, 'dismissed')} disabled={report.status !== 'pending'}>
                                                    <ShieldX className="mr-2 h-4 w-4" /> Tolak Laporan
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
        <Dialog open={!!replyingReport} onOpenChange={(open) => !open && setReplyingReport(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Balas Laporan</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                        <Label>Pesan untuk {replyingReport?.reporter.name}</Label>
                        <Textarea 
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Contoh: Terima kasih atas laporan Anda. Konten telah kami tinjau dan hapus."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setReplyingReport(null)}>Batal</Button>
                    <Button onClick={handleSendReply} disabled={isReplying}>
                        {isReplying && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Kirim Balasan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}

function SiteStatusManager() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const { data: status, isLoading: isStatusLoading, refetch } = useQuery<SiteStatus>({
        queryKey: ['siteStatus'],
        queryFn: async () => {
            const { data, error } = await supabase.from('site_status').select('*').eq('id', 1).single();
            if (error) throw error;
            return data;
        }
    });

    const [maintenance, setMaintenance] = useState({ title: '', message: '' });
    const [update, setUpdate] = useState({ title: '', message: '' });
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [broadcast, setBroadcast] = useState({ title: '', message: '' });

    useEffect(() => {
        if (status) {
            setMaintenance({ title: status.maintenanceTitle || '', message: status.maintenanceMessage || '' });
            setUpdate({ title: status.updateTitle || '', message: status.updateMessage || '' });
            setIsMaintenanceMode(status.isMaintenanceMode);
            setIsUpdateMode(status.isUpdateMode);
        }
    }, [status]);
    
    const handleSaveStatus = async () => {
        setIsLoading(true);
        const { error } = await supabase.from('site_status').update({
            isMaintenanceMode,
            maintenanceTitle: maintenance.title,
            maintenanceMessage: maintenance.message,
            isUpdateMode,
            updateTitle: update.title,
            updateMessage: update.message,
            updatedAt: new Date().toISOString()
        }).eq('id', 1);

        if (error) {
            toast({ title: 'Gagal menyimpan status', variant: 'destructive' });
        } else {
            toast({ title: 'Status situs berhasil diperbarui' });
            refetch();
        }
        setIsLoading(false);
    };

    const handleSendBroadcast = async () => {
        if (!broadcast.title || !broadcast.message) {
            toast({ title: 'Judul dan pesan siaran tidak boleh kosong', variant: 'destructive' });
            return;
        }
        setIsLoading(true);
        const { data: users, error: usersError } = await supabase.from('users').select('id');
        
        if (usersError || !users) {
            toast({ title: 'Gagal mengambil data pengguna', variant: 'destructive' });
            setIsLoading(false);
            return;
        }

        const notifications = users.map(user => ({
            userId: user.id,
            type: 'general' as const,
            title: broadcast.title,
            content: broadcast.message,
        }));

        if (notifications.length > 0) {
            const { error } = await supabase.from('notifications').insert(notifications);
            if (error) {
                toast({ title: 'Gagal mengirim siaran', description: error.message, variant: 'destructive' });
            } else {
                toast({ title: 'Pesan siaran berhasil dikirim ke semua pengguna' });
                setBroadcast({ title: '', message: '' });
            }
        } else {
            toast({ title: 'Tidak ada pengguna untuk dikirimi pesan.'});
        }
        
        setIsLoading(false);
    };

    if (isStatusLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="grid lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'><Construction/>Mode Perbaikan</CardTitle>
                    <CardDescription>Alihkan semua pengguna ke halaman perbaikan jika diaktifkan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Switch id="maintenance-mode" checked={isMaintenanceMode} onCheckedChange={setIsMaintenanceMode} />
                        <Label htmlFor="maintenance-mode">Aktifkan Mode Perbaikan</Label>
                    </div>
                     <Input value={maintenance.title} onChange={e => setMaintenance(p => ({ ...p, title: e.target.value }))} placeholder="Judul Halaman Perbaikan"/>
                     <Textarea value={maintenance.message} onChange={e => setMaintenance(p => ({ ...p, message: e.target.value }))} placeholder="Pesan yang akan ditampilkan..."/>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'><Rocket/>Mode Pembaruan</CardTitle>
                    <CardDescription>Alihkan semua pengguna ke halaman pengumuman pembaruan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Switch id="update-mode" checked={isUpdateMode} onCheckedChange={setIsUpdateMode} />
                        <Label htmlFor="update-mode">Aktifkan Mode Pembaruan</Label>
                    </div>
                     <Input value={update.title} onChange={e => setUpdate(p => ({ ...p, title: e.target.value }))} placeholder="Judul Halaman Pembaruan"/>
                     <Textarea value={update.message} onChange={e => setUpdate(p => ({ ...p, message: e.target.value }))} placeholder="Jelaskan fitur baru atau pembaruan..."/>
                </CardContent>
            </Card>
             <div className="lg:col-span-2">
                <Button onClick={handleSaveStatus} className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Simpan Status Situs
                </Button>
            </div>
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Kirim Siaran ke Semua Pengguna</CardTitle>
                    <CardDescription>Kirim pesan yang akan muncul di Inbox semua pengguna.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Input value={broadcast.title} onChange={e => setBroadcast(p => ({ ...p, title: e.target.value }))} placeholder="Judul Pesan Siaran"/>
                     <Textarea value={broadcast.message} onChange={e => setBroadcast(p => ({ ...p, message: e.target.value }))} placeholder="Isi pesan siaran..."/>
                     <Button onClick={handleSendBroadcast} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Kirim Siaran
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

export function AdminDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [users, setUsers] = useState<UserProfile[] | null>(null);
  const [calculations, setCalculations] = useState<PublicCalculation[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
        setIsLoading(true);
        const [usersRes, calcsRes] = await Promise.all([
            supabase.from('users').select('*'),
            supabase.from('public_calculations').select('*').order('createdAt', { ascending: false })
        ]);
        
        if (usersRes.data) setUsers(usersRes.data as any);
        if (calcsRes.data) setCalculations(calcsRes.data as any);
        
        setIsLoading(false);
    }
    fetchAllData();
  }, [refreshKey]);

  const handleRefresh = () => setRefreshKey(k => k + 1);

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
        <Tabs defaultValue="analytics">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analytics">Analitik</TabsTrigger>
            <TabsTrigger value="users">Pengguna</TabsTrigger>
            <TabsTrigger value="content">Konten</TabsTrigger>
            <TabsTrigger value="reports">Laporan</TabsTrigger>
            <TabsTrigger value="site">Status Situs</TabsTrigger>
          </TabsList>
          <TabsContent value="analytics" className="mt-4">
            <AdminStats users={users} calculations={calculations} />
          </TabsContent>
          <TabsContent value="users" className="mt-4">
            <UserManager users={users} isLoading={isLoading} onRefresh={handleRefresh} />
          </TabsContent>
          <TabsContent value="content" className="mt-4">
            <ContentManager calculations={calculations} isLoading={isLoading} onRefresh={handleRefresh}/>
          </TabsContent>
           <TabsContent value="reports" className="mt-4">
            <ReportsManager onRefresh={handleRefresh} />
          </TabsContent>
          <TabsContent value="site" className="mt-4">
            <SiteStatusManager />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
