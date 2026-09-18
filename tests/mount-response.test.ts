import { describe, expect, it } from "bun:test";
import { sucessResponse, errorResponse } from "../src/lib/mount-response";

describe("Mount Response API Contract", () => {
  it("should create a formatted success response with data", () => {
    const payload = { userId: "user-123", coins: 500 };
    const response = sucessResponse(payload);

    expect(response.ok).toBe(true);
    expect(response.data).toEqual(payload);
    expect(response.error).toBeNull();
    expect(response.toast).toBeNull();
  });

  it("should create a success response with a custom toast message", () => {
    const payload = [{ id: 1, name: "Pikachu" }];
    const response = sucessResponse(payload, "Pacote aberto com sucesso!");

    expect(response.ok).toBe(true);
    expect(response.data).toEqual(payload);
    expect(response.toast).toBe("Pacote aberto com sucesso!");
    expect(response.error).toBeNull();
  });

  it("should create a formatted error response with error and toast", () => {
    const response = errorResponse("USER_NOT_FOUND", "Usuário não encontrado");

    expect(response.ok).toBe(false);
    expect(response.data).toBeNull();
    expect(response.error).toBe("USER_NOT_FOUND");
    expect(response.toast).toBe("Usuário não encontrado");
  });

  it("should handle error response with null toast when omitted", () => {
    const response = errorResponse("INTERNAL_SERVER_ERROR");

    expect(response.ok).toBe(false);
    expect(response.data).toBeNull();
    expect(response.error).toBe("INTERNAL_SERVER_ERROR");
    expect(response.toast).toBeNull();
  });
});
