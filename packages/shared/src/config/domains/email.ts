// @openstarter/shared/config/domains/email —— 邮件服务设置项（General / Resend / Cloudflare Email）。

import type { Setting } from "../types";

/** Email tab 设置：email_general + resend + cloudflare_email。 */
export function getEmailSettings(): Setting[] {
  return [
    // General
    {
      defaultValue: "resend",
      group: "email_general",
      name: "email_provider",
      options: [
        { label: "Resend", value: "resend" },
        { label: "Cloudflare Email", value: "cloudflare" },
      ],
      tab: "email",
      title: "Email Provider",
      type: "select",
    },

    // Resend
    {
      group: "resend",
      name: "resend_api_key",
      placeholder: "re_xxx",
      tab: "email",
      title: "API Key",
      type: "password",
    },
    {
      group: "resend",
      name: "resend_sender_email",
      placeholder: "hello@example.com",
      tab: "email",
      title: "Sender Email",
      type: "text",
    },

    // Cloudflare Email
    {
      group: "cloudflare_email",
      name: "cloudflare_email_api_token",
      placeholder: "Bearer token with Email Send permission",
      tab: "email",
      title: "API Token",
      type: "password",
    },
    {
      group: "cloudflare_email",
      name: "cloudflare_email_account_id",
      placeholder: "Cloudflare account ID",
      tab: "email",
      title: "Account ID",
      type: "text",
    },
    {
      group: "cloudflare_email",
      name: "cloudflare_email_sender_email",
      placeholder: "hello@yourdomain.com",
      tab: "email",
      title: "Sender Email",
      type: "text",
    },
  ];
}