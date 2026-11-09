import { DEFAULT_THEME, THEMES, isThemeId, type ThemeId } from "../theme/themes";
import { isValidFolderName } from "../files/folderName";
import { ICON_NAMES, isIconName, type IconName } from "./icons";

/** Images shown in the header. Each one is optional. */
export interface HeaderLogos {
  left?: string;
  middle?: string;
  right?: string;
}

export interface BrandConfig {
  name: string;
  logo: string;
  logos?: HeaderLogos;
  background?: string;
}

export interface FileBrowserConfig {
  /** Name of a folder inside public/ whose files visitors can browse and download. */
  folder: string;
  title: string;
}

export interface TileConfig {
  label: string;
  description?: string;
  url: string;
  icon: IconName;
}

export interface PortalConfig {
  brand: BrandConfig;
  theme: ThemeId;
  tiles: TileConfig[];
  fileBrowser?: FileBrowserConfig;
}

export type ValidationResult = { ok: true; config: PortalConfig } | { ok: false; errors: string[] };

export const DEFAULT_ICON: IconName = "link";

export const DEFAULT_FILE_BROWSER_TITLE = "Files";

const HEADER_LOGO_POSITIONS = ["left", "middle", "right"] as const;

/** Where config.schema.json sits relative to config.json. Editors use it for completion and checks. */
export const CONFIG_SCHEMA_PATH = "./config.schema.json";

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Only web addresses are allowed, so a "javascript:" link in the file can never run. */
function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    // new URL throws on text that is not an address, which is the "no" answer here.
    return false;
  }
}

/** A path on this site ("/logo.svg") or an embedded image. The Content-Security-Policy blocks other sites' images. */
function isLocalImagePath(value: string): boolean {
  const isSitePath = value.startsWith("/") && !value.startsWith("//");
  return isSitePath || value.startsWith("data:image/");
}

/** Returns the trimmed text, or records the error and returns an empty string. */
function readRequiredText(value: unknown, errorMessage: string, errors: string[]): string {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  errors.push(errorMessage);
  return "";
}

/** Returns the image path if it is valid, or records the error and returns undefined. `label` names the field in the message. */
function readOptionalImagePath(value: unknown, label: string, errors: string[]): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "string" && isLocalImagePath(value.trim())) return value.trim();

  errors.push(`${label} must be a path on this site, such as "/images/logo.jpg". Images from other sites are blocked.`);
  return undefined;
}

function validateHeaderLogos(raw: unknown, errors: string[]): HeaderLogos | undefined {
  if (raw === undefined) return undefined;
  if (!isObject(raw)) {
    errors.push('"brand.logos" must be an object with left, middle and right images.');
    return undefined;
  }

  const logos: HeaderLogos = {};
  for (const position of HEADER_LOGO_POSITIONS) {
    const path = readOptionalImagePath(raw[position], `Header logo "${position}"`, errors);
    if (path) logos[position] = path;
  }
  return logos;
}

function validateBrand(raw: unknown, errors: string[]): BrandConfig {
  if (!isObject(raw)) {
    errors.push('"brand" is missing. It needs a name and a logo.');
    return { name: "", logo: "" };
  }

  const name = readRequiredText(raw.name, "Brand name is required.", errors);
  const logo = readRequiredText(raw.logo, "Brand logo is required.", errors);
  if (logo && !isLocalImagePath(logo)) {
    errors.push('Brand logo must be a path on this site, such as "/logo.svg". Images from other sites are blocked.');
  }

  const logos = validateHeaderLogos(raw.logos, errors);
  const background = readOptionalImagePath(raw.background, "Background", errors);
  return { name, logo, ...(logos && { logos }), ...(background && { background }) };
}

function validateTheme(raw: unknown, errors: string[]): ThemeId {
  if (isThemeId(raw)) return raw;

  const available = THEMES.map((theme) => theme.id).join(", ");
  errors.push(`Theme ${raw === undefined ? "is required" : `"${String(raw)}" does not exist`}. Use one of: ${available}.`);
  return DEFAULT_THEME;
}

function validateTile(raw: unknown, index: number, errors: string[]): TileConfig {
  const position = `Tile ${index + 1}`;
  const fallback: TileConfig = { label: "", url: "", icon: DEFAULT_ICON };
  if (!isObject(raw)) {
    errors.push(`${position} must be an object.`);
    return fallback;
  }

  const label = readRequiredText(raw.label, `${position}: label is required.`, errors);
  const url = readRequiredText(raw.url, `${position}: link is required.`, errors);
  if (url && !isHttpUrl(url)) {
    errors.push(`${position}: link must be a full web address starting with http:// or https://.`);
  }

  const icon = raw.icon ?? DEFAULT_ICON;
  if (!isIconName(icon)) {
    errors.push(`${position}: icon "${String(icon)}" does not exist. Use one of: ${ICON_NAMES.join(", ")}.`);
  }

  const description = typeof raw.description === "string" ? raw.description.trim() : "";
  return {
    label,
    url,
    icon: isIconName(icon) ? icon : DEFAULT_ICON,
    ...(description && { description }),
  };
}

function validateTiles(raw: unknown, errors: string[]): TileConfig[] {
  if (!Array.isArray(raw)) {
    errors.push('"tiles" must be a list.');
    return [];
  }
  return raw.map((tile, index) => validateTile(tile, index, errors));
}

function validateFileBrowser(raw: unknown, errors: string[]): FileBrowserConfig | undefined {
  if (raw === undefined) return undefined;
  if (!isObject(raw)) {
    errors.push('"fileBrowser" must be an object with a folder.');
    return undefined;
  }

  const folder = typeof raw.folder === "string" ? raw.folder.trim() : "";
  if (!isValidFolderName(folder)) {
    errors.push('File browser folder must be the name of one folder inside public/, such as "files". Use letters, digits, "-" and "_" only.');
    return undefined;
  }

  const title = typeof raw.title === "string" && raw.title.trim() !== "" ? raw.title.trim() : DEFAULT_FILE_BROWSER_TITLE;
  return { folder, title };
}

/** Checks data coming from config.json or from the generator form. Collects every problem instead of stopping at the first. */
export function validateConfig(input: unknown): ValidationResult {
  if (!isObject(input)) return { ok: false, errors: ["The config must be a JSON object."] };

  const errors: string[] = [];
  const brand = validateBrand(input.brand, errors);
  const theme = validateTheme(input.theme, errors);
  const tiles = validateTiles(input.tiles, errors);
  const fileBrowser = validateFileBrowser(input.fileBrowser, errors);

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, config: { brand, theme, tiles, ...(fileBrowser && { fileBrowser }) } };
}
