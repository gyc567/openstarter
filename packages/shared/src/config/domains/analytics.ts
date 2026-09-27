// @openstarter/shared/config/domains/analytics —— 分析与追踪设置项（Google Analytics / Plausible / OpenPanel）。

import type { Setting } from "../types";

/** Analytics tab 设置：google_analytics + plausible + openpanel。 */
export function getAnalyticsSettings(): Setting[] {
  return [
    // Google Analytics
    {
      group: "google_analytics",
      name: "google_analytics_id",
      placeholder: "G-XXXXXXXXXX",
      tab: "analytics",
      title: "Measurement ID",
      type: "text",
    },

    // Plausible
    {
      group: "plausible",
      name: "plausible_domain",
      placeholder: "example.com",
      tab: "analytics",
      tip: "The domain registered in your Plausible dashboard",
      title: "Domain",
      type: "text",
    },
    {
      group: "plausible",
      name: "plausible_src",
      placeholder: "https://plausible.io/js/script.js",
      tab: "analytics",
      tip: "Use https://plausible.io/js/script.js for cloud, or your self-hosted URL",
      title: "Script Src",
      type: "text",
    },

    // OpenPanel（移动端）
    {
      group: "openpanel",
      name: "openpanel_client_id",
      placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      tab: "analytics",
      tip: "Client ID from your OpenPanel dashboard",
      title: "Client ID",
      type: "text",
    },
    {
      group: "openpanel",
      name: "openpanel_client_secret",
      placeholder: "xxxxxxxx",
      tab: "analytics",
      tip: "Required by the official RN SDK; rotate in the OpenPanel dashboard",
      title: "Client Secret",
      type: "password",
    },
    {
      group: "google_analytics",
      name: "ga_mobile_enabled",
      tab: "analytics",
      title: "Enable Mobile (Firebase)",
      type: "switch",
    },
  ];
}