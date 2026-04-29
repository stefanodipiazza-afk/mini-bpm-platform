import type { Metadata } from 'next';
import Link from 'next/link';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Mini BPM Platform',
  description: 'Low-code business process management platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-slate-900 text-white px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold">BPM Platform</h1>
            <ul className="flex space-x-6">
              <li>
                <Link href="/" className="hover:text-slate-300">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/workflows" className="hover:text-slate-300">
                  Workflows
                </Link>
              </li>
              <li>
                <Link href="/instances" className="hover:text-slate-300">
                  Instances
                </Link>
              </li>
              <li>
                <Link href="/tasks" className="hover:text-slate-300">
                  Tasks
                </Link>
              </li>
              <li>
                <Link href="/forms" className="hover:text-slate-300">
                  Forms
                </Link>
              </li>
              <li>
                <Link href="/admin/identities" className="hover:text-slate-300">
                  Admin
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        <main className="min-h-screen bg-slate-50 py-8">
          <div className="container">{children}</div>
        </main>
      </body>
    </html>
  );
}
