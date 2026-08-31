import { beforeAll, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

let POST: (request: NextRequest) => Promise<Response>;

beforeAll(async () => {
  delete process.env.ASANA_ACCESS_TOKEN;
  delete process.env.ASANA_PROJECT_ID;
  ({ POST } = await import('../../../app/api/feedback/route'));
});

describe('POST /api/feedback without Asana configured', () => {
  it('fails clearly instead of calling Asana with empty credentials', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ comment: 'Hello' }),
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    expect(response.status).toBe(500);
    expect((await response.json()).error).toContain('not configured');
  });
});
