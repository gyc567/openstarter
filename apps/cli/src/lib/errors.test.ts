import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  ApiError,
  AuthError,
  ConfigError,
  NetworkError,
  handleError,
} from "./errors";

describe("error identities", () => {
  it("AuthError carries name and is instanceof Error/AuthError", () => {
    const e = new AuthError("not logged in");
    expect(e.name).toBe("AuthError");
    expect(e).toBeInstanceOf(AuthError);
    expect(e).toBeInstanceOf(Error);
  });

  it("NetworkError carries name and is instanceof Error/NetworkError", () => {
    const e = new NetworkError("connection refused");
    expect(e.name).toBe("NetworkError");
    expect(e).toBeInstanceOf(NetworkError);
  });

  it("ConfigError carries name and is instanceof Error/ConfigError", () => {
    const e = new ConfigError("bad url");
    expect(e.name).toBe("ConfigError");
    expect(e).toBeInstanceOf(ConfigError);
  });

  it("ApiError carries name and statusCode and is instanceof Error/ApiError", () => {
    const e = new ApiError("bad request", 422);
    expect(e.name).toBe("ApiError");
    expect(e.statusCode).toBe(422);
    expect(e).toBeInstanceOf(ApiError);
  });

  it("ApiError statusCode is optional", () => {
    const e = new ApiError("oops");
    expect(e.statusCode).toBeUndefined();
  });
});

describe("handleError exit-code mapping", () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(((code?: number) => {
        throw new Error(`EXIT_${code ?? "null"}`);
      }) as never);
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("AuthError -> exit 2 with auth hint", () => {
    expect(() => handleError(new AuthError("expired"), false)).toThrow("EXIT_2");
    expect(errSpy.mock.calls.flat().join("\n")).toContain("认证错误");
    expect(errSpy.mock.calls.flat().join("\n")).toContain("expired");
    expect(errSpy.mock.calls.flat().join("\n")).toContain("openstarter login");
  });

  it("NetworkError -> exit 3 with network hint", () => {
    expect(() => handleError(new NetworkError("timeout"), false)).toThrow("EXIT_3");
    expect(errSpy.mock.calls.flat().join("\n")).toContain("网络错误");
  });

  it("ConfigError -> exit 4", () => {
    expect(() => handleError(new ConfigError("bad url"), false)).toThrow("EXIT_4");
    expect(errSpy.mock.calls.flat().join("\n")).toContain("配置错误");
  });

  it("generic Error -> exit 1 without stack by default", () => {
    expect(() => handleError(new Error("generic"), false)).toThrow("EXIT_1");
    const all = errSpy.mock.calls.flat().join("\n");
    expect(all).toContain("generic");
    expect(all).not.toContain("at "); // no stack printed
  });

  it("generic Error with verbose=true prints stack", () => {
    const e = new Error("verbose me");
    expect(() => handleError(e, true)).toThrow("EXIT_1");
    const all = errSpy.mock.calls.flat().join("\n");
    expect(all).toContain("verbose me");
    // stack should appear in the printed output
    expect(all).toMatch(/Error: verbose me|\s+at\s+/);
  });
});