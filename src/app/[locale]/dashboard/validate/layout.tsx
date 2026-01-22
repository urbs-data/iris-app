import { ValidationProvider } from '@/features/documents/validation/context/validation-context';

export default async function ValidateLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <ValidationProvider>{children}</ValidationProvider>;
}
