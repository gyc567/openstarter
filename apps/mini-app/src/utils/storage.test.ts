// 注意：Taro storage API 在 node 环境不可用，测试通过 vi.mock 注入桩函数。
import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetStorageSync,
  mockSetStorageSync,
  mockRemoveStorageSync,
} = vi.hoisted(() => ({
  mockGetStorageSync: vi.fn(),
  mockSetStorageSync: vi.fn(),
  mockRemoveStorageSync: vi.fn(),
}));

vi.mock("@tarojs/taro", () => ({
  default: {
    getStorageSync: mockGetStorageSync,
    setStorageSync: mockSetStorageSync,
    removeStorageSync: mockRemoveStorageSync,
  },
}));

import { getToken, setToken, removeToken } from "./storage";

describe("storage utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the stored token string", () => {
    mockGetStorageSync.mockReturnValue("abc123");
    expect(getToken()).toBe("abc123");
    expect(mockGetStorageSync).toHaveBeenCalledWith("token");
  });

  it("returns null when stored value is not a string", () => {
    mockGetStorageSync.mockReturnValue(42);
    expect(getToken()).toBeNull();
  });

  it("returns null when stored value is empty string", () => {
    mockGetStorageSync.mockReturnValue("");
    expect(getToken()).toBeNull();
  });

  it("returns null when getStorageSync throws", () => {
    mockGetStorageSync.mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    expect(getToken()).toBeNull();
  });

  it("setToken delegates to Taro.setStorageSync", () => {
    setToken("new-token");
    expect(mockSetStorageSync).toHaveBeenCalledWith("token", "new-token");
  });

  it("removeToken delegates to Taro.removeStorageSync", () => {
    removeToken();
    expect(mockRemoveStorageSync).toHaveBeenCalledWith("token");
  });
});