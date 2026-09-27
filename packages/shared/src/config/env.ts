// @openstarter/shared/config/env —— 环境变量兜底配置（R2.3 兜底源之一）。
//
// 设计要点：envConfigs 必须保持单一对象字面量（含每键 `readEnv(...) ?? <fallback>`
// 的求值顺序），不可拆分为 `Object.assign({}, authEnv, paymentEnv, ...)`。
// 一旦拆分，`??` 短路求值会在子对象内完成，回退链 `readEnv("AUTH_URL") ??
// readEnv("VITE_APP_URL") ?? ""` 等多步回退会因 Object.assign 的求值时机而失效，
// 导致读不到次级回退值。因此本文件刻意把所有键集中在一个对象字面量内。

import type { ConfigMap } from "./types";

// 服务端配置服务：统一从 process.env 读取（含 Vite 的 VITE_ 公共变量，服务端亦在 process.env 中）。
const procEnv: Record<string, string | undefined> =
  typeof process === "undefined" ? {} : process.env;

const readEnv = (key: string): string | undefined => procEnv[key];

/**
 * 环境变量配置（预定义默认）。缺失的键回退到此处的静态默认值（R2.3）。
 * getAllConfigs 以 { ...settingDefaults, ...envConfigs, ...dbConfigs } 合并，DB 覆盖 env。
 */
export const envConfigs: ConfigMap = {
  // 支付 - Alipay
  alipay_app_id: readEnv("ALIPAY_APP_ID") ?? "",
  alipay_notify_url: readEnv("ALIPAY_NOTIFY_URL") ?? "",
  alipay_private_key: readEnv("ALIPAY_PRIVATE_KEY") ?? "",
  alipay_public_key: readEnv("ALIPAY_PUBLIC_KEY") ?? "",
  app_description: readEnv("VITE_APP_DESCRIPTION") ?? "Ship your SaaS faster",
  app_logo: readEnv("VITE_APP_LOGO") ?? "/logo.svg",
  app_name: readEnv("VITE_APP_NAME") ?? "OpenStarter",
  // App（公开）
  app_url: readEnv("VITE_APP_URL") ?? "http://localhost:3000",
  apple_app_bundle_identifier: readEnv("APPLE_APP_BUNDLE_IDENTIFIER") ?? "",

  // 认证 - Apple Sign in
  apple_client_id: readEnv("APPLE_CLIENT_ID") ?? "",
  apple_client_secret: readEnv("APPLE_CLIENT_SECRET") ?? "",
  auth_secret: readEnv("AUTH_SECRET") ?? "",

  // 认证
  auth_url: readEnv("AUTH_URL") ?? readEnv("VITE_APP_URL") ?? "",

  // 支付 - Creem
  creem_api_key: readEnv("CREEM_API_KEY") ?? "",
  creem_environment: readEnv("CREEM_ENVIRONMENT") ?? "sandbox",
  creem_signing_secret: readEnv("CREEM_SIGNING_SECRET") ?? "",
  database_auth_token: readEnv("DATABASE_AUTH_TOKEN") ?? "",
  database_provider: readEnv("DATABASE_PROVIDER") ?? "sqlite",

  // 数据库
  database_url: readEnv("DATABASE_URL") ?? "",
  db_max_connections: readEnv("DB_MAX_CONNECTIONS") ?? "1",
  db_schema: readEnv("DB_SCHEMA") ?? "public",
  db_singleton_enabled: readEnv("DB_SINGLETON_ENABLED") ?? "false",
  inline_image_max_kb: readEnv("INLINE_IMAGE_MAX_KB") ?? "2048",

  // Locale（公开）
  locale: readEnv("VITE_DEFAULT_LOCALE") ?? "en",

  // 支付 - PayPal
  paypal_client_id: readEnv("PAYPAL_CLIENT_ID") ?? "",
  paypal_client_secret: readEnv("PAYPAL_CLIENT_SECRET") ?? "",
  paypal_environment: readEnv("PAYPAL_ENVIRONMENT") ?? "sandbox",
  paypal_webhook_id: readEnv("PAYPAL_WEBHOOK_ID") ?? "",

  // 支付 - RevenueCat（移动端 IAP）
  revenuecat_enabled: readEnv("REVENUECAT_ENABLED") ?? "",
  revenuecat_secret_api_key: readEnv("REVENUECAT_SECRET_API_KEY") ?? "",
  revenuecat_webhook_secret: readEnv("REVENUECAT_WEBHOOK_SECRET") ?? "",

  // AI（Replicate 提供 env 兜底；OpenAI/Anthropic 仅后台配置以避免误用机器环境变量）
  replicate_api_token: readEnv("REPLICATE_API_TOKEN") ?? "",

  // AI - OpenRouter / DeepSeek / Ollama（OpenAI 兼容渠道，env 兜底；
  // google/anthropic 沿用「仅后台配置」原则，不读 env）
  openrouter_api_key: readEnv("OPENROUTER_API_KEY") ?? "",
  openrouter_base_url: readEnv("OPENROUTER_BASE_URL") ?? "",
  deepseek_api_key: readEnv("DEEPSEEK_API_KEY") ?? "",
  deepseek_base_url: readEnv("DEEPSEEK_BASE_URL") ?? "",
  ollama_base_url: readEnv("OLLAMA_BASE_URL") ?? "",

  // 邮件 - Resend
  resend_api_key: readEnv("RESEND_API_KEY") ?? "",
  resend_sender_email:
    readEnv("RESEND_SENDER_EMAIL") ?? readEnv("RESEND_EMAIL_FROM") ?? "",
  storage_access_key: readEnv("STORAGE_ACCESS_KEY") ?? "",
  storage_bucket: readEnv("STORAGE_BUCKET") ?? "",

  // 存储 - S3 / R2
  storage_endpoint: readEnv("STORAGE_ENDPOINT") ?? "",
  storage_public_domain: readEnv("STORAGE_PUBLIC_DOMAIN") ?? "",
  storage_region: readEnv("STORAGE_REGION") ?? "auto",
  storage_secret_key: readEnv("STORAGE_SECRET_KEY") ?? "",
  stripe_publishable_key: readEnv("STRIPE_PUBLISHABLE_KEY") ?? "",

  // 支付 - Stripe
  stripe_secret_key: readEnv("STRIPE_SECRET_KEY") ?? "",
  stripe_signing_secret: readEnv("STRIPE_SIGNING_SECRET") ?? "",
  wechat_api_v3_key: readEnv("WECHAT_API_V3_KEY") ?? "",

  // 支付 - WeChat Pay
  wechat_app_id: readEnv("WECHAT_APP_ID") ?? "",
  wechat_mch_id: readEnv("WECHAT_MCH_ID") ?? "",
  wechat_notify_url: readEnv("WECHAT_NOTIFY_URL") ?? "",
  wechat_private_key: readEnv("WECHAT_PRIVATE_KEY") ?? "",
  wechat_serial_no: readEnv("WECHAT_SERIAL_NO") ?? "",
};