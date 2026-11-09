import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Plugin } from "vite";
import { isValidFolderName } from "../src/files/folderName.ts";
import type { FileEntry } from "../src/files/manifest.ts";

export const MANIFEST_FILE_NAME = "files-manifest.json";

/** Lists every file under `folder`, recursively, as paths relative to it. Dotfiles are skipped so they are never advertised. */
export function scanFolder(folder: string, relativePath = ""): FileEntry[] {
  const entries: FileEntry[] = [];

  for (const item of readdirSync(join(folder, relativePath), { withFileTypes: true })) {
    if (item.name.startsWith(".")) continue;

    const itemPath = relativePath === "" ? item.name : `${relativePath}/${item.name}`;
    if (item.isDirectory()) entries.push(...scanFolder(folder, itemPath));
    else if (item.isFile()) entries.push({ path: itemPath, size: statSync(join(folder, itemPath)).size });
  }

  return entries.sort((a, b) => a.path.localeCompare(b.path));
}

/** Reads fileBrowser.folder from config.json. Returns null when the file browser is not configured. */
function readBrowsedFolder(publicDir: string): string | null {
  const configPath = join(publicDir, "config.json");
  if (!existsSync(configPath)) return null;

  const folder = JSON.parse(readFileSync(configPath, "utf-8"))?.fileBrowser?.folder;
  if (folder === undefined) return null;
  if (typeof folder !== "string" || !isValidFolderName(folder)) {
    throw new Error(`fileBrowser.folder in ${configPath} must be one folder name inside public/, such as "files".`);
  }
  return folder;
}

function buildManifestJson(publicDir: string): string | null {
  const folder = readBrowsedFolder(publicDir);
  if (folder === null) return null;

  const folderPath = join(publicDir, folder);
  if (!existsSync(folderPath)) {
    throw new Error(`The file browser folder ${folderPath} does not exist. Create it or change fileBrowser.folder in config.json.`);
  }
  return JSON.stringify({ files: scanFolder(folderPath) });
}

/**
 * The file browser runs in the browser, which cannot list a server folder.
 * This plugin scans the folder named in config.json and serves the result as
 * files-manifest.json: computed on each request in development, written once
 * into dist/ at build time. Files added to the server after the build do not
 * show up until the next build.
 */
export function fileManifest(): Plugin {
  let publicDir = "";
  let outDir = "";

  return {
    name: "file-manifest",
    configResolved(config) {
      publicDir = config.publicDir;
      outDir = resolve(config.root, config.build.outDir);
    },
    configureServer(server) {
      server.middlewares.use(`/${MANIFEST_FILE_NAME}`, (_request, response) => {
        const manifest = buildManifestJson(publicDir);
        response.statusCode = manifest === null ? 404 : 200;
        response.setHeader("Content-Type", "application/json");
        response.end(manifest ?? "{}");
      });
    },
    closeBundle() {
      const manifest = buildManifestJson(publicDir);
      if (manifest === null) return;

      mkdirSync(outDir, { recursive: true });
      writeFileSync(resolve(outDir, MANIFEST_FILE_NAME), manifest);
    },
  };
}
