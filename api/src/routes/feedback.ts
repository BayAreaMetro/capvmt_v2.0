import { Router } from 'express';
import { AsanaClient } from '../asana/client';
import { env } from '../env';
import { toHttpError } from '../lib/http-errors';

export const feedbackRouter = Router();

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

// Fail clearly at request time rather than silently calling Asana with
// empty credentials/project id.
feedbackRouter.use((_req, res, next) => {
  if (!env.asanaAccessToken || !env.asanaProjectId) {
    res.status(500).json({ error: 'Asana feedback integration is not configured (ASANA_ACCESS_TOKEN / ASANA_PROJECT_ID)' });
    return;
  }
  next();
});

feedbackRouter.post('/', async (req, res, next) => {
  if (!isFeedbackPayload(req.body)) {
    res.status(400).json({ error: 'comment is required' });
    return;
  }

  const typeLabel = req.body.type ? (FEEDBACK_TYPE_LABELS[req.body.type] ?? req.body.type) : 'Unspecified';

  try {
    const task = await client.createTask({
      name: `VMT Data Portal feedback: ${typeLabel}`,
      notes: [
        `Name: ${req.body.name || '(not provided)'}`,
        `Email: ${req.body.email || '(not provided)'}`,
        `Type: ${typeLabel}`,
        '',
        req.body.comment,
        '',
        `Submitted: ${new Date().toISOString()}`,
        'Source: CAPVMT Data Portal',
      ].join('\n'),
    });
    res.status(201).json({ ok: true, taskGid: task.gid });
  } catch (error) {
    next(toHttpError(error));
  }
});
