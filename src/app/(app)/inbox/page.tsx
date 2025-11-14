
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/supabase/auth-provider';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Inbox as InboxIcon, ServerCrash, CheckCheck, Mail, Circle } from 'lucide-react';
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

  const { data: notifications, isLoading, isError } = useQuery({
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
    },
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Mail className="h-6 w-6" />
            <h1 className="text-lg font-semibold md:text-2xl font-headline">
                Kotak Masuk
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

      <Card className="border-dashed">
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
                <p className="font-semibold">Kotak masuk kosong</p>
                <p>Semua pesan dari admin akan muncul di sini.</p>
            </div>
          )}
          {!isLoading && !isError && notifications && notifications.length > 0 && (
             <Accordion type="single" collapsible className="w-full">
                {notifications.map(notification => (
                    <AccordionItem key={notification.id} value={notification.id}>
                        <AccordionTrigger onClick={() => handleNotificationClick(notification)} className={cn("hover:no-underline p-4 rounded-lg", !notification.isRead && "bg-primary/5")}>
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
                        <AccordionContent className="p-4 text-muted-foreground whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
                            {notification.content}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

    