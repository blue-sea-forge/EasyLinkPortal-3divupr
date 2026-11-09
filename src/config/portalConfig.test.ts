import { validateConfig } from "./portalConfig";

const validConfig = {
  brand: { name: "Portal", logo: "/logo.svg" },
  theme: "cozy",
  tiles: [{ label: "Site", url: "https://site.test", icon: "globe" }],
};

function withTile(tile: object) {
  return { ...validConfig, tiles: [tile] };
}

function errorsOf(input: unknown): string[] {
  const result = validateConfig(input);
  return result.ok ? [] : result.errors;
}

describe("validateConfig", () => {
  it("accepts a valid config", () => {
    expect(validateConfig(validConfig)).toEqual({ ok: true, config: validConfig });
  });

  it("uses the link icon when a tile has none", () => {
    const result = validateConfig(withTile({ label: "Site", url: "https://site.test" }));
    expect(result.ok && result.config.tiles[0].icon).toBe("link");
  });

  it("trims text and drops an empty description", () => {
    const result = validateConfig(withTile({ label: "  Site ", description: "  ", url: " https://site.test ", icon: "globe" }));
    expect(result.ok && result.config.tiles[0]).toEqual({ label: "Site", url: "https://site.test", icon: "globe" });
  });

  it("rejects links that are not http or https", () => {
    expect(errorsOf(withTile({ label: "Bad", url: "javascript:alert(1)" }))).toEqual([
      "Tile 1: link must be a full web address starting with http:// or https://.",
    ]);
  });

  it("rejects a tile without a label", () => {
    expect(errorsOf(withTile({ url: "https://site.test" }))).toContain("Tile 1: label is required.");
  });

  it("rejects an unknown icon", () => {
    expect(errorsOf(withTile({ label: "Site", url: "https://site.test", icon: "rocket" }))[0]).toContain('icon "rocket"');
  });

  it("rejects a logo hosted on another site", () => {
    const config = { ...validConfig, brand: { name: "Portal", logo: "https://other.test/logo.png" } };
    expect(errorsOf(config)[0]).toContain("Brand logo must be a path on this site");
  });

  it("rejects an unknown theme", () => {
    expect(errorsOf({ ...validConfig, theme: "neon" })[0]).toContain('Theme "neon" does not exist');
  });

  it("requires a theme", () => {
    const { theme: _theme, ...withoutTheme } = validConfig;
    expect(errorsOf(withoutTheme)[0]).toContain("Theme is required");
  });

  it("reports every problem at once", () => {
    expect(errorsOf({ brand: {}, tiles: [{}] }).length).toBeGreaterThan(3);
  });

  it("rejects something that is not an object", () => {
    expect(errorsOf([])).toEqual(["The config must be a JSON object."]);
  });
});

describe("validateConfig: logos, background and file browser", () => {
  it("keeps valid header logos, background and file browser", () => {
    const config = {
      ...validConfig,
      brand: { ...validConfig.brand, logos: { left: "/images/a.jpg", right: "/images/b.jpg" }, background: "/images/bg.jpg" },
      fileBrowser: { folder: "files", title: " Documents " },
    };
    const result = validateConfig(config);
    expect(result.ok && result.config.brand.logos).toEqual({ left: "/images/a.jpg", right: "/images/b.jpg" });
    expect(result.ok && result.config.brand.background).toBe("/images/bg.jpg");
    expect(result.ok && result.config.fileBrowser).toEqual({ folder: "files", title: "Documents" });
  });

  it("uses a default title for the file browser", () => {
    const result = validateConfig({ ...validConfig, fileBrowser: { folder: "files" } });
    expect(result.ok && result.config.fileBrowser).toEqual({ folder: "files", title: "Files" });
  });

  it("rejects a logo or background hosted on another site", () => {
    const brand = { ...validConfig.brand, logos: { left: "https://other.test/a.jpg" }, background: "//other.test/bg.jpg" };
    expect(errorsOf({ ...validConfig, brand })).toHaveLength(2);
  });

  it("rejects a file browser folder that could leave public/", () => {
    expect(errorsOf({ ...validConfig, fileBrowser: { folder: "../secrets" } })[0]).toContain("File browser folder");
    expect(errorsOf({ ...validConfig, fileBrowser: { folder: "a/b" } })[0]).toContain("File browser folder");
  });
});
