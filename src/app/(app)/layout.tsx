
"use client";
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';
import { LayoutGrid, CalendarDays, LogOut, Leaf, UserCircle, Shield, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isAdmin, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace('/login');
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex items-center space-x-2">
          <Leaf className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xl text-primary">Loading Green Guardian...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    // This case should ideally be handled by the redirect, but as a fallback:
    return null; 
  }
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <Leaf className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-semibold text-primary group-data-[collapsible=icon]:hidden">Green Guardian</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/dashboard" legacyBehavior passHref>
                <SidebarMenuButton tooltip="Dashboard">
                  <LayoutGrid />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/schedule-generator" legacyBehavior passHref>
                <SidebarMenuButton tooltip="Schedule Generator">
                  <CalendarDays />
                  <span>Schedule Generator</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            {/* Add more menu items here if needed */}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 mt-auto">
           <div className="flex items-center gap-2 p-2 rounded-md bg-sidebar-accent group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-9 w-9">
              <AvatarImage src={undefined} alt={currentUser.displayName || currentUser.email || 'User'} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(currentUser.displayName || currentUser.email)}
              </AvatarFallback>
            </Avatar>
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-medium text-sidebar-accent-foreground">{currentUser.displayName || currentUser.email}</p>
              <p className="text-xs text-sidebar-accent-foreground/80 flex items-center">
                {isAdmin ? <Shield className="h-3 w-3 mr-1" /> : <UserCircle className="h-3 w-3 mr-1" />}
                {isAdmin ? 'Admin' : 'User'}
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={logout} className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 hover:bg-destructive/20">
            <LogOut className="h-5 w-5 group-data-[collapsible=icon]:mr-0 mr-2" />
            <span className="group-data-[collapsible=icon]:hidden">Logout</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-6 backdrop-blur-sm md:justify-end">
           <div className="md:hidden">
            <SidebarTrigger />
          </div>
          <div className="flex items-center gap-2">
            {/* Could add a theme toggle or other header items here */}
             <Button variant="ghost" size="icon" onClick={() => alert("Settings clicked!")}>
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
