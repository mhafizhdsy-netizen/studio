
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
  Calculator,
  LayoutDashboard,
  LogOut,
  Users,
  Shield,
  User as UserIcon,
  MessageSquare,
  DollarSign,
  Palette,
} from 'lucide-react';
import Link from 'next/link';
import { useUser, useAuth } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { ThemeSettingsDialog } from './ThemeSettingsDialog';

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      user.getIdTokenResult().then((idTokenResult) => {
        setIsAdmin(!!idTokenResult.claims.isAdmin);
      });
    }
  }, [user]);

  const handleSignOut = async () => {
    if(auth) {
        await auth.signOut();
    }
    router.push('/');
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Calculator className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold font-headline">GenHPP</span>
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
          {isAdmin && (
             <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/admin'}
                >
                  <Link href="/admin">
                    <Shield />
                    Admin
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start h-auto px-2 py-1.5">
                    <div className="flex items-center gap-3 w-full">
                        <Avatar>
                            <AvatarImage src={user?.photoURL ?? undefined} />
                            <AvatarFallback className='bg-primary text-primary-foreground font-bold'>
                                {getInitials(user?.displayName || user?.email)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col overflow-hidden text-left">
                            <p className="font-semibold truncate">{user?.displayName}</p>
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
                <DropdownMenuItem onClick={() => setIsThemeDialogOpen(true)}>
                    <Palette className="mr-2 h-4 w-4" />
                    <span>Pengaturan Tema</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Keluar</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </SidebarFooter>
      <ThemeSettingsDialog isOpen={isThemeDialogOpen} onOpenChange={setIsThemeDialogOpen} />
    </>
  );
}
