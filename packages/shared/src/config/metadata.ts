// @openstarter/shared/config/metadata —— 配置元数据（tabs / groups / settings 聚合 + 模块级派生）。
//
// 设计要点：
// - getSettings() 作为聚合器，按 tab 调用各 domains/* 模块的 getXxxSettings() 后合并；
// - allSettings / settingsByName / settingDefaults 在模块加载时一次性派生，
//   供 security.ts（秘密键识别）与 service.ts（写入校验 / 缓存键）复用，
//   保证派生数据全局单实例，零额外计算开销。

import type { ConfigMap, Setting, SettingGroup, SettingTab } from "./types";
import { getAiSettings } from "./domains/ai";
import { getAnalyticsSettings } from "./domains/analytics";
import { getAuthSettings } from "./domains/auth";
import { getCustomerServiceSettings } from "./domains/customer-service";
import { getEmailSettings } from "./domains/email";
import { getGeneralSettings } from "./domains/general";
import { getPaymentSettings } from "./domains/payment";
import { getStorageSettings } from "./domains/storage";

/** 顶层分页：auth / payment / email / storage / ai / analytics 等。 */
export function getSettingTabs(): SettingTab[] {
  return [
    { name: "general", title: "General" },
    { name: "auth", title: "Auth" },
    { name: "payment", title: "Payment" },
    { name: "email", title: "Email" },
    { name: "storage", title: "Storage" },
    { name: "ai", title: "AI" },
    { name: "analytics", title: "Analytics" },
    { name: "customer_service", title: "Customer Service" },
  ];
}

/** 分组：每个分组归属一个 tab，含积分（credit）、认证、支付、邮件、存储、AI 等。 */
export function getSettingGroups(): SettingGroup[] {
  return [
    {
      description: "Basic application settings",
      name: "appinfo",
      tab: "general",
      title: "App Info",
    },
    {
      description: "Default role for new users",
      name: "user_role",
      tab: "general",
      title: "User Roles",
    },
    {
      description: "Initial credits for new users",
      name: "credit",
      tab: "general",
      title: "Credits",
    },
    {
      description: "Email/password authentication",
      name: "email_auth",
      tab: "auth",
      title: "Email Auth",
    },
    {
      description: "Google OAuth login",
      name: "google_auth",
      tab: "auth",
      title: "Google Auth",
    },
    {
      description: "GitHub OAuth login",
      name: "github_auth",
      tab: "auth",
      title: "GitHub Auth",
    },
    {
      description: "Sign in with Apple OAuth",
      name: "apple_auth",
      tab: "auth",
      title: "Apple Auth",
    },
    {
      description: "Passwordless email magic link login",
      name: "magic_link_auth",
      tab: "auth",
      title: "Magic Link",
    },
    {
      description: "Passwordless email one-time password login",
      name: "email_otp_auth",
      tab: "auth",
      title: "Email OTP",
    },
    {
      description: "Temporary guest sessions for anonymous users",
      name: "anonymous_auth",
      tab: "auth",
      title: "Anonymous Auth",
    },
    {
      description: "Payment general settings",
      name: "basic_payment",
      tab: "payment",
      title: "Basic",
    },
    {
      description: "Stripe payment gateway",
      name: "stripe",
      tab: "payment",
      title: "Stripe",
    },
    {
      description: "PayPal payment gateway",
      name: "paypal",
      tab: "payment",
      title: "PayPal",
    },
    {
      description: "Creem payment gateway",
      name: "creem",
      tab: "payment",
      title: "Creem",
    },
    {
      description: "Alipay payment gateway (native)",
      name: "alipay",
      tab: "payment",
      title: "Alipay",
    },
    {
      description: "WeChat Pay gateway (native)",
      name: "wechat",
      tab: "payment",
      title: "WeChat Pay",
    },
    {
      description: "RevenueCat in-app purchase (mobile IAP)",
      name: "revenuecat",
      tab: "payment",
      title: "RevenueCat",
    },
    {
      description: "Email provider selection",
      name: "email_general",
      tab: "email",
      title: "General",
    },
    {
      description: "Resend email service",
      name: "resend",
      tab: "email",
      title: "Resend",
    },
    {
      description: "Cloudflare Email Service",
      name: "cloudflare_email",
      tab: "email",
      title: "Cloudflare Email",
    },
    {
      description: "Object storage settings",
      name: "r2",
      tab: "storage",
      title: "Cloudflare R2 / S3",
    },
    {
      description: "OpenAI (or compatible) API",
      name: "openai",
      tab: "ai",
      title: "OpenAI",
    },
    {
      description: "Anthropic Claude API",
      name: "anthropic",
      tab: "ai",
      title: "Anthropic",
    },
    {
      description: "Replicate AI API",
      name: "replicate",
      tab: "ai",
      title: "Replicate",
    },
    { description: "Fal AI API", name: "fal", tab: "ai", title: "Fal" },
    {
      description: "Google Gemini API",
      name: "google",
      tab: "ai",
      title: "Google",
    },
    {
      description: "OpenRouter aggregated LLM API",
      name: "openrouter",
      tab: "ai",
      title: "OpenRouter",
    },
    {
      description: "DeepSeek API",
      name: "deepseek",
      tab: "ai",
      title: "DeepSeek",
    },
    {
      description: "Local Ollama server",
      name: "ollama",
      tab: "ai",
      title: "Ollama",
    },
    {
      description: "Inject gtag.js with the configured Measurement ID",
      name: "google_analytics",
      tab: "analytics",
      title: "Google Analytics",
    },
    {
      description: "Inject plausible.js for self-hosted or cloud Plausible",
      name: "plausible",
      tab: "analytics",
      title: "Plausible",
    },
    {
      description:
        "OpenPanel product analytics. The RN SDK officially requires the clientSecret in the client; rotate it in the OpenPanel dashboard anytime",
      name: "openpanel",
      tab: "analytics",
      title: "OpenPanel",
    },
    {
      description: "Crisp live chat widget",
      name: "crisp",
      tab: "customer_service",
      title: "Crisp",
    },
    {
      description: "Tawk.to live chat widget",
      name: "tawk",
      tab: "customer_service",
      title: "Tawk.to",
    },
  ];
}

/**
 * 全部配置项定义（含 name / type / group / tab 等元数据）。
 * 既驱动后台分类展示（R2.4），也作为写入校验（R2.5）与秘密键识别的依据。
 *
 * 实现：聚合各 domains/* 模块的 getXxxSettings()；返回数组顺序保持与历史一致
 * （general → auth → payment → email → storage → ai → analytics → customer_service），
 * 便于测试与现有调用方依赖的隐式顺序稳定。
 */
export function getSettings(): Setting[] {
  return [
    ...getGeneralSettings(),
    ...getAuthSettings(),
    ...getPaymentSettings(),
    ...getEmailSettings(),
    ...getStorageSettings(),
    ...getAiSettings(),
    ...getAnalyticsSettings(),
    ...getCustomerServiceSettings(),
  ];
}

// 计算一次，供派生数据复用（settings 为静态定义）。
const allSettings = getSettings();

/** name → Setting 映射，供写入校验按键查规则。 */
export const settingsByName = new Map<string, Setting>(
  allSettings.map((setting) => [setting.name, setting]),
);

/**
 * 预定义默认值（来自 settings 的 defaultValue）：作为 getAllConfigs 的最底层兜底，
 * 覆盖 env 未提供、DB 未写入的开关/选择类项（如 email_auth_enabled=true）。R2.3
 */
export const settingDefaults: ConfigMap = {};
for (const setting of allSettings) {
  if (setting.defaultValue !== undefined) {
    settingDefaults[setting.name] = setting.defaultValue;
  }
}