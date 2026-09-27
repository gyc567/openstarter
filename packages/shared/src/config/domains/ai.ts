// @openstarter/shared/config/domains/ai —— AI 供应商设置项（OpenAI / Anthropic / Replicate / Fal / Google / OpenRouter / DeepSeek / Ollama + default provider）。

import type { Setting } from "../types";

/** AI tab 设置：openai + anthropic + replicate + fal + google + openrouter + deepseek + ollama + default_llm_provider。 */
export function getAiSettings(): Setting[] {
  return [
    // OpenAI
    {
      group: "openai",
      name: "openai_base_url",
      placeholder: "https://api.openai.com/v1",
      tab: "ai",
      title: "Base URL",
      type: "text",
    },
    {
      group: "openai",
      name: "openai_api_key",
      placeholder: "sk-xxx",
      tab: "ai",
      title: "API Key",
      type: "password",
    },

    // Anthropic
    {
      group: "anthropic",
      name: "anthropic_base_url",
      placeholder: "https://api.anthropic.com",
      tab: "ai",
      title: "Base URL",
      type: "text",
    },
    {
      group: "anthropic",
      name: "anthropic_api_key",
      placeholder: "sk-ant-xxx",
      tab: "ai",
      title: "API Key",
      type: "password",
    },

    // Replicate
    {
      group: "replicate",
      name: "replicate_api_token",
      placeholder: "r8_xxx",
      tab: "ai",
      title: "API Token",
      type: "password",
    },

    // Fal
    {
      group: "fal",
      name: "fal_api_key",
      placeholder: "xxx",
      tab: "ai",
      title: "API Key",
      type: "password",
    },

    // Google
    {
      group: "google",
      name: "google_api_key",
      placeholder: "AIza...",
      tab: "ai",
      title: "API Key",
      type: "password",
    },

    // OpenRouter
    {
      group: "openrouter",
      name: "openrouter_base_url",
      placeholder: "https://openrouter.ai/api/v1",
      tab: "ai",
      title: "Base URL",
      type: "text",
    },
    {
      group: "openrouter",
      name: "openrouter_api_key",
      placeholder: "sk-or-xxx",
      tab: "ai",
      title: "API Key",
      type: "password",
    },

    // DeepSeek
    {
      group: "deepseek",
      name: "deepseek_base_url",
      placeholder: "https://api.deepseek.com/v1",
      tab: "ai",
      title: "Base URL",
      type: "text",
    },
    {
      group: "deepseek",
      name: "deepseek_api_key",
      placeholder: "sk-xxx",
      tab: "ai",
      title: "API Key",
      type: "password",
    },

    // Ollama（本地，无 key）
    {
      group: "ollama",
      name: "ollama_base_url",
      placeholder: "http://localhost:11434/v1",
      tab: "ai",
      title: "Base URL",
      type: "text",
    },

    // 默认 LLM 供应商
    {
      defaultValue: "openai",
      group: "openai",
      name: "default_llm_provider",
      options: [
        { label: "OpenAI", value: "openai" },
        { label: "Anthropic", value: "anthropic" },
        { label: "Google", value: "google" },
        { label: "OpenRouter", value: "openrouter" },
        { label: "DeepSeek", value: "deepseek" },
        { label: "Ollama", value: "ollama" },
      ],
      tab: "ai",
      title: "Default LLM Provider",
      type: "select",
    },
  ];
}