export const GENERATOR_PATH = "/generate-config";
export const FILE_BROWSER_PATH = "/file-browser";

function withoutTrailingSlashes(pathname: string): string {
  return pathname.replace(/\/+$/, "");
}

/** True for "/generate-config" and "/generate-config/". The build writes the page as a folder, so Apache serves the second form. */
export function isGeneratorPath(pathname: string): boolean {
  return withoutTrailingSlashes(pathname) === GENERATOR_PATH;
}

/** Same as isGeneratorPath, for the file browser page. */
export function isFileBrowserPath(pathname: string): boolean {
  return withoutTrailingSlashes(pathname) === FILE_BROWSER_PATH;
}

/** Address of a file browser page, or of one of its subfolders. The folder to browse is in "?folder=" and the subfolder in "?path=". */
export function fileBrowserHref(folder: string, subfolder = ""): string {
  const query = new URLSearchParams({ folder });
  if (subfolder !== "") query.set("path", subfolder);
  return `${FILE_BROWSER_PATH}/?${query}`;
}
