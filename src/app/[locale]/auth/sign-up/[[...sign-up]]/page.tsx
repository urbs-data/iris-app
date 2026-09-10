import SignUpViewPage from '@/features/auth/components/sign-up-view';

import { titleMetadata } from '@/lib/page-metadata';
export const generateMetadata = titleMetadata('auth.signUp.title');

export default function Page() {
  return <SignUpViewPage />;
}
