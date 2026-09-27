// @openstarter/shared/config/security —— 保护键与秘密键识别 + 掩码工具。
//
// 职责：
// - PROTECTED_CONFIG_KEYS：基础设施级密钥（auth_secret / database_url / db_schema 等），
//   后台 / DB 配置层禁止写入，只能来自环境变量。
// - SECRET_SETTING_NAMES + SECRET_KEY_PATTERN：联合判定某配置键是否为秘密（需加密 + 掩码）。
// - maskConfigValue / isMaskedConfigValue：后台与 admin API 的安全展示往返。
//
// 注意：本文件不直接读取 process.env / 不导入 crypto；秘密键集合由 metadata.ts 派生。

import type { Setting } from "./types";
import { settingsByName } from "./metadata";

/**
 * 保护键：绝不经后台/DB 配置层写入，只能来自环境变量。
 * 覆盖会话签名密钥与数据库连接等基础设施级机密——阻止「越权改写会话签名密钥/切换数据库连接」。
 */
export const PROTECTED_CONFIG_KEYS: ReadonlySet<string> = new Set([
  "auth_secret",
  "database_url",
  "database_auth_token",
  "database_provider",
  "db_schema",
  "db_singleton_enabled",
  "db_max_connections",
]);

/**
 * 秘密键集合：其值为机密，落库时静态加密、返回后台时掩码。
 * 由 settings 定义派生（password 字段 + 私钥），再以名称模式兜底，
 * 使 env-only 秘密（如 stripe_secret_key）与未来自定义键无需登记即被覆盖。
 */
export const SECRET_SETTING_NAMES: ReadonlySet<string> = new Set<string>(
  Array.from(settingsByName.values())
    .filter(
      (setting: Setting) =>
        setting.type === "password" || setting.name.endsWith("_private_key"),
    )
    .map((setting) => setting.name),
);

const SECRET_KEY_PATTERN =
  /(_secret|_secret_key|_token|_password|_private_key|_api_key|_access_key|_api_v3_key)$/;

/** 判断某配置键是否为秘密键（需加密存储 + 掩码展示）。 */
export function isSecretConfigKey(name: string): boolean {
  return SECRET_SETTING_NAMES.has(name) || SECRET_KEY_PATTERN.test(name);
}

// 掩码前缀：秘密值不会以圆点开头，故可无歧义识别「掩码回传 = 未修改」。
const MASK_PREFIX = "••••••••";

/** 掩码一个秘密值用于展示：足够长时保留末 4 位，否则整体掩码。 */
export function maskConfigValue(value: string): string {
  return value.length > 8 ? `${MASK_PREFIX}${value.slice(-4)}` : MASK_PREFIX;
}

/** 后台回传的掩码值代表「未修改」，写入时应跳过。 */
export function isMaskedConfigValue(value: string): boolean {
  return value.startsWith(MASK_PREFIX);
}