import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanFolder } from "./fileManifest";

describe("scanFolder", () => {
  it("lists files recursively, sorted, and skips dotfiles", () => {
    const root = mkdtempSync(join(tmpdir(), "manifest-"));
    try {
      mkdirSync(join(root, "sub"));
      writeFileSync(join(root, "b.txt"), "12345");
      writeFileSync(join(root, "sub", "a.txt"), "1");
      writeFileSync(join(root, ".hidden"), "x");

      expect(scanFolder(root)).toEqual([
        { path: "b.txt", size: 5 },
        { path: "sub/a.txt", size: 1 },
      ]);
    } finally {
      rmSync(root, { recursive: true });
    }
  });
});
