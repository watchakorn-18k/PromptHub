import type { VerticalNavItems } from '@layouts/types'

// Base navigation items for all authenticated users
export const baseNavItems: VerticalNavItems = [
  {
    heading: 'Main',
  },
  {
    title: 'Dashboard',
    to: { name: 'root' },
    icon: { icon: 'ri-home-line' },
  },
]

// Marketplace navigation items (shown for all users)
export const marketplaceNavItems: VerticalNavItems = [
  {
    heading: 'Marketplace',
  },
  {
    title: 'Browse Prompts',
    to: { name: 'prompts' },
    icon: { icon: 'ri-shopping-bag-line' },
  },
  {
    title: 'My Prompts',
    to: { name: 'prompts-mine' },
    icon: { icon: 'ri-pencil-ruler-2-line' },
  },
]

// Admin-only navigation items
export const adminNavItems: VerticalNavItems = [
  {
    heading: 'Admin',
  },
  {
    title: 'Users',
    to: { name: 'user-page' },
    icon: { icon: 'ri-user-3-line' },
  },
]

// All navigation items (filtered by role at the layout level)
export const allNavItems: VerticalNavItems = [
  ...baseNavItems,
  ...marketplaceNavItems,
  ...adminNavItems,
]

export default allNavItems
