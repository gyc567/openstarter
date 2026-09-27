// @openstarter/shared/config/service —— Config_Service（R2）。
//
// 运行时配置双源合并：环境变量（预定义默认，兜底）+ `config` 表（DB 覆盖）。
// - getAllConfigs：读取合并结果（env/默认兜底、DB 覆盖、秘密解密、1h 内存缓存）。R2.1/R2.3
// - saveConfigs：写入（upsert）——保护键丢弃、掩码值跳过、秘密加密、校验后落库。R2.2/R2.5
// - getAdminConfigs：面向后台的安全视图（保护键移除、秘密值掩码，绝不把 getAllConfigs 直接下发前端）。
// - getSettings/getSettingGroups/getSettingTabs：分组元数据，供 Admin_Console 分类渲染。R2.4
//
// 数据层：读写 `@openstarter/db/schema` 的 `config` 表；连接用 `@openstarter/db/server` 的
// `db()` 单例访问器（稳定契约）。经惰性 dynamic import 获取，把连接与其 env 解析延迟到首次
// DB 访问，配合下方 database_url 守卫与 try/catch，使无 DB 配置或 DB 不可用时读取优雅降级为
// 「仅 env/默认」，不阻断整体读取。
//
// 秘密加解密：复用本包 `./crypto`（同步；加密密钥缺失时抛错，见任务 3.1）。因此解密时用
// 同步调用 + try/catch：解密失败跳过该项、回退 env 值并告警，不阻断其余配置读取。
//
// 缓存生命周期：本文件模块本地持有 cachedConfigs / cacheTime / CACHE_TTL，不导出，
// 供本文件 saveConfigs（写后失效）与 getDbConfigs（读时命中）共用。

import type { Database } from "@openstarter/db";
import { config } from "@openstarter/db/schema";
import { logger } from "../logger";
import { decryptSecret, encryptSecret, isEncryptedSecret } from "../crypto";
import { settingDefaults, settingsByName } from "./metadata";
import { envConfigs } from "./env";
import {
  PROTECTED_CONFIG_KEYS,
  isMaskedConfigValue,
  isSecretConfigKey,
  maskConfigValue,
} from "./security";
import type { ConfigMap } from "./types";
import { validateSettingValue } from "./types";

// 1 小时内存缓存：秘密解密与 DB 读取有成本，配置项变动不频繁，故缓存 DB 侧结果。
let cachedConfigs: ConfigMap | null = null;
let cacheTime = 0;
const CACHE_TTL = 3_600_000; // 1 hour

// 连接：惰性获取 `@openstarter/db/server` 的 db() 单例访问器（稳定契约）。
// 运行时 dynamic import 延迟加载，避免在无 DB 环境下于模块加载期触发 db 包的 env 解析；
// db() 自身负责单例缓存（Node）/按请求新建（Cloudflare Workers 的 TCP 驱动）。
async function getDb(): Promise<Database> {
  const { db } = await import("@openstarter/db/server");
  return db();
}

/**
 * 读取 DB 中的配置项（解密秘密项，带 1h 缓存）。
 * 未配置数据库时返回空集合，使 env/默认兜底生效；任何读取/解密异常都不阻断整体读取。
 */
export async function getDbConfigs(): Promise<ConfigMap> {
  const now = Date.now();
  if (cachedConfigs && now - cacheTime < CACHE_TTL) {
    return cachedConfigs;
  }

  // 无数据库连接（且非 d1）——直接返回空集合，交由 env/默认兜底（R2.3）。
  if (!envConfigs.database_url && envConfigs.database_provider !== "d1") {
    return {};
  }

  try {
    const database = await getDb();
    const rows = await database.select().from(config);
    const result: ConfigMap = {};
    for (const row of rows) {
      if (!(row.name && row.value)) {
        continue;
      }

      if (isEncryptedSecret(row.value)) {
        try {
          // crypto 为同步实现；解密失败（如密钥轮换/缺失）时跳过该项，
          // 使 env 值（若有）生效，并告警，不阻断其余配置读取。
          result[row.name] = decryptSecret(row.value);
        } catch (error) {
          logger.warn(`[config] failed to decrypt "${row.name}", skipping`, error);
        }
      } else {
        result[row.name] = row.value;
      }
    }

    cachedConfigs = result;
    cacheTime = now;
    return result;
  } catch (error) {
    logger.warn("[config] failed to read configs from database", error);
    return {};
  }
}

/**
 * 合并读取全部配置：预定义默认 + 环境变量 + 数据库（数据库覆盖环境变量）。R2.1/R2.3
 */
export async function getAllConfigs(): Promise<ConfigMap> {
  const dbConfigs = await getDbConfigs();
  return { ...settingDefaults, ...envConfigs, ...dbConfigs };
}

/** 读取单个配置值（不存在返回 undefined）。 */
export async function getConfig(name: string): Promise<string | undefined> {
  const configs = await getAllConfigs();
  return configs[name];
}

/**
 * 批量写入配置（upsert）。R2.2/R2.5
 * - 保护键（PROTECTED_CONFIG_KEYS）静默丢弃；
 * - 后台回传的掩码值（未修改）跳过；
 * - 有对应 settings 定义者先按类型校验，失败即抛出可读原因并拒绝整批写入（不落库）；
 * - 秘密键落库前加密。
 *
 * 校验在任何 DB 写入之前完成，故校验失败不会产生任何持久化副作用。
 */
export async function saveConfigs(configs: ConfigMap): Promise<void> {
  const toWrite: { name: string; value: string }[] = [];
  for (const [name, value] of Object.entries(configs)) {
    if (PROTECTED_CONFIG_KEYS.has(name)) {
      continue;
    }
    if (isMaskedConfigValue(value)) {
      continue;
    }

    const setting = settingsByName.get(name);
    if (setting) {
      const reason = validateSettingValue(setting, value);
      if (reason) {
        throw new Error(reason);
      }
    }

    toWrite.push({
      name,
      value: isSecretConfigKey(name) ? encryptSecret(value) : value,
    });
  }

  if (toWrite.length === 0) {
    return;
  }

  const database = await getDb();
  // 每键独立 upsert；并行分发（键彼此唯一、互不冲突），避免循环内 await。
  await Promise.all(
    toWrite.map((entry) =>
      database
        .insert(config)
        .values(entry)
        .onConflictDoUpdate({
          set: { value: entry.value },
          target: config.name,
        }),
    ),
  );

  // 失效缓存，使后续读取返回新值（R2.2）。
  cachedConfigs = null;
  cacheTime = 0;
}

/**
 * 面向后台设置界面的安全视图：移除保护键、掩码秘密值。
 * 绝不能把 getAllConfigs() 直接下发前端——它含全部 env 秘密的明文。
 */
export async function getAdminConfigs(): Promise<ConfigMap> {
  const configs = await getAllConfigs();
  const result: ConfigMap = {};
  for (const [name, value] of Object.entries(configs)) {
    if (PROTECTED_CONFIG_KEYS.has(name)) {
      continue;
    }
    result[name] = isSecretConfigKey(name) && value ? maskConfigValue(value) : value;
  }
  return result;
}