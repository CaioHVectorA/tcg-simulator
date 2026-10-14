import type { Prisma } from "@prisma/client";
export const privateUserSelect = {
  id: true, username: true, email: true, picture: true, money: true,
  createdAt: true, updatedAt: true, last_daily_bounty: true, last_entry: true,
  isGuest: true, authProvider: true, daily_bounty_level: true,
  rarityPoints: true, totalBudget: true, online: true, last_online: true,
} satisfies Prisma.UserSelect;
export const publicUserSelect = {
  id: true, username: true, picture: true, online: true, last_online: true,
} satisfies Prisma.UserSelect;
