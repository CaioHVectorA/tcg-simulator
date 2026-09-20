import { describe, it, expect } from "bun:test";

describe("Trade Duration & Publication Fee Formula", () => {
  const calculateTradeFee = (durationDays: number) => {
    const d = Math.max(1, Math.min(30, Number(durationDays ?? 3)));
    return d * 2000;
  };

  it("should calculate correct publication fees of 2k per day", () => {
    // 1 dia: 2.000 moedas
    expect(calculateTradeFee(1)).toBe(2000);

    // 2 dias: 4.000 moedas
    expect(calculateTradeFee(2)).toBe(4000);

    // 3 dias: 6.000 moedas
    expect(calculateTradeFee(3)).toBe(6000);

    // 5 dias: 10.000 moedas
    expect(calculateTradeFee(5)).toBe(10000);

    // 7 dias: 14.000 moedas
    expect(calculateTradeFee(7)).toBe(14000);

    // 14 dias: 28.000 moedas
    expect(calculateTradeFee(14)).toBe(28000);
  });

  it("should enforce duration bounds between 1 and 30 days", () => {
    expect(calculateTradeFee(0)).toBe(calculateTradeFee(1));
    expect(calculateTradeFee(-5)).toBe(calculateTradeFee(1));
    expect(calculateTradeFee(50)).toBe(calculateTradeFee(30));
  });

  it("should calculate total required money including sendMoney", () => {
    const d = 3;
    const fee = calculateTradeFee(d);
    const sendMoney = 250;
    const totalRequired = fee + sendMoney;
    expect(totalRequired).toBe(6250);

    const userMoneyInsufficient = 5000;
    expect(userMoneyInsufficient < totalRequired).toBe(true);

    const userMoneySufficient = 7000;
    expect(userMoneySufficient >= totalRequired).toBe(true);
  });
});
