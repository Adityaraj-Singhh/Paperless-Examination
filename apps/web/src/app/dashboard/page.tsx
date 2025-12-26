'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth.store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Dashboard
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">
            Welcome, {user.firstName} {user.lastName}!
          </h2>
          <div className="space-y-2 text-gray-600">
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Roles:</strong> {user.roles.join(', ')}
            </p>
            <p>
              <strong>University ID:</strong> {user.universityId}
            </p>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
            <div className="flex gap-3">
              <Link href="/admin">
                <Button>Academic Management</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
