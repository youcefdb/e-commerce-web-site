'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Mail,
  User as UserIcon,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Gift,
  CheckCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { GuestRoute } from '@/components/route-guard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  const { register, error, clearError, isLoading, loginWithGoogle } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  // Clear store errors on unmount
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setVerificationMessage(null);

    if (!name.trim() || !email.trim() || !password) {
      setValidationError('Name, email, and password are required');
      return;
    }

    if (name.trim().length < 2) {
      setValidationError('Name must be at least 2 characters');
      return;
    }

    if (password.trim().length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }

    try {
      const message = await register({ name: name.trim(), email: email.trim(), password });
      setPassword('');
      setVerificationMessage(message);
    } catch {
      // Handled in store
    }
  };

  const handleGoogleSignIn = () => {
    setValidationError(null);
    loginWithGoogle();
  };

  return (
    <GuestRoute>
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-slate-50 via-slate-100/70 to-slate-200/50 dark:from-slate-950 dark:via-slate-900 dark:to-zinc-950 min-h-[75vh] relative overflow-hidden">
        {/* Background decorative glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none dark:bg-primary/5" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-violet-500/5 blur-3xl pointer-events-none dark:bg-violet-500/5" />

        <div className="relative z-10 w-full max-w-4xl bg-card text-card-foreground border border-border/60 shadow-2xl rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 backdrop-blur-md">

          {/* Left Panel - Tech Showcase Branding */}
          <div className="hidden md:flex md:col-span-5 bg-linear-to-br from-slate-900 via-slate-950 to-zinc-950 text-white p-8 flex-col justify-between relative overflow-hidden border-r border-border/10">
            {/* Decorative Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-20" />
            {/* Glow effect on the branding panel */}
            <div className="absolute top-10 right-10 w-40 h-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <Link href="/" className="inline-flex items-center gap-2 font-bold tracking-tight text-white mb-12 group">
                <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-md font-black text-lg transition-transform group-hover:scale-105">e</span>
                <span className="text-xl tracking-wider font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">AERO</span>
              </Link>

              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold tracking-wider uppercase text-slate-300">
                    <Sparkles className="h-3 w-3 text-amber-400" /> New Account
                  </span>
                  <h3 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent leading-snug">
                    Join the Elite Tech Hub
                  </h3>
                </div>

                <ul className="space-y-4 text-sm text-slate-300 font-light">
                  <li className="flex items-start gap-3">
                    <div className="p-1 rounded-md bg-white/5 border border-white/10 text-primary mt-0.5 shrink-0">
                      <UserIcon className="h-4 w-4 text-slate-200" />
                    </div>
                    <div>
                      <span className="font-semibold text-white block">Personalized Account</span>
                      <span className="text-xs text-slate-400">Save custom builds, track orders, and view invoice history.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1 rounded-md bg-white/5 border border-white/10 text-primary mt-0.5 shrink-0">
                      <Gift className="h-4 w-4 text-slate-200" />
                    </div>
                    <div>
                      <span className="font-semibold text-white block">Exclusive Member Deals</span>
                      <span className="text-xs text-slate-400">Get early notifications on restocks and components discounts.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1 rounded-md bg-white/5 border border-white/10 text-primary mt-0.5 shrink-0">
                      <CheckCircle className="h-4 w-4 text-slate-200" />
                    </div>
                    <div>
                      <span className="font-semibold text-white block">Speedy Checkout</span>
                      <span className="text-xs text-slate-400">Store billing information securely for swift transactions.</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="relative z-10 pt-6 border-t border-white/5 text-[11px] text-slate-500 font-medium">
              © {new Date().getFullYear()} eAERO Inc. All rights reserved.
            </div>
          </div>

          {/* Right Panel - Register Form */}
          <div className="col-span-1 md:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-card">
            <div className="w-full max-w-md mx-auto space-y-6">

              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between md:justify-end">
                  <Link href="/" className="md:hidden inline-flex items-center gap-1.5 font-bold tracking-tight text-foreground">
                    <span className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-black text-sm">e</span>
                    <span>AERO</span>
                  </Link>

                  <span className="text-xs text-muted-foreground">
                    Already registered?{' '}
                    <Link href="/login" className="font-bold text-primary hover:underline transition-all duration-200">
                      Sign in
                    </Link>
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-4 md:mt-0">
                  Create your account
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Create a password now. We’ll send a confirmation link to verify your email before you sign in.
                </p>
              </div>

              {/* Errors Display */}
              {(error || validationError) && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex gap-2.5 items-start animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="font-medium">{validationError || error}</span>
                </div>
              )}
              {verificationMessage && (
                <div role="status" className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex gap-2.5 items-start">
                  <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="font-medium">{verificationMessage} Check your inbox, then <Link href="/login" className="underline">sign in</Link>.</span>
                </div>
              )}

              {/* Register Form */}
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-name" className="text-xs font-semibold text-foreground">Full name</Label>
                  <div className="relative group">
                    <Input
                      id="reg-name"
                      type="text"
                      placeholder="John Doe"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 h-11 border-border bg-background/50 focus:bg-background transition-all rounded-xl focus-visible:ring-primary/20"
                    />
                    <UserIcon className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-email" className="text-xs font-semibold text-foreground">Email address</Label>
                  <div className="relative group">
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="name@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-11 border-border bg-background/50 focus:bg-background transition-all rounded-xl focus-visible:ring-primary/20"
                    />
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-password" className="text-xs font-semibold text-foreground">Password</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 border-border bg-background/50 focus:bg-background transition-all rounded-xl focus-visible:ring-primary/20"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full inline-flex shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold h-11 shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] mt-6 cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    <>
                      Sign Up <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/80"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                  <span className="bg-card px-3 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full inline-flex shrink-0 items-center justify-center rounded-xl border border-border bg-background hover:bg-muted/50 text-sm font-semibold h-11 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:pointer-events-none disabled:opacity-50"
              >
                <svg className="h-4 w-4 shrink-0 mr-2.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>

            </div>
          </div>

        </div>
      </div>
    </GuestRoute>
  );
}
