// @openstarter/shared/config/domains/payment —— 支付相关设置项（Basic / Stripe / PayPal / Creem / Alipay / WeChat Pay / RevenueCat）。

import type { Setting } from "../types";

/** Payment tab 设置：basic_payment + stripe + paypal + alipay + wechat + creem + revenuecat。 */
export function getPaymentSettings(): Setting[] {
  return [
    // Basic
    {
      group: "basic_payment",
      name: "select_payment_enabled",
      tab: "payment",
      title: "Show payment method selector",
      type: "switch",
    },
    {
      group: "basic_payment",
      name: "default_payment_provider",
      options: [
        { label: "Stripe", value: "stripe" },
        { label: "Creem", value: "creem" },
        { label: "PayPal", value: "paypal" },
        { label: "Alipay", value: "alipay" },
        { label: "WeChat Pay", value: "wechat" },
      ],
      tab: "payment",
      title: "Default provider",
      type: "select",
    },

    // Stripe
    {
      group: "stripe",
      name: "stripe_enabled",
      tab: "payment",
      title: "Enable Stripe",
      type: "switch",
    },
    {
      group: "stripe",
      name: "stripe_publishable_key",
      placeholder: "pk_xxx",
      tab: "payment",
      title: "Publishable Key",
      type: "text",
    },
    {
      group: "stripe",
      name: "stripe_secret_key",
      placeholder: "sk_xxx",
      tab: "payment",
      title: "Secret Key",
      type: "password",
    },
    {
      group: "stripe",
      name: "stripe_signing_secret",
      placeholder: "whsec_xxx",
      tab: "payment",
      title: "Webhook Signing Secret",
      type: "password",
    },

    // PayPal
    {
      group: "paypal",
      name: "paypal_enabled",
      tab: "payment",
      title: "Enable PayPal",
      type: "switch",
    },
    {
      group: "paypal",
      name: "paypal_client_id",
      placeholder: "xxx",
      tab: "payment",
      title: "Client ID",
      type: "text",
    },
    {
      group: "paypal",
      name: "paypal_client_secret",
      placeholder: "xxx",
      tab: "payment",
      title: "Client Secret",
      type: "password",
    },
    {
      group: "paypal",
      name: "paypal_webhook_id",
      placeholder: "xxx",
      tab: "payment",
      title: "Webhook ID",
      type: "text",
    },
    {
      group: "paypal",
      name: "paypal_environment",
      options: [
        { label: "Sandbox", value: "sandbox" },
        { label: "Live", value: "live" },
      ],
      tab: "payment",
      title: "Environment",
      type: "select",
    },

    // Alipay
    {
      group: "alipay",
      name: "alipay_enabled",
      tab: "payment",
      title: "Enable Alipay",
      type: "switch",
    },
    {
      group: "alipay",
      name: "alipay_app_id",
      placeholder: "2021xxx",
      tab: "payment",
      title: "App ID",
      type: "text",
    },
    {
      group: "alipay",
      name: "alipay_private_key",
      placeholder: "MIIEvQIBADANBgkq...",
      tab: "payment",
      title: "Private Key (RSA2)",
      type: "textarea",
    },
    {
      group: "alipay",
      name: "alipay_public_key",
      placeholder: "MIIBIjANBgkq...",
      tab: "payment",
      title: "Alipay Public Key",
      type: "textarea",
    },
    {
      group: "alipay",
      name: "alipay_notify_url",
      placeholder: "https://example.com/api/payment/notify/alipay",
      tab: "payment",
      title: "Notify URL (Webhook)",
      type: "text",
    },

    // WeChat Pay
    {
      group: "wechat",
      name: "wechat_enabled",
      tab: "payment",
      title: "Enable WeChat Pay",
      type: "switch",
    },
    {
      group: "wechat",
      name: "wechat_app_id",
      placeholder: "wx1234567890",
      tab: "payment",
      title: "AppID",
      type: "text",
    },
    {
      group: "wechat",
      name: "wechat_mch_id",
      placeholder: "1900000001",
      tab: "payment",
      title: "Merchant ID",
      type: "text",
    },
    {
      group: "wechat",
      name: "wechat_api_v3_key",
      placeholder: "32 chars",
      tab: "payment",
      title: "APIv3 Key",
      type: "password",
    },
    {
      group: "wechat",
      name: "wechat_private_key",
      placeholder: "MIIEvgIBADANBgkq...",
      tab: "payment",
      title: "Merchant Private Key (PEM)",
      type: "textarea",
    },
    {
      group: "wechat",
      name: "wechat_serial_no",
      placeholder: "xxx",
      tab: "payment",
      title: "Certificate Serial No",
      type: "text",
    },
    {
      group: "wechat",
      name: "wechat_notify_url",
      placeholder: "https://example.com/api/payment/notify/wechat",
      tab: "payment",
      title: "Notify URL (Webhook)",
      type: "text",
    },

    // Creem
    {
      group: "creem",
      name: "creem_enabled",
      tab: "payment",
      title: "Enable Creem",
      type: "switch",
    },
    {
      defaultValue: "sandbox",
      group: "creem",
      name: "creem_environment",
      options: [
        { label: "Sandbox", value: "sandbox" },
        { label: "Live", value: "live" },
      ],
      tab: "payment",
      title: "Environment",
      type: "select",
    },
    {
      group: "creem",
      name: "creem_api_key",
      placeholder: "cr_xxx",
      tab: "payment",
      title: "API Key",
      type: "password",
    },
    {
      group: "creem",
      name: "creem_signing_secret",
      placeholder: "whsec_xxx",
      tab: "payment",
      title: "Signing Secret",
      type: "password",
    },
    {
      group: "creem",
      name: "creem_product_ids_mapping",
      placeholder: '{"starter_monthly": "prod_xxx"}',
      tab: "payment",
      tip: "JSON map of your internal plan names to Creem product IDs.",
      title: "Product IDs Mapping",
      type: "textarea",
    },
    {
      group: "creem",
      name: "creem_test_amount",
      placeholder: "1",
      tab: "payment",
      tip: "Leave empty to use real amount, 1 = $0.01",
      title: "Test amount (cents)",
      type: "number",
    },

    // RevenueCat（移动端 IAP；webhook 验签与后台开关）。
    {
      group: "revenuecat",
      name: "revenuecat_enabled",
      tab: "payment",
      title: "Enable RevenueCat",
      type: "switch",
    },
    {
      group: "revenuecat",
      name: "revenuecat_webhook_secret",
      placeholder: "whsec_xxx",
      tab: "payment",
      title: "Webhook Signing Secret",
      type: "password",
    },
    {
      group: "revenuecat",
      name: "revenuecat_secret_api_key",
      placeholder: "sk_xxx",
      tab: "payment",
      tip: "Reserved for future server-side entitlement verification.",
      title: "Secret API Key",
      type: "password",
    },
  ];
}