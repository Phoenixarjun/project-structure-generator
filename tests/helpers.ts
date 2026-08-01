import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export async function temporaryDirectory(prefix: string): Promise<{ path: string; cleanup: () => Promise<void> }> {
  const value = await mkdtemp(path.join(os.tmpdir(), prefix));
  return {
    path: value,
    cleanup: () => rm(value, { recursive: true, force: true })
  };
}
