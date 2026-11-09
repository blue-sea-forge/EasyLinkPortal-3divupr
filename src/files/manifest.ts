import type { FileBrowserConfig } from "../config/portalConfig";

export interface FileEntry {
  /** Path inside the browsed folder, with "/" separators, such as "notes/readme.txt". */
  path: string;
  size: number;
}

export interface FileManifest {
  files: FileEntry[];
}

/** Written by the build (see build/fileManifest.ts). A browser cannot list a folder, so the list is made ahead of time. */
export const FILE_MANIFEST_URL = `${import.meta.env.BASE_URL}files-manifest.json`;

export async function loadManifest(): Promise<FileManifest> {
  const response = await fetch(FILE_MANIFEST_URL, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Could not load ${FILE_MANIFEST_URL}: the server answered ${response.status}.`);
  }

  const content: unknown = await response.json();
  const files = (content as FileManifest | null)?.files;
  if (!Array.isArray(files)) throw new Error(`${FILE_MANIFEST_URL} is not valid: "files" must be a list.`);
  return { files };
}

export interface FolderListing {
  folders: string[];
  files: { name: string; path: string; size: number }[];
}

/** Splits the flat list into what sits directly inside `folderPath` ("" is the root). */
export function listFolder(entries: FileEntry[], folderPath: string): FolderListing {
  const prefix = folderPath === "" ? "" : `${folderPath}/`;
  const folders = new Set<string>();
  const files: FolderListing["files"] = [];

  for (const entry of entries) {
    if (!entry.path.startsWith(prefix)) continue;

    const rest = entry.path.slice(prefix.length);
    const [firstSegment, ...otherSegments] = rest.split("/");
    if (otherSegments.length > 0) folders.add(firstSegment);
    else files.push({ name: rest, path: entry.path, size: entry.size });
  }

  return { folders: [...folders].sort(), files: files.sort((a, b) => a.name.localeCompare(b.name)) };
}

/** Keeps only plain folder names from the "?path=" value, so "../" and empty parts are dropped. */
export function cleanFolderPath(rawPath: string | null): string {
  return (rawPath ?? "")
    .split("/")
    .filter((segment) => segment !== "" && segment !== "." && segment !== "..")
    .join("/");
}

/** Address of a file served from the browsed folder. Each segment is encoded so names with spaces or "#" still work. */
export function buildFileUrl({ folder }: FileBrowserConfig, filePath: string): string {
  const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
  return `${import.meta.env.BASE_URL}${folder}/${encodedPath}`;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
