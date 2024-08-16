import { fakerPT_BR as faker } from '@faker-js/faker'
import { PrismaClient, type User } from '@prisma/client'
import { hashSync } from 'bcrypt'
const prisma = new PrismaClient()
function generateUser() {
    return {
        email: faker.internet.email(),
        password: hashSync(faker.internet.password(), 10),
        username: faker.internet.userName(),
    } as User
}
async function seedUsers() {
    await prisma.user.deleteMany({})
    const users = Array.from({ length: 50 }, generateUser)
    let promises = [] as Promise<User>[]
    for (const user of users) {
        // await prisma.user.create({ data: user })
        promises.push(prisma.user.create({ data: user }))
    }
    const new_users = await Promise.all(promises)
    for (const user of new_users) {
        // console.log(user)
        for (let i = 0; i < 50; i++) {
            await prisma.packages_User.create({
                data: {
                    userId: user.id,
                    packageId: Math.floor(Math.random() * 7) + 1
                }
            })
        }
    }
    prisma.$disconnect()
    console.log("Users seeded")
}

seedUsers()