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
    console.time('seed')
    console.log('Seeding users and other models, this can take five minutes or more...')
    
    // ITERATIONS control:
    const USERS = 100
    const CARDS_PER_USER = 240
    const TRADES_PER_USER = 50
    const PACKAGES_PER_USER = 10
    const FRIENDS_PER_USER = 10
    // CLEAN DATABASE
    await prisma.user.deleteMany({})
    await prisma.packages_User.deleteMany({})
    await prisma.friend_User.deleteMany({})
    await prisma.cards_user.deleteMany({})
    await prisma.trade_Card.deleteMany({})
    await prisma.trade.deleteMany({})
    // 







    const users = Array.from({ length: USERS }, generateUser)
    let promises = [] as Promise<User>[]
    for (const user of users) {
        // await prisma.user.create({ data: user })
        promises.push(prisma.user.create({ data: user }))
    }
    const new_users = await Promise.all(promises)
    for (const user of new_users) {
        // console.log(user)
        for (let i = 0; i < PACKAGES_PER_USER; i++) {
            const _user = await prisma.packages_User.create({
                data: {
                    userId: user.id,
                    packageId: Math.floor(Math.random() * 7) + 1
                }
            })
        }
    }
    console.log('Users seeded!')
    const prisma_users = await prisma.user.findMany()
    // make an algorithm to make friends between existent users
    for (const user of prisma_users) {
        for (let i = 0; i < FRIENDS_PER_USER; i++) {
            const friend = prisma_users[Math.floor(Math.random() * prisma_users.length)]
            if (friend.id !== user.id) {
                const _friend = await prisma.friend_User.create({
                    data: {
                        user_id: user.id,
                        friend_id: friend.id,
                        accepted: Math.random() > 0.5
                    }
                })
            }
        }
    }
    console.log('Friends seeded!')
    // give cards to users
    const card_count = await prisma.card.count()
    for (const user of prisma_users) {
        for (let i = 0; i < CARDS_PER_USER; i++) {
            const card = await prisma.cards_user.create({
                data: {
                    userId: user.id,
                    cardId: Math.floor(Math.random() * card_count) + 1
                }
            })
        }
    }
    console.log('Cards given to users!')
    // make an algorith to make trades between existent users
    for (const user of prisma_users) {
        for (let i = 0; i < TRADES_PER_USER; i++) {
            console.log('Trade iteration', i)
            const _user = prisma_users[Math.floor(Math.random() * prisma_users.length)]
            const _trade = await prisma.trade.create({})
            const user_cards = await prisma.cards_user.findMany({ take: 12, where: { userId: user.id } })
            await prisma.trade_Card.createMany({
                data: user_cards.map(card => ({
                    card_id: card.cardId,
                    is_sender: false,
                    trade_id: _trade.id
                }))
            })
            if (_user.id !== user.id) {
                const _user_cards = await prisma.cards_user.findMany({ take: 12, where: { userId: _user.id } })
                await prisma.trade_Card.createMany({
                    data: _user_cards.map(card => ({
                        card_id: card.cardId,
                        is_sender: true,
                        trade_id: _trade.id
                    }))
                })
            }
        }
    }
    prisma.$disconnect()
    console.timeEnd('seed')
    console.log('Users, packages, trades and friendships seeded!')
}

seedUsers()