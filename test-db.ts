import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const payments = await prisma.payment.findMany()
  console.log("Payments:", payments.length)
  
  const renters = await prisma.renter.findMany()
  console.log("Renters:", renters.length)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
