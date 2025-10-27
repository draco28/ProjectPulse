import Link from 'next/link';

export default function WikiNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="neu-raised smooth-transition rounded-3xl p-12 text-center">
        <i className="fas fa-book-dead mb-4 text-6xl text-slate"></i>
        <h2 className="mb-2 text-2xl font-bold text-white">Page Not Found</h2>
        <p className="mb-6 text-slate">
          The wiki page you&rsquo;re looking for doesn&rsquo;t exist.
        </p>
        <Link
          href="/wiki"
          className="coral-gradient smooth-transition inline-block rounded-2xl px-6 py-3 font-semibold text-white"
        >
          <i className="fas fa-home mr-2"></i>
          Back to Wiki Home
        </Link>
      </div>
    </div>
  );
}
