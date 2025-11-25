import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  try {
    const email = 'aammojahid@gmail.com'
    const password = '11223344'
    const hashedPassword = await bcrypt.hash(password, 10)

    const admin = await prisma.admin.upsert({
      where: { email },
      update: { password: hashedPassword },
      create: {
        email,
        password: hashedPassword,
        firstName: 'Mojahid',
        lastName: 'Admin',
      },
    })

    console.log({ admin })
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
  
  await prisma.$disconnect()
}

main()
