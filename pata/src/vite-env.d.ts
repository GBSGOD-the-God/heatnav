/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** AI proxy base URL, baked in at build time. Empty = phone-only. */
  readonly VITE_PATA_AI_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
