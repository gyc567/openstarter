// @openstarter/shared/config/domains/customer-service —— 客服与在线聊天设置项（Crisp / Tawk.to）。

import type { Setting } from "../types";

/** Customer Service tab 设置：crisp + tawk。 */
export function getCustomerServiceSettings(): Setting[] {
  return [
    // Crisp
    {
      group: "crisp",
      name: "crisp_enabled",
      tab: "customer_service",
      title: "Enable Crisp",
      type: "switch",
    },
    {
      group: "crisp",
      name: "crisp_website_id",
      placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      tab: "customer_service",
      title: "Website ID",
      type: "text",
    },

    // Tawk.to
    {
      group: "tawk",
      name: "tawk_enabled",
      tab: "customer_service",
      title: "Enable Tawk.to",
      type: "switch",
    },
    {
      group: "tawk",
      name: "tawk_property_id",
      placeholder: "xxxxxxxxxxxxxxxxxxxxxxxx",
      tab: "customer_service",
      title: "Property ID",
      type: "text",
    },
    {
      group: "tawk",
      name: "tawk_widget_id",
      placeholder: "1xxxxx/default",
      tab: "customer_service",
      title: "Widget ID",
      type: "text",
    },
  ];
}