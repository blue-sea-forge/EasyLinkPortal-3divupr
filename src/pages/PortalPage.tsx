import { useEffect } from "react";
import { Header } from "../components/Header";
import { LoadingNotice } from "../components/LoadingNotice";
import { StatusPage } from "../components/StatusPage";
import { TileGrid } from "../components/TileGrid";
import type { TileConfig } from "../config/portalConfig";
import { FILE_BROWSER_PATH } from "../routes";
import { useConfig } from "../config/useConfig";

export function PortalPage() {
  const state = useConfig();

  useEffect(() => {
    if (state.status !== "ready") return;

    const { name, logo } = state.config.brand;
    document.title = name;
    document.querySelector('link[rel="icon"]')?.setAttribute("href", logo);
  }, [state]);

  if (state.status === "loading") return <LoadingNotice />;
  // The details are in the console. Visitors only need to know the page is broken.
  if (state.status === "failed") return <StatusPage code={500} />;

  const { brand, tiles, fileBrowser } = state.config;
  const fileBrowserTile: TileConfig | null = fileBrowser
    ? { label: fileBrowser.title, description: "Browse and download files", url: `${FILE_BROWSER_PATH}/`, icon: "folder" }
    : null;
  return (
    <>
      <Header name={brand.name} logoUrl={brand.logo} logos={brand.logos} />
      <main className="portal">
        <TileGrid tiles={fileBrowserTile ? [...tiles, fileBrowserTile] : tiles} />
      </main>
    </>
  );
}
