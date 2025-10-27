'use server';

import { prisma } from '@/lib/db';
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
    const agent = await prisma.agentPersona.create({
      data: {
        name: data.name,
        description: data.description,
        expertise: data.expertise,
        personality: data.personality,
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
