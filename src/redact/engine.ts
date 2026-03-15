import fs from "fs";
import type { RedactRule } from "../types.js";
import { BUILTIN_RULES } from "./rules.js";

interface UserRuleJson {
  name: string;
  pattern: string;
  replacement: string;
}

let compiledRules: RedactRule[] = [];

export function loadRules(piiRulesPath: string): void {
  compiledRules = [...BUILTIN_RULES];

  if (!fs.existsSync(piiRulesPath)) {
    return;
  }

  try {
    const raw = fs.readFileSync(piiRulesPath, "utf8");
    const userRules: UserRuleJson[] = JSON.parse(raw);
    for (const rule of userRules) {
      try {
        compiledRules.push({
          name: rule.name,
          pattern: new RegExp(rule.pattern, "gi"),
          replacement: rule.replacement,
        });
      } catch {
        console.warn(`[costclaw] Invalid PII rule "${rule.name}" — skipping`);
      }
    }
  } catch (err) {
    console.warn(`[costclaw] Could not load PII rules from ${piiRulesPath}: ${err}`);
  }
}

export function redact(input: string): string {
  if (!input) return input;
  let out = input;
  for (const rule of compiledRules) {
    // Reset lastIndex for global regexes
    rule.pattern.lastIndex = 0;
    out = out.replace(rule.pattern, rule.replacement);
  }
  return out;
}

export function getRuleCount(): number {
  return compiledRules.length;
}
