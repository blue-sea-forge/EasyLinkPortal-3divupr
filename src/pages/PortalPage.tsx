import { useEffect } from "react";
import { Header } from "../components/Header";
import { LoadingNotice } from "../components/LoadingNotice";
import { StatusPage } from "../components/StatusPage";
import { TileGrid } from "../components/TileGrid";
import type { TileConfig } from "../config/portalConfig";
import { fileBrowserHref } from "../routes";
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

  const { brand, tiles, fileBrowsers = [] } = state.config;
  const fileBrowserTiles: TileConfig[] = fileBrowsers.map(({ folder, title }) => ({
    label: title,
    description: "Browse and download files",
    url: fileBrowserHref(folder),
    icon: "folder",
  }));
  return (
    <>
      <Header name={brand.name} logoUrl={brand.logo} logos={brand.logos} />
      <main className="portal">
        <TileGrid tiles={[...tiles, ...fileBrowserTiles]} />
      </main>
    </>
  );
}
