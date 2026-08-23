import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          404
        </p>
        <h1 className="mt-2 font-display text-4xl">Page not found</h1>
        <p className="mt-3 text-sm text-muted">
          The page you are looking for has moved or never existed.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-5 py-2 transition-colors"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
