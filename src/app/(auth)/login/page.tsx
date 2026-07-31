import { Suspense } from "react";
import LoginForm from "./login-form";
import Logo from "@/components/Logo";

// The login form reads the URL's `redirect` param via `useSearchParams`, which
// suspends during prerendering. Wrap it in a Suspense boundary so the route can
// be prerendered safely while the client component hydrates.
export default function LoginPage() {
  return (
    <div className="animate-fade-in">
      <Suspense fallback={<LoginSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-16 w-16 animate-pulse" />
          <div className="space-y-2 text-center">
            <div className="mx-auto h-6 w-48 animate-pulse rounded bg-card" />
            <div className="mx-auto h-4 w-36 animate-pulse rounded bg-card" />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card/80 p-8">
          <div className="space-y-5">
            <div className="h-11 animate-pulse rounded-xl bg-muted" />
            <div className="h-11 animate-pulse rounded-xl bg-muted" />
            <div className="h-11 animate-pulse rounded-xl bg-primary/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
