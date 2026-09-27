/**
 * Per-dialect column factories for SQLite.
 *
 * The metadata layer (`../_meta/tables.ts`) describes every column in a
 * dialect-agnostic way. This module is the only place that knows how each
 * `ColumnKind` maps to a drizzle/sqlite-core column constructor.
 *
 * Public surface:
 *  - `buildSqliteColumn(desc)` returns a drizzle column builder with all
 *    per-column modifiers applied (notNull / unique / defaultNow /
 *    defaultValue / $onUpdate). Foreign keys are NOT applied here — they
 *    need a sibling table object, so they're resolved at table-build time in
 *    `schema.sqlite.ts`.
 */

import { integer, real, text } from "drizzle-orm/sqlite-core";

import { sqliteNowMs } from "../../_meta/sqliteNow";
import type { ColumnDescriptor } from "../../_meta/tables";

/**
 * Structural shape returned by every sqlite-core builder after modifiers.
 * drizzle's per-column-builder types are deeply generic (e.g.
 * SQLiteColumnBuilder → SQLiteIntegerBuilder → SQLiteTimestampBuilder), but
 * the union of methods we actually need is small. Declaring it structurally
 * lets the assembly layer append `.references(...)` uniformly.
 */
export interface BuiltColumn {
  notNull(): BuiltColumn;
  unique(): BuiltColumn;
  default(v: unknown): BuiltColumn;
  $defaultFn(fn: () => unknown): BuiltColumn;
  $onUpdate(fn: () => unknown): BuiltColumn;
  references(
    fn: () => unknown,
    opts?: { onDelete?: "cascade" | "set null" | "restrict" | "no action" },
  ): BuiltColumn;
  primaryKey(): BuiltColumn;
}

function applyModifiers(col: BuiltColumn, desc: ColumnDescriptor): BuiltColumn {
  let c: BuiltColumn = col;
  if (desc.notNull) c = c.notNull();
  if (desc.unique) c = c.unique();
  // sqlite's `SQLiteTimestamp.defaultNow()` is deprecated and always emits
  // milliseconds regardless of mode, so for `mode: "timestamp"` (seconds)
  // columns we fall back to a JS-side default that returns a Date — that
  // matches the previous handwritten schema's `$defaultFn(() => new Date())`.
  if (desc.defaultNow) {
    c = desc.kind === "tsSec" ? c.$defaultFn(() => new Date()) : c.default(sqliteNowMs);
  }
  if (desc.defaultValue !== undefined) c = c.default(desc.defaultValue);
  if (desc.onUpdate) c = c.$onUpdate(() => new Date());
  return c;
}

export function buildSqliteColumn(desc: ColumnDescriptor): BuiltColumn {
  let raw: BuiltColumn;
  switch (desc.kind) {
    case "id":
      raw = text(desc.column) as unknown as BuiltColumn;
      if (desc.primaryKey) raw = raw.primaryKey();
      break;
    case "text":
    case "varchar":
    case "longtext":
      raw = text(desc.column) as unknown as BuiltColumn;
      break;
    case "bool":
      raw = integer(desc.column, { mode: "boolean" }) as unknown as BuiltColumn;
      break;
    case "int":
      raw = integer(desc.column) as unknown as BuiltColumn;
      break;
    case "tsMs":
      raw = integer(desc.column, { mode: "timestamp_ms" }) as unknown as BuiltColumn;
      break;
    case "tsSec":
      raw = integer(desc.column, { mode: "timestamp" }) as unknown as BuiltColumn;
      break;
    case "real":
      raw = real(desc.column) as unknown as BuiltColumn;
      break;
    case "json":
      raw = text(desc.column, { mode: "json" }) as unknown as BuiltColumn;
      break;
    default: {
      const _exhaustive: never = desc.kind;
      throw new Error(`Unknown column kind: ${String(_exhaustive)}`);
    }
  }
  return applyModifiers(raw, desc);
}