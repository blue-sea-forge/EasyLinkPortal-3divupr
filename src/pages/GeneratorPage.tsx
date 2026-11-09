import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { LoadingNotice } from "../components/LoadingNotice";
import { TileEditor } from "../components/TileEditor";
import { CONFIG_SCHEMA_PATH, validateConfig, type PortalConfig } from "../config/portalConfig";
import { useConfig } from "../config/useConfig";
import { downloadJson } from "../generator/downloadJson";
import { createFormState, createTileDraft, moveItem, toConfigInput, type FormState, type TileDraft } from "../generator/formState";
import { DEFAULT_THEME, THEMES, applyTheme, isThemeId } from "../theme/themes";

const CONFIG_FILE_NAME = "config.json";

/** Used when the current config.json cannot be loaded, so the page is still usable. */
const EMPTY_CONFIG: PortalConfig = {
  brand: { name: "My Portal", logo: "/logo.svg" },
  theme: DEFAULT_THEME,
  tiles: [],
};

export function GeneratorPage() {
  const state = useConfig();

  useEffect(() => {
    document.title = "Config generator";
  }, []);

  if (state.status === "loading") return <LoadingNotice />;

  const startingConfig = state.status === "ready" ? state.config : EMPTY_CONFIG;
  return <ConfigGenerator startingConfig={startingConfig} hasLoadFailed={state.status === "failed"} />;
}

interface ConfigGeneratorProps {
  startingConfig: PortalConfig;
  hasLoadFailed: boolean;
}

function ConfigGenerator({ startingConfig, hasLoadFailed }: ConfigGeneratorProps) {
  const [form, setForm] = useState(() => createFormState(startingConfig));
  const result = validateConfig(toConfigInput(form));

  // The page shows the chosen theme right away, so it can be judged before downloading.
  useEffect(() => {
    applyTheme(form.theme);
  }, [form.theme]);

  function updateForm(changes: Partial<FormState>) {
    setForm((current) => ({ ...current, ...changes }));
  }

  function updateTile(key: number, changes: Partial<TileDraft>) {
    updateForm({ tiles: form.tiles.map((tile) => (tile.key === key ? { ...tile, ...changes } : tile)) });
  }

  return (
    <>
      <Header name={startingConfig.brand.name} logoUrl={startingConfig.brand.logo} logos={startingConfig.brand.logos} />
      <main className="generator">
        <h1>Config generator</h1>
        <p className="generator-intro">
          Fill in the form and download <code>{CONFIG_FILE_NAME}</code>. Put it in the <code>public</code> folder of the
          repository and push to publish it. Nothing is sent to the server from this page.
        </p>
        <a href="/">Back to the portal</a>

        {hasLoadFailed && (
          <p className="notice">The current {CONFIG_FILE_NAME} could not be loaded, so you are starting from an empty one.</p>
        )}

        <section className="generator-section">
          <h2>Portal</h2>
          <label className="field">
            <span>Name</span>
            <input value={form.brandName} onChange={(event) => updateForm({ brandName: event.target.value })} />
          </label>
          <label className="field">
            <span>Logo path</span>
            <input value={form.logo} onChange={(event) => updateForm({ logo: event.target.value })} />
            <small>A file in the public folder, for example /logo.svg.</small>
          </label>
          <label className="field">
            <span>Theme</span>
            <select
              value={form.theme}
              onChange={(event) => isThemeId(event.target.value) && updateForm({ theme: event.target.value })}
            >
              {THEMES.map(({ id, label }) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="generator-section">
          <h2>Tiles</h2>
          {form.tiles.map((tile, index) => (
            <TileEditor
              key={tile.key}
              tile={tile}
              position={index + 1}
              total={form.tiles.length}
              onChange={(changes) => updateTile(tile.key, changes)}
              onMove={(offset) => updateForm({ tiles: moveItem(form.tiles, index, offset) })}
              onRemove={() => updateForm({ tiles: form.tiles.filter((other) => other.key !== tile.key) })}
            />
          ))}
          <button
            type="button"
            className="button button-secondary"
            onClick={() => updateForm({ tiles: [...form.tiles, createTileDraft()] })}
          >
            Add a tile
          </button>
        </section>

        {!result.ok && (
          <ul className="error-list" role="alert">
            {result.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}

        <button
          type="button"
          className="button"
          disabled={!result.ok}
          onClick={() => result.ok && downloadJson(CONFIG_FILE_NAME, { $schema: CONFIG_SCHEMA_PATH, ...result.config })}
        >
          Download {CONFIG_FILE_NAME}
        </button>
      </main>
    </>
  );
}
