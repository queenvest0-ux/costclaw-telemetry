import fs from "fs";
import readline from "readline";
import type { TelemetryEvent } from "../types.js";
import { parseLine } from "./parser.js";

interface WatcherState {
  offset: number;
  inode: number;
}

let parseErrors = 0;
let lastEventTs: number | null = null;

export function getWatcherStats() {
  return { parseErrors, lastEventTs };
}

async function readFromOffset(
  filePath: string,
  offset: number,
  onEvent: (event: TelemetryEvent) => void
): Promise<number> {
  return new Promise((resolve, reject) => {
    let newOffset = offset;
    let buffer = "";

    const stream = fs.createReadStream(filePath, {
      start: offset,
      encoding: "utf8",
    });

    stream.on("data", (chunk: string | Buffer) => {
      if (typeof chunk !== "string") return;
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // keep incomplete last line

      for (const line of lines) {
        newOffset += Buffer.byteLength(line + "\n", "utf8");
        const event = parseLine(line);
        if (event) {
          lastEventTs = event.ts;
          onEvent(event);
        } else if (line.trim()) {
          parseErrors++;
        }
      }
    });

    stream.on("end", () => {
      // Handle any remaining buffer (no trailing newline)
      if (buffer.trim()) {
        const event = parseLine(buffer);
        if (event) {
          lastEventTs = event.ts;
          onEvent(event);
          newOffset += Buffer.byteLength(buffer, "utf8");
        }
      }
      resolve(newOffset);
    });

    stream.on("error", reject);
  });
}

export async function startWatcher(
  filePath: string,
  onEvent: (event: TelemetryEvent) => void
): Promise<() => void> {
  let state: WatcherState = { offset: 0, inode: 0 };
  let watcher: fs.FSWatcher | null = null;

  if (!fs.existsSync(filePath)) {
    console.warn(`[costclaw] Telemetry file not found: ${filePath}`);
    console.warn(`[costclaw] Install knostic/openclaw-telemetry to generate telemetry data.`);
    // Poll for file creation
    const pollInterval = setInterval(() => {
      if (fs.existsSync(filePath)) {
        clearInterval(pollInterval);
        startWatcher(filePath, onEvent); // restart once file exists
      }
    }, 5000);
    return () => clearInterval(pollInterval);
  }

  // Phase 1: backfill existing file
  try {
    const stat = fs.statSync(filePath);
    state.inode = stat.ino;
    state.offset = await readFromOffset(filePath, 0, onEvent);
  } catch (err) {
    console.error(`[costclaw] Error reading telemetry file: ${err}`);
  }

  // Phase 2: watch for new data
  let pending = false;

  const handleChange = async () => {
    if (pending) return;
    pending = true;
    try {
      const stat = fs.statSync(filePath);

      // Detect rotation (inode changed)
      if (stat.ino !== state.inode) {
        console.log("[costclaw] Telemetry file rotated — resetting offset");
        state = { offset: 0, inode: stat.ino };
      }

      state.offset = await readFromOffset(filePath, state.offset, onEvent);
    } catch {
      // File may have been briefly unavailable during rotation
    } finally {
      pending = false;
    }
  };

  watcher = fs.watch(filePath, { persistent: false }, (event) => {
    if (event === "change" || event === "rename") {
      handleChange();
    }
  });

  return () => {
    watcher?.close();
  };
}
