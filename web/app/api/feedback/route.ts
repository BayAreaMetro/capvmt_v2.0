import { NextResponse, type NextRequest } from 'next/server';
import { AsanaClient } from '@/lib/asana/client';
import { env } from '@/lib/env';
import { toHttpError } from '@/lib/http-errors';

const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  '1': 'None',
  '2': 'General Feedback',
  '3': 'Application Bug',
  '4': 'Enhancement Request',
  '5': 'Resource Content',
};

interface FeedbackPayload {
  name?: string;
  email?: string;
  type?: string;
  comment: string;
}

function isFeedbackPayload(body: unknown): body is FeedbackPayload {
  if (typeof body !== 'object' || body === null) return false;
  const record = body as Record<string, unknown>;
  const optionalStringOk = (value: unknown) => value === undefined || typeof value === 'string';
  return (
    optionalStringOk(record.name) &&
    optionalStringOk(record.email) &&
    optionalStringOk(record.type) &&
    typeof record.comment === 'string' &&
    record.comment.trim().length > 0
  );
}

const client = new AsanaClient({
  accessToken: env.asanaAccessToken ?? '',
  projectId: env.asanaProjectId ?? '',
});

export async function POST(request: NextRequest) {
  if (!env.asanaAccessToken || !env.asanaProjectId) {
    return NextResponse.json(
      { error: 'Asana feedback integration is not configured (ASANA_ACCESS_TOKEN / ASANA_PROJECT_ID)' },
      { status: 500 },
    );
  }

  const body: unknown = await request.json();
  if (!isFeedbackPayload(body)) {
    return NextResponse.json({ error: 'comment is required' }, { status: 400 });
  }

  const typeLabel = body.type ? (FEEDBACK_TYPE_LABELS[body.type] ?? body.type) : 'Unspecified';

  try {
    const task = await client.createTask({
      name: `VMT Data Portal feedback: ${typeLabel}`,
      notes: [
        `Name: ${body.name || '(not provided)'}`,
        `Email: ${body.email || '(not provided)'}`,
        `Type: ${typeLabel}`,
        '',
        body.comment,
        '',
        `Submitted: ${new Date().toISOString()}`,
        'Source: CAPVMT Data Portal',
      ].join('\n'),
    });
    return NextResponse.json({ ok: true, taskGid: task.gid }, { status: 201 });
  } catch (error) {
    const httpError = toHttpError(error);
    return NextResponse.json({ error: httpError.message }, { status: httpError.statusCode });
  }
}
