'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { authService } from '@/features/auth/services/auth.service';
import { getApiErrorMessage } from '@/lib/api/errors';

function VerifyEmailContent() {
  const started = useRef(false);
  const [status, setStatus] = useState<'confirm' | 'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Checking your verification link…');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const token = new URLSearchParams(window.location.search).get('token');
    window.history.replaceState(window.history.state, '', '/auth/verify-email');
    if (!token) {
      void Promise.resolve().then(() => {
        setStatus('error');
        setMessage('This verification link is missing its token. Request a new link and try again.');
      });
      return;
    }

    void Promise.resolve().then(() => {
      setVerificationToken(token);
      setStatus('confirm');
      setMessage('Continue to confirm that you own this email address.');
    });
  }, []);

  const handleConfirm = async () => {
    if (!verificationToken || status === 'loading') return;

    setStatus('loading');
    setMessage('Verifying your email address…');
    try {
      const result = await authService.verifyEmail(verificationToken);
      setStatus('success');
      setMessage(result.message);
    } catch (error: unknown) {
      setStatus('error');
      setMessage(getApiErrorMessage(error, 'This verification link is invalid or has expired.'));
    }
  };

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p role={status === 'error' ? 'alert' : 'status'} className="mt-4 text-sm text-muted-foreground">
          {message}
        </p>
        {status === 'confirm' && (
          <button
            type="button"
            onClick={handleConfirm}
            className="mt-6 w-full rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
          >
            Confirm email
          </button>
        )}
        {(status === 'success' || status === 'error') && (
          <Link href="/login" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
            Continue to sign in
          </Link>
        )}
      </section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return <VerifyEmailContent />;
}
