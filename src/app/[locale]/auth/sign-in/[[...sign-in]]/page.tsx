import SignInViewPage from '@/features/auth/components/sign-in-view';

import { titleMetadata } from '@/lib/page-metadata';
export const generateMetadata = titleMetadata('auth.signIn.title');

export default function Page() {
  return <SignInViewPage />;
}
