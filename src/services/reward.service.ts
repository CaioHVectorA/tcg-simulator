import { prisma } from "../helpers/prisma.client";
import { DAILY_ROAD_REWARDS, LEVEL_MILESTONES } from "../lib/reward-config";
import { lockUsers } from "../lib/economy";
import { DomainError } from "../lib/domain-error";

export class RewardService {
  static async claimDaily(userId: number, legacy = false) {
    return prisma.$transaction(async (tx) => {
      await lockUsers(tx, [userId]);
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      const now = new Date();
      const elapsed = user.last_daily_bounty ? now.getTime() - user.last_daily_bounty.getTime() : 86_400_000;
      if (elapsed < 86_400_000) throw new DomainError("quests.dailyAlreadyClaimed", 409);
      const day = ((user.daily_bounty_level - 1) % 30) + 1;
      const reward = DAILY_ROAD_REWARDS[day - 1];
      const coins = legacy ? Math.min(500 * Math.floor(elapsed / 86_400_000), 20000 * (1 + Math.floor(user.daily_bounty_level / 10))) : reward.coins;
      let packageGranted = null;
      if (!legacy && reward.packName) {
        const pack = await tx.package.findFirst({ where: { name: { contains: reward.packName, mode: "insensitive" } }, orderBy: { id: "asc" } });
        if (!pack) throw new DomainError("packages.packageNotFound", 503);
        await tx.packages_User.create({ data: { userId, packageId: pack.id } });
        packageGranted = { id: pack.id, name: pack.name };
      }
      await tx.user.update({ where: { id: userId }, data: { last_daily_bounty: now, daily_bounty_level: { increment: 1 }, money: { increment: coins }, totalBudget: { increment: coins } } });
      return { claimedDay: day, reward: { ...reward, coins }, packageGranted };
    });
  }

  static async claimLevels(userId: number, targetLevel?: number) {
    return prisma.$transaction(async (tx) => {
      await lockUsers(tx, [userId]);
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      const xp = user.rarityPoints * 10 + Math.floor(user.totalBudget / 10);
      const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
      const claimed = await tx.userLevelReward.findMany({ where: { user_id: userId }, select: { level: true } });
      const existing = new Set(claimed.map((c) => c.level));
      const eligible = LEVEL_MILESTONES.filter((m) => m.level <= level && !existing.has(m.level) && (!targetLevel || m.level === targetLevel));
      if (!eligible.length) throw new DomainError("quests.noRewardsToClaim");
      const names = eligible.flatMap((m) => m.packName ? [m.packName] : []);
      const packs = names.length ? await tx.package.findMany({ where: { OR: [...new Set(names)].map((name) => ({ name: { contains: name, mode: "insensitive" as const } })) }, orderBy: { id: "asc" } }) : [];
      const grantedPacks = eligible.flatMap((m) => {
        if (!m.packName) return [];
        const pack = packs.find((p) => p.name.toLowerCase().includes(m.packName!.toLowerCase()));
        if (!pack) throw new DomainError("packages.packageNotFound", 503);
        return [pack];
      });
      await tx.userLevelReward.createMany({ data: eligible.map((m) => ({ user_id: userId, level: m.level })) });
      if (grantedPacks.length) await tx.packages_User.createMany({ data: grantedPacks.map((p) => ({ userId, packageId: p.id })) });
      const totalCoins = eligible.reduce((sum, m) => sum + m.coins, 0);
      await tx.user.update({ where: { id: userId }, data: { money: { increment: totalCoins }, totalBudget: { increment: totalCoins } } });
      return { claimedMilestones: eligible.map((m) => m.level), totalCoins, grantedPacks: grantedPacks.map((p) => p.name) };
    });
  }
}
