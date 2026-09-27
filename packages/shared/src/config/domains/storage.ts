// @openstarter/shared/config/domains/storage —— 对象存储设置项（Cloudflare R2 / S3 兼容）。

import type { Setting } from "../types";

/** Storage tab 设置：r2。 */
export function getStorageSettings(): Setting[] {
  return [
    {
      group: "r2",
      name: "r2_access_key",
      tab: "storage",
      title: "Cloudflare Access Key",
      type: "text",
    },
    {
      group: "r2",
      name: "r2_secret_key",
      tab: "storage",
      title: "Cloudflare Secret Key",
      type: "password",
    },
    {
      group: "r2",
      name: "r2_bucket_name",
      tab: "storage",
      title: "Bucket Name",
      type: "text",
    },
    {
      group: "r2",
      name: "r2_upload_path",
      placeholder: "uploads",
      tab: "storage",
      tip: "Path to upload files to; leave empty to use the default. Example: uploads/foo/bar",
      title: "Upload Path",
      type: "text",
    },
    {
      group: "r2",
      name: "r2_endpoint",
      placeholder: "https://<account-id>.r2.cloudflarestorage.com",
      tab: "storage",
      tip: "Leave empty to use the default R2 endpoint",
      title: "Endpoint",
      type: "text",
    },
    {
      group: "r2",
      name: "r2_domain",
      placeholder: "https://cdn.example.com",
      tab: "storage",
      title: "Domain",
      type: "text",
    },
  ];
}