import { NavItem } from '@/types';

/**
 * Navigation configuration with RBAC support
 *
 * This configuration is used for both the sidebar navigation and Cmd+K bar.
 *
 * RBAC Access Control:
 * Each navigation item can have an `access` property that controls visibility
 * based on permissions, plans, features, roles, and organization context.
 *
 * Examples:
 *
 * 1. Require organization:
 *    access: { requireOrg: true }
 *
 * 2. Require specific permission:
 *    access: { requireOrg: true, permission: 'org:teams:manage' }
 *
 * 3. Require specific plan:
 *    access: { plan: 'pro' }
 *
 * 4. Require specific feature:
 *    access: { feature: 'premium_access' }
 *
 * 5. Require specific role:
 *    access: { role: 'admin' }
 *
 * 6. Multiple conditions (all must be true):
 *    access: { requireOrg: true, permission: 'org:teams:manage', plan: 'pro' }
 *
 * Note: The `visible` function is deprecated but still supported for backward compatibility.
 * Use the `access` property for new items.
 */
export const navItems: NavItem[] = [
  {
    title: 'dashboard-general',
    url: '/dashboard/general',
    icon: 'analyze',
    shortcut: ['g', 'd'],
    items: [],
    group: 'group.main'
  },
  {
    title: 'dashboard-substance',
    url: '/dashboard/substance',
    icon: 'analyze',
    shortcut: ['a', 'c'],
    items: [],
    group: 'group.main'
  },
  {
    title: 'search',
    url: '/dashboard/search',
    icon: 'dashboard',
    items: [],
    group: 'group.documents'
  },
  {
    title: 'explorer',
    url: '/dashboard/explorer',
    icon: 'explorer',
    shortcut: ['e', 'e'],
    items: [],
    group: 'group.documents'
  },
  {
    title: 'validation',
    url: '/dashboard/validate',
    icon: 'check',
    shortcut: ['v', 'v'],
    items: [],
    group: 'group.documents'
  },
  {
    title: 'reports',
    url: '/dashboard/reports',
    icon: 'post',
    items: [],
    group: 'group.documents'
  },
  {
    title: 'profile',
    url: '/dashboard/profile',
    icon: 'account',
    items: [],
    group: 'group.others'
  }
];
