import { loadRules, redact } from "../src/redact/engine.js";
import assert from "assert";

// Load built-in rules only (no user file)
loadRules("/nonexistent/path/rules.json");

// Email
assert.strictEqual(redact("Email john@example.com here"), "Email [REDACTED:EMAIL] here");

// OpenAI key
assert.strictEqual(
  redact("Use key sk-abcdefghijklmnopqrstuvwxyz12345 please"),
  "Use key [REDACTED:API_KEY] please"
);

// Anthropic key
assert.ok(
  redact("sk-ant-api03-ABCDEFGHIJKLMNOPQRSTUVWXYZ12345678901234567890").includes("[REDACTED:API_KEY]")
);

// SSN
assert.strictEqual(redact("SSN: 123-45-6789"), "SSN: [REDACTED:SSN]");

// Path
assert.ok(redact("/home/josiah/secret/file.txt").includes("[REDACTED:PATH]"));

// No-op on clean text
const clean = "Hello, run a web search for AI news";
assert.strictEqual(redact(clean), clean);

// Empty string
assert.strictEqual(redact(""), "");

console.log("✓ redact tests passed");
