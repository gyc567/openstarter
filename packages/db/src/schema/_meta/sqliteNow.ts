/**
 * SQLite-only SQL literal that yields the current epoch in milliseconds.
 *
 * SQLite has no `CURRENT_TIMESTAMP` equivalent that returns a millisecond
 * integer, so we compute the value from julianday('now'). Drizzle-kit emits
 * the literal unchanged into generated migrations; the runtime driver also
 * passes it through unmodified as the column default. Equivalent to PG/MySQL
 * `CURRENT_TIMESTAMP(6)` for downstream consumers.
 */

import { sql } from "drizzle-orm";

export const sqliteNowMs = sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`;