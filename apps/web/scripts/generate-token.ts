
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const projectId = 3;
  const tokenName = 'MCP-Test-Token';
  
  // Generate opaque token
  const token = 'mcp_' + crypto.randomBytes(32).toString('hex');
  const tokenHash = await bcrypt.hash(token, 10);
  
  // Upsert ProjectToken
  await prisma.projectToken.upsert({
    where: {
      projectId_name: {
        projectId,
        name: tokenName
      }
    },
    update: {
      tokenHash,
      isRevoked: false
    },
    create: {
      projectId,
      name: tokenName,
      tokenHash
    }
  });
  
  console.log('\n==========================================');
  console.log('✅ Token Generated Successfully');
  console.log(`Project ID: ${projectId}`);
  console.log(`Token Name: ${tokenName}`);
  console.log(`Token: ${token}`);
  console.log('==========================================\n');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
