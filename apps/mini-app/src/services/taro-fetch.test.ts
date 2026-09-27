import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockRequest, mockGetToken } = vi.hoisted(() => ({
  mockRequest: vi.fn(),
  mockGetToken: vi.fn(),
}));

vi.mock("@tarojs/taro", () => ({
  default: {
    request: mockRequest,
  },
}));

vi.mock("@/utils/storage", () => ({
  getToken: mockGetToken,
}));

import {
  MiniResponse,
  createTaroFetch,
  normalizeHeaders,
  parseBody,
} from "./taro-fetch";

describe("MiniResponse", () => {
  it("derives status and ok from constructor inputs", () => {
    const okResp = new MiniResponse({ result: 1 }, 200, {});
    expect(okResp.status).toBe(200);
    expect(okResp.ok).toBe(true);

    const errResp = new MiniResponse({ error: "no" }, 500, {});
    expect(errResp.status).toBe(500);
    expect(errResp.ok).toBe(false);
  });

  it("headers.get is case-insensitive", () => {
    const resp = new MiniResponse({}, 200, {
      "Content-Type": "application/json",
      "X-Trace": "abc",
    });
    expect(resp.headers.get("content-type")).toBe("application/json");
    expect(resp.headers.get("CONTENT-TYPE")).toBe("application/json");
    expect(resp.headers.get("x-trace")).toBe("abc");
    expect(resp.headers.get("missing")).toBeNull();
  });

  it("json() returns the constructor data", async () => {
    const resp = new MiniResponse({ hello: "world" }, 200, {});
    await expect(resp.json()).resolves.toEqual({ hello: "world" });
  });
});

describe("normalizeHeaders", () => {
  it("returns empty object for undefined input", () => {
    expect(normalizeHeaders(undefined)).toEqual({});
  });

  it("normalizes a plain object", () => {
    expect(normalizeHeaders({ "X-A": "1", "X-B": "2" })).toEqual({
      "X-A": "1",
      "X-B": "2",
    });
  });

  it("normalizes a tuple array", () => {
    expect(
      normalizeHeaders([
        ["X-A", "1"],
        ["X-B", "2"],
      ]),
    ).toEqual({ "X-A": "1", "X-B": "2" });
  });

  it("normalizes an entries()-bearing object", () => {
    const entriesLike = {
      entries(): Iterable<[string, string]> {
        return [
          ["X-A", "1"],
          ["X-B", "2"],
        ];
      },
    };
    expect(normalizeHeaders(entriesLike)).toEqual({ "X-A": "1", "X-B": "2" });
  });
});

describe("parseBody", () => {
  it("returns undefined for null/undefined/falsy", () => {
    expect(parseBody(undefined)).toBeUndefined();
    expect(parseBody(null)).toBeUndefined();
    expect(parseBody(0)).toBeUndefined();
  });

  it("parses valid JSON string", () => {
    expect(parseBody('{"a":1}')).toEqual({ a: 1 });
  });

  it("returns raw string for non-JSON string", () => {
    expect(parseBody("hello")).toBe("hello");
  });

  it("returns object as-is", () => {
    const obj = { a: 1 };
    expect(parseBody(obj)).toBe(obj);
  });
});

describe("createTaroFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invokes Taro.request and returns a MiniResponse", async () => {
    mockGetToken.mockReturnValue(null);
    mockRequest.mockResolvedValue({
      statusCode: 200,
      data: { result: "ok" },
      header: { "content-type": "application/json" },
    });

    const fetch = createTaroFetch();
    const response = await fetch("https://api.example.com/ping", {
      method: "POST",
      headers: { "X-Trace": "abc" },
      body: JSON.stringify({ foo: "bar" }),
    });

    expect(mockRequest).toHaveBeenCalledTimes(1);
    const callArg = mockRequest.mock.calls[0]?.[0] as {
      url: string;
      method: string;
      header: Record<string, string>;
      data: unknown;
    };
    expect(callArg.url).toBe("https://api.example.com/ping");
    expect(callArg.method).toBe("POST");
    expect(callArg.header["X-Trace"]).toBe("abc");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ result: "ok" });
  });

  it("defaults method to GET when init is undefined", async () => {
    mockGetToken.mockReturnValue(null);
    mockRequest.mockResolvedValue({
      statusCode: 204,
      data: null,
      header: {},
    });

    const fetch = createTaroFetch();
    await fetch("https://api.example.com/items");

    const callArg = mockRequest.mock.calls[0]?.[0] as { method: string };
    expect(callArg.method).toBe("GET");
  });

  it("adds Authorization header when getToken returns a token", async () => {
    mockGetToken.mockReturnValue("jwt-xyz");
    mockRequest.mockResolvedValue({
      statusCode: 200,
      data: {},
      header: {},
    });

    const fetch = createTaroFetch();
    await fetch("https://api.example.com/secure");

    const callArg = mockRequest.mock.calls[0]?.[0] as {
      header: Record<string, string>;
    };
    expect(callArg.header.Authorization).toBe("Bearer jwt-xyz");
  });

  it("does not add Authorization header when getToken returns null", async () => {
    mockGetToken.mockReturnValue(null);
    mockRequest.mockResolvedValue({
      statusCode: 200,
      data: {},
      header: {},
    });

    const fetch = createTaroFetch();
    await fetch("https://api.example.com/public");

    const callArg = mockRequest.mock.calls[0]?.[0] as {
      header: Record<string, string>;
    };
    expect(callArg.header.Authorization).toBeUndefined();
  });

  it("calls onUnauthorized when Taro.request returns 401", async () => {
    mockGetToken.mockReturnValue(null);
    mockRequest.mockResolvedValue({
      statusCode: 401,
      data: { error: "token expired" },
      header: {},
    });

    const onUnauth = vi.fn();
    const fetch = createTaroFetch(onUnauth);
    const response = await fetch("https://api.example.com/protected");

    expect(onUnauth).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(401);
  });

  it("accepts a URL object as input", async () => {
    mockGetToken.mockReturnValue(null);
    mockRequest.mockResolvedValue({
      statusCode: 200,
      data: {},
      header: {},
    });

    const fetch = createTaroFetch();
    await fetch(new URL("https://api.example.com/path"));

    const callArg = mockRequest.mock.calls[0]?.[0] as { url: string };
    expect(callArg.url).toBe("https://api.example.com/path");
  });

  it("accepts a Request-style object as input", async () => {
    mockGetToken.mockReturnValue(null);
    mockRequest.mockResolvedValue({
      statusCode: 200,
      data: {},
      header: {},
    });

    const fetch = createTaroFetch();
    await fetch({ url: "https://api.example.com/from-obj" });

    const callArg = mockRequest.mock.calls[0]?.[0] as { url: string };
    expect(callArg.url).toBe("https://api.example.com/from-obj");
  });
});