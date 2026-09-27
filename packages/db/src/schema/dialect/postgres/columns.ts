/**
 * Per-dialect column factories for PostgreSQL.
 *
 * The metadata layer (`../../_meta/tables.ts`) describes every column in a
 * dialect-agnostic way. This module is the only place that knows how each
 * `ColumnKind` maps to a drizzle/pg-core column constructor.
 *
 * Public surface:
 *  - `buildPostgresColumn(desc)` returns a drizzle column builder with all
 *    per-column modifiers applied (notNull / unique / defaultNow /
 *    defaultValue / $onUpdate). Foreign keys are NOT applied here — they
 *    need a sibling table object, so they're resolved at table-build time in
 *    `schema.postgres.ts`.
 */

import { boolean, integer, jsonb, real, text, timestamp, varchar } from "drizzle-orm/pg-core";

import type { ColumnDescriptor } from "../../_meta/tables";

/**
 * Structural shape returned by every pg-core builder after modifiers. drizzle
 * distributes extra methods (defaultNow, $onUpdate) across the per-data-type
 * sub-builder classes (PgDateColumnBaseBuilder etc.), but the union of methods
 * we actually need is small. Declaring it structurally lets the assembly
 * layer append `.references(...)` uniformly.
 */
export interface BuiltColumn {
  notNull(): BuiltColumn;
  unique(): BuiltColumn;
  default(v: unknown): BuiltColumn;
  defaultNow(): BuiltColumn;
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
  if (desc.defaultNow) c = c.defaultNow();
  if (desc.defaultValue !== undefined) c = c.default(desc.defaultValue);
  if (desc.onUpdate) c = c.$onUpdate(() => new Date());
  return c;
}

export function buildPostgresColumn(desc: ColumnDescriptor): BuiltColumn {
  let raw: BuiltColumn;
  switch (desc.kind) {
    case "id":
      raw = text(desc.column) as unknown as BuiltColumn;
      if (desc.primaryKey) raw = raw.primaryKey();
      break;
    case "text":
    case "longtext": // pg has no longtext — fall back to text
      raw = text(desc.column) as unknown as BuiltColumn;
      break;
    case "varchar":
      raw = varchar(desc.column, { length: desc.length ?? 255 }) as unknown as BuiltColumn;
      break;
    case "bool":
      raw = boolean(desc.column) as unknown as BuiltColumn;
      break;
    case "int":
      raw = integer(desc.column) as unknown as BuiltColumn;
      break;
    case "tsMs":
    case "tsSec": // pg `timestamp` is already sub-second by default
      raw = timestamp(desc.column) as unknown as BuiltColumn;
      break;
    case "real":
      raw = real(desc.column) as unknown as BuiltColumn;
      break;
    case "json":
      raw = jsonb(desc.column) as unknown as BuiltColumn;
      break;
    default: {
      const _exhaustive: never = desc.kind;
      throw new Error(`Unknown column kind: ${String(_exhaustive)}`);
    }
  }
  return applyModifiers(raw, desc);
}