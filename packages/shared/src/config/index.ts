// @openstarter/shared/config 包入口（聚合 barrel）。
//
// 此文件作为 `@openstarter/shared/config` 的解析目标（packages/shared/package.json
// 的 "./*" 通配指向 ./src/*.ts，本目录即 config/index.ts），按主题域重新聚合：
//
// - types：ConfigMap / Setting / SettingGroup / SettingTab / validateSettingValue
// - metadata：getSettingTabs / getSettingGroups / getSettings / settingsByName / settingDefaults
// - env：envConfigs / readEnv（readEnv 不导出，仅本模块内部使用）
// - security：PROTECTED_CONFIG_KEYS / SECRET_SETTING_NAMES（不导出） / isSecretConfigKey / maskConfigValue / isMaskedConfigValue
// - service：getDbConfigs / getAllConfigs / getConfig / saveConfigs / getAdminConfigs
//
// 所有公开符号保持与原 config.ts 完全一致；外部消费者无需感知拆分。

export type { ConfigMap, Setting, SettingGroup, SettingTab } from "./types";
export {
  getSettingTabs,
  getSettingGroups,
  getSettings,
} from "./metadata";
export { envConfigs } from "./env";
export {
  PROTECTED_CONFIG_KEYS,
  isSecretConfigKey,
  maskConfigValue,
  isMaskedConfigValue,
} from "./security";
export {
  getDbConfigs,
  getAllConfigs,
  getConfig,
  saveConfigs,
  getAdminConfigs,
} from "./service";