import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

async function main() {
  const prisma = new PrismaClient();
  try {
    // Check for existing test token
    const existing = await prisma.projectToken.findFirst({
      where: {
        projectId: 1,
        name: 'Sprint12-Test-Token',
        isRevoked: false,
      },
    });

    if (existing) {
      console.log('Test token already exists (ID:', existing.id, ')');
      console.log('Creating a NEW token for testing...');
    }

    // Generate new token
    const token = randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);

    const record = await prisma.projectToken.create({
      data: {
        projectId: 1,
        name: `Sprint12-Test-${Date.now()}`,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 86400000), // 7 days
      },
    });

    console.log('\n=== TEST TOKEN CREATED ===');
    console.log('Token:', token);
    console.log('Token ID:', record.id);
    console.log('Project ID:', record.projectId);
    console.log('Expires:', record.expiresAt);
    console.log('\nUse this token for testing:');
    console.log(`curl -H "Authorization: Bearer ${token}" ...`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
