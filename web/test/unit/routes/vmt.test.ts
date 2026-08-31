import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

let getYears: () => Promise<Response>;
let getJurisdictions: () => Promise<Response>;
let getVmt: (
  request: NextRequest,
  ctx: { params: Promise<{ modelRun: string; cityName: string }> },
) => Promise<Response>;

beforeAll(async () => {
  process.env.VMT_DATA_KEY = 'test-key';
  ({ GET: getYears } = await import('../../../app/api/data/years/all/route'));
  ({ GET: getJurisdictions } = await import('../../../app/api/data/jurisdictions/all/route'));
  ({ GET: getVmt } = await import('../../../app/api/data/vmt/[modelRun]/[cityName]/route'));
});

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok, status, json: async () => body })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GET /api/data/years/all', () => {
  it('returns model run years from Socrata', async () => {
    mockFetchOnce([{ model_run: '2050_06_YYY' }]);

    const response = await getYears();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ model_run: '2050_06_YYY' }]);
  });
});

describe('GET /api/data/jurisdictions/all', () => {
  it('returns distinct jurisdictions from Socrata', async () => {
    mockFetchOnce([{ cityname: 'Alameda' }]);

    const response = await getJurisdictions();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ cityname: 'Alameda' }]);
  });
});

describe('GET /api/data/vmt/[modelRun]/[cityName]', () => {
  const ctx = { params: Promise.resolve({ modelRun: '2050_06_YYY', cityName: 'Alameda' }) };

  it('returns VMT rows for the given model run and jurisdiction', async () => {
    mockFetchOnce([{ cityname: 'Alameda', model_run: '2050_06_YYY', total: '43338' }]);

    const response = await getVmt(new NextRequest('http://localhost/api/data/vmt/2050_06_YYY/Alameda'), ctx);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ cityname: 'Alameda', model_run: '2050_06_YYY', total: '43338' }]);
  });

  it('returns a 502 when Socrata fails', async () => {
    mockFetchOnce({}, false, 429);

    const response = await getVmt(new NextRequest('http://localhost/api/data/vmt/2050_06_YYY/Alameda'), ctx);

    expect(response.status).toBe(502);
    expect((await response.json()).error).toContain('429');
  });
});
