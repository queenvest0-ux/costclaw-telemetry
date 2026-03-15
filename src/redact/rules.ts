import type { RedactRule } from "../types.js";

export const BUILTIN_RULES: RedactRule[] = [
  {
    name: "openai_key",
    pattern: /sk-[A-Za-z0-9]{20,}/g,
    replacement: "[REDACTED:API_KEY]",
  },
  {
    name: "anthropic_key",
    pattern: /sk-ant-[A-Za-z0-9\-]{20,}/g,
    replacement: "[REDACTED:API_KEY]",
  },
  {
    name: "github_token",
    pattern: /gh[pousr]_[A-Za-z0-9]{36}/g,
    replacement: "[REDACTED:GH_TOKEN]",
  },
  {
    name: "aws_access_key",
    pattern: /AKIA[0-9A-Z]{16}/g,
    replacement: "[REDACTED:AWS_KEY]",
  },
  {
    name: "bearer_token",
    pattern: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
    replacement: "Bearer [REDACTED]",
  },
  {
    name: "email",
    pattern: /[\w.+-]+@[\w-]+\.[a-z]{2,}/gi,
    replacement: "[REDACTED:EMAIL]",
  },
  {
    name: "phone_us",
    pattern: /\b(\+1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
    replacement: "[REDACTED:PHONE]",
  },
  {
    name: "ssn",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: "[REDACTED:SSN]",
  },
  {
    name: "abs_path",
    pattern: /\/(?:home|Users)\/[^\s"',\])}]+/g,
    replacement: "[REDACTED:PATH]",
  },
  {
    name: "credit_card",
    pattern: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
    replacement: "[REDACTED:CC]",
  },
];
