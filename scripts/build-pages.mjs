#!/usr/bin/env node
/**
 * GitHub Pages용 정적 빌드.
 * Next.js static export는 API Route와 호환되지 않아 빌드 전에 app/api를 잠시 제외합니다.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const apiDir = join(root, "app", "api");
const apiBackup = join(root, ".pages-api-backup");
const outDir = join(root, "out");

function restoreApi() {
  if (existsSync(apiBackup)) {
    if (existsSync(apiDir)) {
      rmSync(apiDir, { recursive: true, force: true });
    }
    renameSync(apiBackup, apiDir);
  }
}

process.on("exit", restoreApi);
process.on("SIGINT", () => {
  restoreApi();
  process.exit(1);
});
process.on("SIGTERM", () => {
  restoreApi();
  process.exit(1);
});

try {
  if (existsSync(apiDir)) {
    if (existsSync(apiBackup)) {
      rmSync(apiBackup, { recursive: true, force: true });
    }
    renameSync(apiDir, apiBackup);
  }

  // webpack 설정(socket.io fallback)을 쓰므로 --webpack 명시 (Next 16 기본은 Turbopack)
  const result = spawnSync("npx", ["next", "build", "--webpack"], {
    stdio: "inherit",
    env: {
      ...process.env,
      GITHUB_PAGES: "true",
    },
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, ".nojekyll"), "");
} finally {
  restoreApi();
}
