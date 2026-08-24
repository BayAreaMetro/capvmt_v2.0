import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

let app: Express;

beforeAll(async () => {
  delete process.env.ASANA_ACCESS_TOKEN;
  delete process.env.ASANA_PROJECT_ID;
  ({ app } = await import('../../src/app'));
});

describe('POST /api/feedback without Asana configured', () => {
  it('fails clearly instead of calling Asana with empty credentials', async () => {
    const response = await request(app).post('/api/feedback').send({ comment: 'Hello' });

    expect(response.status).toBe(500);
    expect(response.body.error).toContain('not configured');
  });
});
