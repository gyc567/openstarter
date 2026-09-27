import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockConfig } = vi.hoisted(() => ({
  mockConfig: {
    getApiUrl: vi.fn(),
    getAccessToken: vi.fn(),
    isAuthenticated: vi.fn(),
    clearAuth: vi.fn(),
  },
}));

vi.mock("./config.js", () => ({
  config: mockConfig,
}));

import { ApiError, AuthError, NetworkError } from "./errors.js";
import {
  createApiClient,
  requireAuthOrThrow,
} from "./api-client.js";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const status = (init.status as number | undefined) ?? 200;
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...(init.headers as Record<string, string>) },
  });
}

describe("requireAuthOrThrow", () => {
  it("throws AuthError when not authenticated", () => {
    mockConfig.isAuthenticated.mockReturnValue(false);
    expect(() => requireAuthOrThrow()).toThrow(AuthError);
  });

  it("returns silently when authenticated", () => {
    mockConfig.isAuthenticated.mockReturnValue(true);
    expect(() => requireAuthOrThrow()).not.toThrow();
  });
});

describe("createApiClient", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig.getApiUrl.mockReturnValue("https://api.example.com");
    mockConfig.getAccessToken.mockReturnValue(undefined);
    mockConfig.isAuthenticated.mockReturnValue(false);
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("adds Authorization header when access token exists", async () => {
    mockConfig.getAccessToken.mockReturnValue("token-abc");
    fetchSpy.mockResolvedValue(jsonResponse({ code: 0, data: { ok: true } }));

    const client = createApiClient();
    await client.request("/me");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer token-abc");
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("does not add Authorization when no token", async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ code: 0, data: { ok: true } }));

    const client = createApiClient();
    await client.request("/public");

    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it("returns unwrapped data on 200 envelope code=0", async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse({ code: 0, message: "ok", data: { id: "x" } }),
    );

    const client = createApiClient();
    const data = await client.request<{ id: string }>("/things");
    expect(data).toEqual({ id: "x" });
  });

  it("returns non-envelope array as-is", async () => {
    fetchSpy.mockResolvedValue(jsonResponse([1, 2, 3]));
    const client = createApiClient();
    const data = await client.request<number[]>("/list");
    expect(data).toEqual([1, 2, 3]);
  });

  it("returns non-envelope object as-is", async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ a: 1, b: 2 }));
    const client = createApiClient();
    const data = await client.request<{ a: number; b: number }>("/raw");
    expect(data).toEqual({ a: 1, b: 2 });
  });

  it("throws ApiError on envelope code!=0 with message", async () => {
    fetchSpy.mockImplementation(() =>
      Promise.resolve(jsonResponse({ code: 1, message: "validation failed" })),
    );
    const client = createApiClient();
    await expect(client.request("/bad")).rejects.toBeInstanceOf(ApiError);
    await expect(client.request("/bad")).rejects.toThrow("validation failed");
  });

  it("returns undefined when response body is empty", async () => {
    fetchSpy.mockResolvedValue(new Response("", { status: 200 }));
    const client = createApiClient();
    const data = await client.request("/empty");
    expect(data).toBeUndefined();
  });

  it("401 throws AuthError and clears auth", async () => {
    fetchSpy.mockResolvedValue(new Response("{}", { status: 401 }));
    const client = createApiClient();
    await expect(client.request("/protected")).rejects.toBeInstanceOf(AuthError);
    expect(mockConfig.clearAuth).toHaveBeenCalledTimes(1);
  });

  it("403 throws ApiError '权限不足'", async () => {
    fetchSpy.mockResolvedValue(new Response("{}", { status: 403 }));
    const client = createApiClient();
    const err = await client.request("/x").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).statusCode).toBe(403);
    expect((err as Error).message).toBe("权限不足");
  });

  it("404 throws ApiError '资源不存在'", async () => {
    fetchSpy.mockResolvedValue(new Response("{}", { status: 404 }));
    const client = createApiClient();
    const err = await client.request("/missing").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).statusCode).toBe(404);
    expect((err as Error).message).toBe("资源不存在");
  });

  it("422 throws ApiError with detail from message field", async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse({ code: 1, message: "字段 email 必填" }, { status: 422 }),
    );
    const client = createApiClient();
    const err = await client.request("/x").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).statusCode).toBe(422);
    expect((err as Error).message).toContain("验证错误");
    expect((err as Error).message).toContain("字段 email 必填");
  });

  it("429 throws ApiError with retry hint", async () => {
    fetchSpy.mockResolvedValue(new Response("{}", { status: 429 }));
    const client = createApiClient();
    const err = await client.request("/x").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).statusCode).toBe(429);
    expect((err as Error).message).toContain("请求过于频繁");
  });

  it("5xx throws ApiError with retry hint", async () => {
    fetchSpy.mockResolvedValue(new Response("{}", { status: 503 }));
    const client = createApiClient();
    const err = await client.request("/x").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).statusCode).toBe(503);
    expect((err as Error).message).toContain("服务器错误");
  });

  it("throws ApiError '无法解析的响应' on JSON parse failure", async () => {
    fetchSpy.mockResolvedValue(new Response("not-json-{{}", { status: 200 }));
    const client = createApiClient();
    const err = await client.request("/bad-json").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as Error).message).toContain("无法解析的响应");
  });

  it("wraps fetch throw into NetworkError", async () => {
    fetchSpy.mockRejectedValue(new Error("ECONNREFUSED"));
    const client = createApiClient();
    const err = await client.request("/x").catch((e) => e);
    expect(err).toBeInstanceOf(NetworkError);
    expect((err as Error).message).toContain("网络请求失败");
    expect((err as Error).message).toContain("ECONNREFUSED");
  });

  it("exposes apiUrl from config", () => {
    const client = createApiClient();
    expect(client.apiUrl).toBe("https://api.example.com");
  });
});