import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetStorageSync, mockSetStorageSync, mockRemoveStorageSync } = vi.hoisted(() => ({
  mockGetStorageSync: vi.fn(),
  mockSetStorageSync: vi.fn(),
  mockRemoveStorageSync: vi.fn(),
}));

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));

vi.mock("@tarojs/taro", () => ({
  default: {
    getStorageSync: mockGetStorageSync,
    setStorageSync: mockSetStorageSync,
    removeStorageSync: mockRemoveStorageSync,
  },
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    getSession: mockGetSession,
  },
}));

vi.mock("@/utils/storage", () => ({
  getToken: mockGetStorageSync,
  setToken: mockSetStorageSync,
  removeToken: mockRemoveStorageSync,
}));

import { useAuthStore } from "./auth-store";

describe("auth-store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
      isHydrated: false,
    });
  });

  it("hydrate without stored token does not call getSession and marks hydrated", async () => {
    mockGetStorageSync.mockReturnValue(null);

    await useAuthStore.getState().hydrate();

    const state = useAuthStore.getState();
    expect(mockGetSession).not.toHaveBeenCalled();
    expect(state.isHydrated).toBe(true);
    expect(state.isAuthenticated).toBe(false);
  });

  it("hydrate with token and valid session populates user and marks authenticated", async () => {
    mockGetStorageSync.mockReturnValue("valid-token");
    mockGetSession.mockResolvedValue({
      data: {
        user: {
          id: "u-1",
          email: "alice@example.com",
          name: "Alice",
          avatar: "https://cdn/avatar.png",
        },
      },
    });

    await useAuthStore.getState().hydrate();

    const state = useAuthStore.getState();
    expect(mockGetSession).toHaveBeenCalledTimes(1);
    expect(state.token).toBe("valid-token");
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual({
      id: "u-1",
      email: "alice@example.com",
      name: "Alice",
      avatar: "https://cdn/avatar.png",
    });
    expect(state.isHydrated).toBe(true);
  });

  it("hydrate with token but null session clears token", async () => {
    mockGetStorageSync.mockReturnValue("stale-token");
    mockGetSession.mockResolvedValue({ data: null });

    await useAuthStore.getState().hydrate();

    const state = useAuthStore.getState();
    expect(mockRemoveStorageSync).toHaveBeenCalled();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isHydrated).toBe(true);
  });

  it("hydrate with token keeps token when getSession throws", async () => {
    mockGetStorageSync.mockReturnValue("keep-me");
    mockGetSession.mockRejectedValue(new Error("network down"));

    await useAuthStore.getState().hydrate();

    const state = useAuthStore.getState();
    expect(state.token).toBe("keep-me");
    expect(state.isHydrated).toBe(true);
    expect(state.isAuthenticated).toBe(false);
  });

  it("setSession updates state and persists token", () => {
    useAuthStore.getState().setSession("session-token", {
      id: "u-2",
      email: "bob@example.com",
    });

    const state = useAuthStore.getState();
    expect(mockSetStorageSync).toHaveBeenCalledWith("session-token");
    expect(state.token).toBe("session-token");
    expect(state.user).toEqual({ id: "u-2", email: "bob@example.com" });
    expect(state.isAuthenticated).toBe(true);
  });

  it("logout clears state and removes token", () => {
    useAuthStore.setState({
      token: "t",
      user: { id: "u-3", email: "x@y.com" },
      isAuthenticated: true,
      isHydrated: true,
    });

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(mockRemoveStorageSync).toHaveBeenCalled();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});