import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { formatOutput, formatTable, formatKeyValue } from "./output";

describe("formatTable", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("prints (empty) for empty array", () => {
    formatTable([]);
    expect(logSpy).toHaveBeenCalledWith("(empty)");
  });

  it("prints single row with header and dashes", () => {
    formatTable([{ id: "1", name: "alpha" }]);
    const calls = logSpy.mock.calls.flat().map(String);
    expect(calls[0]).toContain("id");
    expect(calls[0]).toContain("name");
    expect(calls[1]).toMatch(/-+/);
    expect(calls[2]).toContain("alpha");
    expect(calls[2]).toContain("1");
  });

  it("renders multi-column rows with two-space separator", () => {
    formatTable([
      { a: "x", b: "y" },
      { a: "1", b: "2" },
    ]);
    const calls = logSpy.mock.calls.flat().map(String);
    expect(calls[0]).toBe("a  b");
    expect(calls[2]).toContain("x");
    expect(calls[2]).toContain("y");
    expect(calls[3]).toContain("1");
    expect(calls[3]).toContain("2");
  });

  it("truncates long cell values with ellipsis and caps width at 40", () => {
    const longValue = "x".repeat(80);
    formatTable([{ id: longValue }]);
    const calls = logSpy.mock.calls.flat().map(String);
    // data line is calls[2]
    const dataLine = calls[2] ?? "";
    expect(dataLine.length).toBeLessThanOrEqual(43); // 40 + 2-space separator margin, single column so no sep
    expect(dataLine.endsWith("...")).toBe(true);
    expect(dataLine.includes("xxxx")).toBe(true);
  });
});

describe("formatKeyValue", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("prints (empty) for empty object", () => {
    formatKeyValue({});
    expect(logSpy).toHaveBeenCalledWith("(empty)");
  });

  it("prints key: value pairs aligned", () => {
    formatKeyValue({ name: "alice", role: "admin" });
    const calls = logSpy.mock.calls.flat().map(String);
    expect(calls.some((l: string) => l.includes("name") && l.includes("alice"))).toBe(true);
    expect(calls.some((l: string) => l.includes("role") && l.includes("admin"))).toBe(true);
  });

  it("renders null value as the literal string 'null'", () => {
    formatKeyValue({ token: null });
    const calls = logSpy.mock.calls.flat().map(String);
    expect(calls.some((l: string) => l.endsWith("null"))).toBe(true);
  });

  it("renders undefined value as empty string", () => {
    formatKeyValue({ token: undefined });
    const calls = logSpy.mock.calls.flat().map(String);
    // Line ends with "token: " then empty
    expect(calls.some((l: string) => /token:\s*$/.test(l))).toBe(true);
  });

  it("renders nested object as JSON.stringify", () => {
    formatKeyValue({ meta: { a: 1, b: "x" } });
    const calls = logSpy.mock.calls.flat().map(String);
    expect(calls.some((l: string) => l.includes('"a":1'))).toBe(true);
    expect(calls.some((l: string) => l.includes('"b":"x"'))).toBe(true);
  });
});

describe("formatOutput", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("prints JSON when json=true", () => {
    formatOutput({ a: 1, b: [2, 3] }, true);
    expect(logSpy).toHaveBeenCalledTimes(1);
    const out = logSpy.mock.calls[0]?.[0] as string;
    expect(out).toContain('"a": 1');
    expect(out).toContain('"b": [');
  });

  it("prints human-readable table for arrays when json=false", () => {
    formatOutput([{ id: "1", name: "alpha" }], false);
    const calls = logSpy.mock.calls.flat().map(String);
    expect(calls[0]).toContain("id");
    expect(calls[0]).toContain("name");
  });

  it("prints human-readable key-value for objects when json=false", () => {
    formatOutput({ foo: "bar" }, false);
    const calls = logSpy.mock.calls.flat().map(String);
    expect(calls.some((l: string) => l.includes("foo") && l.includes("bar"))).toBe(true);
  });
});