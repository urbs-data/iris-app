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
  countryId: string;
  countryLabel: string;
  siteId: string;
  siteLabel: string;
  clerkOrgId: string;
}

// Definición única de proyectos - países y sitios se generan automáticamente
export const PROJECTS: Project[] = [
  {
    id: 'proyecto-1',
    label: 'Proyecto 1',
    countryId: 'argentina',
    countryLabel: 'Argentina',
    siteId: 'berazategui',
    siteLabel: 'Berazategui',
    clerkOrgId: 'org_37zbB0nabOiSlx3ahAaNAbFrpUZ'
  },
  {
    id: 'proyecto-2',
    label: 'Proyecto 2',
    countryId: 'EEUU',
    countryLabel: 'EEUU',
    siteId: 'berazategui',
    siteLabel: 'Berazategui',
    clerkOrgId: 'org_38RVApbyfuKPvX0tEdfN2EATyr5'
  },
  {
    id: 'proyecto-3',
    label: 'Proyecto 3',
    countryId: 'argentina',
    countryLabel: 'Argentina',
    siteId: 'berazategui',
    siteLabel: 'Berazategui',
    clerkOrgId: 'org_XXXXX3'
  }
];

export const COUNTRIES: Country[] = Array.from(
  new Map(
    PROJECTS.map((project) => [project.countryId, project.countryLabel])
  ).entries()
).map(([id, label]) => ({ id, label }));

export const SITES: Site[] = Array.from(
  new Map(
    PROJECTS.map((project) => [
      `${project.countryId}-${project.siteId}`,
      {
        id: project.siteId,
        label: project.siteLabel,
        countryId: project.countryId
      }
    ])
  ).values()
);

export const YEARS = Array.from(
  { length: new Date().getFullYear() - 1995 },
  (_, i) => {
    const year = (new Date().getFullYear() - i).toString();
    return { value: year, label: year };
  }
);

// Document search file types
export const FILE_TYPES = [
  { value: 'excels', label: 'excels' },
  { value: 'documents', label: 'documents' },
  { value: 'others', label: 'others' }
] as const;

// Document classifications for search
export const CLASSIFICATIONS = [
  { value: 'Muestras', label: 'Muestras' },
  { value: 'Procesos de remediacion', label: 'Procesos de remediacion' },
  { value: 'Reportes de monitoreo', label: 'Reportes de monitoreo' },
  { value: 'Memorandum tecnicos', label: 'Memorandum tecnicos' },
  { value: 'Reportes tecnicos', label: 'Reportes tecnicos' },
  { value: 'Reportes a las autoridades', label: 'Reportes a las autoridades' },
  { value: 'Estudios complementarios', label: 'Estudios complementarios' },
  { value: 'Estudios hidrogeologicos', label: 'Estudios hidrogeologicos' },
  { value: 'Informes de avance', label: 'Informes de avance' },
  { value: 'Pozos', label: 'Pozos' },
  { value: 'Sustancias', label: 'Sustancias' },
  { value: 'Otros', label: 'Otros' }
] as const;

// Subclassifications mapped by classification
export const SUBCLASSIFICATIONS_MAP: Record<
  string,
  { value: string; label: string }[]
> = {
  Muestras: [
    { value: 'Cadenas de custodia', label: 'Cadenas de custodia' },
    { value: 'Muestras de suelo', label: 'Muestras de suelo' },
    { value: 'Muestras de agua', label: 'Muestras de agua' },
    { value: 'CoC de agua', label: 'CoC de agua' },
    { value: 'CoC de suelo', label: 'CoC de suelo' }
  ],
  'Procesos de remediacion': [
    { value: 'Reportes diarios', label: 'Reportes diarios' },
    { value: 'Inyección', label: 'Inyección' },
    { value: 'Otros', label: 'Otros' }
  ],
  'Reportes de monitoreo': [{ value: 'Otros', label: 'Otros' }],
  'Memorandum tecnicos': [{ value: 'Otros', label: 'Otros' }],
  'Reportes tecnicos': [{ value: 'Otros', label: 'Otros' }],
  'Reportes a las autoridades': [{ value: 'Otros', label: 'Otros' }],
  'Estudios complementarios': [{ value: 'Otros', label: 'Otros' }],
  'Estudios hidrogeologicos': [{ value: 'Otros', label: 'Otros' }],
  'Informes de avance': [{ value: 'Otros', label: 'Otros' }],
  Pozos: [{ value: 'Otros', label: 'Otros' }],
  Sustancias: [{ value: 'Otros', label: 'Otros' }],
  Otros: [{ value: 'Otros', label: 'Otros' }]
};
