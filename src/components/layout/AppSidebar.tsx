
"use client";

import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  LogOut,
  Users,
  User as UserIcon,
  MessageSquare,
  DollarSign,
  ClipboardList,
  BarChart2,
  Megaphone,
  Calculator,
  Bot,
  Landmark,
  Wand2,
  Shield,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/supabase/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Logo } from '../ui/logo';
import { Badge } from '../ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';


const AdminBadge = () => (
    <Badge variant="accent" className="text-xs px-1.5 py-0.5 ml-2">
        <Shield className="h-3 w-3 mr-1"/>Admin
    </Badge>
)

export function AppSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('users')
            .select('isAdmin')
            .eq('id', user.id)
            .single();
        setIsAdmin(data?.isAdmin || false);
    };
    checkAdmin();
  }, [user]);

  const { data: unreadCount } = useQuery({
    queryKey: ['unreadNotifications', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('userId', user!.id)
        .eq('isRead', false);
      if (error) return 0;
      return count;
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every 60 seconds
  });


  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name) return '??';
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
        return nameParts[0][0] + nameParts[nameParts.length - 1][0];
    }
    return name.substring(0, 2).toUpperCase();
  };

  const displayName = user?.user_metadata?.name || user?.email;
  const photoURL = user?.user_metadata?.photoURL;
  
  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo />
            <span className="text-xl font-bold font-headline">HitunginAja</span>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/dashboard'}
            >
              <Link href="/dashboard">
                <LayoutDashboard />
                Dashboard
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/inbox')}
            >
              <Link href="/inbox" className='relative'>
                <Mail />
                Kotak Masuk
                {unreadCount && unreadCount > 0 && (
                   <span className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {unreadCount}
                   </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/ai-consultant')}
            >
              <Link href="/ai-consultant">
                <Bot />
                Konsultan AI
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarSeparator className="my-1"/>
           <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/calculator')}
            >
              <Link href="/calculator">
                <Calculator />
                Kalkulator HPP
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/ideal-price-calculator')}
            >
              <Link href="/ideal-price-calculator">
                <DollarSign />
                Harga Jual Ideal
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/profit-simulator')}
            >
              <Link href="/profit-simulator">
                <Wand2 />
                Simulator Keuntungan
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/ads-calculator')}
            >
              <Link href="/ads-calculator">
                <Megaphone />
                Analisis Iklan
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/loan-calculator')}
            >
              <Link href="/loan-calculator">
                <Landmark />
                Kalkulator Pinjaman
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarSeparator className="my-1"/>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/expenses')}
            >
              <Link href="/expenses">
                <ClipboardList />
                Catatan Pengeluaran
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/reports')}
            >
              <Link href="/reports">
                <BarChart2 />
                Laporan Keuntungan
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarSeparator className="my-1"/>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/messages')}
            >
              <Link href="/messages">
                <MessageSquare />
                Chat Anonim
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/community'}
            >
              <Link href="/community">
                <Users />
                Komunitas
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start h-auto px-2 py-1.5">
                    <div className="flex items-center gap-3 w-full">
                        <Avatar>
                            <AvatarImage src={photoURL} />
                            <AvatarFallback className='bg-primary text-primary-foreground font-bold'>
                                {getInitials(displayName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate flex items-center">
                                <span className="truncate">{displayName}</span>
                                {isAdmin && <AdminBadge/>}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[var(--sidebar-width)] mb-2 ml-2" side="top" align="start">
                <DropdownMenuItem asChild>
                    <Link href="/profile">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Edit Profil</span>
                    </Link>
                </DropdownMenuItem>
                 {isAdmin && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                             <Link href="/admin">
                                <Shield className="mr-2 h-4 w-4" />
                                <span>Panel Admin</span>
                            </Link>
                        </DropdownMenuItem>
                    </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Keluar</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </SidebarFooter>
    </>
  );
}

    