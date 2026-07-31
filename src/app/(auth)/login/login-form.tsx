"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Logo from "@/components/Logo";

type Mode = "signin" | "signup" | "reset";

const firebaseErrorMap: Record<string, string> = {
  "auth/user-not-found": "No account found with that email.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/missing-credential": "Please enter your email and password.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/invalid-credential": "Incorrect email or password. Please try again.",
  "auth/network-request-failed": "Network error. Please check your connection.",
  "auth/popup-blocked": "Popup blocked. Please allow popups and try again.",
  "auth/popup-closed-by-user": "Sign-in cancelled. Please try again.",
  "auth/operation-not-allowed": "This sign-in method is not enabled. Please use email/password.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/account-exists-with-different-credential": "An account already exists with this email using a different sign-in method.",
  "auth/unauthorized-continue-uri": "Domain not authorized. Contact support.",
  "auth/invalid-continue-uri": "Invalid configuration. Contact support.",
  "auth/missing-continue-uri": "Missing configuration. Contact support.",
  "auth/invalid-api-key": "Invalid API key. Contact support.",
  "auth/app-not-authorized": "App not authorized. Check Firebase console settings.",
};

function getErrorCode(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code: unknown }).code);
  }
  return "";
}

function friendlyError(err: unknown): string {
  const code = getErrorCode(err);
  console.error("[Auth Error]", code, err);
  if (code.startsWith("auth/")) {
    return firebaseErrorMap[code] ?? `Error: ${code}`;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

function MailIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function EyeIcon({ closed }: { closed: boolean }) {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {closed ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      )}
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function passwordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["Weak", "Weak", "Fair", "Good", "Strong", "Very strong"];
  const colors = ["", "#f87171", "#f87171", "#fbbf24", "#4ade80", "#22c55e"];
  return { score, label: labels[score], color: colors[score] };
}

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  showStrength,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
  showStrength?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const strength = showStrength ? passwordStrength(value) : null;

  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60">
          <LockIcon />
        </span>
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-muted/60 py-3 pl-10 pr-11 text-sm text-foreground placeholder-muted-foreground/50 transition-colors focus:border-primary focus:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          <EyeIcon closed={visible} />
        </button>
      </div>
      {strength && strength.label && (
        <div className="mt-2">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="h-1 flex-1 rounded-full bg-border"
                style={{ backgroundColor: i < strength.score ? strength.color : undefined }}
              />
            ))}
          </div>
          <p className="mt-1 text-xs" style={{ color: strength.color }}>
            {strength.label} password
          </p>
        </div>
      )}
    </div>
  );
}

function TextInput({
  id,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  icon,
}: {
  id: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60">
        {icon}
      </span>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-muted/60 py-3 pl-10 pr-3 text-sm text-foreground placeholder-muted-foreground/50 transition-colors focus:border-primary focus:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
        placeholder={placeholder}
      />
    </div>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, sendPasswordReset } =
    useAuth();

  const redirect = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === "signup";
  const showReset = mode === "reset";

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignUp && confirmPassword !== password) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      if (showReset) {
        await sendPasswordReset(email);
        setResetSent(true);
      } else if (isSignUp) {
        await signUpWithEmail(email, password, displayName || undefined);
      } else {
        await signInWithEmail(email, password);
      }
      router.replace(redirect);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      sessionStorage.setItem("authRedirectTo", redirect);
      await signInWithGoogle();
      // For popup flow, redirect here; for redirect flow, AuthProvider handles it
      router.replace(redirect);
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const spinner = (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ strokeDasharray: "32, 100" }} />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Background accents */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />

      <div className="relative w-full max-w-[400px] animate-fade-in">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <Logo className="h-16 w-16" />
          <h1 className="mt-4 text-2xl font-bold text-white">Manhwa Reader</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignUp ? "Create your free account" : "Welcome back"}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          {/* Mode tabs */}
          {!showReset && (
            <div className="mb-6 grid grid-cols-2 rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`rounded-lg py-2 text-sm font-medium transition-all ${
                  !isSignUp
                    ? "bg-primary text-white shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`rounded-lg py-2 text-sm font-medium transition-all ${
                  isSignUp
                    ? "bg-primary text-white shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 animate-fade-in rounded-xl border border-red-500/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {showReset ? (
            resetSent ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-400/15 text-green-400">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="font-semibold text-white">Check your email</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  If an account exists for{" "}
                  <span className="text-foreground">{email}</span>, a password reset link has been sent.
                </p>
                <button
                  onClick={() => switchMode("signin")}
                  className="mt-6 text-sm font-medium text-primary hover:text-primary-hover"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Email
                  </label>
                  <TextInput
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="you@example.com"
                    autoComplete="email"
                    icon={<MailIcon />}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting && spinner}
                  {submitting ? "Sending…" : "Send Reset Link"}
                </button>
              </form>
            )
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Display Name
                    </label>
                    <TextInput
                      id="display-name"
                      type="text"
                      value={displayName}
                      onChange={setDisplayName}
                      placeholder="Jane Doe"
                      autoComplete="name"
                      icon={<UserIcon />}
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Email
                  </label>
                  <TextInput
                    id="email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="you@example.com"
                    autoComplete="email"
                    icon={<MailIcon />}
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-sm font-medium text-foreground">
                      Password
                    </label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => switchMode("reset")}
                        className="text-xs font-medium text-primary hover:text-primary-hover"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <PasswordInput
                    id={isSignUp ? "new-password" : "current-password"}
                    value={password}
                    onChange={setPassword}
                    placeholder="••••••••"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    showStrength={isSignUp}
                  />
                </div>

                {isSignUp && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Confirm Password
                    </label>
                    <PasswordInput
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting && spinner}
                  {submitting
                    ? isSignUp
                      ? "Creating account…"
                      : "Signing in…"
                    : isSignUp
                      ? "Create Account"
                      : "Sign In"}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3 text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-wider">Or continue with</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-white py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg className="h-5 w-5" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}

          {showReset && (
            <button
              onClick={() => switchMode("signin")}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeftIcon />
              Back to sign in
            </button>
          )}
        </div>

        {/* Footer links */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <button
            onClick={() => switchMode(isSignUp ? "signin" : "signup")}
            className="font-medium text-primary hover:text-primary-hover"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>

        <Link
          href={redirect || "/"}
          className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/80 transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon />
          Back to {redirect === "/" ? "Home" : "previous page"}
        </Link>
      </div>
    </div>
  );
}
