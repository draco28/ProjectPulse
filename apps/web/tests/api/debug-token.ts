import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const TOKEN = '1bc5faadb0f4a9ab6ac31451c3ffb25a5a8e595041148094a6b67d4fafe2acea';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Testing token validation...');
    console.log('Token (first 20 chars):', TOKEN.substring(0, 20) + '...');

    // Get all tokens
    const tokens = await prisma.projectToken.findMany({
      where: { isRevoked: false },
      select: { id: true, name: true, projectId: true, tokenHash: true },
    });

    console.log('\nFound', tokens.length, 'active token(s):');

    for (const candidate of tokens) {
      console.log(`\nChecking token ID ${candidate.id} (${candidate.name}):`);
      console.log('  Hash (first 20 chars):', candidate.tokenHash.substring(0, 20) + '...');

      try {
        const match = await bcrypt.compare(TOKEN, candidate.tokenHash);
        console.log('  bcrypt.compare result:', match);
        if (match) {
          console.log('  ✅ TOKEN MATCHES!');
          return;
        }
      } catch (e) {
        console.log('  ❌ bcrypt error:', e);
      }
    }

    console.log('\n❌ No matching token found');
  } finally {
    await prisma.$disconnect();
  }
}

main();
