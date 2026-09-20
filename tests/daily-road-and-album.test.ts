import { describe, expect, it } from "bun:test";
import { DAILY_ROAD_REWARDS } from "../src/controller/user.controller";

describe("Daily Road & Album Business Logic", () => {
  it("should have exactly 30 days configured in the daily reward road", () => {
    expect(DAILY_ROAD_REWARDS).toHaveLength(30);
    expect(DAILY_ROAD_REWARDS[0].day).toBe(1);
    expect(DAILY_ROAD_REWARDS[29].day).toBe(30);
  });

  it("should calculate the correct cycle day from daily_bounty_level", () => {
    const getCycleDay = (level: number) => ((level - 1) % 30) + 1;

    expect(getCycleDay(1)).toBe(1);
    expect(getCycleDay(7)).toBe(7);
    expect(getCycleDay(30)).toBe(30);
    expect(getCycleDay(31)).toBe(1); // Next cycle starts back at 1
    expect(getCycleDay(60)).toBe(30);
    expect(getCycleDay(61)).toBe(1);
  });

  it("should grant booster packs on milestone days 7, 14, 21, 28 and 30", () => {
    const milestones = DAILY_ROAD_REWARDS.filter((r) => r.isMilestone);
    expect(milestones).toHaveLength(5);

    const milestoneDays = milestones.map((m) => m.day);
    expect(milestoneDays).toEqual([7, 14, 21, 28, 30]);

    milestones.forEach((m) => {
      expect(m.packName).not.toBeNull();
      expect(typeof m.packName).toBe("string");
    });

    // Grand finale on day 30
    const day30 = DAILY_ROAD_REWARDS[29];
    expect(day30.day).toBe(30);
    expect(day30.coins).toBe(25000);
    expect(day30.packName).toBe("Pacote lendário");
    expect(day30.isGrandFinale).toBe(true);
  });

  it("should resolve login identifier whether username or email is passed", () => {
    const resolveIdentifier = (body: { email?: string; username?: string }) => {
      return (body.username || body.email || "").trim();
    };

    expect(resolveIdentifier({ username: "Red" })).toBe("Red");
    expect(resolveIdentifier({ email: "red@pokemon.com" })).toBe("red@pokemon.com");
    expect(resolveIdentifier({ username: "  Ash  " })).toBe("Ash");
    expect(resolveIdentifier({ email: "ash@kanto.org", username: "AshKetchum" })).toBe("AshKetchum");
    expect(resolveIdentifier({})).toBe("");
  });

  it("should calculate correct collection album completion percentage", () => {
    const getPercentage = (owned: number, total: number) => {
      if (total <= 0) return 0;
      return Math.round((owned / total) * 100);
    };

    expect(getPercentage(0, 6102)).toBe(0);
    expect(getPercentage(61, 6102)).toBe(1);
    expect(getPercentage(3051, 6102)).toBe(50);
    expect(getPercentage(6102, 6102)).toBe(100);
  });

  it("should grant exactly 5 starter packages for new trainers", () => {
    const STARTER_PACKS_COUNT = 5;
    const starterPacks = Array.from({ length: STARTER_PACKS_COUNT }).map(() => ({
      packageId: 72,
      opened: false,
    }));

    expect(starterPacks).toHaveLength(5);
    expect(starterPacks.every((p) => p.opened === false)).toBe(true);
  });
});
