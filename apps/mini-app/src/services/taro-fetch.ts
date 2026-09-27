// apps/mini-app/src/services/taro-fetch.ts
// Taro.request → fetch 适配器 + 极简 Response shim

import Taro from "@tarojs/taro";
import { getToken } from "@/utils/storage";

// 入参签名使用窄类型联合而非 any；运行时由 normalizeHeaders() 兼容 Web Headers。
// 见 normalizeHeaders() 和 parseBody() 内 typeof 检查。

/** 适配 fetch HeadersInit 的窄类型联合（小程序可能无原生 Headers 实例）。 */
export type HeadersLike =
  | Record<string, string>
  | Array<[string, string]>
  | { entries(): Iterable<[string, string]> };

/** fetch 入参窄类型：字符串、URL 实例，或 Request-style `{ url }` 对象。 */
export type FetchInput = string | URL | { url: string };

/** 极简 Response shim（小程序环境无原生 Response API）。 */
export class MiniResponse implements Pick<Response, "status" | "ok" | "json"> {
  status: number;
  ok: boolean;
  headers: { get(name: string): string | null };
  private _data: unknown;

  constructor(data: unknown, status: number, headers: Record<string, string>) {
    this.status = status;
    this.ok = status >= 200 && status < 300;
    this._data = data;
    this.headers = {
      get: (name: string) => {
        const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
        return key ? headers[key] : null;
      },
    };
  }

  async json(): Promise<unknown> {
    return this._data;
  }
}

/** 把 Taro.request 包装成标准 fetch 接口（FetchEsque）。 */
export function createTaroFetch(onUnauthorized?: () => void) {
  return async (
    input: FetchInput,
    init?: Omit<RequestInit, "headers" | "body"> & { headers?: HeadersLike; body?: unknown },
  ): Promise<Response> => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const token = getToken();
    const headers = normalizeHeaders(init?.headers);

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const body = parseBody(init?.body);

    const res = await Taro.request({
      url,
      method: (init?.method ?? "GET") as keyof Taro.request.Method,
      header: headers,
      data: body,
    });

    if (res.statusCode === 401) {
      onUnauthorized?.();
    }

    return new MiniResponse(res.data, res.statusCode, res.header || {}) as unknown as Response;
  };
}

export function normalizeHeaders(headers?: HeadersLike): Record<string, string> {
  if (!headers) return {};

  // Handle array of tuples (must precede entries() check since arrays also have entries())
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  // Handle Headers instance (Web API, 小程序可能无此类型)
  if (typeof (headers as Partial<HeadersLike>).entries === "function") {
    try {
      const entries = (headers as { entries(): Iterable<[string, string]> }).entries();
      return Object.fromEntries(entries);
    } catch {
      /* ignore */
    }
  }

  // Handle plain object
  return headers as Record<string, string>;
}

export function parseBody(body: unknown): unknown {
  if (!body) return undefined;

  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  return body;
}