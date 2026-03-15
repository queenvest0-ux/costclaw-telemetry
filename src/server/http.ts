import http from "http";
import { getRoutes } from "./api.js";
import { DASHBOARD_HTML } from "./dashboard-html.js";

let activeServer: http.Server | null = null;

export function stopServer(): void {
  activeServer?.close();
  activeServer = null;
}

export function startServer(port: number): http.Server {
  const routes = getRoutes();
  const dashboardHtml = DASHBOARD_HTML;

  const server = http.createServer((req, res) => {
    const url = req.url?.split("?")[0] ?? "/";

    // CORS (localhost only)
    res.setHeader("Access-Control-Allow-Origin", `http://localhost:${port}`);
    res.setHeader("Access-Control-Allow-Methods", "GET");

    if (url === "/" || url === "/dashboard") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(dashboardHtml);
      return;
    }

    const route = routes.find((r) => r.method === req.method && r.path === url);
    if (route) {
      try {
        const data = route.handler();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  server.listen(port, "127.0.0.1", () => {
    console.log(`\n🦞 CostClaw dashboard: http://localhost:${port}\n`);
  });

  activeServer = server;
  return server;
}
