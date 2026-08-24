import { afterEach, describe, expect, it, vi } from 'vitest';
import { SocrataVmtClient } from '../../src/socrata/vmt';

function mockFetchOnce(body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => body,
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SocrataVmtClient', () => {
  it('fetches distinct jurisdictions from the configured dataset', async () => {
    mockFetchOnce([{ cityname: 'Alameda' }, { cityname: 'Berkeley' }]);
    const client = new SocrataVmtClient({ dataset: 'test-key' });

    const rows = await client.getJurisdictions();

    expect(rows).toEqual([{ cityname: 'Alameda' }, { cityname: 'Berkeley' }]);
    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain('/resource/test-key.json');
    expect(String(url)).toContain('%24select=cityname');
    expect(String(url)).toContain('%24group=cityname');
  });

  it('fetches VMT rows filtered by model run and jurisdiction', async () => {
    mockFetchOnce([{ cityname: 'Alameda', model_run: '2050_06_YYY', total: '43338' }]);
    const client = new SocrataVmtClient({ dataset: 'test-key' });

    const rows = await client.getVmtByJurisdiction('2050_06_YYY', 'Alameda');

    expect(rows).toEqual([{ cityname: 'Alameda', model_run: '2050_06_YYY', total: '43338' }]);
    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain('model_run=2050_06_YYY');
    expect(String(url)).toContain('cityname=Alameda');
  });

  it('fetches distinct model run years', async () => {
    mockFetchOnce([{ model_run: '2015_06_YYY' }, { model_run: '2050_06_YYY' }]);
    const client = new SocrataVmtClient({ dataset: 'test-key' });

    const rows = await client.getModelRunYears();

    expect(rows).toEqual([{ model_run: '2015_06_YYY' }, { model_run: '2050_06_YYY' }]);
    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain('%24select=model_run');
  });

  it('passes the app token header and throws on a non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 429, json: async () => ({}) })),
    );
    const client = new SocrataVmtClient({ dataset: 'test-key', appToken: 'token-123' });

    await expect(client.getJurisdictions()).rejects.toThrow('Socrata request failed: 429');
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({ 'X-App-Token': 'token-123' });
  });
});
