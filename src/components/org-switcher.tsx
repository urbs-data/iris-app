'use client';

import { useAuth, useOrganizationList } from '@clerk/nextjs';
import { GalleryVerticalEnd } from 'lucide-react';
import Image from 'next/image';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';

export function OrgSwitcher() {
  const { state } = useSidebar();
  const { isLoaded, userMemberships } = useOrganizationList({
    userMemberships: {
      infinite: true,
      keepPreviousData: false
    }
  });

  const { orgId } = useAuth();

  // Get the currently active organization
  const activeOrganization = userMemberships?.data?.find(
    (membership) => membership.organization.id === orgId
  )?.organization;

  // Show loading state
  if (!isLoaded) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg' disabled>
            <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg'>
              <GalleryVerticalEnd className='size-4' />
            </div>
            <div
              className={`grid flex-1 text-left text-sm leading-tight transition-all duration-200 ease-in-out ${
                state === 'collapsed'
                  ? 'invisible max-w-0 overflow-hidden opacity-0'
                  : 'visible max-w-full opacity-100'
              }`}
            >
              <span className='truncate font-medium'>Cargando...</span>
              <span className='text-muted-foreground truncate text-xs'>
                Proyecto
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // If no active organization, show placeholder
  if (!activeOrganization) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg' disabled>
            <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg'>
              <GalleryVerticalEnd className='size-4' />
            </div>
            <div
              className={`grid flex-1 text-left text-sm leading-tight transition-all duration-200 ease-in-out ${
                state === 'collapsed'
                  ? 'invisible max-w-0 overflow-hidden opacity-0'
                  : 'visible max-w-full opacity-100'
              }`}
            >
              <span className='truncate font-medium'>Sin proyecto</span>
              <span className='text-muted-foreground truncate text-xs'>
                Selecciona uno
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Get the user's role in the active organization
  const userRole = userMemberships?.data?.find(
    (m) => m.organization.id === activeOrganization.id
  )?.role;

  // Display active organization (no dropdown - user must sign out to change)
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size='lg' className='cursor-default'>
          <div className='text-sidebar-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg'>
            {activeOrganization.hasImage && activeOrganization.imageUrl ? (
              <Image
                src={activeOrganization.imageUrl}
                alt={activeOrganization.name}
                width={32}
                height={32}
                className='size-full object-cover'
              />
            ) : (
              <GalleryVerticalEnd className='size-4' />
            )}
          </div>
          <div
            className={`grid flex-1 text-left text-sm leading-tight transition-all duration-200 ease-in-out ${
              state === 'collapsed'
                ? 'invisible max-w-0 overflow-hidden opacity-0'
                : 'visible max-w-full opacity-100'
            }`}
          >
            <span className='truncate font-medium'>
              {activeOrganization.name}
            </span>
            <span className='text-muted-foreground truncate text-xs'>
              {userRole || 'Proyecto'}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
