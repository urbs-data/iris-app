import { auth, currentUser } from '@clerk/nextjs/server';
import { cache } from 'react';
import { redirect } from 'next/navigation';

const getClerkAuth = cache(async function () {
  const authResult = await auth();
  const user = await currentUser();

  if (!authResult.userId || !user) {
    redirect('/auth/sign-in');
  }

  return {
    userId: authResult.userId,
    user: {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      username: user.username,
      publicMetadata: user.publicMetadata,
      privateMetadata: user.privateMetadata
    }
  };
});

const getClerkOrganization = cache(async function () {
  const authResult = await auth();
  if (!authResult.orgId || !authResult.orgSlug) {
    redirect('/dashboard/general');
  }

  return {
    id: authResult.orgId,
    slug: authResult.orgSlug,
    role: authResult.orgRole,
    permissions: authResult.orgPermissions
  };
});

export async function getAuthContext() {
  const authData = await getClerkAuth();

  return {
    session: {
      user: authData.user
    }
  };
}

export async function getAuthOrganizationContext() {
  const authData = await getClerkAuth();
  let organization: {
    id: string;
    slug: string;
    role: string | undefined;
    permissions: string[] | undefined;
  };

  if (process.env.NODE_ENV === 'development') {
    organization = {
      id: 'org_38folzUP9dtd6eiF3KSDq7t2Reo',
      slug: 'iris-app',
      role: 'admin',
      permissions: ['read', 'write']
    };
  } else {
    organization = await getClerkOrganization();
  }

  return {
    session: {
      user: authData.user
    },
    organization
  };
}
