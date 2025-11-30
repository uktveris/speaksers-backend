import path from "path";
import { RECORDINGS_DIR } from "../sfu/callRecorder";
import * as fs from "fs/promises";
import { existsSync } from "fs";

export function startCleanupJob() {
  let running = false;

  async function runCleanup() {
    if (running) return;

    running = true;

    try {
      const dir = RECORDINGS_DIR;
      if (!existsSync(dir)) {
        console.log(`${RECORDINGS_DIR} does not exist; skipping cleanup job initialization`);
        return;
      }
      const files = await fs.readdir(dir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        const ageHours = (now - stats.mtimeMs) / (1000 * 60 * 60);

        if (ageHours > 24) {
          await fs.unlink(filePath);
        }
      }
    } finally {
      running = false;
    }
  }
  console.log("hourly recordings cleanup job started");
  runCleanup();
  return setInterval(runCleanup, 60 * 60 * 1000);
}
