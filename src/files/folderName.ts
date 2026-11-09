/** One folder name, no slashes or dots, so a config value can never point outside public/. */
const FOLDER_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;

export function isValidFolderName(value: string): boolean {
  return FOLDER_NAME_PATTERN.test(value);
}
