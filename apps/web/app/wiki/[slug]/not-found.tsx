import Link from 'next/link';
import { BookX, Home } from 'lucide-react';

export default function WikiNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="neu-raised smooth-transition rounded-3xl p-12 text-center">
        <BookX className="mb-4 h-20 w-20 text-slate" aria-hidden="true" />
        <h2 className="mb-2 text-2xl font-bold text-white">Page Not Found</h2>
        <p className="mb-6 text-slate">
          The wiki page you&rsquo;re looking for doesn&rsquo;t exist.
        </p>
        <Link
          href="/wiki"
          className="coral-gradient smooth-transition inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold text-white"
        >
          <Home className="h-5 w-5" aria-hidden="true" />
          Back to Wiki Home
        </Link>
      </div>
    </div>
  );
}
