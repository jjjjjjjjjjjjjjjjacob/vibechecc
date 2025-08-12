/**
 * Vite ambient type declarations.
 * - Enables importing CSS and SVG files as URLs via the `?url` suffix.
 * - Pulls in the base Vite client types for tooling support.
 */
/// <reference types="vite/client" />

// Allow `import styles from 'file.css?url'` to return the resolved URL
declare module '*.css?url' {
  const url: string;
  export default url;
}

// Allow `import icon from 'file.svg?url'` to return the resolved URL
declare module '*.svg?url' {
  const url: string;
  export default url;
}
