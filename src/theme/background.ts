/** CSS variable read by the body rule in global.css. */
const BACKGROUND_VARIABLE = "--background-image";

/**
 * Sets the page background image. It goes through the CSSOM because the
 * Content-Security-Policy forbids inline style attributes, and the path is
 * written as a quoted CSS string so a quote in the config cannot break out of url().
 */
export function applyBackground(imagePath: string | undefined) {
  const root = document.documentElement.style;
  if (imagePath) root.setProperty(BACKGROUND_VARIABLE, `url(${JSON.stringify(imagePath)})`);
  else root.removeProperty(BACKGROUND_VARIABLE);
}
