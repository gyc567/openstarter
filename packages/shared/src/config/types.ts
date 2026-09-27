// @openstarter/shared/config/types —— 共享类型与写入校验。
//
// 说明：validateSettingValue 仅依赖 Setting 类型，故置于 types.ts 内，避免
// 在 service.ts 中重复定义。

/** 配置键值对集合。 */
export type ConfigMap = Record<string, string>;

/** 单个配置项定义（驱动后台设置界面与写入校验）。 */
export interface Setting {
  defaultValue?: string;
  group: string;
  name: string;
  options?: { label: string; value: string }[];
  placeholder?: string;
  tab: string;
  tip?: string;
  title: string;
  type: "text" | "password" | "textarea" | "number" | "switch" | "select";
}

/** 配置分组（归属某个 tab）。 */
export interface SettingGroup {
  description?: string;
  name: string;
  tab: string;
  title: string;
}

/** 配置分页（Admin_Console 顶层分类）。 */
export interface SettingTab {
  name: string;
  title: string;
}

/**
 * 依据配置项声明的类型校验写入值；通过返回 null，否则返回可读的失败原因。
 * 空字符串视为「清空/未设置」，一律允许。
 */
export function validateSettingValue(
  setting: Setting,
  value: string,
): string | null {
  if (value === "") {
    return null;
  }

  switch (setting.type) {
    case "number": {
      if (!Number.isFinite(Number(value))) {
        return `Setting "${setting.name}" must be a valid number`;
      }
      return null;
    }
    case "switch": {
      if (value !== "true" && value !== "false") {
        return `Setting "${setting.name}" must be "true" or "false"`;
      }
      return null;
    }
    case "select": {
      const options = setting.options ?? [];
      if (
        options.length > 0 &&
        !options.some((opt) => opt.value === value)
      ) {
        const allowed = options.map((opt) => opt.value).join(", ");
        return `Setting "${setting.name}" must be one of: ${allowed}`;
      }
      return null;
    }
    default:
      return null;
  }
}