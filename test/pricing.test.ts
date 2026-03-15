import { computeCost } from "../src/pricing/calculator.js";
import assert from "assert";

// Exact match
let r = computeCost("gpt-4o-mini", 1_000_000, 1_000_000);
assert.strictEqual(r.source, "calculated");
assert.ok(r.costUsd > 0, "should have positive cost");

// Alias / prefix match
r = computeCost("claude-3-5-sonnet", 1_000_000, 0);
assert.strictEqual(r.source, "calculated");
assert.ok(r.costUsd > 0);

// Telemetry cost takes precedence
r = computeCost("gpt-4o", 1_000_000, 1_000_000, 0.42);
assert.strictEqual(r.source, "telemetry");
assert.strictEqual(r.costUsd, 0.42);

// Unknown model
r = computeCost("some-unknown-model-xyz", 1000, 500);
assert.strictEqual(r.source, "estimated");
assert.strictEqual(r.costUsd, 0);

// Zero tokens
r = computeCost("claude-3-haiku-20240307", 0, 0);
assert.strictEqual(r.costUsd, 0);
assert.strictEqual(r.source, "calculated");

console.log("✓ pricing tests passed");
