export interface SocrataConfig {
  domain?: string;
  dataset: string;
  username?: string;
  password?: string;
  appToken?: string;
}

/**
 * Thin wrapper over the SODA REST API (https://dev.socrata.com/docs/queries/).
 * Replaces the legacy soda-js `Consumer`/`Producer` used in
 * server/api/data/data.controller.js.
 */
export class SocrataClient {
  constructor(private config: SocrataConfig) {}

  async query(params: Record<string, string>): Promise<unknown[]> {
    const domain = this.config.domain ?? 'data.bayareametro.gov';
    const url = new URL(`https://${domain}/resource/${this.config.dataset}.json`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const headers: Record<string, string> = {};
    if (this.config.appToken) {
      headers['X-App-Token'] = this.config.appToken;
    }
    if (this.config.username && this.config.password) {
      const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      headers.Authorization = `Basic ${credentials}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Socrata request failed: ${response.status}`);
    }

    return response.json() as Promise<unknown[]>;
  }
}
