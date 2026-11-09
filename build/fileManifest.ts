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

/** Reads the folder names from fileBrowsers in config.json. Returns an empty list when no file browser is configured. */
function readBrowsedFolders(publicDir: string): string[] {
  const configPath = join(publicDir, "config.json");
  if (!existsSync(configPath)) return [];

  const browsers = JSON.parse(readFileSync(configPath, "utf-8"))?.fileBrowsers ?? [];
  if (!Array.isArray(browsers)) throw new Error(`fileBrowsers in ${configPath} must be a list.`);

  return browsers.map((browser) => {
    if (typeof browser?.folder !== "string" || !isValidFolderName(browser.folder)) {
      throw new Error(`Each fileBrowsers entry in ${configPath} needs a folder that is one folder name inside public/, such as "files".`);
    }
    return browser.folder;
  });
}

/** Returns the manifest as JSON text, or null when no file browser is configured. */
function buildManifestJson(publicDir: string): string | null {
  const folderNames = readBrowsedFolders(publicDir);
  if (folderNames.length === 0) return null;

  const folders: Record<string, FileEntry[]> = {};
  for (const folderName of folderNames) {
    const folderPath = join(publicDir, folderName);
    if (!existsSync(folderPath)) {
      throw new Error(`The file browser folder ${folderPath} does not exist. Create it or remove it from fileBrowsers in config.json.`);
    }
    folders[folderName] = scanFolder(folderPath);
  }
  return JSON.stringify({ folders });
}

/**
 * The file browsers run in the browser, which cannot list a server folder.
 * This plugin scans the folders named in config.json and serves the result as
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
