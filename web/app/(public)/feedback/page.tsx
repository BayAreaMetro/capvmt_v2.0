'use client';

import { useState, type FormEvent } from 'react';
import { Card, Typography, Input, Select, Button, VStack, NotificationBox } from '@bayareametro/mtc-ui';

// Resolved by plan Task 5: feedback is brought in-house, posted as a
// task in a configurable Asana project (api/src/routes/feedback.ts)
// instead of the legacy external Elastic Beanstalk service.
const FEEDBACK_ENDPOINT = '/api/feedback';

const FEEDBACK_TYPES = [
  { value: '1', label: 'None' },
  { value: '2', label: 'General Feedback' },
  { value: '3', label: 'Application Bug' },
  { value: '4', label: 'Enhancement Request' },
  { value: '5', label: 'Resource Content' },
];

export default function FeedbackPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(FEEDBACK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, type, comment }),
      });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);

      setSuccess(true);
      setName('');
      setEmail('');
      setType('');
      setComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card.Root className="feedback-page narrow-content">
      <Card.Body>
        <VStack className="gap-3">
          <Typography as="p">
            To provide us with general feedback, bugs and improvements, or suggestions for future
            releases, please fill out the form below:
          </Typography>

          {success && (
            <NotificationBox type="success">Thanks — your feedback was submitted.</NotificationBox>
          )}
          {error && <NotificationBox type="info">{error}</NotificationBox>}

          <form onSubmit={handleSubmit}>
            <VStack className="gap-3">
              <Input.Root orientation="stacked">
                <Input.Label>Full Name</Input.Label>
                <Input.Field
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="First Last"
                />
              </Input.Root>

              <Input.Root orientation="stacked">
                <Input.Label>Email</Input.Label>
                <Input.Field
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                />
                <Input.HelpText>We&apos;ll never share your email with anyone.</Input.HelpText>
              </Input.Root>

              <Input.Root orientation="stacked">
                <Input.Label>Feedback Type</Input.Label>
                <Select.Field value={type} onChange={(event) => setType(event.target.value)}>
                  <option value="">Feedback Type</option>
                  {FEEDBACK_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select.Field>
              </Input.Root>

              <Input.Root orientation="stacked">
                <Input.Label>Comments</Input.Label>
                <Input.Field
                  as="textarea"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Leave a comment here"
                />
              </Input.Root>

              <Button type="submit" disabled={submitting}>
                Submit
              </Button>
            </VStack>
          </form>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
