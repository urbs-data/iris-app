'use server';

import { Project, PROJECTS } from '@/constants/data';
import { authActionClient } from '@/lib/actions/safe-action';
import { clerkClient } from '@clerk/nextjs/server';

export const getAvailableTenants = authActionClient
  .metadata({ actionName: 'getAvailableTenants' })
  .action(async ({ ctx }): Promise<Project[]> => {
    const userId = ctx.session.user.id;

    const client = await clerkClient();
    const { data: memberships } =
      await client.users.getOrganizationMembershipList({
        userId,
        limit: 100
      });

    const userOrgIds = new Set(
      memberships?.map((membership) => membership.organization.id) || []
    );

    const availableProjects = PROJECTS.filter((project) =>
      userOrgIds.has(project.clerkOrgId)
    );

    return availableProjects;
  });
