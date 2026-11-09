import { DEFAULT_ICON, type HeaderLogos, type PortalConfig, type TileConfig } from "../config/portalConfig";
import type { ThemeId } from "../theme/themes";

/** A tile as typed in the form. Every field is text, and `key` keeps React rows stable when tiles move. */
export interface TileDraft {
  key: number;
  label: string;
  description: string;
  url: string;
  icon: TileConfig["icon"];
}

export interface FormState {
  brandName: string;
  logo: string;
  theme: ThemeId;
  tiles: TileDraft[];
  /** Not editable in the form. Kept so downloading a config does not drop them. */
  logos?: HeaderLogos;
  background?: string;
}

let nextTileKey = 0;

export function createTileDraft(tile?: TileConfig): TileDraft {
  return {
    key: nextTileKey++,
    label: tile?.label ?? "",
    description: tile?.description ?? "",
    url: tile?.url ?? "",
    icon: tile?.icon ?? DEFAULT_ICON,
  };
}

export function createFormState(config: PortalConfig): FormState {
  return {
    brandName: config.brand.name,
    logo: config.brand.logo,
    theme: config.theme,
    tiles: config.tiles.map(createTileDraft),
    logos: config.brand.logos,
    background: config.brand.background,
  };
}

/** The shape of config.json, ready for validateConfig. */
export function toConfigInput(form: FormState): unknown {
  return {
    brand: { name: form.brandName, logo: form.logo, logos: form.logos, background: form.background },
    theme: form.theme,
    tiles: form.tiles.map(({ label, description, url, icon }) => ({ label, description, url, icon })),
  };
}

/** Moves the item at `index` by `offset` places. Out of range moves leave the list as it is. */
export function moveItem<T>(items: T[], index: number, offset: number): T[] {
  const target = index + offset;
  if (target < 0 || target >= items.length) return items;

  const moved = [...items];
  [moved[index], moved[target]] = [moved[target], moved[index]];
  return moved;
}
