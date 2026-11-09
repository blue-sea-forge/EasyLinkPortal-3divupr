# 0004: Header logos, background and file browser

## Context

The header needs three images (left, middle, right) and the pages need a background image. Visitors also need to browse and download files from a folder of the site. The site is static on Apache, and the Content-Security-Policy forbids inline styles and images from other sites.

## Decisions

1. Logos and background are paths in `config.json` (`brand.logos`, `brand.background`), validated like `brand.logo`. The background is applied by setting a CSS variable from JavaScript (`src/theme/background.ts`), because an inline `style` attribute would be blocked by the CSP. The path is written as a quoted CSS string so a quote in the config cannot end the `url()`.

2. The file browser is the page `/file-browser/`, built as a copy of the app shell like the generator page. The folder shown is `fileBrowser.folder` in `config.json`. It must be a single name (`[A-Za-z0-9_-]+`) so the config cannot point outside `public/`.

3. A browser cannot list a folder, and `Options -Indexes` is on. A Vite plugin (`build/fileManifest.ts`) scans the folder at build time and writes `files-manifest.json`. The page builds its folder view from that flat list. The current subfolder is in `?path=`, because Apache only serves files that exist and the app has no router. Dotfiles are left out of the list. Downloads use a plain link with the `download` attribute, so no script is involved.

4. The generator keeps `logos`, `background` and `fileBrowser` from the current config and writes them back, so downloading a config does not remove them. They are not editable in the form.

## Alternatives rejected

- Enabling Apache directory listing: the look cannot be controlled and it exposes every folder it is enabled on.
- A runtime listing through a server script: needs PHP or a backend, the project is static.
- Hardcoding the background in CSS: the image could not change from `config.json`.

## Trade-offs

- Files added to the server by hand do not appear until the next build, since the list is made at build time.
- Empty folders are not shown, because the list only holds files.
