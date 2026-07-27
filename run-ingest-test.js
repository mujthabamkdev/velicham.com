const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  // Clear channel first to test fresh
  await prisma.channel.deleteMany({});
  
  // Now test by requiring compiled or running ts-node / import if needed, or simple node script
}
run();
