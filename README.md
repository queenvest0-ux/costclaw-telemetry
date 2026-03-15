# CostClaw — LLM Cost Tracking for OpenClaw

> Know exactly what your AI agents are spending. Real-time dashboard, per-model breakdown, session costs, and saving recommendations — all local, all private.

## Features

- **Real-time cost tracking** — every LLM call captured automatically via OpenClaw hooks
- **Live dashboard** at `http://localhost:3333` — no browser extension needed
- **Per-model breakdown** — see exactly which model is burning your budget
- **Session costs** — group spend by conversation
- **Usage by source** — separate costs for user messages, heartbeat, cron jobs, and subagents
- **Saving recommendations** — auto-generated suggestions based on your actual usage
- **Today / 7-day / 30-day views** — hourly bar chart, daily trend, sortable tables
- **Persistent storage** — SQLite with auto-migrations, survives restarts
- **Privacy-first** — all data stays in `~/.openclaw/costclaw.db`, nothing leaves your machine
- **Supports 30+ models** — Claude, GPT-4o, o1/o3, Gemini, Grok, Llama, and more

## Install (60 seconds)

```bash
git clone https://github.com/Aperturesurvivor/costclaw-telemetry.git
cd costclaw-telemetry
npm install
npm run build
openclaw plugins install -l .
openclaw gateway restart
```

Open your browser to **http://localhost:3333** — done.

> **Requirements:** [OpenClaw](https://github.com/openclaw/openclaw) installed and running. Node.js 18+.

## Usage

Once installed, CostClaw runs automatically in the background. Every LLM call your agents make is tracked with no extra setup.

**Dashboard** — open `http://localhost:3333` in any browser.

**Ask your agent directly:**
- *"How much have I spent today?"* → calls `costclaw_status`
- *"Open the cost dashboard"* → calls `costclaw_dashboard`

## Configuration

Optional — set a custom port in `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "costclaw": {
        "config": { "port": 3333 }
      }
    }
  }
}
```

## Custom PII Redaction

Add your own redaction rules to `~/.openclaw/costclaw-pii-rules.json`:

```json
[
  { "name": "my-secret", "pattern": "MY_SECRET_[A-Z0-9]+" }
]
```

## Adding a New Model's Pricing

Edit `src/pricing/table.ts` and add an entry to `MODEL_PRICING`:

```typescript
"model-name-as-reported-by-api": { inputPer1M: 1.00, outputPer1M: 3.00 },
```

Then `npm run build && openclaw gateway restart`.

## Project Structure

```
src/
  index.ts                  Plugin entry — registers hooks, tools, HTTP service
  pricing/table.ts          Model pricing table (30+ models)
  storage/db.ts             SQLite init and versioned migrations
  storage/queries.ts        All DB read/write functions
  redact/                   PII redaction engine + built-in rules
  recommendations/engine.ts Cost-saving recommendation logic
  server/dashboard-html.ts  Full dashboard UI (inlined TypeScript string)
  server/api.ts             HTTP API route handlers
  server/http.ts            HTTP server setup
```

## Troubleshooting

**Dashboard not loading** — confirm the plugin is active:
```bash
openclaw plugins list
# Should show "costclaw" with status "loaded"
# If not:
openclaw plugins enable costclaw && openclaw gateway restart
```

**Cost shows $0.00 for a model** — the model name isn't in the pricing table. Add it to `src/pricing/table.ts` and rebuild.

**Port conflict** — change the port in `~/.openclaw/openclaw.json` (see Configuration above).

## Roadmap

- [ ] Budget alerts (notify agent or email when daily spend exceeds threshold)
- [ ] Smart cost routing — auto-switch to cheaper model when budget is low
- [ ] Export to CSV
- [ ] npm publish for one-line install

## License

MIT — free to use, modify, and distribute.

---

Made for the OpenClaw community 🦀
