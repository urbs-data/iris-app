import ProfileViewPage from '@/features/profile/components/profile-view-page';

import { titleMetadata } from '@/lib/page-metadata';
export const generateMetadata = titleMetadata('profile.title');

export default async function Page() {
  return <ProfileViewPage />;
}
