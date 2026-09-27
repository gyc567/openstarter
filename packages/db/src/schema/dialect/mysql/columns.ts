/**
 * Per-dialect column factories for MySQL.
 *
 * The metadata layer (`../../_meta/tables.ts`) describes every column in a
 * dialect-agnostic way. This module is the only place that knows how each
 * `ColumnKind` maps to a drizzle/mysql-core column constructor.
 *
 * Public surface:
 *  - `buildMysqlColumn(desc)` returns a drizzle column builder with all
 *    per-column modifiers applied (notNull / unique / defaultNow /
 *    defaultValue / onUpdateNow). Foreign keys are NOT applied here — they
 *    need a sibling table object, so they're resolved at table-build time in
 *    `schema.mysql.ts`.
 */

import { boolean, int, json, longtext, real, text, timestamp, varchar } from "drizzle-orm/mysql-core";

import type { ColumnDescriptor } from "../../_meta/tables";

/**
 * Structural shape returned by every mysql-core builder after modifiers.
 * drizzle distributes `defaultNow` / `onUpdateNow` across the per-data-type
 * sub-builder classes, but the union of methods we actually need is small.
 * Declaring it structurally lets the assembly layer append `.references(...)`
 * uniformly.
 */
export interface BuiltColumn {
  notNull(): BuiltColumn;
  unique(): BuiltColumn;
  default(v: unknown): BuiltColumn;
  defaultNow(): BuiltColumn;
  onUpdateNow(): BuiltColumn;
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
  if (desc.onUpdate) c = c.onUpdateNow();
  return c;
}

export function buildMysqlColumn(desc: ColumnDescriptor): BuiltColumn {
  let raw: BuiltColumn;
  switch (desc.kind) {
    case "id":
      raw = varchar(desc.column, { length: 255 }) as unknown as BuiltColumn;
      if (desc.primaryKey) raw = raw.primaryKey();
      break;
    case "text":
      raw = text(desc.column) as unknown as BuiltColumn;
      break;
    case "varchar":
      raw = varchar(desc.column, { length: desc.length ?? 255 }) as unknown as BuiltColumn;
      break;
    case "longtext":
      raw = longtext(desc.column) as unknown as BuiltColumn;
      break;
    case "bool":
      raw = boolean(desc.column) as unknown as BuiltColumn;
      break;
    case "int":
      raw = int(desc.column) as unknown as BuiltColumn;
      break;
    case "tsMs":
    case "tsSec":
      raw = timestamp(desc.column) as unknown as BuiltColumn;
      break;
    case "real":
      raw = real(desc.column) as unknown as BuiltColumn;
      break;
    case "json":
      raw = json(desc.column) as unknown as BuiltColumn;
      break;
    default: {
      const _exhaustive: never = desc.kind;
      throw new Error(`Unknown column kind: ${String(_exhaustive)}`);
    }
  }
  return applyModifiers(raw, desc);
}