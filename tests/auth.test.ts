import { describe, expect, it } from "bun:test";
import bcrypt from "bcrypt";

describe("Guest & Auth Business Logic", () => {
  it("should generate valid unique guest email format", () => {
    const randomSuffix = Math.floor(Math.random() * 900000 + 100000);
    const guestEmail = `guest_${randomSuffix}@guest.poketcg`;

    expect(guestEmail).toMatch(/^guest_\d{6}@guest\.poketcg$/);
    expect(guestEmail.endsWith("@guest.poketcg")).toBe(true);
  });

  it("should validate guest nickname requirements", () => {
    const validateNickname = (nick: string) => {
      const trimmed = nick.trim();
      return trimmed.length >= 3 && trimmed.length <= 25;
    };

    expect(validateNickname("Ash")).toBe(true);
    expect(validateNickname("RedKetchum")).toBe(true);
    expect(validateNickname("  Gary  ")).toBe(true);
    expect(validateNickname("Ab")).toBe(false); // too short
    expect(validateNickname("   ")).toBe(false); // empty
    expect(validateNickname("A".repeat(30))).toBe(false); // too long
  });

  it("should hash and verify passwords correctly using bcrypt", async () => {
    const rawPassword = "P@ssword123!";
    const saltRounds = 10;
    const hash = await bcrypt.hash(rawPassword, saltRounds);

    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith("$2")).toBe(true);

    const match = await bcrypt.compare(rawPassword, hash);
    expect(match).toBe(true);

    const wrongMatch = await bcrypt.compare("WrongPassword", hash);
    expect(wrongMatch).toBe(false);
  });

  it("should validate email format during account upgrade", () => {
    const isValidEmail = (email: string) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    expect(isValidEmail("trainer@pokemon.com")).toBe(true);
    expect(isValidEmail("ash.ketchum@pallettown.org")).toBe(true);
    expect(isValidEmail("invalid-email")).toBe(false);
    expect(isValidEmail("@no-user.com")).toBe(false);
    expect(isValidEmail("no-domain@")).toBe(false);
  });
});
