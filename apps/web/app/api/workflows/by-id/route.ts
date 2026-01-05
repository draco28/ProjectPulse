import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const workflowId = parseInt(params.id, 10);

    if (isNaN(workflowId)) {
      return NextResponse.json({ error: 'Invalid workflow ID' }, { status: 400 });
    }

    const workflow = await prisma.workflowTemplate.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json(workflow);
  } catch (error) {
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching workflow');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
