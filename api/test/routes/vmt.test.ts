import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

let app: Express;

beforeAll(async () => {
  process.env.VMT_DATA_KEY = 'test-key';
  ({ app } = await import('../../src/app'));
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

    const response = await request(app).get('/api/data/years/all');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ model_run: '2050_06_YYY' }]);
  });
});

describe('GET /api/data/jurisdictions/all', () => {
  it('returns distinct jurisdictions from Socrata', async () => {
    mockFetchOnce([{ cityname: 'Alameda' }]);

    const response = await request(app).get('/api/data/jurisdictions/all');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ cityname: 'Alameda' }]);
  });
});

describe('GET /api/data/vmt/:modelRun/:cityName', () => {
  it('returns VMT rows for the given model run and jurisdiction', async () => {
    mockFetchOnce([{ cityname: 'Alameda', model_run: '2050_06_YYY', total: '43338' }]);

    const response = await request(app).get('/api/data/vmt/2050_06_YYY/Alameda');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ cityname: 'Alameda', model_run: '2050_06_YYY', total: '43338' }]);
  });

  it('returns a 502 when Socrata fails', async () => {
    mockFetchOnce({}, false, 429);

    const response = await request(app).get('/api/data/vmt/2050_06_YYY/Alameda');

    expect(response.status).toBe(502);
    expect(response.body.error).toContain('429');
  });
});
