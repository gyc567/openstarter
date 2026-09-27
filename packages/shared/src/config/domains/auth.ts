// @openstarter/shared/config/domains/auth —— 认证相关设置项（Email / Google / GitHub / Apple / Magic Link / Email OTP / Anonymous）。

import type { Setting } from "../types";

/** Auth tab 设置：email_auth + google_auth + github_auth + apple_auth + magic_link_auth + email_otp_auth + anonymous_auth。 */
export function getAuthSettings(): Setting[] {
  return [
    // Email
    {
      defaultValue: "true",
      group: "email_auth",
      name: "email_auth_enabled",
      tab: "auth",
      title: "Enable email auth",
      type: "switch",
    },
    {
      defaultValue: "false",
      group: "email_auth",
      name: "email_verification_enabled",
      tab: "auth",
      title: "Require email verification on sign up",
      type: "switch",
    },
    {
      defaultValue: "false",
      group: "email_auth",
      name: "invite_code_required",
      tab: "auth",
      title: "Require invite code on sign up",
      type: "switch",
    },

    // Google
    {
      group: "google_auth",
      name: "google_auth_enabled",
      tab: "auth",
      title: "Enable Google auth",
      type: "switch",
    },
    {
      group: "google_auth",
      name: "google_one_tap_enabled",
      tab: "auth",
      tip: "Show the Google One Tap prompt to signed-out visitors. Requires Client ID.",
      title: "Enable Google One Tap",
      type: "switch",
    },
    {
      group: "google_auth",
      name: "google_client_id",
      placeholder: "xxx.apps.googleusercontent.com",
      tab: "auth",
      title: "Client ID",
      type: "text",
    },
    {
      group: "google_auth",
      name: "google_client_secret",
      placeholder: "GOCSPX-xxx",
      tab: "auth",
      title: "Client Secret",
      type: "password",
    },

    // GitHub
    {
      group: "github_auth",
      name: "github_auth_enabled",
      tab: "auth",
      title: "Enable GitHub auth",
      type: "switch",
    },
    {
      group: "github_auth",
      name: "github_client_id",
      placeholder: "Ov23xxx",
      tab: "auth",
      title: "Client ID",
      type: "text",
    },
    {
      group: "github_auth",
      name: "github_client_secret",
      placeholder: "xxx",
      tab: "auth",
      title: "Client Secret",
      type: "password",
    },

    // Apple
    {
      group: "apple_auth",
      name: "apple_auth_enabled",
      tab: "auth",
      title: "Enable Sign in with Apple",
      type: "switch",
    },
    {
      group: "apple_auth",
      name: "apple_client_id",
      placeholder: "com.yourcompany.app",
      tab: "auth",
      title: "Services ID (Client ID)",
      type: "text",
    },
    {
      group: "apple_auth",
      name: "apple_client_secret",
      placeholder: "eyJhbGciOiJFUzI1NiIs...",
      tab: "auth",
      title: "Client Secret (JWT)",
      type: "password",
    },
    {
      group: "apple_auth",
      name: "apple_app_bundle_identifier",
      placeholder: "com.yourcompany.app",
      tab: "auth",
      tip: "Used for native Sign in with Apple flows; on web you may reuse the Services ID.",
      title: "App Bundle Identifier",
      type: "text",
    },

    // Magic Link
    {
      group: "magic_link_auth",
      name: "magic_link_enabled",
      tab: "auth",
      tip: "Allow passwordless login via a one-time link sent to the user's email.",
      title: "Enable Magic Link",
      type: "switch",
    },
    {
      defaultValue: "1800",
      group: "magic_link_auth",
      name: "magic_link_expires_in",
      placeholder: "1800",
      tab: "auth",
      title: "Link expiry (seconds)",
      type: "number",
    },

    // Email OTP
    {
      group: "email_otp_auth",
      name: "email_otp_enabled",
      tab: "auth",
      tip: "Allow passwordless login via a one-time code sent to the user's email.",
      title: "Enable Email OTP",
      type: "switch",
    },
    {
      defaultValue: "300",
      group: "email_otp_auth",
      name: "email_otp_expires_in",
      placeholder: "300",
      tab: "auth",
      title: "Code expiry (seconds)",
      type: "number",
    },

    // Anonymous
    {
      group: "anonymous_auth",
      name: "anonymous_auth_enabled",
      tab: "auth",
      tip: "Allow visitors to create a temporary guest session before signing up.",
      title: "Enable anonymous sign-in",
      type: "switch",
    },
  ];
}