import fs from "fs";
import zlib from "zlib";
import readline from "readline";
import path from "path";
import type { TelemetryEvent } from "../types.js";
import { parseLine } from "./parser.js";

export async function backfillRotatedFiles(
  baseFilePath: string,
  onEvent: (event: TelemetryEvent) => void,
  lastKnownSeq: number
): Promise<void> {
  const dir = path.dirname(baseFilePath);
  const base = path.basename(baseFilePath);

  // Look for rotated files: telemetry.jsonl.1.gz, .2.gz, etc.
  let idx = 1;
  while (true) {
    const rotatedPath = path.join(dir, `${base}.${idx}.gz`);
    if (!fs.existsSync(rotatedPath)) break;

    try {
      await processGzFile(rotatedPath, onEvent, lastKnownSeq);
    } catch (err) {
      console.warn(`[costclaw] Could not backfill ${rotatedPath}: ${err}`);
    }

    idx++;
  }
}

function processGzFile(
  filePath: string,
  onEvent: (event: TelemetryEvent) => void,
  lastKnownSeq: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath);
    const gunzip = zlib.createGunzip();
    const rl = readline.createInterface({ input: fileStream.pipe(gunzip) });

    rl.on("line", (line) => {
      const event = parseLine(line);
      if (event && event.seq > lastKnownSeq) {
        onEvent(event);
      }
    });

    rl.on("close", resolve);
    rl.on("error", reject);
    fileStream.on("error", reject);
    gunzip.on("error", reject);
  });
}
