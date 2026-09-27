/**
 * Shared metadata for the 3 dialect-specific schema files.
 *
 * Drizzle column types are not portable across dialects (sqlite-core vs
 * pg-core vs mysql-core), but the *shape* of the schema is identical. This
 * module captures that shape as plain data — no drizzle imports — so each
 * dialect assembly layer can build its own columns from the same descriptors.
 *
 * See `dialect/{sqlite,postgres,mysql}/columns.ts` for the per-dialect
 * factories that consume this metadata.
 */

/** Physical column kinds. The dialect factory maps each kind to the matching drizzle type. */
export type ColumnKind =
  /** Primary key column. Sqlite/PG use `text`; MySQL uses `varchar(255)`. */
  | "id"
  /** `text` in all 3 dialects. */
  | "text"
  /** MySQL `varchar(N, { length: N })` (defaults to 255 when `length` omitted). */
  | "varchar"
  /** MySQL `longtext`. Only used by mysql-core. */
  | "longtext"
  /** Boolean. Sqlite uses `integer({mode:'boolean'})`; pg/mysql use `boolean()`. */
  | "bool"
  /** 32-bit integer. Sqlite uses `integer`; pg uses `integer`; mysql uses `int`. */
  | "int"
  /** Millisecond-resolution timestamp. Sqlite uses `integer({mode:'timestamp_ms'})`; pg/mysql use `timestamp()`. */
  | "tsMs"
  /** Seconds-resolution timestamp. Sqlite-only legacy columns (kept on invite/user_invite). */
  | "tsSec"
  /** Floating point. */
  | "real"
  /** JSON. Sqlite uses `text({mode:'json'})`; pg uses `jsonb`; mysql uses `json`. */
  | "json";

/** Single-column descriptor consumed by the per-dialect assembly factories. */
export interface ColumnDescriptor {
  /** Drizzle property name on the table object (camelCase, e.g. `createdAt`). */
  name: string;
  /** Physical column name in the database (snake_case, e.g. `created_at`). */
  column: string;
  kind: ColumnKind;
  /** Varchar length. Ignored unless `kind === 'varchar'`. Defaults to 255 in the factory. */
  length?: number;
  /** Marks this column as a primary key. */
  primaryKey?: boolean;
  /** Adds `.notNull()`. */
  notNull?: boolean;
  /** Adds column-level `.unique()`. */
  unique?: boolean;
  /**
   * Adds a db-side CURRENT_TIMESTAMP default.
   *  - sqlite: `.default(sqliteNowMs)` (julianday literal)
   *  - pg / mysql: `.defaultNow()`
   */
  defaultNow?: boolean;
  /**
   * Adds a dialect-appropriate on-update hook.
   *  - sqlite / pg: `.$onUpdate(() => new Date())` (JS-side)
   *  - mysql: `.onUpdateNow()` (DB-side)
   */
  onUpdate?: boolean;
  /** Literal default value (string / number / boolean). */
  defaultValue?: string | number | boolean;
  /** Foreign-key reference. Resolved against sibling tables at table-build time. */
  references?: { table: string; column: string; onDelete?: "cascade" };
  /** Documentation only: enum-like string values the column is expected to hold. */
  enumValues?: readonly string[];
}

/** Composite / unique / secondary index description. */
export interface IndexDescriptor {
  name: string;
  columns: string[];
  unique?: boolean;
}

/** Full description of one table: columns + non-unique-indexes (column-level uniques live on `ColumnDescriptor.unique`). */
export interface TableDescriptor {
  name: string;
  columns: ColumnDescriptor[];
  indexes?: IndexDescriptor[];
}

// ─── Internal builder helpers (kept terse; final TABLE_METADATA below) ─────────

const c = (
  name: string,
  column: string,
  kind: ColumnKind,
  rest: Omit<ColumnDescriptor, "name" | "column" | "kind"> = {},
): ColumnDescriptor => ({ name, column, kind, ...rest });

// ─── Tables (alphabetically grouped by domain, matching the order of the
// dialect schema files) ──────────────────────────────────────────────────────

const user = {
  name: "user",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("name", "name", "text", { notNull: true }),
    c("email", "email", "varchar", { length: 255, notNull: true, unique: true }),
    c("emailVerified", "email_verified", "bool", { notNull: true, defaultValue: false }),
    c("image", "image", "text"),
    c("role", "role", "text"),
    c("banned", "banned", "bool", { defaultValue: false }),
    c("banReason", "ban_reason", "text"),
    c("banExpires", "ban_expires", "tsMs"),
    c("isAnonymous", "is_anonymous", "bool", { defaultValue: false }),
    c("twoFactorEnabled", "two_factor_enabled", "bool", { defaultValue: false }),
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
    c("updatedAt", "updated_at", "tsMs", { notNull: true, defaultNow: true, onUpdate: true }),
    c("ip", "ip", "varchar", { length: 45, notNull: true, defaultValue: "" }),
    c("locale", "locale", "varchar", { length: 20, notNull: true, defaultValue: "" }),
    c("utmSource", "utm_source", "varchar", { length: 100, notNull: true, defaultValue: "" }),
  ],
  indexes: [
    { name: "idx_user_name", columns: ["name"] },
    { name: "idx_user_created_at", columns: ["createdAt"] },
  ],
} as const satisfies TableDescriptor;

const session = {
  name: "session",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("token", "token", "varchar", { length: 255, notNull: true, unique: true }),
    c("userId", "user_id", "varchar", { length: 255, notNull: true, references: { table: "user", column: "id", onDelete: "cascade" } }),
    c("expiresAt", "expires_at", "tsMs", { notNull: true }),
    c("ipAddress", "ip_address", "varchar", { length: 45 }),
    c("userAgent", "user_agent", "text"),
    c("impersonatedBy", "impersonated_by", "varchar", { length: 255 }),
    c("activeOrganizationId", "active_organization_id", "varchar", { length: 255 }),
    c("activeTeamId", "active_team_id", "varchar", { length: 255 }),
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
    c("updatedAt", "updated_at", "tsMs", { notNull: true, onUpdate: true }),
  ],
  indexes: [
    { name: "idx_session_user_expires", columns: ["userId", "expiresAt"] },
  ],
} as const satisfies TableDescriptor;

const account = {
  name: "account",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("userId", "user_id", "varchar", { length: 255, notNull: true, references: { table: "user", column: "id", onDelete: "cascade" } }),
    c("providerId", "provider_id", "varchar", { length: 50, notNull: true }),
    c("accountId", "account_id", "varchar", { length: 255, notNull: true }),
    c("password", "password", "text"),
    c("accessToken", "access_token", "text"),
    c("accessTokenExpiresAt", "access_token_expires_at", "tsMs"),
    c("refreshToken", "refresh_token", "text"),
    c("refreshTokenExpiresAt", "refresh_token_expires_at", "tsMs"),
    c("idToken", "id_token", "text"),
    c("scope", "scope", "varchar", { length: 255 }),
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
    c("updatedAt", "updated_at", "tsMs", { notNull: true, onUpdate: true }),
  ],
  indexes: [
    { name: "idx_account_user_id", columns: ["userId"] },
    { name: "idx_account_provider_account", columns: ["providerId", "accountId"] },
  ],
} as const satisfies TableDescriptor;

const verification = {
  name: "verification",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("identifier", "identifier", "varchar", { length: 255, notNull: true }),
    c("value", "value", "text", { notNull: true }),
    c("expiresAt", "expires_at", "tsMs", { notNull: true }),
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
    c("updatedAt", "updated_at", "tsMs", { notNull: true, defaultNow: true, onUpdate: true }),
  ],
  indexes: [
    { name: "idx_verification_identifier", columns: ["identifier"] },
  ],
} as const satisfies TableDescriptor;

const passkey = {
  name: "passkey",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("userId", "user_id", "varchar", { length: 255, notNull: true, references: { table: "user", column: "id", onDelete: "cascade" } }),
    c("name", "name", "varchar", { length: 255 }),
    c("credentialID", "credential_id", "varchar", { length: 255, notNull: true }),
    c("publicKey", "public_key", "text", { notNull: true }),
    c("counter", "counter", "int", { notNull: true }),
    c("deviceType", "device_type", "varchar", { length: 50, notNull: true }),
    c("backedUp", "backed_up", "bool", { notNull: true }),
    c("transports", "transports", "text"),
    c("aaguid", "aaguid", "varchar", { length: 255 }),
    c("createdAt", "created_at", "tsMs"),
  ],
  indexes: [
    { name: "idx_passkey_user_id", columns: ["userId"] },
    { name: "idx_passkey_credential_id", columns: ["credentialID"] },
  ],
} as const satisfies TableDescriptor;

const twoFactor = {
  name: "two_factor",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("userId", "user_id", "varchar", { length: 255, notNull: true, references: { table: "user", column: "id", onDelete: "cascade" } }),
    c("secret", "secret", "varchar", { length: 255, notNull: true }),
    c("backupCodes", "backup_codes", "longtext", { notNull: true }),
    c("verified", "verified", "bool", { defaultValue: true }),
  ],
  indexes: [
    { name: "idx_two_factor_secret", columns: ["secret"] },
    { name: "idx_two_factor_user_id", columns: ["userId"] },
  ],
} as const satisfies TableDescriptor;

const organization = {
  name: "organization",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("name", "name", "varchar", { length: 255, notNull: true }),
    c("slug", "slug", "varchar", { length: 255, notNull: true, unique: true }),
    c("logo", "logo", "text"),
    c("metadata", "metadata", "longtext"),
    c("createdAt", "created_at", "tsMs", { notNull: true }),
  ],
  indexes: [
    { name: "idx_organization_slug", columns: ["slug"] },
  ],
} as const satisfies TableDescriptor;

const member = {
  name: "member",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("userId", "user_id", "varchar", { length: 255, notNull: true, references: { table: "user", column: "id", onDelete: "cascade" } }),
    c("organizationId", "organization_id", "varchar", { length: 255, notNull: true, references: { table: "organization", column: "id", onDelete: "cascade" } }),
    c("role", "role", "varchar", { length: 255, notNull: true, defaultValue: "member" }),
    c("createdAt", "created_at", "tsMs", { notNull: true }),
  ],
  indexes: [
    { name: "idx_member_organization_id", columns: ["organizationId"] },
    { name: "idx_member_user_id", columns: ["userId"] },
  ],
} as const satisfies TableDescriptor;

const invitation = {
  name: "invitation",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("inviterId", "inviter_id", "varchar", { length: 255, notNull: true, references: { table: "user", column: "id", onDelete: "cascade" } }),
    c("organizationId", "organization_id", "varchar", { length: 255, notNull: true, references: { table: "organization", column: "id", onDelete: "cascade" } }),
    c("teamId", "team_id", "varchar", { length: 255 }),
    c("email", "email", "varchar", { length: 255, notNull: true }),
    c("role", "role", "varchar", { length: 255 }),
    c("status", "status", "varchar", { length: 50, notNull: true, defaultValue: "pending", enumValues: ["pending", "accepted", "rejected", "canceled"] }),
    c("expiresAt", "expires_at", "tsMs", { notNull: true }),
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
  ],
  indexes: [
    { name: "idx_invitation_organization_id", columns: ["organizationId"] },
    { name: "idx_invitation_email", columns: ["email"] },
  ],
} as const satisfies TableDescriptor;

const team = {
  name: "team",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("name", "name", "varchar", { length: 255, notNull: true }),
    c("organizationId", "organization_id", "varchar", { length: 255, notNull: true, references: { table: "organization", column: "id", onDelete: "cascade" } }),
    c("createdAt", "created_at", "tsMs", { notNull: true }),
    c("updatedAt", "updated_at", "tsMs", { onUpdate: true }),
  ],
  indexes: [
    { name: "idx_team_organization_id", columns: ["organizationId"] },
  ],
} as const satisfies TableDescriptor;

const teamMember = {
  name: "team_member",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("userId", "user_id", "varchar", { length: 255, notNull: true, references: { table: "user", column: "id", onDelete: "cascade" } }),
    c("teamId", "team_id", "varchar", { length: 255, notNull: true, references: { table: "team", column: "id", onDelete: "cascade" } }),
    c("createdAt", "created_at", "tsMs"),
  ],
  indexes: [
    { name: "idx_team_member_team_id", columns: ["teamId"] },
    { name: "idx_team_member_user_id", columns: ["userId"] },
  ],
} as const satisfies TableDescriptor;

const deviceCode = {
  name: "device_code",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("deviceCode", "device_code", "varchar", { length: 255, notNull: true, unique: true }),
    c("userCode", "user_code", "varchar", { length: 255, notNull: true }),
    c("userId", "user_id", "varchar", { length: 255 }),
    c("clientId", "client_id", "varchar", { length: 255 }),
    c("scope", "scope", "varchar", { length: 255 }),
    c("status", "status", "varchar", { length: 255, notNull: true }),
    c("expiresAt", "expires_at", "tsMs", { notNull: true }),
    c("pollingInterval", "polling_interval", "int"),
    c("lastPolledAt", "last_polled_at", "tsMs"),
  ],
  indexes: [
    { name: "idx_device_code_user_code", columns: ["userCode"] },
    { name: "idx_device_code_status", columns: ["status"] },
  ],
} as const satisfies TableDescriptor;

const config = {
  name: "config",
  columns: [
    c("name", "name", "varchar", { length: 255, notNull: true, unique: true }),
    c("value", "value", "text"),
  ],
} as const satisfies TableDescriptor;

const taxonomy = {
  name: "taxonomy",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("userId", "user_id", "varchar", { length: 255, notNull: true, references: { table: "user", column: "id", onDelete: "cascade" } }),
    c("parentId", "parent_id", "varchar", { length: 255 }),
    c("type", "type", "varchar", { length: 50, notNull: true }),
    c("slug", "slug", "varchar", { length: 255, notNull: true, unique: true }),
    c("title", "title", "varchar", { length: 255, notNull: true }),
    c("description", "description", "text"),
    c("image", "image", "text"),
    c("icon", "icon", "varchar", { length: 255 }),
    c("status", "status", "varchar", { length: 50, notNull: true }),
    c("sort", "sort", "int", { notNull: true, defaultValue: 0 }),
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
    c("updatedAt", "updated_at", "tsMs", { notNull: true, onUpdate: true }),
    c("deletedAt", "deleted_at", "tsMs"),
  ],
  indexes: [
    { name: "idx_taxonomy_type_status", columns: ["type", "status"] },
  ],
} as const satisfies TableDescriptor;

const post = {
  name: "post",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("userId", "user_id", "varchar", { length: 255, notNull: true, references: { table: "user", column: "id", onDelete: "cascade" } }),
    c("parentId", "parent_id", "varchar", { length: 255 }),
    c("type", "type", "varchar", { length: 50, notNull: true }),
    c("slug", "slug", "varchar", { length: 255, notNull: true, unique: true }),
    c("title", "title", "varchar", { length: 255 }),
    c("description", "description", "text"),
    c("image", "image", "text"),
    c("content", "content", "longtext"),
    c("categories", "categories", "text"),
    c("tags", "tags", "text"),
    c("authorName", "author_name", "varchar", { length: 255 }),
    c("authorImage", "author_image", "text"),
    c("status", "status", "varchar", { length: 50, notNull: true }),
    c("sort", "sort", "int", { notNull: true, defaultValue: 0 }),
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
    c("updatedAt", "updated_at", "tsMs", { notNull: true, onUpdate: true }),
    c("deletedAt", "deleted_at", "tsMs"),
  ],
  indexes: [
    { name: "idx_post_type_status", columns: ["type", "status"] },
  ],
} as const satisfies TableDescriptor;

const order = {
  name: "order",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("userId", "user_id", "varchar", { length: 255, notNull: true, references: { table: "user", column: "id", onDelete: "cascade" } }),
    c("userEmail", "user_email", "varchar", { length: 255 }),
    c("orderNo", "order_no", "varchar", { length: 255, notNull: true, unique: true }),
    c("productId", "product_id", "varchar", { length: 255 }),
    c("productName", "product_name", "varchar", { length: 255 }),
    c("paymentProductId", "payment_product_id", "varchar", { length: 255 }),
    c("paymentUserId", "payment_user_id", "varchar", { length: 255 }),
    c("paymentUserName", "payment_user_name", "varchar", { length: 255 }),
    c("paymentEmail", "payment_email", "varchar", { length: 255 }),
    c("paymentSessionId", "payment_session_id", "varchar", { length: 255 }),
    c("paymentProvider", "payment_provider", "varchar", { length: 50, notNull: true }),
    c("paymentType", "payment_type", "varchar", { length: 50 }),
    c("paymentInterval", "payment_interval", "varchar", { length: 50 }),
    c("transactionId", "transaction_id", "varchar", { length: 255 }),
    c("subscriptionId", "subscription_id", "varchar", { length: 255 }),
    c("subscriptionNo", "subscription_no", "varchar", { length: 255 }),
    c("currency", "currency", "varchar", { length: 10, notNull: true }),
    c("amount", "amount", "int", { notNull: true }),
    c("discountAmount", "discount_amount", "int"),
    c("discountCurrency", "discount_currency", "varchar", { length: 10 }),
    c("discountCode", "discount_code", "varchar", { length: 255 }),
    c("creditsAmount", "credits_amount", "int"),
    c("creditsValidDays", "credits_valid_days", "int"),
    c("paymentAmount", "payment_amount", "int"),
    c("paymentCurrency", "payment_currency", "varchar", { length: 10 }),
    c("paidAt", "paid_at", "tsMs"),
    c("planName", "plan_name", "varchar", { length: 255 }),
    c("status", "status", "varchar", { length: 50, notNull: true }),
    c("checkoutInfo", "checkout_info", "text", { notNull: true }),
    c("checkoutResult", "checkout_result", "text"),
    c("paymentResult", "payment_result", "text"),
    c("subscriptionResult", "subscription_result", "text"),
    c("checkoutUrl", "checkout_url", "text"),
    c("callbackUrl", "callback_url", "text"),
    c("description", "description", "text"),
    c("invoiceId", "invoice_id", "varchar", { length: 255 }),
    c("invoiceUrl", "invoice_url", "text"),
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
    c("updatedAt", "updated_at", "tsMs", { notNull: true, onUpdate: true }),
    c("deletedAt", "deleted_at", "tsMs"),
  ],
  indexes: [
    { name: "idx_order_user_status_payment_type", columns: ["userId", "status", "paymentType"] },
    { name: "idx_order_transaction_provider", columns: ["transactionId", "paymentProvider"] },
    { name: "idx_order_created_at", columns: ["createdAt"] },
  ],
} as const satisfies TableDescriptor;

const subscription = {
  name: "subscription",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("userId", "user_id", "varchar", { length: 255, notNull: true, references: { table: "user", column: "id", onDelete: "cascade" } }),
    c("userEmail", "user_email", "varchar", { length: 255 }),
    c("subscriptionId", "subscription_id", "varchar", { length: 255, notNull: true }),
    c("subscriptionNo", "subscription_no", "varchar", { length: 255, notNull: true, unique: true }),
    c("productId", "product_id", "varchar", { length: 255 }),
    c("productName", "product_name", "varchar", { length: 255 }),
    c("paymentProductId", "payment_product_id", "varchar", { length: 255 }),
    c("paymentUserId", "payment_user_id", "varchar", { length: 255 }),
    c("paymentProvider", "payment_provider", "varchar", { length: 50, notNull: true }),
    c("interval", "interval", "varchar", { length: 50 }),
    c("intervalCount", "interval_count", "int"),
    c("trialPeriodDays", "trial_period_days", "int"),
    c("currency", "currency", "varchar", { length: 10 }),
    c("amount", "amount", "int"),
    c("creditsAmount", "credits_amount", "int"),
    c("creditsValidDays", "credits_valid_days", "int"),
    c("currentPeriodStart", "current_period_start", "tsMs"),
    c("currentPeriodEnd", "current_period_end", "tsMs"),
    c("canceledAt", "canceled_at", "tsMs"),
    c("canceledEndAt", "canceled_end_at", "tsMs"),
    c("canceledReason", "canceled_reason", "text"),
    c("canceledReasonType", "canceled_reason_type", "varchar", { length: 50 }),
    c("planName", "plan_name", "varchar", { length: 255 }),
    c("status", "status", "varchar", { length: 50, notNull: true }),
    c("billingUrl", "billing_url", "text"),
    c("subscriptionResult", "subscription_result", "text"),
    c("description", "description", "text"),
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
    c("updatedAt", "updated_at", "tsMs", { notNull: true, onUpdate: true }),
    c("deletedAt", "deleted_at", "tsMs"),
  ],
  indexes: [
    { name: "idx_subscription_user_status_interval", columns: ["userId", "status", "interval"] },
    { name: "idx_subscription_provider_id", columns: ["subscriptionId", "paymentProvider"] },
    { name: "idx_subscription_created_at", columns: ["createdAt"] },
  ],
} as const satisfies TableDescriptor;

const credit = {
  name: "credit",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("userId", "user_id", "varchar", { length: 255, notNull: true, references: { table: "user", column: "id", onDelete: "cascade" } }),
    c("userEmail", "user_email", "varchar", { length: 255 }),
    c("orderNo", "order_no", "varchar", { length: 255 }),
    c("subscriptionNo", "subscription_no", "varchar", { length: 255 }),
    c("transactionNo", "transaction_no", "varchar", { length: 255, notNull: true, unique: true }),
    c("transactionType", "transaction_type", "varchar", { length: 50, notNull: true }),
    c("transactionScene", "transaction_scene", "varchar", { length: 50 }),
    c("credits", "credits", "int", { notNull: true }),
    c("remainingCredits", "remaining_credits", "int", { notNull: true, defaultValue: 0 }),
    c("description", "description", "text"),
    c("metadata", "metadata", "text"),
    c("consumedDetail", "consumed_detail", "text"),
    c("status", "status", "varchar", { length: 50, notNull: true }),
    c("expiresAt", "expires_at", "tsMs"),
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
    c("updatedAt", "updated_at", "tsMs", { notNull: true, onUpdate: true }),
    c("deletedAt", "deleted_at", "tsMs"),
  ],
  indexes: [
    { name: "idx_credit_consume_fifo", columns: ["userId", "status", "transactionType", "remainingCredits", "expiresAt"] },
    { name: "idx_credit_order_no", columns: ["orderNo"] },
    { name: "idx_credit_subscription_no", columns: ["subscriptionNo"] },
  ],
} as const satisfies TableDescriptor;

const apikey = {
  name: "apikey",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("userId", "user_id", "varchar", { length: 255, notNull: true, references: { table: "user", column: "id", onDelete: "cascade" } }),
    c("title", "title", "varchar", { length: 255, notNull: true }),
    c("keyHash", "key_hash", "varchar", { length: 255, notNull: true }),
    c("keyPrefix", "key_prefix", "varchar", { length: 255, notNull: true }),
    c("status", "status", "varchar", { length: 50, notNull: true }),
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
    c("updatedAt", "updated_at", "tsMs", { notNull: true, onUpdate: true }),
    c("deletedAt", "deleted_at", "tsMs"),
  ],
  indexes: [
    { name: "idx_apikey_user_status", columns: ["userId", "status"] },
    { name: "idx_apikey_keyhash_status", columns: ["keyHash", "status"] },
  ],
} as const satisfies TableDescriptor;

const role = {
  name: "role",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("name", "name", "varchar", { length: 255, notNull: true, unique: true }),
    c("title", "title", "varchar", { length: 255, notNull: true }),
    c("description", "description", "text"),
    c("status", "status", "varchar", { length: 50, notNull: true }),
    c("sort", "sort", "int", { notNull: true, defaultValue: 0 }),
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
    c("updatedAt", "updated_at", "tsMs", { notNull: true, onUpdate: true }),
  ],
  indexes: [
    { name: "idx_role_status", columns: ["status"] },
  ],
} as const satisfies TableDescriptor;

const permission = {
  name: "permission",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("code", "code", "varchar", { length: 255, notNull: true, unique: true }),
    c("title", "title", "varchar", { length: 255, notNull: true }),
    c("description", "description", "text"),
    c("resource", "resource", "varchar", { length: 50, notNull: true }),
    c("action", "action", "varchar", { length: 50, notNull: true }),
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
    c("updatedAt", "updated_at", "tsMs", { notNull: true, onUpdate: true }),
  ],
  indexes: [
    { name: "idx_permission_resource_action", columns: ["resource", "action"] },
  ],
} as const satisfies TableDescriptor;

const rolePermission = {
  name: "role_permission",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("roleId", "role_id", "varchar", { length: 255, notNull: true, references: { table: "role", column: "id", onDelete: "cascade" } }),
    c("permissionId", "permission_id", "varchar", { length: 255, notNull: true, references: { table: "permission", column: "id", onDelete: "cascade" } }),
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
    c("updatedAt", "updated_at", "tsMs", { notNull: true, onUpdate: true }),
    c("deletedAt", "deleted_at", "tsMs"),
  ],
  indexes: [
    { name: "idx_role_permission_role_permission", columns: ["roleId", "permissionId"] },
  ],
} as const satisfies TableDescriptor;

const userRole = {
  name: "user_role",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("userId", "user_id", "varchar", { length: 255, notNull: true, references: { table: "user", column: "id", onDelete: "cascade" } }),
    c("roleId", "role_id", "varchar", { length: 255, notNull: true, references: { table: "role", column: "id", onDelete: "cascade" } }),
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
    c("updatedAt", "updated_at", "tsMs", { notNull: true, onUpdate: true }),
    c("expiresAt", "expires_at", "tsMs"),
  ],
  indexes: [
    { name: "idx_user_role_user_expires", columns: ["userId", "expiresAt"] },
    { name: "uq_user_role_user_role", columns: ["userId", "roleId"], unique: true },
  ],
} as const satisfies TableDescriptor;

const aiModel = {
  name: "ai_model",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("provider", "provider", "varchar", { length: 50, notNull: true }),
    c("modelId", "model_id", "varchar", { length: 255, notNull: true }),
    c("displayName", "display_name", "varchar", { length: 255, notNull: true }),
    c("mediaType", "media_type", "varchar", { length: 50, notNull: true }),
    c("enabled", "enabled", "bool", { notNull: true, defaultValue: true }),
    c("sortOrder", "sort_order", "int", { notNull: true, defaultValue: 0 }),
    c("creditPrice", "credit_price", "int", { notNull: true, defaultValue: 0 }),
    c("maxOutputTokens", "max_output_tokens", "int"),
    c("metadata", "metadata", "longtext"),
    c("optionsSchema", "options_schema", "longtext"),
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
    c("updatedAt", "updated_at", "tsMs", { notNull: true, onUpdate: true }),
  ],
  indexes: [
    { name: "idx_ai_model_enabled_media", columns: ["enabled", "mediaType", "sortOrder"] },
    { name: "uq_ai_model_provider_model", columns: ["provider", "modelId"], unique: true },
  ],
} as const satisfies TableDescriptor;

const aiTask = {
  name: "ai_task",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("userId", "user_id", "varchar", { length: 255, notNull: true, references: { table: "user", column: "id", onDelete: "cascade" } }),
    c("provider", "provider", "varchar", { length: 50, notNull: true }),
    c("model", "model", "varchar", { length: 255, notNull: true }),
    c("mediaType", "media_type", "varchar", { length: 50, notNull: true }),
    c("scene", "scene", "varchar", { length: 100, notNull: true, defaultValue: "" }),
    c("status", "status", "varchar", { length: 50, notNull: true }),
    c("taskId", "task_id", "varchar", { length: 255 }),
    c("prompt", "prompt", "longtext", { notNull: true }),
    c("options", "options", "longtext"),
    c("taskInfo", "task_info", "longtext"),
    c("taskResult", "task_result", "longtext"),
    c("costCredits", "cost_credits", "int", { notNull: true, defaultValue: 0 }),
    c("creditId", "credit_id", "varchar", { length: 255 }),
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
    c("updatedAt", "updated_at", "tsMs", { notNull: true, onUpdate: true }),
    c("deletedAt", "deleted_at", "tsMs"),
  ],
  indexes: [
    { name: "idx_ai_task_user_media_type", columns: ["userId", "mediaType"] },
    { name: "idx_ai_task_media_type_status", columns: ["mediaType", "status"] },
  ],
} as const satisfies TableDescriptor;

const chat = {
  name: "chat",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("userId", "user_id", "varchar", { length: 255, notNull: true, references: { table: "user", column: "id", onDelete: "cascade" } }),
    c("provider", "provider", "varchar", { length: 50, notNull: true }),
    c("model", "model", "varchar", { length: 255, notNull: true }),
    c("title", "title", "varchar", { length: 255, notNull: true, defaultValue: "" }),
    c("status", "status", "varchar", { length: 50, notNull: true }),
    c("content", "content", "longtext"),
    c("parts", "parts", "longtext", { notNull: true }),
    c("metadata", "metadata", "longtext"),
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
    c("updatedAt", "updated_at", "tsMs", { notNull: true, onUpdate: true }),
  ],
  indexes: [
    { name: "idx_chat_user_status", columns: ["userId", "status"] },
  ],
} as const satisfies TableDescriptor;

const chatMessage = {
  name: "chat_message",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("userId", "user_id", "varchar", { length: 255, notNull: true, references: { table: "user", column: "id", onDelete: "cascade" } }),
    c("chatId", "chat_id", "varchar", { length: 255, notNull: true, references: { table: "chat", column: "id", onDelete: "cascade" } }),
    c("provider", "provider", "varchar", { length: 50, notNull: true }),
    c("model", "model", "varchar", { length: 255, notNull: true }),
    c("role", "role", "varchar", { length: 50, notNull: true }),
    c("status", "status", "varchar", { length: 50, notNull: true }),
    c("parts", "parts", "longtext", { notNull: true }),
    c("metadata", "metadata", "longtext"),
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
    c("updatedAt", "updated_at", "tsMs", { notNull: true, onUpdate: true }),
  ],
  indexes: [
    { name: "idx_chat_message_chat_id", columns: ["chatId", "status"] },
    { name: "idx_chat_message_user_id", columns: ["userId", "status"] },
  ],
} as const satisfies TableDescriptor;

const ticket = {
  name: "ticket",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("userId", "user_id", "varchar", { length: 255, notNull: true, references: { table: "user", column: "id" } }),
    c("title", "title", "varchar", { length: 255, notNull: true }),
    c("status", "status", "varchar", { length: 50, notNull: true, defaultValue: "open" }),
    // BUG FIX: were `mode: "timestamp"` + JS-side $defaultFn() in schema.sqlite.ts;
    // unified on tsMs + db-side defaultNow to match every other timestamp column.
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
    c("updatedAt", "updated_at", "tsMs", { notNull: true, defaultNow: true }),
  ],
  indexes: [
    { name: "idx_ticket_user", columns: ["userId"] },
    { name: "idx_ticket_status", columns: ["status"] },
  ],
} as const satisfies TableDescriptor;

const ticketMessage = {
  name: "ticket_message",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("ticketId", "ticket_id", "varchar", { length: 255, notNull: true, references: { table: "ticket", column: "id" } }),
    c("userId", "user_id", "varchar", { length: 255, notNull: true, references: { table: "user", column: "id" } }),
    c("role", "role", "varchar", { length: 50, notNull: true, defaultValue: "user" }),
    c("content", "content", "longtext", { notNull: true }),
    c("attachments", "attachments", "longtext", { notNull: true, defaultValue: "[]" }),
    // BUG FIX: same ms-resolution + db-side defaultNow as ticket.createdAt.
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
  ],
  indexes: [
    { name: "idx_ticket_message_ticket", columns: ["ticketId"] },
  ],
} as const satisfies TableDescriptor;

const inviteCode = {
  name: "invite_code",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("code", "code", "varchar", { length: 255, notNull: true, unique: true }),
    c("createdBy", "created_by", "varchar", { length: 255, references: { table: "user", column: "id" } }),
    c("maxUses", "max_uses", "int", { notNull: true, defaultValue: 1 }),
    c("usedCount", "used_count", "int", { notNull: true, defaultValue: 0 }),
    c("trialDays", "trial_days", "int", { notNull: true, defaultValue: 15 }),
    c("note", "note", "text", { defaultValue: "" }),
    // SQLite-only tsSec columns (kept for parity with the current sqlite snapshot).
    c("expiresAt", "expires_at", "tsSec"),
    c("createdAt", "created_at", "tsSec", { notNull: true, defaultNow: true }),
  ],
  indexes: [
    { name: "idx_invite_code_code", columns: ["code"] },
  ],
} as const satisfies TableDescriptor;

const userInvite = {
  name: "user_invite",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("userId", "user_id", "varchar", { length: 255, notNull: true, unique: true, references: { table: "user", column: "id" } }),
    c("inviteCodeId", "invite_code_id", "varchar", { length: 255, notNull: true, references: { table: "invite_code", column: "id" } }),
    // SQLite-only tsSec columns (kept for parity with the current sqlite snapshot).
    c("trialEndsAt", "trial_ends_at", "tsSec", { notNull: true }),
    c("activatedAt", "activated_at", "tsSec", { notNull: true, defaultNow: true }),
  ],
  indexes: [
    { name: "idx_user_invite_user", columns: ["userId"] },
    { name: "idx_user_invite_code", columns: ["inviteCodeId"] },
  ],
} as const satisfies TableDescriptor;

const referral = {
  name: "referral",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("userId", "user_id", "varchar", { length: 255, notNull: true, unique: true, references: { table: "user", column: "id" } }),
    c("code", "code", "varchar", { length: 255, notNull: true, unique: true }),
    c("customRate", "custom_rate", "int"),
    c("note", "note", "text", { defaultValue: "" }),
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
    c("updatedAt", "updated_at", "tsMs", { notNull: true, defaultNow: true }),
  ],
  indexes: [
    { name: "idx_referral_code", columns: ["code"] },
  ],
} as const satisfies TableDescriptor;

const referralRelation = {
  name: "referral_relation",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("referrerId", "referrer_id", "varchar", { length: 255, notNull: true, references: { table: "user", column: "id" } }),
    c("referredUserId", "referred_user_id", "varchar", { length: 255, notNull: true, unique: true, references: { table: "user", column: "id" } }),
    c("code", "code", "varchar", { length: 255, notNull: true }),
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
  ],
  indexes: [
    { name: "idx_referral_relation_referrer", columns: ["referrerId"] },
    { name: "idx_referral_relation_code", columns: ["code"] },
  ],
} as const satisfies TableDescriptor;

const commission = {
  name: "commission",
  columns: [
    c("id", "id", "id", { primaryKey: true }),
    c("referrerId", "referrer_id", "varchar", { length: 255, notNull: true, references: { table: "user", column: "id" } }),
    c("referredUserId", "referred_user_id", "varchar", { length: 255, notNull: true, references: { table: "user", column: "id" } }),
    c("orderNo", "order_no", "varchar", { length: 255, notNull: true, unique: true }),
    c("transactionNo", "transaction_no", "varchar", { length: 255 }),
    c("baseAmount", "base_amount", "int", { notNull: true }),
    c("baseCurrency", "base_currency", "text"),
    c("rate", "rate", "int", { notNull: true }),
    c("commissionCredits", "commission_credits", "int", { notNull: true }),
    c("cashAmount", "cash_amount", "int"),
    c("status", "status", "varchar", { length: 32, notNull: true }),
    c("settledAt", "settled_at", "tsMs"),
    c("settledBy", "settled_by", "text"),
    c("note", "note", "text"),
    c("createdAt", "created_at", "tsMs", { notNull: true, defaultNow: true }),
    c("updatedAt", "updated_at", "tsMs", { notNull: true, defaultNow: true }),
  ],
  indexes: [
    { name: "idx_commission_referrer_status", columns: ["referrerId", "status"] },
    { name: "idx_commission_status", columns: ["status"] },
  ],
} as const satisfies TableDescriptor;

/**
 * Master table metadata, in declaration order. This order is preserved by
 * each dialect assembly layer so table-builder introspection and downstream
 * column-name iteration remain stable across schemas.
 */
export const TABLE_METADATA = [
  user,
  session,
  account,
  verification,
  passkey,
  twoFactor,
  organization,
  member,
  invitation,
  team,
  teamMember,
  deviceCode,
  config,
  taxonomy,
  post,
  order,
  subscription,
  credit,
  apikey,
  role,
  permission,
  rolePermission,
  userRole,
  aiModel,
  aiTask,
  chat,
  chatMessage,
  ticket,
  ticketMessage,
  inviteCode,
  userInvite,
  referral,
  referralRelation,
  commission,
] as const satisfies readonly TableDescriptor[];

/**
 * Type-level exports derived from TABLE_METADATA. Each dialect assembly
 * layer uses these to type its table constants as concrete
 * `*TableWithColumns<…>` without hand-writing per-table column lists, and
 * without the `as any` propagation that breaks `db.insert(table).returning()`
 * typing for downstream consumers.
 *
 *  - `TableMetadataName` — the union of table names (snake_case DB names).
 *  - `ColsOf<N>`         — `{ name: <dialect column type>; … }` for table N.
 */
export type TableMetadataName = (typeof TABLE_METADATA)[number]["name"];

export type ColsOf<
  N extends TableMetadataName,
  TCol,
> = Extract<
  (typeof TABLE_METADATA)[number],
  { name: N }
> extends { columns: ReadonlyArray<infer E> }
  ? { [K in (E extends { name: infer Name extends string } ? Name : never)]: TCol }
  : never;