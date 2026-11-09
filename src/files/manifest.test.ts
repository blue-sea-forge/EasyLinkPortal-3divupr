import { cleanFolderPath, formatSize, listFolder } from "./manifest";

const entries = [
  { path: "readme.txt", size: 10 },
  { path: "docs/a.txt", size: 20 },
  { path: "docs/deep/b.txt", size: 30 },
  { path: "docs2/c.txt", size: 40 },
];

describe("listFolder", () => {
  it("lists the files and first-level folders of the root", () => {
    expect(listFolder(entries, "")).toEqual({
      folders: ["docs", "docs2"],
      files: [{ name: "readme.txt", path: "readme.txt", size: 10 }],
    });
  });

  it("lists the content of a subfolder and does not match folders with the same prefix", () => {
    expect(listFolder(entries, "docs")).toEqual({
      folders: ["deep"],
      files: [{ name: "a.txt", path: "docs/a.txt", size: 20 }],
    });
  });
});

describe("cleanFolderPath", () => {
  it("drops empty, current and parent segments", () => {
    expect(cleanFolderPath("../docs//./deep/")).toBe("docs/deep");
    expect(cleanFolderPath(null)).toBe("");
  });
});

describe("formatSize", () => {
  it("uses a readable unit", () => {
    expect(formatSize(512)).toBe("512 B");
    expect(formatSize(2048)).toBe("2.0 kB");
  });
});
