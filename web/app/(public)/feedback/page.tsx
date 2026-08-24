'use client';

import { useState, type FormEvent } from 'react';

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
    <main className="feedback-page">
      <h6>
        To provide us with general feedback, bugs and improvements, or suggestions for future
        releases, please fill out the form below:
      </h6>

      {success && <p className="feedback-page__success">Thanks — your feedback was submitted.</p>}
      {error && <p className="data-page__error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>
          Full Name
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="First Last" />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
          />
        </label>
        <p>We&apos;ll never share your email with anyone.</p>

        <label>
          Feedback Type
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">Feedback Type</option>
            {FEEDBACK_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Comments
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Leave a comment here"
          />
        </label>

        <button type="submit" className="button" disabled={submitting}>
          Submit
        </button>
      </form>
    </main>
  );
}
