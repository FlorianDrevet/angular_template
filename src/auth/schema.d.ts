export interface Schema {
  project: string;
  provider: 'none' | 'msal' | 'oidc';
  ssr?: boolean;
}
