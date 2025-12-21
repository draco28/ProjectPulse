'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function toggleAgentStatus(agentId: number, currentStatus: boolean) {
  try {
    // Toggle the agent's active status
    const updatedAgent = await prisma.agentPersona.update({
      where: { id: agentId },
      data: { isActive: !currentStatus },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    // Revalidate the agents page to reflect the change
    revalidatePath('/agents');

    return {
      success: true,
      agent: updatedAgent,
    };
  } catch (error) {
    console.error('Failed to toggle agent status:', error);
    return {
      success: false,
      error: 'Failed to update agent status',
    };
  }
}

export async function createAgent(data: {
  name: string;
  description: string;
  expertise: string[];
  personality?: string;
}) {
  try {
    // Generate base slug from name: "Code Reviewer" → "code-reviewer"
    const baseSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    // Handle slug collisions by appending -2, -3, etc.
    let slug = baseSlug;
    let attempts = 0;
    const maxAttempts = 10;

    // TODO: Get projectId from auth/session when available
    const projectId = 1; // Default project for MVP

    while (attempts < maxAttempts) {
      // Check if slug already exists (now scoped to project)
      const existing = await prisma.agentPersona.findUnique({
        where: {
          projectId_slug: {
            projectId: projectId,
            slug: slug,
          },
        },
        select: { id: true },
      });

      if (!existing) {
        // Slug is available, break out of loop
        break;
      }

      // Slug is taken, try next suffix
      attempts++;
      slug = `${baseSlug}-${attempts + 1}`;
    }

    if (attempts >= maxAttempts) {
      return {
        success: false,
        error: 'Unable to generate unique slug. Please try a different name.',
      };
    }

    const agent = await prisma.agentPersona.create({
      data: {
        projectId: projectId, // Sprint 8.5 Phase 3: Agents are project-scoped
        name: data.name,
        slug: slug,
        description: data.description,
        systemPrompt: `You are ${data.name}. ${data.description}`, // Default system prompt
        expertise: data.expertise,
        personality: data.personality,
        skills: [], // Empty by default, can be configured later
        tools: [], // Empty by default, can be configured later
        rules: [], // Empty by default, can be configured later
        isActive: false, // New agents start inactive
      },
    });

    revalidatePath('/agents');

    return {
      success: true,
      agent,
    };
  } catch (error) {
    console.error('Failed to create agent:', error);
    return {
      success: false,
      error: 'Failed to create agent',
    };
  }
}

export async function deleteAgent(agentId: number) {
  try {
    await prisma.agentPersona.delete({
      where: { id: agentId },
    });

    revalidatePath('/agents');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Failed to delete agent:', error);
    return {
      success: false,
      error: 'Failed to delete agent',
    };
  }
}
