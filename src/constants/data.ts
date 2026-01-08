export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export const recentSalesData: SaleUser[] = [
  {
    id: 1,
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: '+$1,999.00',
    image: 'https://api.slingacademy.com/public/sample-users/1.png',
    initials: 'OM'
  },
  {
    id: 2,
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/2.png',
    initials: 'JL'
  },
  {
    id: 3,
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: '+$299.00',
    image: 'https://api.slingacademy.com/public/sample-users/3.png',
    initials: 'IN'
  },
  {
    id: 4,
    name: 'William Kim',
    email: 'will@email.com',
    amount: '+$99.00',
    image: 'https://api.slingacademy.com/public/sample-users/4.png',
    initials: 'WK'
  },
  {
    id: 5,
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/5.png',
    initials: 'SD'
  }
];

export const CATEGORIES = [
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Furniture', label: 'Furniture' },
  { value: 'Clothing', label: 'Clothing' },
  { value: 'Toys', label: 'Toys' },
  { value: 'Groceries', label: 'Groceries' },
  { value: 'Books', label: 'Books' },
  { value: 'Jewelry', label: 'Jewelry' },
  { value: 'Beauty Products', label: 'Beauty Products' }
];

// Tenant selection data
export interface Country {
  id: string;
  label: string;
}

export interface Site {
  id: string;
  label: string;
  countryId: string;
}

export interface Project {
  id: string;
  label: string;
  siteId: string;
  clerkOrgId: string;
}

export const COUNTRIES: Country[] = [{ id: 'argentina', label: 'Argentina' }];

export const SITES: Site[] = [
  { id: 'berazategui', label: 'Berazategui', countryId: 'argentina' }
];

export const PROJECTS: Project[] = [
  {
    id: 'proyecto-1',
    label: 'Proyecto 1',
    siteId: 'berazategui',
    clerkOrgId: 'org_37zbB0nabOiSlx3ahAaNAbFrpUZ'
  },
  {
    id: 'proyecto-2',
    label: 'Proyecto 2',
    siteId: 'berazategui',
    clerkOrgId: 'org_XXXXX2'
  },
  {
    id: 'proyecto-3',
    label: 'Proyecto 3',
    siteId: 'berazategui',
    clerkOrgId: 'org_XXXXX3'
  }
];
