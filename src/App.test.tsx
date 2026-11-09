import { render, screen } from "@testing-library/react";
import { App } from "./App";
import { TEST_CONFIG, stubConfigResponse } from "./test/mockConfig";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.history.pushState({}, "", "/");
});

describe("App", () => {
  it("shows the brand name and one link per tile from the config", async () => {
    stubConfigResponse(TEST_CONFIG);
    render(<App />);

    expect(await screen.findByText("Test Portal")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /First site/ })).toHaveAttribute("href", "https://first.test");
    expect(screen.getByRole("link", { name: /Second site/ })).toHaveAttribute("href", "https://second.test");
  });

  it("applies the theme set in the config", async () => {
    stubConfigResponse(TEST_CONFIG);
    render(<App />);

    await screen.findByText("Test Portal");
    expect(document.documentElement.dataset.theme).toBe("forest");
  });

  it("shows the 500 page when the config cannot be loaded", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    stubConfigResponse({}, 404);
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Internal Server Error" })).toBeInTheDocument();
  });

  it("shows the 500 page when the config is invalid", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    stubConfigResponse({ brand: { name: "No tiles", logo: "/logo.svg" } });
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Internal Server Error" })).toBeInTheDocument();
  });

  it("shows the status page without loading the config on a 4xx code", () => {
    const fetchStub = stubConfigResponse(TEST_CONFIG);
    window.history.pushState({}, "", "/?status=404");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Page Not Found" })).toBeInTheDocument();
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it("shows the generator on /generate-config", async () => {
    stubConfigResponse(TEST_CONFIG);
    window.history.pushState({}, "", "/generate-config/");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Config generator" })).toBeInTheDocument();
  });

  it("shows a link back to the portal on the file browser page", async () => {
    const config = { ...TEST_CONFIG, fileBrowsers: [{ folder: "files", title: "Files" }] };
    const fetchStub = vi.fn(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () => (url.includes("files-manifest") ? { folders: { files: [] } } : config),
    }));
    vi.stubGlobal("fetch", fetchStub);
    window.history.pushState({}, "", "/file-browser/?folder=files");
    render(<App />);

    expect(await screen.findByRole("link", { name: /Back to the portal/ })).toHaveAttribute("href", "/");
  });
});
