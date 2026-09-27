import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  requestDeviceCode,
  pollForToken,
  deviceLogin,
} from "./auth-client";
import { NetworkError } from "./errors";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: (init.status as number | undefined) ?? 200,
    headers: { "content-type": "application/json", ...(init.headers as Record<string, string>) },
  });
}

describe("requestDeviceCode", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("returns parsed device code on 200", async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse({
        device_code: "dev-1",
        user_code: "ABCD-1234",
        verification_uri: "https://example.com/activate",
        verification_uri_complete: "https://example.com/activate?code=ABCD-1234",
        expires_in: 600,
        interval: 5,
      }),
    );

    const result = await requestDeviceCode("https://api.example.com");
    expect(result.device_code).toBe("dev-1");
    expect(result.user_code).toBe("ABCD-1234");
    expect(result.verification_uri_complete).toBe(
      "https://example.com/activate?code=ABCD-1234",
    );

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/api/auth/device/code");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body.client_id).toBe("openstarter-cli");
  });

  it("throws NetworkError when status not ok", async () => {
    fetchSpy.mockResolvedValue(new Response("server down", { status: 500 }));
    const err = await requestDeviceCode("https://api.example.com").catch((e) => e);
    expect(err).toBeInstanceOf(NetworkError);
    expect((err as Error).message).toContain("无法请求设备码");
  });

  it("throws NetworkError when JSON parse fails", async () => {
    fetchSpy.mockResolvedValue(new Response("not-json-{{{", { status: 200 }));
    const err = await requestDeviceCode("https://api.example.com").catch((e) => e);
    expect(err).toBeInstanceOf(NetworkError);
    expect((err as Error).message).toContain("无法请求设备码");
  });

  it("wraps underlying fetch throw in NetworkError", async () => {
    fetchSpy.mockRejectedValue(new Error("ECONNREFUSED"));
    const err = await requestDeviceCode("https://api.example.com").catch((e) => e);
    expect(err).toBeInstanceOf(NetworkError);
    expect((err as Error).message).toContain("无法请求设备码");
  });
});

describe("pollForToken", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    vi.useFakeTimers();
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });
  afterEach(() => {
    fetchSpy.mockRestore();
    vi.useRealTimers();
  });

  it("returns tokens on first try when response.ok", async () => {
    fetchSpy.mockImplementation(() =>
      Promise.resolve(
        jsonResponse({
          access_token: "at",
          token_type: "Bearer",
          expires_in: 3600,
          scope: "openid",
        }),
      ),
    );

    const promise = pollForToken("https://api.example.com", "dev-1", 1, 10).catch(
      (e) => e,
    );
    await vi.advanceTimersByTimeAsync(2000);
    const tokens = await promise;
    expect(tokens).toMatchObject({ access_token: "at" });
  });

  it("keeps polling on authorization_pending then returns tokens", async () => {
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse({ error: "authorization_pending" }, { status: 400 }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ error: "authorization_pending" }, { status: 400 }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ error: "authorization_pending" }, { status: 400 }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: "at-3",
          token_type: "Bearer",
          expires_in: 3600,
          scope: "openid",
        }),
      );

    const promise = pollForToken("https://api.example.com", "dev-1", 1, 60).catch(
      (e) => e,
    );
    await vi.advanceTimersByTimeAsync(10_000);
    const tokens = await promise;
    expect(tokens).toMatchObject({ access_token: "at-3" });
    expect(fetchSpy).toHaveBeenCalledTimes(4);
  });

  it("slow_down does not throw and continues polling", async () => {
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse({ error: "slow_down" }, { status: 400 }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: "at-slow",
          token_type: "Bearer",
          expires_in: 3600,
          scope: "openid",
        }),
      );

    const promise = pollForToken("https://api.example.com", "dev-1", 1, 60).catch(
      (e) => e,
    );
    await vi.advanceTimersByTimeAsync(5000);
    const tokens = await promise;
    expect(tokens).toMatchObject({ access_token: "at-slow" });
  });

  it("throws NetworkError on unknown error code", async () => {
    fetchSpy.mockImplementation(() =>
      Promise.resolve(
        jsonResponse({ error: "access_denied", error_description: "denied" }, { status: 400 }),
      ),
    );
    // expiresIn=2, interval=1: first iteration sleeps 1s, fetches, throws "denied".
    // Pre-attach a noop catch to avoid unhandled-rejection window during fake-timer advancement.
    const promise = pollForToken("https://api.example.com", "dev-1", 1, 2).catch(
      (e) => e,
    );
    await vi.advanceTimersByTimeAsync(3000);
    const err = await promise;
    expect(err).toBeInstanceOf(NetworkError);
    expect((err as Error).message).toContain("denied");
  });

  it("throws NetworkError when body is not JSON", async () => {
    fetchSpy.mockImplementation(() =>
      Promise.resolve(new Response("not-json-{{{", { status: 400 })),
    );
    const promise = pollForToken("https://api.example.com", "dev-1", 1, 2).catch(
      (e) => e,
    );
    await vi.advanceTimersByTimeAsync(3000);
    const err = await promise;
    expect(err).toBeInstanceOf(NetworkError);
    expect((err as Error).message).toContain("非 JSON");
  });

  it("throws NetworkError on timeout when expiresIn elapses", async () => {
    // Always return authorization_pending so the loop never terminates normally.
    // mockImplementation returns a fresh Response per call so the body is readable each iteration.
    fetchSpy.mockImplementation(() =>
      Promise.resolve(jsonResponse({ error: "authorization_pending" }, { status: 400 })),
    );

    const promise = pollForToken("https://api.example.com", "dev-1", 1, 2).catch(
      (e) => e,
    );
    await vi.advanceTimersByTimeAsync(5000);
    const err = await promise;
    expect(err).toBeInstanceOf(NetworkError);
    expect((err as Error).message).toContain("授权超时");
  });
});

describe("deviceLogin", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchSpy = vi.spyOn(globalThis, "fetch");
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => {
    fetchSpy.mockRestore();
    logSpy.mockRestore();
    vi.useRealTimers();
  });

  it("prints verify URL and user code to console, then returns tokens", async () => {
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse({
          device_code: "dev-x",
          user_code: "ZZZZ-9999",
          verification_uri: "https://example.com/activate",
          verification_uri_complete: "https://example.com/activate?code=ZZZZ-9999",
          expires_in: 60,
          interval: 1,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: "at-final",
          token_type: "Bearer",
          expires_in: 3600,
          scope: "openid",
        }),
      );

    const promise = deviceLogin("https://api.example.com").catch((e) => e);
    await vi.advanceTimersByTimeAsync(3000);
    const tokens = await promise;

    const out = logSpy.mock.calls.flat().map(String).join("\n");
    expect(out).toContain("https://example.com/activate?code=ZZZZ-9999");
    expect(out).toContain("ZZZZ-9999");
    expect(tokens.access_token).toBe("at-final");
  });
});