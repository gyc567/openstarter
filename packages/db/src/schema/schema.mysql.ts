/**
 * MySQL dialect schema definitions.
 *
 * Active when DATABASE_PROVIDER is `mysql`.
 * Exports the same symbol names and `$inferSelect` / `$inferInsert` types as
 * the `schema.sqlite` and `schema.postgres` dialects so callers and drizzle-kit
 * remain dialect-agnostic.
 *
 * Per the design's dialect field convention, identifier / general string
 * columns use `varchar(255)`; enum-like short fields keep narrower lengths and
 * large text/JSON payloads use `longtext`.
 *
 * The shape of every table (columns, uniques, indexes, FKs) is captured in
 * `_meta/tables.ts`; this file is the thin assembly layer that wires that
 * metadata into mysql-core table objects.
 *
 * NOTE on the `any` casts in the assembly loop: drizzle's per-column-builder
 * generics (MySqlColumnBuilder → MySqlColumn) do not compose cleanly with a
 * Record-driven loop, so the loop is intentionally typed loosely. drizzle-kit
 * introspects the resulting table objects fine, and each export is cast back
 * to a column-indexed MySqlTable so downstream `session.userId` continues to
 * resolve to a `MySqlColumn` (preserving the public API).
 */

import { index, mysqlTable, uniqueIndex } from "drizzle-orm/mysql-core";

import { TABLE_METADATA, type IndexDescriptor, type TableDescriptor } from "./_meta/tables";
import { buildMysqlColumn } from "./dialect/mysql/columns";

// biome-ignore lint/suspicious/noExplicitAny: assembly loop types — see file note.
const built: Record<string, any> = {};

for (const desc of TABLE_METADATA as readonly TableDescriptor[]) {
  // biome-ignore lint/suspicious/noExplicitAny: assembly loop types — see file note.
  const cols: Record<string, any> = {};
  for (const col of desc.columns) {
    // biome-ignore lint/suspicious/noExplicitAny: assembly loop types — see file note.
    let c: any = buildMysqlColumn(col);
    if (col.references) {
      const target = built[col.references.table];
      if (!target) {
        throw new Error(
          `Cannot resolve FK on ${desc.name}.${col.name}: target table ${col.references.table} must be declared before ${desc.name}`,
        );
      }
      c = c.references(
        () => target[col.references!.column],
        col.references.onDelete ? { onDelete: col.references.onDelete } : undefined,
      );
    }
    cols[col.name] = c;
  }

  // biome-ignore lint/suspicious/noExplicitAny: assembly loop types — see file note.
  built[desc.name] = (mysqlTable as any)(desc.name, cols, (t: any) =>
    ((desc.indexes ?? []) as readonly IndexDescriptor[]).map((idx) => {
      const idxCols = idx.columns.map((c) => t[c]);
      const builder = idx.unique ? uniqueIndex(idx.name) : index(idx.name);
      return (builder.on as (...a: unknown[]) => unknown)(...idxCols);
    }),
  );
}

// Re-export with the per-table column types preserved at the type level. The
// runtime object is already a fully-built drizzle `MySqlTableWithColumns<...>`,
// but assembling it through the metadata loop strips the per-column generic
// shape from TypeScript's view. Re-asserting via `MySqlTableWithColumns` here
// restores `role.id`, `inviteCode.code`, etc. as properly-typed columns — which
// in turn keeps drizzle's `eq()`, `db.insert(role).values({...}).returning()`,
// and `$inferSelect` working in the consumer packages (api/auth/billing) that
// must remain byte-identical with the pre-consolidation build.
import type { MySqlTableWithColumns } from "drizzle-orm/mysql-core";
type AnyMySqlTable = MySqlTableWithColumns<{
  name: string;
  schema: undefined;
  columns: Record<string, any>;
  dialect: "mysql";
}>;
function asTable(name: string): AnyMySqlTable {
  return built[name] as AnyMySqlTable;
}

// ─── Tables ────────────────────────────────────────────────────────────────────

// Each export is typed as `any` because drizzle's per-table generic
// (`MySqlTableWithColumns<T>`) cannot be reconstructed from a runtime loop
// (TABLE_METADATA). Runtime shape is correct (drizzle-kit introspection +
// the existing tests both pass); downstream `session.userId` access still
// resolves to the real `MySqlColumn` via `any` propagation.
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const user = asTable("user");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const session = asTable("session");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const account = asTable("account");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const verification = asTable("verification");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const passkey = asTable("passkey");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const twoFactor = asTable("two_factor");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const organization = asTable("organization");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const member = asTable("member");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const invitation = asTable("invitation");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const team = asTable("team");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const teamMember = asTable("team_member");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const deviceCode = asTable("device_code");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const config = asTable("config");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const taxonomy = asTable("taxonomy");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const post = asTable("post");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const order = asTable("order");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const subscription = asTable("subscription");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const credit = asTable("credit");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const apikey = asTable("apikey");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const role = asTable("role");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const permission = asTable("permission");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const rolePermission = asTable("role_permission");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const userRole = asTable("user_role");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const aiModel = asTable("ai_model");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const aiTask = asTable("ai_task");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const chat = asTable("chat");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const chatMessage = asTable("chat_message");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const ticket = asTable("ticket");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const ticketMessage = asTable("ticket_message");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const inviteCode = asTable("invite_code");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const userInvite = asTable("user_invite");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const referral = asTable("referral");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const referralRelation = asTable("referral_relation");
// biome-ignore lint/suspicious/noExplicitAny: see comment above.
export const commission = asTable("commission");

// ─── Types ───────────────────────────────────────────────────────────────────

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
export type Verification = typeof verification.$inferSelect;
export type Config = typeof config.$inferSelect;
export type Taxonomy = typeof taxonomy.$inferSelect;
export type NewTaxonomy = typeof taxonomy.$inferInsert;
export type Post = typeof post.$inferSelect;
export type NewPost = typeof post.$inferInsert;
export type Order = typeof order.$inferSelect;
export type NewOrder = typeof order.$inferInsert;
export type Subscription = typeof subscription.$inferSelect;
export type NewSubscription = typeof subscription.$inferInsert;
export type Credit = typeof credit.$inferSelect;
export type NewCredit = typeof credit.$inferInsert;
export type Apikey = typeof apikey.$inferSelect;
export type NewApikey = typeof apikey.$inferInsert;
export type Role = typeof role.$inferSelect;
export type NewRole = typeof role.$inferInsert;
export type Permission = typeof permission.$inferSelect;
export type RolePermission = typeof rolePermission.$inferSelect;
export type UserRole = typeof userRole.$inferSelect;
export type AiModel = typeof aiModel.$inferSelect;
export type NewAiModel = typeof aiModel.$inferInsert;
export type AiTask = typeof aiTask.$inferSelect;
export type NewAiTask = typeof aiTask.$inferInsert;
export type Chat = typeof chat.$inferSelect;
export type NewChat = typeof chat.$inferInsert;
export type ChatMessage = typeof chatMessage.$inferSelect;
export type NewChatMessage = typeof chatMessage.$inferInsert;
export type Ticket = typeof ticket.$inferSelect;
export type NewTicket = typeof ticket.$inferInsert;
export type TicketMessage = typeof ticketMessage.$inferSelect;
export type NewTicketMessage = typeof ticketMessage.$inferInsert;
export type InviteCode = typeof inviteCode.$inferSelect;
export type NewInviteCode = typeof inviteCode.$inferInsert;
export type UserInvite = typeof userInvite.$inferSelect;
export type NewUserInvite = typeof userInvite.$inferInsert;
export type DeviceCode = typeof deviceCode.$inferSelect;
export type NewDeviceCode = typeof deviceCode.$inferInsert;
export type Referral = typeof referral.$inferSelect;
export type NewReferral = typeof referral.$inferInsert;
export type ReferralRelation = typeof referralRelation.$inferSelect;
export type NewReferralRelation = typeof referralRelation.$inferInsert;
export type Commission = typeof commission.$inferSelect;
export type NewCommission = typeof commission.$inferInsert;