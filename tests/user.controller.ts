import { describe, expect, it } from "bun:test";

describe("User Controller Validation Rules", () => {
  it("should validate username constraints", () => {
    const isValidUsername = (u?: string) => {
      if (!u) return false;
      const trimmed = u.trim();
      return trimmed.length >= 3 && trimmed.length <= 30;
    };

    expect(isValidUsername("Ash")).toBe(true);
    expect(isValidUsername("RedKetchum_123")).toBe(true);
    expect(isValidUsername("a")).toBe(false);
    expect(isValidUsername("")).toBe(false);
    expect(isValidUsername(undefined)).toBe(false);
  });

  it("should validate avatar picture URL format", () => {
    const isValidPicture = (url?: string) => {
      if (!url) return false;
      const trimmed = url.trim();
      return (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("/")
      );
    };

    expect(isValidPicture("https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png")).toBe(true);
    expect(isValidPicture("/wallpaper.jpg")).toBe(true);
    expect(isValidPicture("javascript:alert(1)")).toBe(false);
    expect(isValidPicture("")).toBe(false);
  });
});
