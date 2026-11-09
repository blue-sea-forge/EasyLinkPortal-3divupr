import { useEffect, useState } from "react";
import { Download, Folder } from "lucide-react";
import { Header } from "../components/Header";
import { LoadingNotice } from "../components/LoadingNotice";
import { StatusPage } from "../components/StatusPage";
import { useConfig } from "../config/useConfig";
import type { FileBrowserConfig } from "../config/portalConfig";
import { buildFileUrl, cleanFolderPath, formatSize, listFolder, loadManifest, type FileManifest } from "../files/manifest";
import { FILE_BROWSER_PATH } from "../routes";

type ManifestState = { status: "loading" } | { status: "ready"; manifest: FileManifest } | { status: "failed" };

export function FileBrowserPage() {
  const state = useConfig();

  if (state.status === "loading") return <LoadingNotice />;
  if (state.status === "failed") return <StatusPage code={500} />;

  const { brand, fileBrowser } = state.config;
  // Without a fileBrowser entry in config.json this page does not exist.
  if (!fileBrowser) return <StatusPage code={404} />;

  return (
    <>
      <Header name={brand.name} logoUrl={brand.logo} logos={brand.logos} />
      <main className="portal">
        <FileList fileBrowser={fileBrowser} />
      </main>
    </>
  );
}

/** Link to a folder of the browser. The folder is kept in "?path=" because Apache only serves real files. */
function folderHref(folderPath: string): string {
  return folderPath === "" ? `${FILE_BROWSER_PATH}/` : `${FILE_BROWSER_PATH}/?path=${encodeURIComponent(folderPath)}`;
}

function FileList({ fileBrowser }: { fileBrowser: FileBrowserConfig }) {
  const [manifestState, setManifestState] = useState<ManifestState>({ status: "loading" });
  const folderPath = cleanFolderPath(new URLSearchParams(window.location.search).get("path"));

  useEffect(() => {
    document.title = fileBrowser.title;
    loadManifest()
      .then((manifest) => setManifestState({ status: "ready", manifest }))
      .catch((error: Error) => {
        console.error(error);
        setManifestState({ status: "failed" });
      });
  }, [fileBrowser.title]);

  if (manifestState.status === "loading") return <LoadingNotice />;
  if (manifestState.status === "failed") return <p className="notice">The file list could not be loaded.</p>;

  const { folders, files } = listFolder(manifestState.manifest.files, folderPath);
  const segments = folderPath === "" ? [] : folderPath.split("/");

  return (
    <>
      <h1 className="file-title">{fileBrowser.title}</h1>
      <nav className="breadcrumb" aria-label="Folder path">
        <a href={folderHref("")}>Home</a>
        {segments.map((segment, index) => (
          <span key={index}>
            {" / "}
            <a href={folderHref(segments.slice(0, index + 1).join("/"))}>{segment}</a>
          </span>
        ))}
      </nav>

      {folders.length === 0 && files.length === 0 ? (
        <p className="notice">This folder is empty.</p>
      ) : (
        <ul className="file-list">
          {folders.map((folder) => (
            <li key={folder}>
              <a className="file-row" href={folderHref(folderPath === "" ? folder : `${folderPath}/${folder}`)}>
                <Folder size={20} aria-hidden="true" />
                <span className="file-name">{folder}</span>
              </a>
            </li>
          ))}
          {files.map((file) => (
            <li key={file.path}>
              <a className="file-row" href={buildFileUrl(fileBrowser, file.path)} download={file.name}>
                <Download size={20} aria-hidden="true" />
                <span className="file-name">{file.name}</span>
                <span className="file-size">{formatSize(file.size)}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
