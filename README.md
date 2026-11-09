# Easy Link Portal

A single page with a logo, a title and a grid of tiles. Each tile links to another website. Error codes in the 400 and 500 range show a status page.

Built with React and Vite, deployed to OVH shared hosting by GitHub Actions.

## Commands

```sh
npm install
npm run dev     # local server
npm test        # unit tests
npm run build   # type check and build into dist/
```

## Changing the content

Everything shown on the home page comes from `public/config.json`: the name, the logo, the theme and the list of tiles. The file is read by the browser when the page opens, so editing it on the server takes effect without a rebuild.

```json
{
  "brand": { "name": "Easy Link Portal", "logo": "/logo.svg" },
  "theme": "cozy",
  "tiles": [
    { "label": "GitHub", "description": "Source code", "url": "https://github.com", "icon": "git-branch" }
  ]
}
```

- `logo` is a file in `public/`. Images from other sites are blocked by the Content-Security-Policy.
- `theme` is required. It is one of the ids listed under Themes below.
- `description` and `icon` are optional on a tile. The default icon is `link`.
- Links must start with `http://` or `https://`.
- The available icon names are the keys in `src/config/icons.ts`.

- `brand.logos` is optional and has `left`, `middle` and `right` images for the header, as paths in `public/`. Without `left`, `brand.logo` is shown on the left. The middle image sits next to the name.
- `brand.background` is optional: an image shown behind every page.
- `fileBrowser` is optional, see File browser below.

`config.schema.json` describes the format. `config.json` points to it with `$schema`, so editors such as VS Code suggest the valid values and flag mistakes while you type. The generator keeps that line in the files it downloads.

If the file is missing or invalid, the portal shows the 500 page and the browser console lists what is wrong.

### Config generator

Open `/generate-config/` to build the file with a form: edit the name, logo, theme and tiles, then download `config.json` and replace the one in `public/`. The form starts from the current config and refuses to download until every field is valid. Nothing is sent to the server. The page is not linked from the portal.

## File browser

Add `"fileBrowser": { "folder": "files", "title": "Files" }` to `config.json` and the portal shows an extra tile that opens `/file-browser/`. That page lists the content of `public/files/` (the `folder` value is a single folder name inside `public/`), lets visitors open subfolders and download any file. `title` is optional.

A browser cannot list a server folder, so the build scans the folder and writes `files-manifest.json` next to `index.html`. In `npm run dev` the list is computed on every request. After uploading files to the server by hand, the list does not change until the next build and deploy.

## Themes

The theme is set by `theme` in `config.json`, and visitors cannot change it. Available ids: `classic-light`, `classic-dark`, `military`, `cozy`, `forest`, `sunset` and `lavender`. The config generator previews the theme as you pick it.

To add a theme, add an entry to `THEMES` in `src/theme/themes.ts` and a `[data-theme="id"]` block in `src/styles/global.css` that sets the same variables as the others.

## Status pages

The build writes `400.html`, `404.html` and `500.html` next to `index.html`. They are copies of the app with a different `http-status` meta tag, and the app shows the matching status page. `public/ovh-deployments/.htaccess` tells Apache to serve them for those codes (403 is shown as a 404).

In development, add `?status=503` to the URL to preview any status page.

## Deployment

A push to `main` runs `.github/workflows/deploy.yml`: tests, build, then upload of `dist/` to OVH. Vite copies `public/` into `dist/`, and the workflow moves the Apache rules from `dist/ovh-deployments/.htaccess` to the root of `dist/` before the upload. The rules block inline scripts and styles (Content-Security-Policy), so do not add them to the app. Use CSS files and bundled images only.

Technical decisions are in `docs/decisions/`.
