import { describe, expect, it } from "bun:test";
import { DEPLOYED_API_URL, resolveApiEndpoint } from "../apps/www/src/lib/api-endpoint";
describe("Published frontend API endpoint", () => {
  it("never sends public users to a local development server", () => {
    for (const value of [undefined,"","http://localhost:8080","https://localhost:8080","https://127.0.0.1:8089","https://[::1]:8080","not a URL"]) expect(resolveApiEndpoint(value,true)).toBe(DEPLOYED_API_URL);
  });
  it("never uses the website itself as the backend", () => {
    for (const website of ["https://tcg-alpha.vercel.app", "https://tcg-caiohvectoras-projects.vercel.app", "https://tcgsim.com"]) expect(resolveApiEndpoint(website,true)).toBe(DEPLOYED_API_URL);
  });
  it("keeps explicit HTTPS deployment overrides and normalizes trailing slashes", () => {
    expect(resolveApiEndpoint(" https://api.example.com/ ",true)).toBe("https://api.example.com");
    expect(resolveApiEndpoint(DEPLOYED_API_URL,true)).toBe(DEPLOYED_API_URL);
  });
  it("keeps development and isolated test servers local", () => {
    expect(resolveApiEndpoint(undefined,false)).toBe("http://localhost:8080");
    expect(resolveApiEndpoint("http://127.0.0.1:8089",false)).toBe("http://127.0.0.1:8089");
  });
  it("does not use insecure or credential-bearing configuration", () => {
    expect(resolveApiEndpoint("http://api.example.com",true)).toBe(DEPLOYED_API_URL);
    expect(resolveApiEndpoint("https://user:password@api.example.com",true)).toBe(DEPLOYED_API_URL);
  });
});
