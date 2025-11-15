
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/supabase/auth-provider';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Inbox as InboxIcon, ServerCrash, CheckCheck, Mail, Circle, MoreHorizontal, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

const fetchNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export default function InboxPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);

  const { data: notifications, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => fetchNotifications(user!.id),
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ isRead: true })
        .eq('id', notificationId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications', user?.id] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
        const unreadIds = notifications?.filter(n => !n.isRead).map(n => n.id) || [];
        if (unreadIds.length === 0) return;
        const { error } = await supabase
            .from('notifications')
            .update({ isRead: true })
            .in('id', unreadIds);
        if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications', user?.id] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);
        if (error) throw new Error(error.message);
    },
    onSuccess: () => {
        toast({ title: "Notifikasi dihapus." });
        queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['unreadNotifications', user?.id] });
    },
    onError: (error) => {
        toast({ title: "Gagal menghapus", description: error.message, variant: 'destructive' });
    }
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const openDeleteDialog = (notificationId: string) => {
    setSelectedNotificationId(notificationId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedNotificationId) {
      deleteNotificationMutation.mutate(selectedNotificationId);
    }
    setIsDeleteDialogOpen(false);
    setSelectedNotificationId(null);
  };

  return (
    <>
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
              <Mail className="h-6 w-6" />
              <h1 className="text-lg font-semibold md:text-2xl font-headline">
                  Inbox
              </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
          >
            {markAllAsReadMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCheck className="mr-2 h-4 w-4" />}
            Tandai semua telah dibaca
          </Button>
        </div>

        <Card className="border-dashed mt-6">
          <CardContent className="p-4 md:p-6">
            {isLoading && (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            )}
            {isError && (
              <div className="text-center py-10 text-destructive">
                  <ServerCrash className="mx-auto h-12 w-12 mb-4" />
                  <p className="font-semibold text-lg">Gagal Memuat Pesan</p>
                  <p>Terjadi kesalahan saat mengambil data dari server.</p>
              </div>
            )}
            {!isLoading && !isError && notifications?.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                  <InboxIcon className="mx-auto h-12 w-12 mb-4" />
                  <p className="font-semibold">Inbox kosong</p>
                  <p>Semua pesan dari admin akan muncul di sini.</p>
              </div>
            )}
            {!isLoading && !isError && notifications && notifications.length > 0 && (
              <Accordion type="single" collapsible className="w-full">
                  {notifications.map(notification => (
                      <AccordionItem key={notification.id} value={notification.id}>
                          <div className="flex items-center pr-4 rounded-lg hover:bg-muted/50 data-[state=open]:bg-muted/50">
                            <AccordionTrigger onClick={() => handleNotificationClick(notification)} className="hover:no-underline p-4 flex-1">
                                <div className="flex items-start gap-4 text-left w-full">
                                    {!notification.isRead && <Circle className="h-2 w-2 text-primary fill-primary mt-1.5 shrink-0" />}
                                    <div className={cn("flex-1", notification.isRead && "pl-4")}>
                                        <p className={cn("font-semibold", !notification.isRead && "text-primary")}>{notification.title}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: id })}
                                        </p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => openDeleteDialog(notification.id)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Hapus Notifikasi
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <AccordionContent className="p-4 text-muted-foreground whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
                              {notification.content}
                          </AccordionContent>
                      </AccordionItem>
                  ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </main>

    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Hapus Notifikasi Ini?</AlertDialogTitle>
            <AlertDialogDescription>
                Tindakan ini tidak dapat dibatalkan. Notifikasi akan dihapus secara permanen.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteNotificationMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleDeleteConfirm} 
                disabled={deleteNotificationMutation.isPending}
                className="bg-destructive hover:bg-destructive/90"
            >
                {deleteNotificationMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Ya, Hapus
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
