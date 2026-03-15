# CostClaw — Agent Guide

CostClaw is an OpenClaw plugin that tracks the cost of every LLM call your agents make. It runs as a background service, stores everything locally in SQLite, and serves a real-time dashboard at http://localhost:3333.

## What you can do

### Check current spend
Call the `costclaw_status` tool. It returns today's cost, this month's total, tokens used, number of models and sessions, and the dashboard URL.

### Open the dashboard
Call the `costclaw_dashboard` tool. It opens http://localhost:3333 in the user's browser. The dashboard shows spend trends, per-model breakdown, cost per token, usage by source (user messages vs heartbeat vs cron vs subagents), and cost-saving recommendations.

### Answer cost questions directly
The `costclaw_status` tool gives you enough to answer questions like:
- "How much have I spent today?" → check `today_usd`
- "What's my monthly spend?" → check `month_usd`
- "How many tokens have I used?" → check the tokens fields
- "Which model is costing the most?" → tell the user to open the dashboard for a full breakdown, or call `costclaw_status` for a summary

## What CostClaw tracks

- Every LLM call made by any agent (main agent, subagents, heartbeat runs, cron jobs, memory runs)
- Model used, input tokens, output tokens, cost in USD
- What triggered the run (`user`, `heartbeat`, `cron`, `memory`)
- Whether it was a subagent or the main agent
- Session key so costs can be grouped by conversation

## What CostClaw does NOT do

- It does not limit or throttle LLM usage
- It does not send any data externally — everything stays in `~/.openclaw/costclaw.db`
- It does not track tool calls in detail (only success/failure and duration)
- It cannot retroactively track calls made before it was installed

## Data storage

All data is in `~/.openclaw/costclaw.db` (SQLite, WAL mode). It persists across gateway restarts and reboots. The database schema auto-migrates on startup — you never need to delete it.

To check the DB path or confirm the plugin is running, call `costclaw_status` and look for `dashboard_url` in the response.

## Dashboard sections

| Section | What it shows |
|---|---|
| Summary cards | Today's cost + tokens, month cost + tokens, avg cost per 1K tokens, model count, session count, total LLM calls |
| 7-day trend | Daily spend as a line chart |
| Model breakdown (chart) | Doughnut chart of spend share by model |
| Model breakdown (table) | Per-model: cost, input/output tokens, cost per 1K tokens, share % |
| Usage by source | Cost broken down by what triggered the run — user messages, heartbeat, cron, memory, and whether it was a subagent |
| Sessions by cost | Most expensive sessions, with LLM call count and time range |
| Recommendations | Auto-generated suggestions for switching to cheaper models based on actual usage patterns |

## Project structure (if you need to modify something)

```
src/
  index.ts                  Main plugin entry — registers hooks, tools, and the HTTP service
  pricing/table.ts          Model pricing table — edit this to update or add model prices
  storage/db.ts             SQLite init and migrations — add new migrations here
  storage/queries.ts        All database read/write functions
  redact/rules.ts           Built-in PII redaction rules
  redact/engine.ts          PII engine — also loads user rules from ~/.openclaw/costclaw-pii-rules.json
  recommendations/engine.ts Cost-saving recommendation logic
  server/dashboard-html.ts  The entire dashboard UI as an inlined TypeScript string
  server/api.ts             HTTP API route handlers
  server/http.ts            HTTP server setup
```

## How to add a new model's pricing

Edit `src/pricing/table.ts` and add an entry to `MODEL_PRICING`:
```typescript
"model-name-as-reported-by-api": { inputPer1M: X.XX, outputPer1M: X.XX },
```
Then run `npm run build` and `openclaw gateway restart`.

## How to add a future DB migration

In `src/storage/db.ts`, append to the `MIGRATIONS` array:
```typescript
{
  version: N,  // next integer after the last one
  description: "What this changes",
  sql: `ALTER TABLE llm_events ADD COLUMN new_column TEXT;`,
},
```
Migrations run automatically on next gateway start. Never edit or remove existing migration entries.

## Troubleshooting

**Dashboard shows "No data yet" after running agents**
The plugin captures data via the `llm_output` hook. Confirm the plugin is loaded: `openclaw plugins list` should show `costclaw` with status `loaded`. If it shows `disabled`, run `openclaw plugins enable costclaw` and restart.

**Cost shows $0.00 for a model**
The model name reported by the API isn't in the pricing table. Check `src/pricing/table.ts` and add it. The `cost_source` field in the DB will be `estimated` for unknown models.

**Port 3333 is already in use**
Set a different port in `~/.openclaw/openclaw.json` under `plugins.entries.costclaw.config.port`.
