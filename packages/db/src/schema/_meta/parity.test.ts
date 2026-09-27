import { describe, expect, it } from "vitest";

import { TABLE_METADATA } from "./tables";

// drizzle 表对象内部列集合经 symbol 键取值，tsc 严格模式要求先收窄为 symbol 索引记录。
const columnsOf = (table: unknown): Record<string, unknown> =>
  (table as Record<symbol, unknown>)[Symbol.for("drizzle:Columns")] as Record<string, unknown>;

// 三个方言的命名导出（camelCase） → 数据库表名（snake_case）映射。组装层在每个
// schema.{dialect}.ts 中显式导出这些符号。
import * as sqliteSchema from "../schema.sqlite";
import * as postgresSchema from "../schema.postgres";
import * as mysqlSchema from "../schema.mysql";

/**
 * Tables where the export key differs from the DB table name. All others are
 * identical (e.g. `user` → `user`). Kept in lockstep with TABLE_METADATA.
 */
const RENAME: Record<string, string> = {
  twoFactor: "two_factor",
  teamMember: "team_member",
  deviceCode: "device_code",
  rolePermission: "role_permission",
  userRole: "user_role",
  aiModel: "ai_model",
  aiTask: "ai_task",
  chatMessage: "chat_message",
  ticketMessage: "ticket_message",
  inviteCode: "invite_code",
  userInvite: "user_invite",
  referralRelation: "referral_relation",
};

/** Resolve the exported table constant for a given export key + dialect. */
function pickDialectTable(dialect: Record<string, unknown>, exportKey: string): unknown {
  const t = dialect[exportKey];
  if (!t) {
    throw new Error(`Missing export "${exportKey}" in dialect schema`);
  }
  return t;
}

describe("dialect parity: column-name sets match across sqlite / postgres / mysql", () => {
  it.each(TABLE_METADATA.map((d, idx) => [idx, d.name] as const))(
    "%s — table %s",
    (_idx, _dbName) => {
      const desc = TABLE_METADATA.find((d) => d.name === _dbName);
      if (!desc) throw new Error(`Descriptor not found for ${_dbName}`);
      const exportKey =
        Object.entries(RENAME).find(([, v]) => v === desc.name)?.[0] ?? desc.name;

      const sqliteCols = new Set(Object.keys(columnsOf(pickDialectTable(sqliteSchema, exportKey))));
      const pgCols = new Set(Object.keys(columnsOf(pickDialectTable(postgresSchema, exportKey))));
      const mysqlCols = new Set(Object.keys(columnsOf(pickDialectTable(mysqlSchema, exportKey))));

      // Every metadata column should appear in every dialect.
      for (const col of desc.columns) {
        expect(sqliteCols.has(col.name)).toBe(true);
        expect(pgCols.has(col.name)).toBe(true);
        expect(mysqlCols.has(col.name)).toBe(true);
      }

      // And the dialect column sets must equal the metadata set exactly (no
      // stray columns emitted by the assembly layer).
      const metaCols = new Set(desc.columns.map((c) => c.name));
      expect(sqliteCols).toEqual(metaCols);
      expect(pgCols).toEqual(metaCols);
      expect(mysqlCols).toEqual(metaCols);
    },
  );
});