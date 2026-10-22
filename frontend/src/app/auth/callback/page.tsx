'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.search);
    const googleLinked = params.get('googleLinked') === 'success';
    const googleLinkFailed = params.get('googleLinkError') === 'failed';

    void checkAuth().then((user) => {
      if (user && googleLinked) {
        router.replace('/profile?googleLinked=success');
      } else if (user && googleLinkFailed) {
        router.replace('/profile?googleLinkError=failed');
      } else {
        router.replace(user ? '/' : '/login');
      }
    });
  }, [checkAuth, router]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 text-center">
      <p className="text-muted-foreground">Completing Google sign-in…</p>
    </main>
  );
}
