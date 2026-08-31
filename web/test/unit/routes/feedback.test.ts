import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

let POST: (request: NextRequest) => Promise<Response>;

beforeAll(async () => {
  process.env.ASANA_ACCESS_TOKEN = 'test-token';
  process.env.ASANA_PROJECT_ID = 'test-project';
  ({ POST } = await import('../../../app/api/feedback/route'));
});

function mockFetchOnce(ok: boolean, status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok, status, json: async () => body })),
  );
}

function postFeedback(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/feedback', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('POST /api/feedback', () => {
  it('creates an Asana task and returns its gid', async () => {
    mockFetchOnce(true, 201, { data: { gid: 'task-789' } });

    const response = await postFeedback({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      type: '3',
      comment: 'The map is broken.',
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true, taskGid: 'task-789' });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const sentBody = JSON.parse((init as RequestInit).body as string);
    expect(sentBody.data.name).toBe('VMT Data Portal feedback: Application Bug');
    expect(sentBody.data.notes).toContain('Name: Ada Lovelace');
    expect(sentBody.data.notes).toContain('The map is broken.');
    expect(sentBody.data.projects).toEqual(['test-project']);
  });

  it('rejects a payload with no comment', async () => {
    const response = await postFeedback({ name: 'Ada' });

    expect(response.status).toBe(400);
  });

  it('returns a 502 when Asana fails', async () => {
    mockFetchOnce(false, 401, {});

    const response = await postFeedback({ comment: 'Hello' });

    expect(response.status).toBe(502);
  });
});
