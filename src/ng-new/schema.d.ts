export interface Schema {
  name: string;
  directory?: string;
  ssr?: boolean;
  ui?: 'none' | 'material' | 'tailwind';
  auth?: 'none' | 'msal' | 'oidc';
  i18n?: boolean;
  docker?: boolean;
  ci?: boolean;
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun';
  skipInstall?: boolean;
  skipGit?: boolean;
}
