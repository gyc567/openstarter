// @openstarter/shared/config/domains/general —— App Info / User Roles / Credits 设置项。

import type { Setting } from "../types";

/** General tab 设置：appinfo + user_role + credit。 */
export function getGeneralSettings(): Setting[] {
  return [
    // App Info
    {
      group: "appinfo",
      name: "app_name",
      placeholder: "My App",
      tab: "general",
      title: "App Name",
      type: "text",
    },
    {
      group: "appinfo",
      name: "app_description",
      placeholder: "Ship your SaaS faster",
      tab: "general",
      title: "App Description",
      type: "textarea",
    },
    {
      group: "appinfo",
      name: "app_url",
      placeholder: "https://example.com",
      tab: "general",
      title: "App URL",
      type: "text",
    },

    // User Roles
    {
      group: "user_role",
      name: "initial_role_enabled",
      tab: "general",
      title: "Auto-assign role for new users",
      type: "switch",
    },
    {
      group: "user_role",
      name: "initial_role_name",
      placeholder: "viewer",
      tab: "general",
      title: "Default role name",
      type: "text",
    },

    // Credits
    {
      group: "credit",
      name: "initial_credits_enabled",
      tab: "general",
      title: "Grant credits on signup",
      type: "switch",
    },
    {
      group: "credit",
      name: "initial_credits_amount",
      placeholder: "100",
      tab: "general",
      title: "Credits amount",
      type: "number",
    },
    {
      group: "credit",
      name: "initial_credits_valid_days",
      placeholder: "365",
      tab: "general",
      title: "Valid days",
      type: "number",
    },
    {
      group: "credit",
      name: "initial_credits_description",
      placeholder: "Welcome bonus",
      tab: "general",
      title: "Description",
      type: "text",
    },
  ];
}