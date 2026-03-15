# CostClaw — Reduce Your OpenClaw Agent Costs

**The fastest way to see, understand, and reduce what your OpenClaw agents spend on LLM API calls.**

CostClaw is a free, open-source OpenClaw plugin that tracks every LLM call your agents make, calculates the real cost in USD, and serves a live local dashboard at `http://localhost:3333`. No external services. No data leaves your machine.

> Most OpenClaw users don't realize they're spending $50–300/mo on API calls until they get the bill. CostClaw shows you in real time — and tells you exactly where to cut.

---

## Why OpenClaw costs get out of control

OpenClaw agents run continuously. They respond to user messages, fire on heartbeat timers, run cron jobs, and spin up subagents. Every one of those runs makes LLM API calls. Without visibility:

- **Heartbeat agents** run every few minutes on expensive models — even when there's nothing to do
- **Subagents** multiply costs: one user message can trigger 5–10 downstream LLM calls
- **Wrong model selection** — running GPT-4o for tasks that Claude Haiku handles equally well costs 10–20x more
- **No per-session visibility** — you can't tell which conversation cost $0.12 vs $4.00

CostClaw fixes all of this.

---

## How to reduce your OpenClaw costs (step by step)

1. **Install CostClaw** (60 seconds, see below)
2. **Open the dashboard** at `http://localhost:3333`
3. **Check "Usage by Source"** — if `heartbeat` is your biggest spend, your polling interval is too aggressive or your model is too expensive for keep-alive checks
4. **Check "Model Breakdown"** — switch to a cheaper model for tasks that don't need top-tier reasoning
5. **Check "Sessions by Cost"** — identify which conversation patterns are the most expensive
6. **Read the Recommendations panel** — CostClaw auto-generates specific suggestions based on your actual usage

---

## Features

- **Real-time cost dashboard** at `http://localhost:3333`
- **Per-model breakdown** with cost, tokens, and share of total spend
- **Usage by source** — separate costs for user messages, heartbeat, cron jobs, memory runs, and subagents
- **Session cost tracking** — see exactly which conversations cost the most
- **Today / 7-day / 30-day views** with hourly drill-down for today
- **Automatic saving recommendations** based on your actual usage patterns
- **Supports 30+ models** — Claude 3.5/4, GPT-4o/mini, o1/o3, Gemini 2.5, Grok-2/3, Llama variants, and more
- **Persistent SQLite storage** with auto-migrations — survives restarts, no data loss
- **PII redaction** — sensitive data scrubbed before storage
- **Privacy-first** — all data stays in `~/.openclaw/costclaw.db`, zero external requests

---

## Install (2 commands)

```bash
openclaw plugins install costclaw-telemetry
openclaw gateway restart
```

Open **http://localhost:3333** in your browser. That's it.

**Requirements:** [OpenClaw](https://github.com/openclaw/openclaw) installed and running. Node.js 18+.

### Alternative: install from source

```bash
git clone https://github.com/Aperturesurvivor/costclaw-telemetry.git
cd costclaw-telemetry
npm install && npm run build
openclaw plugins install -l .
openclaw gateway restart
```

---

## Ask your agent directly

Once installed, your OpenClaw agent gets two new tools:

| Say this | What happens |
|---|---|
| "How much have I spent today?" | Agent calls `costclaw_status` and reports your spend |
| "Open the cost dashboard" | Agent opens `http://localhost:3333` in your browser |
| "Which model is costing me the most?" | Agent reads the model breakdown from `costclaw_status` |

---

## Dashboard sections

| Section | What it shows |
|---|---|
| KPI cards | Today's cost + tokens, monthly total, cost per 1K tokens, model count, session count, total calls |
| Spend trend | Hourly bars (today) or daily line chart (7D/30D) — switch with the tabs |
| Model breakdown | Doughnut chart + sortable table with share % and per-model cost |
| Usage by source | Horizontal bars for user / heartbeat / cron / memory / subagent spend |
| Sessions by cost | Sortable table of your most expensive conversations |
| Recommendations | Auto-generated cost-cutting suggestions with estimated monthly savings |

---

## Supported models and pricing

CostClaw includes pricing for 30+ models out of the box:

| Provider | Models |
|---|---|
| Anthropic | claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus, claude-sonnet-4, claude-haiku-4 |
| OpenAI | gpt-4o, gpt-4o-mini, o1, o1-mini, o3, o3-mini |
| Google | gemini-2.5-pro, gemini-2.5-flash, gemini-1.5-pro |
| xAI | grok-2, grok-3 |
| Meta | llama-3.3-70b, llama-3.1-8b, llama-3.1-405b |

To add a model: edit `src/pricing/table.ts`, run `npm run build && openclaw gateway restart`.

---

## Configuration

Custom port in `~/.openclaw/openclaw.json`:

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

Custom PII redaction rules in `~/.openclaw/costclaw-pii-rules.json`:

```json
[
  { "name": "my-secret", "pattern": "MY_SECRET_[A-Z0-9]+" }
]
```

---

## FAQ

**How much can I actually save?**
Varies by usage, but the most common wins: switching heartbeat agents from GPT-4o to GPT-4o-mini saves ~20x on keep-alive costs. Routing low-complexity tasks to Claude Haiku instead of Sonnet typically cuts model costs by 50–80%.

**Does this slow down my agents?**
No. CostClaw captures data via OpenClaw's native event hooks — the same path used for every other plugin. There is no added latency to LLM calls.

**Is my data sent anywhere?**
No. Everything stays in `~/.openclaw/costclaw.db` on your local machine. The dashboard server only binds to localhost.

**What if a model shows $0.00 cost?**
The model name reported by the API isn't in the pricing table yet. Add it to `src/pricing/table.ts` — takes 30 seconds.

**Can I use this with multiple OpenClaw instances?**
Each instance needs its own plugin install. Multi-machine aggregation is on the roadmap.

**Does it work with self-hosted / local models (Ollama, LM Studio)?**
Yes — they'll show up with $0.00 cost (local models are free). Useful for tracking token volume even without a dollar cost.

---

## Troubleshooting

**Dashboard not loading:**
```bash
openclaw plugins list
# "costclaw" should show status "loaded"
# If not:
openclaw plugins enable costclaw && openclaw gateway restart
```

**Cost shows $0.00 for a model** — add it to `src/pricing/table.ts` and rebuild.

**Port conflict** — change port in `~/.openclaw/openclaw.json`.

---

## Project structure

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

---

## Roadmap

- [ ] Budget alerts — notify agent or email when daily spend exceeds threshold
- [ ] Smart cost routing — automatically switch to cheaper model when budget is low
- [ ] Export to CSV
- [ ] npm publish for one-line install (`openclaw plugins install costclaw`)
- [ ] Multi-machine aggregation

---

## Contributing

PRs welcome. To add a model's pricing, edit `src/pricing/table.ts`. To report a bug or request a feature, open an issue.

---

## License

MIT — free to use, modify, and distribute.

---

*Made for the OpenClaw community. If this saved you money, consider starring the repo — it helps others find it.*
