import { afterEach, describe, expect, it, vi } from 'vitest';
import { AsanaClient } from '../../../lib/asana/client';

function mockFetchOnce(ok: boolean, status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok, status, json: async () => body })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AsanaClient', () => {
  it('creates a task in the configured project', async () => {
    mockFetchOnce(true, 201, { data: { gid: 'task-123', permalink_url: 'https://app.asana.com/0/1/task-123' } });
    const client = new AsanaClient({ accessToken: 'token-abc', projectId: 'project-456' });

    const task = await client.createTask({ name: 'Feedback: Bug', notes: 'Something broke' });

    expect(task).toEqual({ gid: 'task-123', permalink_url: 'https://app.asana.com/0/1/task-123' });
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toBe('https://app.asana.com/api/1.0/tasks');
    expect((init as RequestInit).headers).toMatchObject({ Authorization: 'Bearer token-abc' });
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      data: { name: 'Feedback: Bug', notes: 'Something broke', projects: ['project-456'] },
    });
  });

  it('throws on a non-ok response', async () => {
    mockFetchOnce(false, 401, {});
    const client = new AsanaClient({ accessToken: 'bad-token', projectId: 'project-456' });

    await expect(client.createTask({ name: 'x' })).rejects.toThrow('Asana request failed: 401');
  });
});
