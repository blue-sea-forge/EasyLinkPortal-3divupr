import { ErrorBoundary } from "./components/ErrorBoundary";
import { StatusPage } from "./components/StatusPage";
import { FileBrowserPage } from "./pages/FileBrowserPage";
import { GeneratorPage } from "./pages/GeneratorPage";
import { PortalPage } from "./pages/PortalPage";
import { isFileBrowserPath, isGeneratorPath } from "./routes";
import { isErrorStatus, readServedStatus } from "./status/httpStatus";

export function App() {
  const servedStatus = readServedStatus();

  if (isErrorStatus(servedStatus)) return <StatusPage code={servedStatus} />;

  return <ErrorBoundary>{renderPage(window.location.pathname)}</ErrorBoundary>;
}

function renderPage(pathname: string) {
  if (isGeneratorPath(pathname)) return <GeneratorPage />;
  if (isFileBrowserPath(pathname)) return <FileBrowserPage />;
  return <PortalPage />;
}
