import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('health', () => {
  it('returns ok', async () => {
    await request(app).get('/health').expect(200).expect({ ok: true });
  });
});
