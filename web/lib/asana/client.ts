export interface AsanaConfig {
  accessToken: string;
  projectId: string;
  domain?: string;
}

export interface CreateTaskInput {
  name: string;
  notes?: string;
}

export interface AsanaTask {
  gid: string;
  permalink_url?: string;
}

/**
 * Thin wrapper over the Asana REST API (https://developers.asana.com/reference/createtask),
 * used to post feedback submissions as tasks in a configured project instead
 * of storing them in a database. Auth is a Personal Access Token - this is a
 * single server posting to a single, known Asana workspace/project, not a
 * multi-tenant integration, so full OAuth isn't needed.
 */
export class AsanaClient {
  constructor(private config: AsanaConfig) {}

  async createTask(input: CreateTaskInput): Promise<AsanaTask> {
    const domain = this.config.domain ?? 'https://app.asana.com';
    const response = await fetch(`${domain}/api/1.0/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.accessToken}`,
      },
      body: JSON.stringify({
        data: {
          name: input.name,
          notes: input.notes,
          projects: [this.config.projectId],
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Asana request failed: ${response.status}`);
    }

    const json = (await response.json()) as { data: AsanaTask };
    return json.data;
  }
}
