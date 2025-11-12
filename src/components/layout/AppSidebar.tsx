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
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from '@/lib/firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';

export function AppSidebar() {
  const pathname = usePathname();
  const { user, userProfile } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getInitials = (name: string | undefined) => {
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
         <div className="flex items-center gap-3">
            <Avatar>
                <AvatarImage src={user?.photoURL ?? undefined} />
                <AvatarFallback className='bg-primary text-primary-foreground font-bold'>
                    {getInitials(userProfile?.name || user?.displayName || user?.email || undefined)}
                </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
                <p className="font-semibold truncate">{userProfile?.name || user?.displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
         </div>
         <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            <span>Keluar</span>
         </Button>
      </SidebarFooter>
    </>
  );
}
