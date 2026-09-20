import { describe, expect, it } from "bun:test";
import { sucessResponse, errorResponse } from "../src/lib/mount-response";

describe("Quests Claim All Contract & Calculation Logic", () => {
  it("should correctly aggregate rewards across multiple completed quests", () => {
    const quests = [
      { id: 1, name: "Abrir 5 pacotes", completed: true, actualReward: 1200 },
      { id: 2, name: "Ter 20 cartas", completed: true, actualReward: 5000 },
      { id: 3, name: "Fazer 1 troca", completed: true, actualReward: 10000 },
      { id: 4, name: "Login diário", completed: false, actualReward: 500 },
    ];

    const eligibleQuests = quests.filter((q) => q.completed);
    const totalCoins = eligibleQuests.reduce((sum, q) => sum + q.actualReward, 0);
    const count = eligibleQuests.length;

    expect(totalCoins).toBe(16200);
    expect(count).toBe(3);

    const response = sucessResponse(
      { totalClaimed: totalCoins, count },
      `Você coletou ${totalCoins} moedas de ${count} missões!`
    );

    expect(response.ok).toBe(true);
    expect(response.data.totalClaimed).toBe(16200);
    expect(response.data.count).toBe(3);
    expect(response.toast).toContain("16200");
  });

  it("should return an error response when no quests are eligible for claim", () => {
    const quests = [
      { id: 1, completed: false, actualReward: 1000 },
      { id: 2, completed: false, actualReward: 2000 },
    ];

    const eligible = quests.filter((q) => q.completed);
    let response;
    if (eligible.length === 0) {
      response = errorResponse("Nenhuma recompensa pronta para ser coletada.");
    }

    expect(response?.ok).toBe(false);
    expect(response?.error).toBe("Nenhuma recompensa pronta para ser coletada.");
  });
});
